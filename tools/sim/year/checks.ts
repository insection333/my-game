// The year's checks (docs/EXPANSION.md section 2), on two kinds of player playing a year on the real
// engine: the steady player (an active hour a day with the fire) and the light player (ten minutes in
// the morning, five in the evening).
import { HOUR, MINUTE } from '@idle-clash/kernel';
import { FEATURES } from '@idle-clash/features';
import { HONOURS } from '../../../packages/features/src/deeds/honours.ts';
import { pointsOf } from '../../../packages/features/src/deeds/list.ts';
import { companionChecks } from './companions.ts';
import { titleChecks } from './titles.ts';
import { secondYearChecks, TWO_YEARS } from './second-year.ts';
import { STAGES as WORK_STAGES, stageCost, stageOf, WORKS } from '../../../packages/features/src/shared/steading.ts';
import { fighter } from '../combat.ts';
import { DAY, focusedPlayer, gaps, T0 } from '../player.ts';
import { LIGHT, playYear, STEADY, type Year } from './player.ts';
import { ALL_SKILLS, ARTISAN, COMBAT, GATHERING, level } from './world.ts';

type Check = (ok: boolean, what: string) => void;
const YEAR = 365;
/** A year, and the 25% either side a target may stray. */
const [EARLY, LATE] = [Math.round(YEAR * 0.75), Math.round(YEAR * 1.25)];
/** The steady player plays on to two years: the castle's long arc (session 138, eighteen months) and what
 *  each system still gives in the second year (session 209). */
const STAGES = [1, 7, 30, 90, 180, 365];
/** The seed verify plays; another may be given to measure a check before it is trusted (session 180). */
const SEED = Number(process.env.YEAR_SEED ?? 11);
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
/** Past 99, the most days running without a first. */
/** After every skill is at 99: the longest wait for a first, and the share of days with one. 3 days held at
 *  one seed by luck (session 167: main itself waited 3, 5 and 3 days at seeds 11 to 13, as the castle's
 *  firsts come as its gold allows, and any change to the castle moves them by a day or two either way;
 *  session 169 saw 6). The wait is held to under a week, and most days to bring a first, which is the
 *  cadence the end game keeps whatever the seed. */
const ENDGAME_WAIT = 6;
const ENDGAME_DAYS_WITH_A_FIRST = 0.5;

const lastOf = (y: Year, skills: readonly string[]) => Math.max(...skills.map((s) => y.at99[s] ?? Infinity));
const firstOf = (y: Year, skills: readonly string[]) => Math.min(...skills.map((s) => y.at99[s] ?? Infinity));

export function yearChecks(check: Check, lines: string[]): { steady: Year; light: Year } {
  const points: number[] = [];
  /** The day each work of the steading reached each of its stages. */
  const raised: Record<string, number[]> = Object.fromEntries(WORKS.map((w) => [w.id, []]));
  const steady = playYear(
    STEADY,
    SEED,
    TWO_YEARS,
    (day, state) => {
      points[day] = pointsOf(state);
      for (const w of WORKS) for (let n = raised[w.id].length; n < stageOf(state, w.id); n++) raised[w.id].push(day);
    },
    true,
  );
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

  // Gold over the year, once the Storehouse is fully enlarged and the steading takes the rest.
  const gold = [30, 90, 180, 365].map((n) => `day ${n} ${((steady.days[n - 1]?.gold ?? 0) / 1e6).toFixed(0)}M`);
  lines.push(`\nThe steady player's gold: ${gold.join(', ')}`);
  // Where it goes instead: the steading's works, raised as the materials and the gold come (session 25).
  const works = WORKS.map((w) => `${w.id} ${raised[w.id].join(', ') || 'never'}`);
  lines.push(`The steady player's works, raised on days: ${works.join('; ')}`);
  // What holds each work not yet at its height when the run ends (session 244).
  const held = (item: string) => steady.final.items[item] ?? 0;
  const lacks = WORKS.filter((w) => stageOf(steady.final, w.id) < WORK_STAGES).map((w) => {
    const cost = stageCost(w, stageOf(steady.final, w.id) + 1);
    const short = [{ item: 'gold', count: cost.gold * 1.5 }, ...cost.items]
      .filter((i) => held(i.item) < i.count)
      .map((i) => `${i.item} ${held(i.item)} of ${i.count}`);
    return `${w.id} (${short.join(', ') || 'nothing'})`;
  });
  if (lacks.length) lines.push(`At the run's end, what the works' next raisings lack: ${lacks.join('; ')}`);
  // Every work flies its pennant within the year (at 60M its fifth raising never came for four of the six),
  // and the later stages, paid in Uncommon finds, are reached: every work raised past its pennant, one to its height.
  const pennants = WORKS.map((w) => raised[w.id][4]);
  check(
    pennants.every((d) => d !== undefined && d <= 365),
    `Every work of the steading flies its pennant within the year (days ${pennants.map((d) => d ?? 'never').join(', ')})`,
  );
  check(
    WORKS.every((w) => raised[w.id].length > 5) && WORKS.some((w) => raised[w.id].length === WORK_STAGES),
    `Every work is raised past its pennant with Uncommon finds, one to its height (${WORKS.map((w) => raised[w.id].length).join(', ')})`,
  );

  // Every skill at 99 in about a year, for the steady player; the light player not far behind.
  const all = lastOf(steady, ALL_SKILLS);
  check(all >= EARLY && all <= LATE, `Every skill at 99 on day ${all} (target ${YEAR}, within 25%)`);
  const lightAll = lastOf(light, ALL_SKILLS);
  check(
    lightAll <= all * 1.25,
    `The light player has every skill at 99 on day ${lightAll}, within a quarter of the steady player's ${all}`,
  );

  // Castle Clash in the year (session 33): raised at total level 100 and kept as a careful lord would,
  // its Edict of Vigor lifting every skill's XP; the targets above all hold with it.
  for (const y of [steady, light]) castleYear(y, check, lines);
  companionChecks(steady, check, lines);
  secondYearChecks(steady, check, lines);

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
  titleChecks(steady, points, check, lines);

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
  // The climb is held to a first a day. Past 99 (sooner with an edict running), Kindling and the castle's
  // war carry the days, held to a first at least every few days (session 36: the lord's war past 99 took
  // the longest wait from a week to three days).
  const top = lastOf(steady, ALL_SKILLS);
  const climb = year.filter((d) => d.day <= top);
  const empty = climb.filter((d) => d.firsts.length === 0).map((d) => d.day);
  const running = empty.some((d, i) => empty[i + 1] === d + 1);
  const kinds = new Set(year.flatMap((d) => d.firsts.map((f) => f.split(':')[0])));
  lines.push(`Kinds of first over the year: ${[...kinds].join(', ')}`);
  lines.push(`Days of the climb without a first: ${empty.join(', ') || 'none'}`);
  check(
    empty.length <= EMPTY_DAYS && !running,
    `A first on ${climb.length - empty.length} of the climb's ${climb.length} days (at most ${EMPTY_DAYS} without, never two running)`,
  );
  const after = year.filter((d) => d.day > top);
  lines.push(`After every skill is at 99 (day ${top}): ${after.flatMap((d) => d.firsts).join(', ') || 'nothing'}`);
  let gap = 0;
  let longest = 0;
  for (const d of after) {
    gap = d.firsts.length ? 0 : gap + 1;
    longest = Math.max(longest, gap);
  }
  if (after.length) {
    check(
      longest <= ENDGAME_WAIT,
      `After every skill is at 99, never more than ${ENDGAME_WAIT} days without a first (the longest ${longest})`,
    );
    const withFirst = after.filter((d) => d.firsts.length > 0).length;
    check(
      withFirst >= after.length * ENDGAME_DAYS_WITH_A_FIRST,
      `After every skill is at 99, a first on ${withFirst} of ${after.length} days (at least half)`,
    );
  }
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

/** Days in a year the edict may go unpowered (a short treasury), and what a castle reaches in a year. */
const UNPOWERED_DAYS = 0.1;
/** The least share of the castle's year its lord's own materials pay (session 247: the castle raised from the land). */
const MATERIALS_SHARE = 0.05;
const CASTLE_YEAR = { level: 15, tier: 26, marks: 550 };
/** The days each of the troops' later evolutions should come in (session 138): the second within the first
 *  months, the third about half a year in, the fourth past the year, each gap about double the last. The
 *  fourth turns on how a lord's gold went for a year, so it moves with the seed (session 176: days 451, 422,
 *  382 and 397 at seeds 11 to 14, the third within 170 to 177). Session 210's daily bosses bring their gold too
 *  (days 357 to 368 at seeds 11 to 13): held to about a year, from eleven months to sixteen. */
const EVOLUTION_DAYS = [
  [30, 120],
  [150, 220],
  [330, 480],
] as const;

function castleYear(y: Year, check: Check, lines: string[]) {
  lines.push(`\n## ${y.kind.name}'s castle`);
  const kept = y.days.filter((d) => d.castle && d.day <= YEAR);
  const raised = kept[0]?.day ?? Infinity;
  check(raised <= 7, `${y.kind.name} raises a castle on day ${raised} (within the first week)`);
  for (const n of [30, 90, 180, 365]) {
    const c = y.days[n - 1]?.castle;
    if (c)
      lines.push(
        `Day ${n}: castle level ${c.level.toFixed(1)}, edict +${c.pct.toFixed(1)}%, treasury ${(c.treasury / 1e6).toFixed(1)}M of ${(c.required / 1e6).toFixed(1)}M needed, tier ${c.tier}, ${c.marks} war marks earned`,
      );
  }
  // What its own materials paid towards its levels (session 247), against all the gold the castle took.
  const spentAll = kept.reduce((n, d) => n + d.castle!.spent, 0);
  const byMaterials = kept.at(-1)?.castle?.materials ?? 0;
  check(
    byMaterials >= (byMaterials + spentAll) * MATERIALS_SHARE,
    `${y.kind.name}'s own materials pay ${(byMaterials / 1e6).toFixed(1)}M of the castle's year beside ${(spentAll / 1e6).toFixed(1)}M of gold (at least ${MATERIALS_SHARE * 100}%)`,
  );
  const unpowered = kept.filter((d) => d.castle!.pct <= 0).length;
  check(
    unpowered <= kept.length * UNPOWERED_DAYS,
    `${y.kind.name}'s edict is powered on ${kept.length - unpowered} of ${kept.length} days (at least 90%)`,
  );
  const end = kept.at(-1)?.castle;
  const quarters = [91, 182, 273, 365, 456, 548].filter((n) => n <= y.days.length);
  const levels = quarters.map((n) => y.days[n - 1]?.castle?.level ?? 0);
  check(
    levels.every((l, i) => i === 0 || l > levels[i - 1]),
    `${y.kind.name}'s castle grows every quarter (${levels.map((l) => l.toFixed(1)).join(', ')})`,
  );
  // The troops' evolutions, each in its window (the light player's year ends at 365, before the fourth).
  for (const [n, [from, to]] of EVOLUTION_DAYS.entries()) {
    if (to > y.days.length) continue;
    const day = y.days.find((d) => (d.castle?.evolution ?? 0) > n)?.day ?? Infinity;
    check(
      day >= from && day <= to,
      `${y.kind.name}'s troops evolve a ${['second', 'third', 'fourth'][n]} time on day ${day} (between ${from} and ${to})`,
    );
  }
  if (y.kind.name === 'The steady player' && end) {
    check(
      end.level >= CASTLE_YEAR.level,
      `A year's castle at level ${end.level.toFixed(1)} (at least ${CASTLE_YEAR.level})`,
    );
    check(end.tier >= CASTLE_YEAR.tier, `A year's incursions reach tier ${end.tier} (a fortress a fortnight)`);
    check(
      end.marks >= CASTLE_YEAR.marks,
      `A year's war marks without a siege: ${end.marks} (at least ${CASTLE_YEAR.marks}, a War College tree)`,
    );
  }
}
