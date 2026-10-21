// Goals' routes: claiming a goal (a first step, a short goal, today's daily goal or a milestone) and
// refreshing the ladder (making the short goals it lacks and today's daily goal). Pure: each takes the
// state and returns a new one, an answer and the events to announce.
import { give, noteMoment, type GameEvent, type State } from '@idle-clash/kernel';
import { FIRST_STEPS, MILESTONES } from './content.ts';
import { firstStepsDone, isDone, payFirst } from './first-steps.ts';
import { dailyProgress, makeDaily, makeShort, milestoneProgress, shortProgress } from './ladder.ts';
import { dailyName, milestoneName, shortName } from './ladder-view.ts';
import { dayOf, goalsOf, setGoals, type GoalsState } from './state.ts';

export type ClaimResult = { ok: true } | { ok: false; reason: 'unknown' | 'notDone' };
type Answer<R> = { state: State; result: R; events: GameEvent[] };
const refused = (state: State, reason: 'unknown' | 'notDone'): Answer<ClaimResult> => ({
  state,
  result: { ok: false, reason },
  events: [],
});

/** The ladder after First steps, filled: three short goals and today's daily goal. */
function filled(state: State, g: GoalsState, now: number): GoalsState {
  if (!FIRST_STEPS.every((s) => g.claimed.includes(s.id))) return g;
  let next = g;
  while (next.short.length < 3) {
    const made = makeShort(state, next);
    if (!made) break;
    next = { ...next, short: [...next.short, made], made: next.made + 1 };
  }
  if (!next.daily || next.daily.day !== dayOf(now)) {
    const daily = makeDaily(state, now);
    if (daily) next = { ...next, daily };
  }
  return next;
}

/** Whether the ladder lacks a goal (asked on every draw, so it does not work goals out). */
export function needsRefresh(state: State, now: number): boolean {
  const g = goalsOf(state);
  return firstStepsDone(state) && (g.short.length < 3 || !g.daily || g.daily.day !== dayOf(now));
}

export function refresh(state: State, now: number): Answer<{ ok: true }> {
  const g = goalsOf(state);
  const next = filled(state, g, now);
  if (next === g) return { state, result: { ok: true }, events: [] };
  const out = structuredClone(state);
  setGoals(out, next);
  return { state: out, result: { ok: true }, events: [] };
}

/** Claims a finished goal: its reward, a moment, and the goal marked done. Claiming twice does nothing. */
export function claim(state: State, goal: string, now: number): Answer<ClaimResult> {
  const g = goalsOf(state);
  const out = structuredClone(state);
  let next: GoalsState;
  let name: string | undefined;
  const step = FIRST_STEPS.find((s) => s.id === goal);
  const short = g.short.find((s) => s.id === goal);
  const milestone = MILESTONES.find((m) => `m-${m.id}` === goal);
  if (step) {
    if (g.claimed.includes(goal)) return { state, result: { ok: true }, events: [] };
    if (!isDone(state, step)) return refused(state, 'notDone');
    payFirst(out, step);
    next = { ...g, claimed: [...g.claimed, goal] };
  } else if (short) {
    const p = shortProgress(state, short);
    if (p.now < p.of) return refused(state, 'notDone');
    give(out, 'gold', short.reward);
    name = shortName(short);
    next = { ...g, short: g.short.filter((s) => s !== short) };
  } else if (goal === 'daily' && g.daily && g.daily.day === dayOf(now)) {
    if (g.daily.claimed) return { state, result: { ok: true }, events: [] };
    const p = dailyProgress(state, g.daily);
    if (p.now < p.of) return refused(state, 'notDone');
    give(out, 'gold', g.daily.reward);
    name = dailyName(g.daily);
    next = { ...g, daily: { ...g.daily, claimed: true } };
  } else if (milestone && !g.milestones.includes(milestone.id)) {
    const p = milestoneProgress(state, milestone);
    if (p.now < p.of) return refused(state, 'notDone');
    give(out, 'gold', milestone.reward);
    name = milestoneName(milestone);
    next = { ...g, milestones: [...g.milestones, milestone.id] };
  } else return refused(state, 'unknown');
  setGoals(out, filled(out, next, now));
  noteMoment(out, now);
  return { state: out, result: { ok: true }, events: [{ type: 'goalDone', at: now, goal, ...(name ? { name } : {}) }] };
}
