// First steps (GAME_DESIGN.md section 11): six goals, each with a button that starts it and a small
// reward. Wearing the sword is done once a weapon is worn; the first fight's bread is given when the
// step before it is claimed. Goals read shared state (completions, items, the gear worn) through the
// kernel and shared helpers, never the features they name.
import { fmt, levelFor, t, TIER_LEVELS } from '@idle-clash/content';
import { actionKey, countOf, give, xpOf, type State } from '@idle-clash/kernel';
import { itemOf } from '../shared/catalog.ts';
import { combatOf } from '../shared/combat/state.ts';
import { FIRST_STEPS, type FirstStep } from './content.ts';
import { goalsOf } from './state.ts';
import { inLane, startCommand, workingIn, type GoalRow } from './view.ts';

export const completionsOf = (state: State, step: FirstStep): number => {
  const key = actionKey(step.start.action);
  return Object.hasOwn(state.mastery, key) ? state.mastery[key] : 0;
};

export const isDone = (state: State, step: FirstStep): boolean =>
  step.wearWeapon ? combatOf(state).worn.weapon !== undefined : completionsOf(state, step) >= step.completions;

export const firstStepsDone = (state: State): boolean =>
  FIRST_STEPS.every((s) => goalsOf(state).claimed.includes(s.id));

/** Pays a finished step's reward into `next` (and the next step's, when it comes first). */
export function payFirst(next: State, step: FirstStep): void {
  if (!step.rewardFirst) give(next, step.reward.item, step.reward.count);
  const after = FIRST_STEPS[FIRST_STEPS.indexOf(step) + 1] as FirstStep | undefined;
  if (after?.rewardFirst) give(next, after.reward.item, after.reward.count);
}

/** A weapon the player owns and may wear: the one the first fight's step puts on. */
function wearable(state: State): string | null {
  for (const id of Object.keys(state.items)) {
    const gear = itemOf(id)?.gear;
    if (gear?.slot !== 'weapon' || !gear.style || countOf(state, id) < 1) continue;
    if (levelFor(xpOf(state, gear.style)) >= TIER_LEVELS[gear.tier - 1]) return id;
  }
  return null;
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
function rewardText(step: FirstStep): string {
  const { item, count } = step.reward;
  const reward =
    item === 'gold'
      ? t('goals.reward.gold', { amount: fmt.int(count) })
      : t('goals.reward.items', { count: fmt.int(count), item: lower(t(`item.${item}`)) });
  return step.rewardFirst ? t('goals.reward.first', { reward }) : reward;
}

/** A step not yet done: its button, or why it has none yet. */
function todo(state: State, now: number, step: FirstStep): Pick<GoalRow, 'button' | 'note'> {
  if (step.wearWeapon) {
    const item = wearable(state);
    return item
      ? {
          button: { label: t(`goal.${step.id}.start`), route: { feature: 'combat', route: 'wear', input: { item } } },
          note: null,
        }
      : { button: null, note: t('gear.noWeapon') };
  }
  if (step.needs && levelFor(xpOf(state, step.needs.skill)) < step.needs.level)
    return {
      button: null,
      note: t('goals.needs', { skill: t(`skill.${step.needs.skill}`), level: fmt.int(step.needs.level) }),
    };
  if (step.start.kind === 'combat' && combatOf(state).worn.weapon === undefined)
    return { button: null, note: t('stop.noWeapon') };
  return {
    button: {
      label: t(`goal.${step.id}.start`),
      command: startCommand(state, now, step.start.action, step.start.kind),
    },
    note: null,
  };
}

export function firstStepRows(state: State, now: number): GoalRow[] {
  const { claimed } = goalsOf(state);
  return FIRST_STEPS.map((step): GoalRow => {
    const reward = rewardText(step);
    const name = t(`goal.${step.id}`);
    const progress = step.completions ? Math.min(1, completionsOf(state, step) / step.completions) : 0;
    if (claimed.includes(step.id))
      return { id: step.id, name, reward, progress: 1, state: 'claimed', button: null, note: t('goals.claimed') };
    if (isDone(state, step)) {
      const label = step.rewardFirst ? t('goals.finish') : t('goals.claim', { reward });
      return { id: step.id, name, reward, progress: 1, state: 'ready', button: { label, claim: step.id }, note: null };
    }
    const working = !step.wearWeapon && workingIn(state, step.start.action);
    if (working) return { id: step.id, name, reward, progress, state: 'working', button: null, note: inLane(working) };
    return { id: step.id, name, reward, progress, state: 'todo', ...todo(state, now, step) };
  });
}
