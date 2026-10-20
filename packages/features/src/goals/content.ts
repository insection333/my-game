// The goals ladder's content. First steps (GAME_DESIGN.md section 11): six goals, each with a button
// that starts it and a small reward. Wearing the sword is done once a weapon is worn; the first
// fight's reward, 10 bread, is given when the step before it is claimed, so the player has food.
import type { ActionRef, LaneKind } from '@idle-clash/kernel';

export interface FirstStep {
  id: string;
  /** What the step's button starts, and in what kind of lane (the lane itself is chosen as it starts). */
  start: { kind: LaneKind; action: ActionRef };
  /** Done once a weapon is worn, instead of by completions; its button wears the player's weapon. */
  wearWeapon?: true;
  /** The reward is given when the step before is claimed (food for the first fight). */
  rewardFirst?: true;
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
  {
    id: 'wear-your-sword',
    start: { kind: 'combat', action: { feature: 'combat', id: 'hollow-rat' } },
    wearWeapon: true,
    completions: 0,
    reward: { item: 'gold', count: 25 },
  },
  {
    id: 'defeat-a-hollow-rat',
    start: { kind: 'combat', action: { feature: 'combat', id: 'hollow-rat' } },
    completions: 1,
    reward: { item: 'bread', count: 10 },
    rewardFirst: true,
  },
];
