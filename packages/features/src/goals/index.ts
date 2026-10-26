// Goals: the ladder on the Hearth. First steps while unfinished, with their buttons and claims;
// afterwards three short goals, today's daily goal and the nearest milestone (session 9).
import { fmt, Id, t } from '@idle-clash/content';
import { z } from 'zod';
import { defineFeature, defineRoute, type Json } from '../define.ts';
import { firstStepRows, firstStepsDone } from './first-steps.ts';
import { ladderRows } from './ladder-view.ts';
import { standingView } from './ranks.ts';
import { claim, needsRefresh, refresh } from './rules.ts';
import type { GoalsView } from './view.ts';

export type { GoalRow, GoalsView } from './view.ts';
export type { StandingView } from './ranks.ts';

export const goals = defineFeature({
  id: 'goals',
  flag: { on: true, note: 'First steps since session 6; the whole ladder since session 9' },
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
    refresh: defineRoute({
      input: z.object({}).strict(),
      example: {},
      run: (state, _input, now) => refresh(state, now),
    }),
  },
  slots: {
    'hearth.standing': ({ state }) => standingView(state) as unknown as Json,
    'hearth.goals': ({ state, now }) => {
      if (!firstStepsDone(state)) {
        const rows = firstStepRows(state, now);
        const done = rows.filter((r) => r.state === 'claimed').length;
        return {
          title: t('goals.firstSteps'),
          progress: t('goals.progress', { done: fmt.int(done), total: fmt.int(rows.length) }),
          rows,
          refresh: false,
        } satisfies GoalsView as unknown as Json;
      }
      return {
        title: t('goals.title'),
        progress: null,
        rows: ladderRows(state, now),
        refresh: needsRefresh(state, now),
      } satisfies GoalsView as unknown as Json;
    },
  },
  help: { title: 'help.goals.title', body: 'help.goals.body' },
});
