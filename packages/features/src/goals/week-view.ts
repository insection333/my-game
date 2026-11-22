// How the week's contract reads on the Hearth (session 172): one row under the day's goal, saying how many
// of its tasks are done and when the next contract comes, opening to its tasks, each with its count and,
// once a week, Swap.
import { fmt, t } from '@idle-clash/content';
import type { State } from '@idle-clash/kernel';
import type { Json } from '../define.ts';
import type { WeekContract, WeekTask } from './state.ts';
import type { GoalRow } from './view.ts';
import { taskProgress, weekEnds } from './week.ts';

const actionName = (a: { feature: string; id: string }) => t(`action.${a.feature}.${a.id}`);

export function taskName(task: WeekTask): string {
  switch (task.kind) {
    case 'xp':
      return t('goal.week.xp', { xp: fmt.int(task.target), skill: t(`skill.${task.skill}`) });
    case 'count':
      return t('goal.week.count', { action: actionName(task.action!), count: fmt.int(task.target) });
    case 'boss':
      return t(task.target === 1 ? 'goal.week.bossOne' : 'goal.week.boss', { count: fmt.int(task.target) });
    case 'mastery':
      return t(task.target === 1 ? 'goal.week.masteryOne' : 'goal.week.mastery', { count: fmt.int(task.target) });
  }
}

/** The moment's words when a week's contract is claimed: the weeks kept so far. */
export const weekName = (weeks: number) =>
  weeks === 1 ? t('goal.week.doneOne') : t('goal.week.done', { count: fmt.int(weeks) });

export interface WeekPart {
  text: string;
  count: string;
  done: boolean;
  /** Swap this task for another: once a week, while the contract is open. */
  swap: { feature: string; route: string; input: Json } | null;
}

export function weekRow(state: State, now: number, w: WeekContract): GoalRow & { parts: WeekPart[] } {
  const progress = w.tasks.map((task) => taskProgress(state, task));
  const done = progress.filter((p) => p.now >= p.of).length;
  const all = done === w.tasks.length;
  const open = !w.claimed && !all;
  const parts = w.tasks.map((task, i) => ({
    text: taskName(task),
    count: t('goals.count', { now: fmt.int(progress[i].now), of: fmt.int(progress[i].of) }),
    done: progress[i].now >= progress[i].of,
    swap:
      open && !w.swapped && progress[i].now < progress[i].of
        ? { feature: 'goals', route: 'swap', input: { task: i } }
        : null,
  }));
  const turns = fmt.when(weekEnds(now), now);
  return {
    id: 'week',
    name: t('goal.week'),
    reward: t('goals.reward.cache', { amount: fmt.int(w.reward) }),
    count: t('goals.count', { now: fmt.int(done), of: fmt.int(w.tasks.length) }),
    progress: w.tasks.length ? done / w.tasks.length : 0,
    state: w.claimed ? 'claimed' : all ? 'ready' : 'working',
    button: !w.claimed && all ? { label: t('goals.openCache'), claim: 'week' } : null,
    note: w.claimed ? t('goals.week.claimed', { when: turns }) : t('goals.week.turns', { when: turns }),
    parts,
  };
}
