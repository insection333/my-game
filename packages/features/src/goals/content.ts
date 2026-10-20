// The goals ladder's content. First steps (GAME_DESIGN.md section 11): six goals, each with a button
// that starts it and a small reward. A step joins the list when the feature it needs is built, so
// session 6 has the first; mining, smelting, forging, wearing and the first fight follow.
import type { ActionRef, LaneId } from '@idle-clash/kernel';

export interface FirstStep {
  id: string;
  /** What the step's button starts, and in which lane. */
  start: { lane: LaneId; action: ActionRef };
  /** Done once this action has been completed this many times. */
  completions: number;
  reward: { item: string; count: number };
}

export const FIRST_STEPS: readonly FirstStep[] = [
  {
    id: 'chop-a-pine',
    start: { lane: 'gathering', action: { feature: 'woodcutting', id: 'pine-tree' } },
    completions: 1,
    reward: { item: 'gold', count: 25 },
  },
];
