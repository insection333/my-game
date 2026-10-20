// Goals' rules: whether a step is done, and claiming it. Goals read shared state (completions,
// items, the gear worn) through the kernel and shared helpers, never the features they name.
import { actionKey, give, noteMoment, type GameEvent, type State } from '@idle-clash/kernel';
import { z } from 'zod';
import { combatOf } from '../shared/combat/state.ts';
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

export const isDone = (state: State, step: FirstStep): boolean =>
  step.wearWeapon ? combatOf(state).worn.weapon !== undefined : completionsOf(state, step) >= step.completions;

export type ClaimResult = { ok: true } | { ok: false; reason: 'unknown' | 'notDone' };

/** Claims a finished step: its reward, a moment, and the step marked claimed. Claiming twice does nothing. */
export function claim(
  state: State,
  goal: string,
  now: number,
): { state: State; result: ClaimResult; events: GameEvent[] } {
  const step = FIRST_STEPS.find((s) => s.id === goal);
  if (!step) return { state, result: { ok: false, reason: 'unknown' }, events: [] };
  const goals = goalsOf(state);
  if (goals.claimed.includes(goal)) return { state, result: { ok: true }, events: [] };
  if (!isDone(state, step)) return { state, result: { ok: false, reason: 'notDone' }, events: [] };
  const next = structuredClone(state);
  if (!step.rewardFirst) give(next, step.reward.item, step.reward.count);
  // The next step's reward, when it comes first, arrives with this one.
  const after = FIRST_STEPS[FIRST_STEPS.indexOf(step) + 1] as FirstStep | undefined;
  if (after?.rewardFirst) give(next, after.reward.item, after.reward.count);
  next.features.goals = { claimed: [...goals.claimed, goal] };
  noteMoment(next, now);
  return { state: next, result: { ok: true }, events: [{ type: 'goalDone', at: now, goal }] };
}
