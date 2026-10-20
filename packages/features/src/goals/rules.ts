// Goals' rules: whether a step is done, and claiming it. Goals read shared state (completions,
// items) through the kernel; they never import the features whose actions they name.
import { actionKey, give, noteMoment, type GameEvent, type State } from '@idle-clash/kernel';
import { z } from 'zod';
import { FIRST_STEPS, type FirstStep } from './content.ts';

/** Goals' own part of the save. */
export const GoalsState = z.object({ claimed: z.array(z.string().max(64)).max(200) }).strict();
export type GoalsState = z.infer<typeof GoalsState>;

export function goalsOf(state: State): GoalsState {
  const parsed = GoalsState.safeParse(Object.hasOwn(state.features, 'goals') ? state.features.goals : undefined);
  return parsed.success ? parsed.data : { claimed: [] };
}

export const completionsOf = (state: State, step: FirstStep): number => {
  const key = actionKey(step.start.action);
  return Object.hasOwn(state.mastery, key) ? state.mastery[key] : 0;
};

export const isDone = (state: State, step: FirstStep): boolean => completionsOf(state, step) >= step.completions;

export type ClaimResult = { ok: true } | { ok: false; reason: 'unknown' | 'notDone' };

/** Claims a finished step: its reward, a moment, and the step marked claimed. Claiming twice does nothing. */
export function claim(state: State, goal: string, now: number): { state: State; result: ClaimResult; events: GameEvent[] } {
  const step = FIRST_STEPS.find((s) => s.id === goal);
  if (!step) return { state, result: { ok: false, reason: 'unknown' }, events: [] };
  const goals = goalsOf(state);
  if (goals.claimed.includes(goal)) return { state, result: { ok: true }, events: [] };
  if (!isDone(state, step)) return { state, result: { ok: false, reason: 'notDone' }, events: [] };
  const next = structuredClone(state);
  give(next, step.reward.item, step.reward.count);
  next.features.goals = { claimed: [...goals.claimed, goal] };
  noteMoment(next, now);
  return { state: next, result: { ok: true }, events: [{ type: 'goalDone', at: now, goal }] };
}
