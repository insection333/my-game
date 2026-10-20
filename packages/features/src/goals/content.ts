// The goals ladder's content. First steps (GAME_DESIGN.md section 11): six goals, each with a button
// that starts it and a small reward. A step joins the list when the feature it needs is built, so
// session 7 has the first four; wearing the sword and the first fight follow in session 8.
import type { ActionRef, LaneKind } from '@idle-clash/kernel';

export interface FirstStep {
  id: string;
  /** What the step's button starts, and in what kind of lane (the lane itself is chosen as it starts). */
  start: { kind: LaneKind; action: ActionRef };
  /** A level the action needs first, shown instead of the button until it is reached. */
  needs?: { skill: string; level: number };
  /** Done once this action has been completed this many times. */
  completions: number;
  reward: { item: string; count: number };
}

export const FIRST_STEPS: readonly FirstStep[] = [
  {
    id: 'chop-a-pine',
    start: { kind: 'gathering', action: { feature: 'woodcutting', id: 'pine-tree' } },
    completions: 1,
    reward: { item: 'gold', count: 25 },
  },
  {
    id: 'mine-copper-ore',
    start: { kind: 'gathering', action: { feature: 'mining', id: 'copper-vein' } },
    completions: 1,
    reward: { item: 'gold', count: 25 },
  },
  {
    id: 'smelt-a-copper-bar',
    start: { kind: 'artisan', action: { feature: 'smithing', id: 'copper-bar' } },
    completions: 1,
    reward: { item: 'gold', count: 25 },
  },
  {
    id: 'forge-a-copper-sword',
    start: { kind: 'artisan', action: { feature: 'smithing', id: 'copper-sword' } },
    needs: { skill: 'smithing', level: 2 },
    completions: 1,
    reward: { item: 'gold', count: 25 },
  },
];
