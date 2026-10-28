// Goals' routes: claiming a goal (a first step, a short goal, today's daily goal or a milestone) and
// refreshing the ladder (making the short goals it lacks and today's daily goal, once an earlier day's
// goal done while away has been paid). Pure: each takes the
// state and returns a new one, an answer and the events to announce.
import { give, LANE_IDS, noteMoment, type GameEvent, type State } from '@idle-clash/kernel';
import { cacheFor, openCache, type Cache } from './cache.ts';
import { FIRST_STEPS, MILESTONES } from './content.ts';
import { firstStepsDone, isDone, payFirst } from './first-steps.ts';
import { currentDaily, dailyProgress, makeDaily, makeShort, milestoneProgress, shortProgress } from './ladder.ts';
import { dailyName, milestoneName, shortName } from './ladder-view.ts';
import { dayOf, goalsOf, setGoals, type GoalsState, type ShortGoal } from './state.ts';

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
  let next = retired(state, g, now);
  while (next.short.length < 3) {
    const made = makeShort(state, next, now);
    if (!made) break;
    next = { ...next, short: [...next.short, made], made: next.made + 1 };
  }
  if (!currentDaily(state, next.daily, now) || (next.daily?.claimed && next.daily.day !== dayOf(now))) {
    const daily = makeDaily(state, now);
    if (daily) next = { ...next, daily };
  }
  return next;
}

/** Short goals no lane works at are retired (stale), to make way for the lanes' work; a goal from before
 *  session 18, which has no time, takes this moment as its own. */
function retired(state: State, g: GoalsState, now: number): GoalsState {
  const short = g.short.map((s) => (s.at === undefined ? { ...s, at: now } : s)).filter((s) => !stale(state, s, now));
  const same = short.length === g.short.length && short.every((s, i) => s.at === g.short[i].at);
  return same ? g : { ...g, short };
}
const DAY_MS = 24 * 3600_000;

/** A short goal no lane is working at: one made for a lane's work goes as soon as a lane of its kind
 *  turns to other work (a lane standing idle, out of ore say, keeps it for the player to take up
 *  again); any other, and one whose lanes stay idle, after a day. */
function stale(state: State, s: ShortGoal, now: number): boolean {
  const at = (l: (typeof LANE_IDS)[number]) => state.lanes[l].current?.action;
  if (LANE_IDS.some((l) => at(l)?.feature === s.action.feature && at(l)?.id === s.action.id)) return false;
  const kin = LANE_IDS.filter((l) => l === s.lane || (s.lane === 'gathering' && l === 'gathering2'));
  if (s.follows === true && kin.some((l) => at(l) !== undefined)) return true;
  return s.at !== undefined && now - s.at >= DAY_MS;
}

/** Whether the ladder lacks a goal or holds one to retire (asked on every draw, so it stays cheap). */
export function needsRefresh(state: State, now: number): boolean {
  const g = goalsOf(state);
  return (
    firstStepsDone(state) &&
    (g.short.length < 3 ||
      !currentDaily(state, g.daily, now) ||
      (g.daily?.claimed === true && g.daily.day !== dayOf(now)) ||
      g.short.some((s) => s.at === undefined || stale(state, s, now)))
  );
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
  let cache: Cache | undefined;
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
    cache = cacheFor(state, short.reward, g.opened);
    openCache(out, cache);
    name = shortName(short);
    next = { ...g, short: g.short.filter((s) => s !== short), opened: g.opened + 1 };
  } else if (goal === 'daily' && g.daily && currentDaily(state, g.daily, now)) {
    if (g.daily.claimed) return { state, result: { ok: true }, events: [] };
    const p = dailyProgress(state, g.daily);
    if (p.now < p.of) return refused(state, 'notDone');
    cache = cacheFor(state, g.daily.reward, g.opened);
    openCache(out, cache);
    name = dailyName(g.daily);
    next = { ...g, daily: { ...g.daily, claimed: true }, opened: g.opened + 1 };
  } else if (milestone && !g.milestones.includes(milestone.id)) {
    const p = milestoneProgress(state, milestone);
    if (p.now < p.of) return refused(state, 'notDone');
    give(out, 'gold', milestone.reward);
    name = milestoneName(milestone);
    next = { ...g, milestones: [...g.milestones, milestone.id] };
  } else return refused(state, 'unknown');
  setGoals(out, filled(out, next, now));
  noteMoment(out, now);
  return {
    state: out,
    result: { ok: true },
    events: [{ type: 'goalDone', at: now, goal, ...(name ? { name } : {}), ...(cache ? { cache } : {}) }],
  };
}
