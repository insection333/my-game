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

/** A milestone (GAME_DESIGN.md section 11): a long-term mark, paid in gold and shown on hiscores. */
export type Milestone =
  | { id: string; kind: 'total'; level: number; reward: number }
  | { id: string; kind: 'forged'; metal: string; tier: number; reward: number }
  | { id: string; kind: 'log'; count: number; reward: number }
  | { id: string; kind: 'mastery'; step: number; reward: number };

export const MILESTONES: readonly Milestone[] = [
  ...[
    [50, 2_000],
    [100, 10_000],
    [150, 30_000],
    [200, 60_000],
    [250, 100_000],
    [280, 150_000],
  ].map(([level, reward]): Milestone => ({ id: `total-${level}`, kind: 'total', level, reward })),
  ...[
    ['copper', 250],
    ['bronze', 1_000],
    ['iron', 5_000],
    ['steel', 20_000],
  ].map(([metal, reward], i): Milestone => ({
    id: `first-${metal}`,
    kind: 'forged',
    metal: String(metal),
    tier: i + 1,
    reward: Number(reward),
  })),
  ...[
    [12, 5_000],
    [24, 25_000],
    [36, 75_000],
  ].map(([count, reward]): Milestone => ({ id: `log-${count}`, kind: 'log', count, reward })),
  { id: 'mastery-10', kind: 'mastery', step: 10, reward: 50_000 },
];
