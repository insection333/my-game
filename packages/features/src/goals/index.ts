// Goals: the ladder on the Hearth. In session 6, the first of the six first steps, with its button and
// its claim; short goals, the daily goal and milestones join in session 9.
import { fmt, Id, t } from '@idle-clash/content';
import { actionKey, type Command, type LaneId } from '@idle-clash/kernel';
import { z } from 'zod';
import { defineFeature, defineRoute, type Json } from '../define.ts';
import { FIRST_STEPS } from './content.ts';
import { claim, completionsOf, goalsOf, isDone } from './rules.ts';

/** One goal as the Hearth draws it. */
export interface GoalRow {
  id: string;
  name: string;
  reward: string;
  progress: number;
  state: 'todo' | 'working' | 'ready' | 'claimed';
  /** What its button does: start the step's action, or claim it. Null when there is nothing to press. */
  button: { label: string; command: Command } | { label: string; claim: string } | null;
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
      run: (state, input, now) => claim(state, input.goal, now),
    }),
  },
  slots: {
    'hearth.goals': ({ state }) => {
      const { claimed } = goalsOf(state);
      const rows = FIRST_STEPS.map((step): GoalRow => {
        const reward = t('goals.reward.gold', { amount: fmt.int(step.reward.count) });
        const name = t(`goal.${step.id}`);
        const progress = Math.min(1, completionsOf(state, step) / step.completions);
        if (claimed.includes(step.id))
          return { id: step.id, name, reward, progress: 1, state: 'claimed', button: null, note: t('goals.claimed') };
        if (isDone(state, step))
          return {
            id: step.id,
            name,
            reward,
            progress: 1,
            state: 'ready',
            button: { label: t('goals.claim', { reward }), claim: step.id },
            note: null,
          };
        const running = state.lanes[step.start.lane].current;
        if (running && actionKey(running.action) === actionKey(step.start.action))
          return {
            id: step.id,
            name,
            reward,
            progress,
            state: 'working',
            button: null,
            note: t('goals.inLane', { lane: t(LANE_NAMES[step.start.lane]) }),
          };
        const command: Command = { type: 'start', lane: step.start.lane, action: step.start.action };
        return {
          id: step.id,
          name,
          reward,
          progress,
          state: 'todo',
          button: { label: t(`goal.${step.id}.start`), command },
          note: null,
        };
      });
      const done = rows.filter((r) => r.state === 'claimed').length;
      return {
        title: t('goals.firstSteps'),
        progress: t('goals.progress', { done: fmt.int(done), total: fmt.int(rows.length) }),
        rows,
      } satisfies GoalsView as unknown as Json;
    },
  },
  help: { title: 'help.goals.title', body: 'help.goals.body' },
});
