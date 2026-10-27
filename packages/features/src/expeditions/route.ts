// A route, drawn fresh for each run (GAME_DESIGN.md section 9): a foe for every fight stage from the
// three of the region the player fares best against (the best half the time); a cache and a camp in every hour, at drawn places; one twist, or two (two runs in five); and the fork's two roads. The page shows the
// next route before it is taken: it is drawn from the save's seed and how many routes have been taken,
// so the page and the server draw the same one, and the next is different.
import { seeded, type State } from '@idle-clash/kernel';
import { skillLevel } from '../shared/skill.ts';
import { HITPOINTS } from '../shared/combat/data.ts';
import { oddsFor } from '../shared/combat/odds.ts';
import type { Foe } from '../shared/combat/foes.ts';
import {
  FOE_WEIGHTS,
  openFoes,
  ROADS,
  SECOND_TWIST,
  STAGES_PER_HOUR,
  TWISTS,
  type Region,
  type Twist,
} from '../shared/expeditions/data.ts';
import { expeditionsOf, type Route, type Stage } from '../shared/expeditions/state.ts';

export type Hours = 1 | 2 | 4 | 8;

/** The foes a run meets: the three of the region the fighter fares best against (gold and XP an hour,
 *  by Your odds, none too strong while others are not); without a weapon, the three strongest. */
export function runFoes(state: State, region: Region): Foe[] {
  const open = openFoes(region, skillLevel(state, HITPOINTS));
  const worth = (f: Foe) => {
    const o = oddsFor(state, f);
    return o ? (o.verdict === 'tooStrong' ? -1e9 : 0) + o.goldPerHour + o.xpPerHour : f.level;
  };
  return [...open].sort((a, b) => worth(b) - worth(a)).slice(0, 3);
}

/** The route the next run into a region would take. Null while the region has no foe opened. */
export function nextRoute(state: State, region: Region, hours: Hours): Route | null {
  const foes = runFoes(state, region);
  if (!foes.length) return null;
  const r = seeded(state.seed);
  let i = 0;
  const roll = () => r(`route-${region}-${hours}`, expeditionsOf(state).drawn * 4096 + i++);
  return drawRoute(
    roll,
    region,
    hours,
    foes.map((f) => f.id),
  );
}

/** A route from a source of random numbers: the same numbers draw the same route. */
export function drawRoute(roll: () => number, region: Region, hours: Hours, foes: readonly string[]): Route {
  const n = hours * STAGES_PER_HOUR;
  const weights = FOE_WEIGHTS.slice(0, foes.length);
  const total = weights.reduce((a, b) => a + b, 0);
  const foeAt = (x: number) => {
    let left = x * total;
    return foes[weights.findIndex((w) => (left -= w) < 0)] ?? foes[0];
  };
  const stages: Stage[] = Array.from({ length: n }, () => ({ foe: foeAt(roll()), after: null }));
  for (let h = 0; h < hours; h++) {
    const a = Math.floor(roll() * STAGES_PER_HOUR);
    const b = (a + 1 + Math.floor(roll() * (STAGES_PER_HOUR - 1))) % STAGES_PER_HOUR;
    stages[h * STAGES_PER_HOUR + a] = { ...stages[h * STAGES_PER_HOUR + a], after: 'cache' };
    stages[h * STAGES_PER_HOUR + b] = { ...stages[h * STAGES_PER_HOUR + b], after: 'camp' };
  }
  const pick = (list: readonly Twist[], not?: Twist) => {
    const left = list.filter((x) => x !== not);
    return left[Math.floor(roll() * left.length)];
  };
  const first = pick(TWISTS);
  const twists = roll() < SECOND_TWIST ? [first, pick(TWISTS, first)] : [first];
  const road = pick(ROADS);
  return {
    region,
    hours,
    stages,
    twists: twists.map((t) => t.id),
    roads: [road.id, pick(ROADS, road).id],
    fork: n / 2,
  };
}
