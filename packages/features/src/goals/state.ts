// Goals' own part of the save: the first steps and milestones claimed, the three short goals at hand,
// and today's daily goal. Each short goal and the daily goal keep where their count began (`base`),
// so progress is what was done since. Fields added in session 9 default, so older saves still read.
import type { State } from '@idle-clash/kernel';
import { z } from 'zod';

const Key = z.string().max(64);
const Ref = z.object({ feature: Key, id: Key }).strict();
const Count = z.number().int().nonnegative();

export const ShortGoal = z
  .object({
    id: Key,
    /** Complete an action `target` times, or reach mastery step `target` on it. */
    kind: z.enum(['count', 'mastery']),
    action: Ref,
    skill: Key,
    lane: z.enum(['gathering', 'artisan', 'combat']),
    target: Count,
    base: Count,
    reward: Count,
  })
  .strict();
export type ShortGoal = z.infer<typeof ShortGoal>;

export const DailyGoal = z
  .object({
    /** The day it is for (UTC, 2026-10-21). */
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    skill: Key,
    target: Count,
    base: z.number().nonnegative(),
    reward: Count,
    claimed: z.boolean(),
  })
  .strict();
export type DailyGoal = z.infer<typeof DailyGoal>;

export const GoalsState = z
  .object({
    claimed: z.array(Key).max(200),
    short: z.array(ShortGoal).max(3).default([]),
    /** Short goals made so far: each new one draws its choice from this count. */
    made: Count.default(0),
    daily: DailyGoal.nullable().default(null),
    milestones: z.array(Key).max(100).default([]),
    /** Supply caches opened so far: each one's draw comes from this count (session 11). */
    opened: Count.default(0),
  })
  .strict();
export type GoalsState = z.infer<typeof GoalsState>;

export function goalsOf(state: State): GoalsState {
  const parsed = GoalsState.safeParse(Object.hasOwn(state.features, 'goals') ? state.features.goals : undefined);
  return parsed.success ? parsed.data : { claimed: [], short: [], made: 0, daily: null, milestones: [], opened: 0 };
}

export const setGoals = (state: State, g: GoalsState): void => {
  state.features.goals = g;
};

/** The UTC day a moment falls on, as the daily goal names it. */
export const dayOf = (at: number): string => new Date(at).toISOString().slice(0, 10);
