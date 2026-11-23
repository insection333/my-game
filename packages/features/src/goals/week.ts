// The week's contract (session 172): four tasks between the day's goal and the season, each sized to
// about eight hours of the player's own pace, so a lane left at it does it while they are away: XP in two
// skills they train, items made in their artisan's work (or XP in a third skill), and boss wins for a
// player who fights bosses (or mastery steps for one who does not). One task may be swapped a week. Done,
// it pays a supply cache worth four hours of their earning, and a week kept, counted and never taken away.
// The week turns at Monday 00:00 UTC, as the day does at midnight UTC.
import { masteryStep } from '@idle-clash/content';
import { seeded, xpOf, type State } from '@idle-clash/kernel';
import { findsIn } from '../shared/catalog.ts';
import { xpBonusPct } from '../shared/complete.ts';
import { expeditionsOf } from '../shared/expeditions/state.ts';
import { doneCount } from '../shared/given.ts';
import { weekEnds, weekOf } from '../shared/week-time.ts';
import { earning, nice } from './ladder.ts';
import { bestIn, paces, type Pace } from './pace.ts';
import type { WeekContract, WeekTask } from './state.ts';

const DAY = 86_400_000;
/** Hours of the player's own pace a task asks. */
export const WEEK_TASK_HOURS = 8;
/** Hours of the player's earning the week's cache is worth. */
export const WEEK_PAY_HOURS = 4;
/** Boss wins, and mastery steps, a week asks for. */
export const WEEK_BOSSES = 3;
export const WEEK_STEPS = 2;

export { weekEnds, weekOf };

const bossWins = (state: State) => Object.values(expeditionsOf(state).wins).reduce((n, w) => n + w, 0);
const steps = (state: State) => Object.values(state.mastery).reduce((n, done) => n + masteryStep(done), 0);

/** Where a task's count stands now, from which its progress is measured. */
export function measure(state: State, task: Pick<WeekTask, 'kind' | 'skill' | 'action'>): number {
  switch (task.kind) {
    case 'xp':
      return xpOf(state, task.skill!);
    case 'count':
      // The work itself, not the completions a Rare find gave it (session 181).
      return doneCount(state, `${task.action!.feature}:${task.action!.id}`);
    case 'boss':
      return bossWins(state);
    case 'mastery':
      return steps(state);
  }
}

export const taskProgress = (state: State, task: WeekTask) => ({
  now: Math.max(0, Math.min(task.target, Math.floor(measure(state, task) - task.base))),
  of: task.target,
});

/** XP a skill's best work earns in eight hours, at the player's lasting gains (as the day's goal). */
function xpTask(state: State, p: Pace, now: number): WeekTask {
  const lasting = 1 + xpBonusPct(state, p.skill, findsIn(p.skill), now, 0, false) / 100;
  const target = nice(((p.xpEach * lasting) / p.secondsEach) * WEEK_TASK_HOURS * 3600);
  return { kind: 'xp', skill: p.skill, target, base: xpOf(state, p.skill) };
}

/** Every task this player could be asked for this week, best first: XP in the skills at work in their
 *  lanes, then the other skills they train; their artisan's best work; boss wins once they have won one,
 *  else mastery steps. */
export function candidates(state: State, now: number): WeekTask[] {
  const list = paces(state);
  const skills = [...new Set(list.map((p) => p.skill))].filter((s) => xpOf(state, s) > 0 && s !== 'hitpoints');
  const working = new Set(Object.values(state.lanes).flatMap((l) => (l.current ? [l.current.action.feature] : [])));
  const best = skills.flatMap((s) => bestIn(list, s) ?? []);
  best.sort((a, b) => Number(working.has(b.action.feature)) - Number(working.has(a.action.feature)));
  const xp = best.map((p) => xpTask(state, p, now));
  const artisan = list
    .filter((p) => p.lane === 'artisan' && xpOf(state, p.skill) > 0)
    .sort((a, b) => b.xpEach / b.secondsEach - a.xpEach / a.secondsEach)[0];
  const count: WeekTask[] = artisan
    ? [
        {
          kind: 'count',
          action: artisan.action,
          target: Math.max(10, nice((WEEK_TASK_HOURS * 3600) / artisan.secondsEach)),
          base: measure(state, { kind: 'count', action: artisan.action }),
        },
      ]
    : [];
  const fights: WeekTask[] =
    bossWins(state) > 0
      ? [{ kind: 'boss', target: WEEK_BOSSES, base: bossWins(state) }]
      : [{ kind: 'mastery', target: WEEK_STEPS, base: steps(state) }];
  return [...xp.slice(0, 2), ...count, ...fights, ...xp.slice(2)];
}

const same = (a: WeekTask, b: WeekTask) =>
  a.kind === b.kind && a.skill === b.skill && a.action?.feature === b.action?.feature && a.action?.id === b.action?.id;

/** This week's contract: the four best tasks, or as many as there are. Null before any skill is trained. */
export function makeWeek(state: State, now: number): WeekContract | null {
  const tasks = candidates(state, now).slice(0, 4);
  if (tasks.length < 2) return null;
  return {
    week: weekOf(now),
    tasks,
    swapped: false,
    claimed: false,
    reward: Math.max(50, nice(earning(paces(state)) * WEEK_PAY_HOURS * 3600)),
  };
}

/** One task swapped for another the player could be asked for (once a week), drawn from the save's seed. */
export function swapTask(state: State, w: WeekContract, index: number, now: number): WeekContract | null {
  if (w.swapped || w.claimed || index < 0 || index >= w.tasks.length) return null;
  const others = candidates(state, now).filter((c) => !w.tasks.some((t) => same(t, c)));
  if (!others.length) return null;
  const pick = others[Math.floor(seeded(state.seed)('week', Date.parse(w.week) / DAY + index) * others.length)];
  return { ...w, swapped: true, tasks: w.tasks.map((t, i) => (i === index ? pick : t)) };
}

export const weekDone = (state: State, w: WeekContract) =>
  w.tasks.every((task) => {
    const p = taskProgress(state, task);
    return p.now >= p.of;
  });

/** The contract the ladder holds now: this week's, or last week's done and waiting to be paid. */
export function currentWeek(state: State, w: WeekContract | null, now: number): WeekContract | null {
  if (!w) return null;
  if (w.week === weekOf(now)) return w;
  return !w.claimed && weekDone(state, w) ? w : null;
}
