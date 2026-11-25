// advance(state, now, rng) → { state, events }: lanes run in time order, one completion at a time,
// so advancing a to b to c gives exactly what a to c gives. The input state is never changed.
import { logFire } from './fire-log.ts';
import type { Command } from './commands.ts';
import { isNotable, type GameEvent } from './events.ts';
import type { Rng } from './rng.ts';
import type { ActionContext, ActionRegistry } from './rules.ts';
import {
  actionKey,
  LANE_IDS,
  laneKind,
  QUEUE,
  type ActionRef,
  type LaneId,
  type State,
  type StopReason,
} from './schema.ts';
import { noteMoment, queueOf, setQueue } from './state.ts';
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
  'alreadyRunning',
  'alreadyQueued',
  'queueFull',
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

  /** Stops a lane with a reason, then starts what it has to come: Next, or if Next cannot start, the next of the
   *  rest that can (session 240), each refused said as a stop. */
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
    // A lane that waited for an ingredient and runs dry again waits quietly: it was said once.
    const quiet = !!l.current?.waited && why.code === 'outOfInputs';
    l.current = null;
    l.stopped = action ? { reason: why, at, action } : { reason: why, at };
    if (!quiet) events.push({ type: 'laneStopped', at, lane, action, reason: why });
    const queue = queueOf(l);
    setQueue(l, []);
    for (const [i, next] of queue.entries()) {
      const refused = begin(s, lane, next, at, rng, events);
      if (!refused) {
        events.push({ type: 'nextStarted', at, lane, action: next });
        setQueue(l, queue.slice(i + 1));
        return;
      }
      l.stopped = { reason: refused, at, action: next };
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

  /** A lane that ran out of an ingredient waits for it: when another lane brings it in, the lane starts
   *  again by itself (session 149: smelting stood stopped ten minutes into eight hours away while the ore
   *  it wanted piled up behind it). Only a lane the engine stopped for want of an ingredient, with nothing
   *  queued behind it; never one the player stopped. */
  function wake(s: State, at: number, rng: Rng, events: GameEvent[]) {
    for (const lane of LANE_IDS) {
      const l = s.lanes[lane];
      if (l.current || l.next || l.stopped?.reason.code !== 'outOfInputs' || !l.stopped.action) continue;
      if (!begin(s, lane, l.stopped.action, at, rng, events)) l.current!.waited = true;
    }
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
        setQueue(s.lanes[lane], []);
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
      if (why) {
        s.lanes[lane].current = run; // so halt knows whether it had waited
        halt(s, lane, run.action, why, at, rng, events);
      } else if (run.waited) s.lanes[lane].current!.waited = true;
      wake(s, at, rng, events);
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
    logFire(s, now);
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
        // A lane repeats what it runs, so queueing that behind itself does nothing (session 81); nor does
        // queueing what is already to come, and a lane holds three to come (session 240).
        if (actionKey(l.current.action) === actionKey(cmd.action))
          return { ok: false, reason: reason('alreadyRunning') };
        const queue = queueOf(l);
        if (queue.some((a) => actionKey(a) === actionKey(cmd.action)))
          return { ok: false, reason: reason('alreadyQueued') };
        if (queue.length >= QUEUE) return { ok: false, reason: reason('queueFull', { most: QUEUE }) };
        setQueue(l, [...queue, cmd.action]);
        return { ok: true };
      }
      case 'clearNext':
        // One of the actions to come, by its place, or all of them.
        setQueue(l, cmd.at === undefined ? [] : queueOf(l).filter((_, i) => i !== cmd.at));
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
    relight(out.state, at, rng, out.events);
    return out;
  }

  /** The fire lit again, its lane takes up what it ran when the fire went out (session 153: a player back to
   *  stoke found it stopped "Fire went out" on every return, though the fire promises a second Gathering
   *  lane). Never a lane the player stopped, nor one with a Next queued. */
  function relight(s: State, at: number, rng: Rng, events: GameEvent[]) {
    const l = s.lanes.gathering2;
    if (l.current || l.next || l.stopped?.reason.code !== 'fireOut' || !l.stopped.action) return;
    begin(s, 'gathering2', l.stopped.action, at, rng, events);
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
