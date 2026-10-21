// The brief's first-hour and gold targets on the real engine.
// - A fresh player following the Hearth's goals: the first level-up under a minute, the first crafted
//   gear worn under 15 minutes, a find within the hour, a notable moment about every minute (the
//   model's first hour) and never more than five minutes without one.
// - Gold: on each day the model expects an enlargement to be bought, a day of the player's lanes pays
//   for a day of food and that enlargement.
import { bestIn, combatData, FEATURES, paces, storehouseData, yourOdds } from '@idle-clash/features';
import type { State } from '@idle-clash/kernel';
import { bestFoe } from './combat.ts';
import { newcomer } from './newcomer.ts';
import type { Played } from './player.ts';

type Check = (ok: boolean, what: string) => void;
const BUY_DAYS = [1, 2, 3, 5, 7, 10, 14, 18];

export function firstHour(check: Check, lines: string[], seeds: readonly number[]) {
  if (!FEATURES.some((f) => f.id === 'combat' && f.flag.on)) return;
  const fresh = seeds.map((seed) => newcomer(seed));
  const worst = (f: (n: (typeof fresh)[number]) => number) => Math.max(...fresh.map(f));
  lines.push(`\n## The first hour: ${seeds.length} newcomers following the Hearth's goals`);
  const gaps = fresh.map((n) => {
    const marks = [0, ...n.moments, 3600];
    return marks.slice(1).map((m, i) => m - marks[i]);
  });
  const mean = Math.max(...fresh.map((n) => 3600 / Math.max(1, n.moments.length)));
  const longest = Math.max(...gaps.flat());
  lines.push(
    `First level after ${worst((n) => n.levelled)} s; sword worn after ${worst((n) => n.worn)} s; first foe beaten after ${worst((n) => n.fought)} s; first find after ${Math.round(worst((n) => n.found))} s; a moment every ${(mean / 60).toFixed(1)} min, the longest gap ${(longest / 60).toFixed(1)} min`,
  );
  check(worst((n) => n.levelled) < 60, `A newcomer's first level-up comes within a minute`);
  check(worst((n) => n.worn) <= 15 * 60, `The first crafted gear is worn within 15 minutes`);
  check(Math.min(...fresh.map((n) => n.claimed)) === 6, `Every newcomer claims all six first steps within the hour`);
  check(worst((n) => n.found) <= 3600, `Every newcomer makes a find within the first hour`);
  check(
    mean <= 1.25 * 60,
    `A notable moment about every minute in the first hour (every ${(mean / 60).toFixed(1)} min)`,
  );
  check(longest <= 300, `Never more than 5 minutes without a moment in the first hour`);
}

/** Gold an hour from a skill's best open action (net of what it uses up). */
const goldPerHour = (state: State, skill: string) => {
  const p = bestIn(paces(state), skill);
  return p ? (p.goldEach / p.secondsEach) * 3600 : 0;
};

export function gold(check: Check, lines: string[], runs: { gather?: Played; smith?: Played; fight?: Played }) {
  const { gather, smith, fight } = runs;
  if (!gather || !smith || !fight) return;
  lines.push('\n## Gold: a day of lanes against a day of food and the next Storehouse enlargement');
  /** A day's gold and food at the pace of the lanes on one morning. */
  const at = (k: number) => {
    const day = (r: Played) => r.days[Math.min(k, r.days.length - 1)].start;
    const g = goldPerHour(day(gather), 'woodcutting');
    const s = goldPerHour(day(smith), 'smithing');
    const f = day(fight);
    const o = yourOdds(f, bestFoe(f));
    // The best food the fighter carries is what Your odds counts.
    const price = [...combatData.FOODS].reverse().find((x) => (f.items[x.id] ?? 0) > 0)?.price ?? 0;
    const food = 24 * (o?.foodPerHour ?? 0) * price;
    return { food, income: 24 * (g + s + (o ? o.goldPerHour : 0)) + food };
  };
  BUY_DAYS.forEach((d, i) => {
    // The day's pace rises as it goes: the mean of its morning and the next.
    const [a, b] = [at(d - 1), at(d)];
    const income = (a.income + b.income) / 2;
    const foodPerDay = (a.food + b.food) / 2;
    const cost = storehouseData.ENLARGE_COSTS[i];
    lines.push(
      `Day ${d}: income ${Math.round(income).toLocaleString('en')}, food ${Math.round(foodPerDay).toLocaleString('en')}, enlargement ${i + 1} costs ${cost.toLocaleString('en')}`,
    );
    check(income >= foodPerDay + cost, `Day ${d}: a day's gold covers a day of food and enlargement ${i + 1}`);
  });
}
