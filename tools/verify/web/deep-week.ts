// The Deep for verify's players (session 214): a depth reached this week, so the Deep's ladder of the week
// reads as it will with players on it, and the keeper's Expeditions tab shows a deepest and its waystone.
import { deepOf, weekOf } from '@idle-clash/features';
import type { State } from '@idle-clash/kernel';

const NO_RUNS = { marks: 0, relics: {}, drawn: 0, run: null, bossDay: {}, wins: {}, runs: {}, twists: [] };

/** A save that has reached `depth` in the Deep this week (and no deeper ever). */
export function withDeep(state: State, depth: number, now: number): State {
  const e = state.features.expeditions ?? NO_RUNS;
  const deep = { ...deepOf(state), deepest: depth, week: weekOf(now), weekDeepest: depth, descents: 3 };
  return { ...state, features: { ...state.features, expeditions: { ...e, deep } } };
}

/** A quarter of the crowd has gone down this week, each to its own depth, by its place in the crowd. */
export const crowdDeep = (state: State, i: number, now: number): State =>
  i % 4 === 1 ? withDeep(state, 9 + ((i * 7) % 23), now) : state;
