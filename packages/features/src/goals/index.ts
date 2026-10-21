// Goals: the ladder on the Hearth. First steps with their buttons and claims (all six since
// session 8); short goals, the daily goal and milestones join in session 9.
import { fmt, Id, levelFor, t, TIER_LEVELS } from '@idle-clash/content';
import { actionKey, countOf, LANE_IDS, laneFor, xpOf, type Command, type LaneId, type State } from '@idle-clash/kernel';
import { z } from 'zod';
import { defineFeature, defineRoute, type Json } from '../define.ts';
import { itemOf } from '../shared/catalog.ts';
import { combatOf } from '../shared/combat/state.ts';
import { FIRST_STEPS, type FirstStep } from './content.ts';
import { claim, completionsOf, goalsOf, isDone } from './rules.ts';

/** One goal as the Hearth draws it. */
export interface GoalRow {
  id: string;
  name: string;
  reward: string;
  progress: number;
  state: 'todo' | 'working' | 'ready' | 'claimed';
  /** What its button does: start the step's action, or claim it. Null when there is nothing to press. */
  button:
    | { label: string; command: Command }
    | { label: string; claim: string }
    | { label: string; route: { feature: string; route: string; input: Json } }
    | null;
  note: string | null;
}
export interface GoalsView {
  title: string;
  progress: string;
  rows: GoalRow[];
}

const LANE_NAMES: Record<LaneId, string> = {
  gathering: 'lane.gathering',
  gathering2: 'lane.gathering2',
  artisan: 'lane.artisan',
  combat: 'lane.combat',
};

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
  const lane = laneFor(state, now, step.start.action, step.start.kind);
  const command: Command = { type: 'start', lane, action: step.start.action };
  return { button: { label: t(`goal.${step.id}.start`), command }, note: null };
}

export const goals = defineFeature({
  id: 'goals',
  flag: { on: true, note: 'First steps since session 6; the rest of the ladder in session 9' },
  content: {},
  effects: [],
  stops: [],
  rules: {},
  routes: {
    claim: defineRoute({
      input: z.object({ goal: Id }).strict(),
      example: { goal: 'chop-a-pine' },
      run: (state, input, now) => claim(state, input.goal, now),
    }),
  },
  slots: {
    'hearth.goals': ({ state, now }) => {
      const { claimed } = goalsOf(state);
      const rows = FIRST_STEPS.map((step): GoalRow => {
        const reward = rewardText(step);
        const name = t(`goal.${step.id}`);
        const progress = step.completions ? Math.min(1, completionsOf(state, step) / step.completions) : 0;
        if (claimed.includes(step.id))
          return { id: step.id, name, reward, progress: 1, state: 'claimed', button: null, note: t('goals.claimed') };
        if (isDone(state, step))
          return {
            id: step.id,
            name,
            reward,
            progress: 1,
            state: 'ready',
            button: { label: step.rewardFirst ? t('goals.finish') : t('goals.claim', { reward }), claim: step.id },
            note: null,
          };
        const working =
          !step.wearWeapon &&
          LANE_IDS.find((l) => {
            const run = state.lanes[l].current;
            return run && actionKey(run.action) === actionKey(step.start.action);
          });
        if (working)
          return {
            id: step.id,
            name,
            reward,
            progress,
            state: 'working',
            button: null,
            note: t('goals.inLane', { lane: t(LANE_NAMES[working]) }),
          };
        return { id: step.id, name, reward, progress, state: 'todo', ...todo(state, now, step) };
      });
      const done = rows.filter((r) => r.state === 'claimed').length;
      // First steps show while unfinished (IA.md); once all are claimed the panel goes, until the
      // short goals that follow them arrive (session 9).
      if (done === rows.length) return null;
      return {
        title: t('goals.firstSteps'),
        progress: t('goals.progress', { done: fmt.int(done), total: fmt.int(rows.length) }),
        rows,
      } satisfies GoalsView as unknown as Json;
    },
  },
  help: { title: 'help.goals.title', body: 'help.goals.body' },
});
