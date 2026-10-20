// Mending a damaged save: keep everything that is still sound, repair or drop what is not, and say
// what was done. A save is never refused while anything in it can be kept.
import {
  LANE_IDS,
  REMEMBERED_REQUESTS,
  SaveDoc,
  SAVE_VERSION,
  StopReason,
  ActionRef,
  RequestRecord,
  SkillXp,
} from './schema.ts';
import type { Lane, LaneId, State } from './schema.ts';
import { newState } from './state.ts';

export interface Mended {
  doc: SaveDoc;
  /** What was repaired, in plain words, for the log and the admin page. Empty if nothing was. */
  repairs: string[];
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isTime = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;

/** Keeps the entries of a record whose key is an id and whose value passes; reports the rest. */
function keepValid<T>(
  raw: unknown,
  what: string,
  ok: (v: unknown) => v is T,
  repairs: string[],
  keyOk = (k: string) => ID.test(k),
) {
  const out: Record<string, T> = {};
  if (!isObject(raw)) {
    if (raw !== undefined) repairs.push(`${what} were unreadable and were cleared`);
    return out;
  }
  for (const [k, v] of Object.entries(raw)) {
    if (keyOk(k) && ok(v)) out[k] = v;
    else repairs.push(`${what}: dropped "${k.slice(0, 40)}" (${JSON.stringify(v)?.slice(0, 40) ?? 'nothing'})`);
  }
  return out;
}

function mendLane(id: LaneId, raw: unknown, now: number, repairs: string[]): Lane {
  const lane: Lane = { current: null, next: null, stopped: null, rolls: 0 };
  if (!isObject(raw)) {
    if (raw !== undefined) repairs.push(`The ${id} lane was unreadable and was stopped`);
    return lane;
  }
  lane.rolls = isTime(raw.rolls) ? raw.rolls : 0;
  const cur = raw.current;
  if (isObject(cur) && ActionRef.safeParse(cur.action).success && isTime(cur.startedAt) && isTime(cur.endsAt)) {
    const sane = cur.endsAt > cur.startedAt && cur.endsAt - cur.startedAt <= 24 * 3600_000 && cur.startedAt <= now;
    if (sane) lane.current = { action: ActionRef.parse(cur.action), startedAt: cur.startedAt, endsAt: cur.endsAt };
  }
  if (cur && !lane.current) {
    repairs.push(`The ${id} lane's action was damaged and was stopped`);
    lane.stopped = { reason: { code: 'mended' }, at: now };
  }
  if (raw.next !== null && raw.next !== undefined) {
    if (ActionRef.safeParse(raw.next).success) lane.next = ActionRef.parse(raw.next);
    else repairs.push(`The ${id} lane's Next action was damaged and was cleared`);
  }
  const st = raw.stopped;
  if (!lane.stopped && isObject(st) && isTime(st.at) && StopReason.safeParse(st.reason).success) {
    lane.stopped = { reason: StopReason.parse(st.reason), at: st.at };
  }
  return lane;
}

function mendLuck(raw: unknown, clock: number, repairs: string[]): State['luck'] {
  if (isObject(raw) && isTime(raw.misses) && isTime(raw.lastMoment) && raw.lastMoment <= clock)
    return { misses: raw.misses, lastMoment: raw.lastMoment };
  if (raw !== undefined) repairs.push('Luck was damaged and was reset');
  return { misses: 0, lastMoment: clock };
}

/** Checks the schema cannot make: times must not lie ahead of the server's clock. */
function soundAt(doc: SaveDoc, now: number): boolean {
  const ahead = now + FUTURE_SLACK;
  const st = doc.state;
  return (
    st.clock <= ahead &&
    st.fireUntil <= ahead + 10 * 60_000 &&
    st.luck.lastMoment <= st.clock &&
    LANE_IDS.every((l) => (st.lanes[l].current?.startedAt ?? 0) <= st.clock)
  );
}

/** How far a save's clock may run ahead of the server's (clock drift between machines). */
const FUTURE_SLACK = 5 * 60_000;

export function mend(raw: unknown, now: number): Mended {
  const strict = SaveDoc.safeParse(raw);
  if (strict.success && soundAt(strict.data, now)) return { doc: strict.data, repairs: [] };

  const repairs: string[] = [];
  const doc = isObject(raw) ? raw : {};
  if (!isObject(raw)) repairs.push('The save was unreadable; a fresh start was made');
  const st = isObject(doc.state) ? doc.state : {};
  if (isObject(raw) && !isObject(doc.state)) repairs.push('The game state was unreadable; a fresh start was made');

  const seed =
    Number.isInteger(st.seed) && (st.seed as number) >= 0 && (st.seed as number) <= 0xffffffff
      ? (st.seed as number)
      : null;
  if (seed === null && isObject(doc.state)) repairs.push('The random seed was damaged and was replaced');
  const base = newState(seed ?? Math.floor(now % 0xffffffff), now);
  const time = (key: 'clock' | 'lastSeen' | 'fireUntil', fallback: number) => {
    const v = st[key];
    if (isTime(v) && v <= now + FUTURE_SLACK) return v;
    if (v !== undefined) repairs.push(`The ${key} time was damaged and was reset`);
    return fallback;
  };
  const clock = time('clock', now);
  const state: State = {
    ...base,
    clock,
    lastSeen: Math.min(time('lastSeen', clock), clock),
    fireUntil: time('fireUntil', clock),
    lanes: Object.fromEntries(
      LANE_IDS.map((l) => [l, mendLane(l, isObject(st.lanes) ? st.lanes[l] : undefined, clock, repairs)]),
    ) as Record<LaneId, Lane>,
    items: keepValid(st.items, 'Items', isTime, repairs),
    skills: keepValid(st.skills, 'Skills', (v): v is SkillXp => SkillXp.safeParse(v).success, repairs),
    mastery: keepValid(st.mastery, 'Mastery', isTime, repairs, (k) => /^[a-z0-9-]{1,64}:[a-z0-9-]{1,64}$/.test(k)),
    luck: mendLuck(st.luck, clock, repairs),
    found: keepValid(st.found, 'First finds', isTime, repairs),
    features: keepValid(st.features, 'Feature data', (v): v is unknown => v !== undefined, repairs),
  };
  for (const id of LANE_IDS) {
    const run = state.lanes[id].current;
    if (run && run.startedAt > state.clock) {
      state.lanes[id].current = null;
      state.lanes[id].stopped = { reason: { code: 'mended' }, at: state.clock };
      repairs.push(`The ${id} lane's action started after the clock and was stopped`);
    }
  }

  const requests = Array.isArray(doc.requests)
    ? doc.requests
        .filter((r) => RequestRecord.safeParse(r).success)
        .slice(-REMEMBERED_REQUESTS)
        .map((r) => RequestRecord.parse(r))
    : [];
  if (!Array.isArray(doc.requests) && isObject(raw))
    repairs.push('The list of recent requests was damaged and was cleared');

  const mended = SaveDoc.parse({ version: SAVE_VERSION, state, requests });
  if (!repairs.length) repairs.push('The save failed its checks; it was rebuilt from its sound parts');
  return { doc: mended, repairs };
}
