// The Deep's relics (session 215, the plan *Dead and short content, 23 November*): a second set of relics,
// bought with marks, that work only in the Deep, so the year's pacing is untouched and marks have a use again
// once the first relics are raised (about day 80). Each has no last rank: every rank costs a little more than
// the one before, and the Deep grows stronger by compounding as the relics do, so the deepest a fighter reaches
// keeps growing, more slowly, for as long as they play.
import type { State } from '@idle-clash/kernel';
import type { Foe } from '../combat/data.ts';
import { expeditionsOf } from './state.ts';

export type DeepRelicId = 'deep-satchel' | 'deep-lantern' | 'deep-edge';

export const DEEP_RELIC = {
  /** More meals in a descent's pack, a rank. */
  MEALS: 2,
  /** The Deep's foes and bosses hit this much softer a rank, each rank on what is left. */
  WARD_PCT: 2,
  /** Your blows land this much harder in the Deep, a rank, each rank on the last. */
  EDGE_PCT: 3,
  /** The first rank's marks, and each rank after costs this much more than the one before. */
  FIRST: 40,
  GROWTH: 1.03,
} as const;

export const DEEP_RELICS: readonly DeepRelicId[] = ['deep-satchel', 'deep-lantern', 'deep-edge'];

export const deepRank = (state: State, id: DeepRelicId): number => {
  const ranks = expeditionsOf(state).deep?.relics ?? {};
  return Object.hasOwn(ranks, id) ? ranks[id] : 0;
};

/** The marks the rank after `rank` costs. */
export const deepRelicCost = (rank: number): number => Math.round(DEEP_RELIC.FIRST * DEEP_RELIC.GROWTH ** rank);

/** The meals a descent's pack holds beyond the pack's own. */
export const deepMeals = (state: State) => deepRank(state, 'deep-satchel') * DEEP_RELIC.MEALS;

/** A foe as it fights in the Deep for this fighter: the lantern's ward off its hits, and the edge's blows
 *  counted against its health (a blow a share harder is the same fight as a foe a share less hale). */
export function inTheDeep<F extends Foe>(state: State, foe: F): F {
  const ward = (1 - DEEP_RELIC.WARD_PCT / 100) ** deepRank(state, 'deep-lantern');
  const edge = (1 + DEEP_RELIC.EDGE_PCT / 100) ** deepRank(state, 'deep-edge');
  return { ...foe, hp: Math.max(1, Math.round(foe.hp / edge)), maxHit: Math.max(1, Math.round(foe.maxHit * ward)) };
}
