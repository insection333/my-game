// advance(state, now, rng) → { state, events }: lanes run in time order, one completion at a time,
// so advancing a to b to c gives exactly what a to c gives. The input state is never changed.
import type { Command } from './commands.ts';
import { isNotable, type GameEvent } from './events.ts';
import type { Rng } from './rng.ts';
import type { ActionContext, ActionRegistry } from './rules.ts';
import { actionKey, LANE_IDS, laneKind, type ActionRef, type LaneId, type State, type StopReason } from './schema.ts';
import { noteMoment } from './state.ts';
import { DEFAULT_CONFIG, type KernelConfig } from './time.ts';

export interface Advanced {
  state: State;
  events: GameEvent[];
}
export type CommandResult = { ok: true } | { ok: false; reason: StopReason };
export interface Commanded extends Advanced {
  result: CommandResult;
}

export interface Engine {
  advance(state: State, now: number, rng: Rng): Advanced;
  /** Advances to now, counts the input (the fire, the away clock), then applies the command. */
  command(state: State, now: number, cmd: Command, rng: Rng): Commanded;
  /** Advances to now and counts a real input, for a feature's own route to change the state after. */
  input(state: State, now: number, rng: Rng): Advanced;
}

/** Every stop code the kernel itself gives; features declare their own in their manifest. */
export const KERNEL_STOP_CODES = [
  'unavailable',
  'wrongLane',
  'fireOut',
  'stoppedByPlayer',
  'mended',
  'skillInOtherLane',
] as const;

const reason = (code: string, detail?: Record<string, string | number>): StopReason =>
  detail ? { code, detail } : { code };

export function createEngine(registry: ActionRegistry, config: KernelConfig = DEFAULT_CONFIG): Engine {
  function context(
    s: State,
    lane: LaneId,
    at: number,
    rng: Rng,
    events: GameEvent[],
    canRoll = true,
    seed?: number,
    startedAt = at,
  ): ActionContext {
    return {
      state: s,
      at,
      startedAt,
      lane,
      seed,
      fireBurning: at < s.fireUntil,
      fireMinutes: at < s.fireUntil ? Math.max(0, at - (s.fireSince ?? at)) / 60_000 : 0,
      roll: () => {
        if (!canRoll) throw new Error('rules.check must not roll');
        return rng(lane, s.lanes[lane].rolls++);
      },
      emit: (e) => {
        events.push(e);
        if (isNotable(e)) noteMoment(s, e.at);
      },
    };
  }

  /** Starts an action on a lane at a time, or says why it cannot start. */
  function begin(
    s: State,
    lane: LaneId,
    action: ActionRef,
    at: number,
    rng: Rng,
    events: GameEvent[],
  ): StopReason | null {
    const rules = registry(action);
    if (!rules) return reason('unavailable', { action: actionKey(action) });
    if (rules.lane !== laneKind(lane)) return reason('wrongLane', { action: actionKey(action) });
    if (lane === 'gathering2' && !(at < s.fireUntil)) return reason('fireOut');
    // The fire's second Gathering lane is for a second skill (cut wood and mine at once), not twice one.
    if (laneKind(lane) === 'gathering') {
      const other = s.lanes[lane === 'gathering' ? 'gathering2' : 'gathering'].current;
      if (other && other.action.feature === action.feature) return reason('skillInOtherLane');
    }
    const why = rules.check(context(s, lane, at, rng, events, false), action);
    if (why) return why;
    const seed = rules.seeded ? Math.floor(rng(lane, s.lanes[lane].rolls++) * 0x100000000) : undefined;
    const ms = Math.round(rules.duration(context(s, lane, at, rng, events, true, seed), action));
    if (!Number.isFinite(ms)) throw new Error(`${actionKey(action)} returned a duration of ${ms}`);
    const endsAt = at + Math.max(config.minAction, ms);
    s.lanes[lane].current =
      seed === undefined ? { action, startedAt: at, endsAt } : { action, startedAt: at, endsAt, seed };
    s.lanes[lane].stopped = null;
    return null;
  }

  /** Stops a lane with a reason, then starts its queued Next action if there is one. */
  function halt(
    s: State,
    lane: LaneId,
    action: ActionRef | null,
    why: StopReason,
    at: number,
    rng: Rng,
    events: GameEvent[],
  ) {
    const l = s.lanes[lane];
    l.current = null;
    l.stopped = { reason: why, at };
    events.push({ type: 'laneStopped', at, lane, action, reason: why });
    const next = l.next;
    if (!next) return;
    l.next = null;
    const refused = begin(s, lane, next, at, rng, events);
    if (!refused) events.push({ type: 'nextStarted', at, lane, action: next });
    else {
      l.stopped = { reason: refused, at };
      events.push({ type: 'laneStopped', at, lane, action: next, reason: refused });
    }
  }

  /** The earliest thing due on any lane at or before the limit; ties go to the earlier lane. */
  function nextDue(s: State, limit: number) {
    let due: { at: number; lane: LaneId; fireOut: boolean } | null = null;
    for (const lane of LANE_IDS) {
      const run = s.lanes[lane].current;
      if (!run) continue;
      const fireOut = lane === 'gathering2' && s.fireUntil < run.endsAt;
      const at = fireOut ? s.fireUntil : run.endsAt;
      if (at <= limit && (!due || at < due.at)) due = { at, lane, fireOut };
    }
    return due;
  }

  function advance(state: State, now: number, rng: Rng): Advanced {
    const s = structuredClone(state);
    const events: GameEvent[] = [];
    if (now <= s.clock) return { state: s, events };
    const limit = Math.min(now, s.lastSeen + config.awayCap);
    for (let due = nextDue(s, limit); due; due = nextDue(s, limit)) {
      const { at, lane } = due;
      const run = s.lanes[lane].current!;
      s.clock = at;
      if (due.fireOut) {
        s.lanes[lane].next = null;
        halt(s, lane, run.action, reason('fireOut'), at, rng, events);
        continue;
      }
      const rules = registry(run.action);
      if (!rules) {
        halt(s, lane, run.action, reason('unavailable', { action: actionKey(run.action) }), at, rng, events);
        continue;
      }
      const made =
        rules.complete(context(s, lane, at, rng, events, true, run.seed, run.startedAt), run.action) !== false;
      const key = actionKey(run.action);
      if (made) s.mastery[key] = (Object.hasOwn(s.mastery, key) ? s.mastery[key] : 0) + 1;
      s.lanes[lane].current = null;
      const why = begin(s, lane, run.action, at, rng, events);
      if (why) halt(s, lane, run.action, why, at, rng, events);
    }
    s.clock = now;
    return { state: s, events };
  }

  /** Counts a real input: lanes that rested at the away cap resume where they were; the fire lights. */
  function touch(s: State, now: number): void {
    const rested = now - (s.lastSeen + config.awayCap);
    if (rested > 0) {
      for (const lane of LANE_IDS) {
        const run = s.lanes[lane].current;
        if (run) {
          run.startedAt += rested;
          run.endsAt += rested;
        }
      }
    }
    s.lastSeen = now;
    // Lit from cold, the fire starts its heat again; kept burning, it keeps it.
    if (!(now < s.fireUntil)) s.fireSince = now;
    s.fireUntil = Math.max(s.fireUntil, now + config.fireBurns);
  }

  function apply(s: State, now: number, cmd: Command, rng: Rng, events: GameEvent[]): CommandResult {
    if (cmd.type === 'stoke') return { ok: true };
    const l = s.lanes[cmd.lane];
    switch (cmd.type) {
      case 'start': {
        if (l.current && actionKey(l.current.action) === actionKey(cmd.action)) return { ok: true };
        const why = begin(s, cmd.lane, cmd.action, now, rng, events);
        return why ? { ok: false, reason: why } : { ok: true };
      }
      case 'queueNext': {
        const rules = registry(cmd.action);
        if (!rules) return { ok: false, reason: reason('unavailable', { action: actionKey(cmd.action) }) };
        if (rules.lane !== laneKind(cmd.lane)) return { ok: false, reason: reason('wrongLane') };
        if (!l.current) {
          const why = begin(s, cmd.lane, cmd.action, now, rng, events);
          return why ? { ok: false, reason: why } : { ok: true };
        }
        l.next = cmd.action;
        return { ok: true };
      }
      case 'clearNext':
        l.next = null;
        return { ok: true };
      case 'stop':
        if (l.current) halt(s, cmd.lane, l.current.action, reason('stoppedByPlayer'), now, rng, events);
        return { ok: true };
    }
  }

  function input(state: State, now: number, rng: Rng): Advanced {
    const at = Math.max(now, state.clock);
    const out = advance(state, at, rng);
    touch(out.state, at);
    return out;
  }

  function command(state: State, now: number, cmd: Command, rng: Rng): Commanded {
    const { state: s, events } = input(state, now, rng);
    const result = apply(s, s.clock, cmd, rng, events);
    if (!result.ok)
      events.push({
        type: 'refused',
        at: s.clock,
        lane: 'lane' in cmd ? cmd.lane : null,
        action: 'action' in cmd ? cmd.action : null,
        reason: result.reason,
      });
    return { state: s, events, result };
  }

  return { advance, command, input };
}
