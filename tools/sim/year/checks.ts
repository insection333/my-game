// The year's checks (docs/EXPANSION.md section 2), on two kinds of player playing a year on the real
// engine: the steady player (an active hour a day with the fire) and the light player (ten minutes in
// the morning, five in the evening).
import { HOUR, MINUTE } from '@idle-clash/kernel';
import { FEATURES } from '@idle-clash/features';
import { HONOURS } from '../../../packages/features/src/deeds/honours.ts';
import { pointsOf } from '../../../packages/features/src/deeds/list.ts';
import { fighter } from '../combat.ts';
import { DAY, focusedPlayer, gaps, T0 } from '../player.ts';
import { LIGHT, playYear, STEADY, type Year } from './player.ts';
import { ALL_SKILLS, ARTISAN, COMBAT, GATHERING, level } from './world.ts';

type Check = (ok: boolean, what: string) => void;
const YEAR = 365;
/** A year, and the 25% either side a target may stray. */
const [EARLY, LATE] = [Math.round(YEAR * 0.75), Math.round(YEAR * 1.25)];
const STAGES = [1, 7, 30, 90, 180, 365];
const SEED = 11;
/** A skill kept in its lane: days to each level (docs/EXPANSION.md section 2). */
const CLIMB: [number, number][] = [
  [55, 49],
  [70, 73.5],
  [85, 91],
  [99, 105],
];
/** Deeds a quarter of the year at the least: one every three days. */
const QUARTER_DEEDS = 30;
/** Days of a year that may pass without a first (one in fifty), never two running. */
const EMPTY_DAYS = 7;

const lastOf = (y: Year, skills: readonly string[]) => Math.max(...skills.map((s) => y.at99[s] ?? Infinity));
const firstOf = (y: Year, skills: readonly string[]) => Math.min(...skills.map((s) => y.at99[s] ?? Infinity));

export function yearChecks(check: Check, lines: string[]): { steady: Year; light: Year } {
  const points: number[] = [];
  const steady = playYear(STEADY, SEED, LATE, (day, state) => (points[day] = pointsOf(state)));
  const light = playYear(LIGHT, SEED, LATE);

  for (const y of [steady, light]) {
    lines.push(`\n## ${y.kind.name}: a year on the real engine`);
    const at = ALL_SKILLS.map((s) => `${s} ${y.at99[s] ?? `not (${level(y.final, s)})`}`).join(', ');
    lines.push(`Level 99 on day: ${at}`);
    for (const [lane, skills] of [
      ['Gathering', GATHERING],
      ['Artisan', ARTISAN],
      ['Combat', COMBAT],
    ] as const)
      lines.push(`${lane}: 99 from day ${firstOf(y, skills)} to day ${lastOf(y, skills)}`);
    const awayS = (y.days.length * (DAY - y.kind.visits.reduce((n, v) => n + v.minutes * MINUTE, 0))) / 1000;
    for (const lane of ['gathering', 'artisan', 'combat']) {
      const idle = y.days.reduce((n, d) => n + (d.idle[lane] ?? 0), 0) / awayS;
      lines.push(`The ${lane} lane stood idle ${(idle * 100).toFixed(1)}% of the time away`);
      check(idle <= 0.05, `${y.kind.name}: the ${lane} lane works at least 95% of the time away`);
    }
    const full = y.days.reduce((n, d) => n + (d.stops.storehouseFull ?? 0), 0);
    check(full === 0, `${y.kind.name}: no lane stops for a full Storehouse all year (${full})`);
    check(
      y.refused / y.commands <= 0.01,
      `${y.kind.name}: ${y.refused} of ${y.commands} commands refused (at most 1%)`,
    );
  }

  // Gold over the year: what it comes to once the Storehouse is fully enlarged (a finding for the owner,
  // not a target: gold has nothing left to buy after the last enlargement).
  const gold = [30, 90, 180, 365].map((n) => `day ${n} ${((steady.days[n - 1]?.gold ?? 0) / 1e6).toFixed(0)}M`);
  lines.push(`\nThe steady player's gold: ${gold.join(', ')}`);

  // Every skill at 99 in about a year, for the steady player; the light player not far behind.
  const all = lastOf(steady, ALL_SKILLS);
  check(all >= EARLY && all <= LATE, `Every skill at 99 on day ${all} (target ${YEAR}, within 25%)`);
  const lightAll = lastOf(light, ALL_SKILLS);
  check(
    lightAll <= all * 1.25,
    `The light player has every skill at 99 on day ${lightAll}, within a quarter of the steady player's ${all}`,
  );

  // A moment about every two minutes of active play at every stage of the year, never five without one.
  lines.push(`\n## Moments in the steady player's active hour`);
  for (const n of STAGES) {
    const d = steady.days[n - 1];
    if (!d) continue;
    const from = T0 + (n - 1) * DAY;
    const g = gaps(d.active, from, from + HOUR);
    const mean = 3600 / g.length / 60;
    const worst = Math.max(...g) / 60;
    lines.push(`Day ${n}: a moment every ${mean.toFixed(1)} min; the longest gap ${worst.toFixed(1)} min`);
    check(mean <= 2.5, `Day ${n}: a moment about every 2 minutes of active play (every ${mean.toFixed(1)} min)`);
    check(worst <= 5, `Day ${n}: never more than 5 minutes without a moment (${worst.toFixed(1)} min)`);
  }

  // Deeds keep coming all year, not only while everything is new (step 15 left their pace to this step).
  lines.push(`\n## Deeds over the year`);
  for (const [from, to] of [
    [1, 91],
    [92, 182],
    [183, 273],
    [274, 365],
  ]) {
    const done = steady.days
      .filter((d) => d.day >= from && d.day <= to)
      .reduce((n, d) => n + d.firsts.filter((f) => f === 'deed' || f === 'title').length, 0);
    lines.push(`Days ${from} to ${to}: ${done} deeds`);
    check(done >= QUARTER_DEEDS, `Days ${from} to ${to}: ${done} deeds done (at least ${QUARTER_DEEDS} a quarter)`);
  }

  // Titles by points spaced over the year: each within it, the last in its final quarter.
  const titles = HONOURS.flatMap((h) => (h.kind === 'title' && h.unlock && 'points' in h.unlock ? [h] : []));
  const dayOf = (need: number) => points.findIndex((p) => p >= need);
  const when = titles.map((h) => `${h.id} day ${dayOf((h.unlock as { points: number }).points)}`);
  lines.push(`Titles by points: ${when.join(', ')}`);
  const last = dayOf(Math.max(...titles.map((h) => (h.unlock as { points: number }).points)));
  check(
    last > 0 && last <= YEAR && last >= EARLY,
    `The last title by points comes on day ${last} (in the year's last quarter)`,
  );

  // Something new to aim for every day: today's daily goal (drawn from the day's work) set and done
  // every day, and a first on all but about one day in fifty, never two days running without one.
  lines.push(`\n## Something new every day`);
  const year = steady.days.filter((d) => d.day <= YEAR);
  // A day's goal done while away is paid at the next visit, so it is the year's count that tells.
  const dailies = year.reduce(
    (n, d) => n + d.events.filter((e) => e.type === 'goalDone' && e.goal === 'daily').length,
    0,
  );
  check(dailies >= year.length - 1, `${dailies} daily goals set and done in ${year.length} days`);
  const empty = year.filter((d) => d.firsts.length === 0).map((d) => d.day);
  const running = empty.some((d, i) => empty[i + 1] === d + 1);
  const kinds = new Set(year.flatMap((d) => d.firsts.map((f) => f.split(':')[0])));
  lines.push(`Kinds of first over the year: ${[...kinds].join(', ')}`);
  lines.push(`Days without a first: ${empty.join(', ') || 'none'}`);
  check(
    empty.length <= EMPTY_DAYS && !running,
    `A first on ${year.length - empty.length} of ${year.length} days (at most ${EMPTY_DAYS} without, never two running)`,
  );
  // One skill kept in its lane, on the real engine to 99: a gathering skill, an artisan one, a style.
  lines.push(`\n## One skill kept in its lane, to 99`);
  const kept = [
    [
      'Woodcutting',
      focusedPlayer(
        FEATURES.find((f) => f.id === 'woodcutting')!,
        SEED,
        130,
      ),
    ],
    [
      'Smithing',
      focusedPlayer(
        FEATURES.find((f) => f.id === 'smithing')!,
        SEED,
        130,
        'artisan',
      ),
    ],
    ['Melee', fighter('melee', SEED, 130)],
  ] as const;
  for (const [name, run] of kept) {
    const days = CLIMB.map(([lvl]) => (run.levelAt[lvl] ?? Infinity) / 24);
    lines.push(`${name}: ${CLIMB.map(([lvl], i) => `${lvl} on day ${days[i].toFixed(0)}`).join(', ')}`);
    CLIMB.forEach(([lvl, target], i) =>
      check(
        Math.abs(days[i] / target - 1) <= 0.25,
        `${name} kept in its lane reaches ${lvl} on day ${days[i].toFixed(0)} (target ${target}, within 25%)`,
      ),
    );
  }
  return { steady, light };
}
