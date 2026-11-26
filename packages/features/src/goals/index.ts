// Goals: the ladder on the Hearth. First steps while unfinished, with their buttons and claims;
// afterwards three short goals, today's daily goal and the nearest milestone (session 9).
import { fmt, Id, t } from '@idle-clash/content';
import { z } from 'zod';
import { defineFeature, defineRoute, type Json } from '../define.ts';
import { firstStepRows, firstStepsDone } from './first-steps.ts';
import { ladderRows } from './ladder-view.ts';
import { standingView } from './ranks.ts';
import { claim, claimAll, needsRefresh, refresh, swap } from './rules.ts';
import { giftErrands, giftsView, openGift } from './gift.ts';
import type { State } from '@idle-clash/kernel';
import type { GoalRow, GoalsView } from './view.ts';

export type { GoalRow, GoalsView } from './view.ts';
export type { GiftsView } from './gift.ts';

/** The rows the Hearth lists: First steps while unfinished, the ladder after. */
const rowsOf = (state: State, now: number): GoalRow[] =>
  firstStepsDone(state) ? ladderRows(state, now) : firstStepRows(state, now);

/** The goals ready to claim, in the order the Hearth lists them (session 242). */
const readyOf = (rows: readonly GoalRow[]): string[] =>
  rows.flatMap((r) => (r.button && 'claim' in r.button ? [r.button.claim] : []));

/** Claim all, offered while two goals or more are ready. */
const claimAllOf = (rows: readonly GoalRow[]): string | null => {
  const ready = readyOf(rows).length;
  return ready > 1 ? t('goals.claimAll', { count: fmt.int(ready) }) : null;
};
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
    claimAll: defineRoute({
      input: z.object({}).strict(),
      example: {},
      run: (state, _input, now) => claimAll(state, (s) => readyOf(rowsOf(s, now)), now),
    }),
    swap: defineRoute({
      input: z.object({ task: z.number().int().min(0).max(3) }).strict(),
      example: { task: 0 },
      run: (state, input, now) => swap(state, input.task, now),
    }),
    // A friend's gift opened (session 254).
    openGift: defineRoute({
      input: z.object({ id: z.number().int().positive() }).strict(),
      example: { id: 1 },
      run: (state, input, now) => openGift(state, input.id, now),
    }),
    refresh: defineRoute({
      passive: true,
      input: z.object({}).strict(),
      example: {},
      run: (state, _input, now) => refresh(state, now),
    }),
  },
  slots: {
    'hearth.gifts': ({ state, now }) => giftsView(state, now) as unknown as Json,
    'hearth.errands': ({ state }) => giftErrands(state) as unknown as Json,
    'hearth.standing': ({ state }) => standingView(state) as unknown as Json,
    'hearth.goals': ({ state, now }) => {
      if (!firstStepsDone(state)) {
        const rows = firstStepRows(state, now);
        // A step done counts, its gold claimed or not (session 129: two steps offering Claim read "0 of 6").
        const done = rows.filter((r) => r.state === 'claimed' || r.state === 'ready').length;
        return {
          title: t('goals.firstSteps'),
          progress: t('goals.progress', { done: fmt.int(done), total: fmt.int(rows.length) }),
          rows,
          refresh: false,
          claimAll: claimAllOf(rows),
        } satisfies GoalsView as unknown as Json;
      }
      const rows = ladderRows(state, now);
      return {
        title: t('goals.title'),
        progress: null,
        rows,
        refresh: needsRefresh(state, now),
        claimAll: claimAllOf(rows),
      } satisfies GoalsView as unknown as Json;
    },
  },
  help: { title: 'help.goals.title', body: 'help.goals.body' },
});
