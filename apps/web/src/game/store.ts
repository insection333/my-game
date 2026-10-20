// The game as the page sees it, loaded once a player is signed in (session.ts loads it). The server
// keeps the save; the page runs the same kernel engine to show time passing between answers, and
// takes the server's state whenever one arrives (a command's answer, the live channel, or a fresh
// read when the tab comes back). The clock ticks only while something is moving, so a resting page
// uses no CPU.
import { actionRegistry, FEATURES, type Feature, type Json } from '@idle-clash/features';
import { createEngine, seeded, type Command, type CommandResult, type GameEvent, type State } from '@idle-clash/kernel';
import { api, ApiError, requestId } from '../api.ts';
import { openLive } from './live.ts';
import { handled, sessionStore, signedOut } from './session.ts';

export interface GameView {
  state: State;
  now: number;
  events: GameEvent[];
  features: readonly Feature[];
}

let features: readonly Feature[] = [];
let view: GameView | null = null;
let engine = createEngine(actionRegistry([], () => true));
/** The server's clock minus this device's, so prediction runs on the server's time. */
let skew = 0;
const clock = () => Date.now() + skew;

const listeners = new Set<() => void>();
const emit = () => {
  for (const l of listeners) l();
};
let timer: ReturnType<typeof setInterval> | null = null;
let live: { close: () => void } | null = null;
/** Changes sent and not yet answered. While any are, the page's guess already includes them, so
 *  an older state from the server (a live message, an earlier answer) would undo them on screen. */
let inFlight = 0;

function stopClock() {
  if (timer) clearInterval(timer);
  timer = null;
}

const busy = (s: State, now: number) => now < s.fireUntil || Object.values(s.lanes).some((l) => l.current);

function publish(next: GameView) {
  view = next;
  emit();
  if (busy(next.state, next.now)) timer ??= setInterval(tick, 1000);
  else stopClock();
}

function tick() {
  if (document.hidden || !view) return;
  const now = clock();
  const out = engine.advance(view.state, now, seeded(view.state.seed));
  publish({ ...view, state: out.state, now, events: [...view.events, ...out.events].slice(-50) });
}

/** Takes the server's word for the save, unless a change sent since is still unanswered. */
function adopt(state: State, now: number) {
  if (inFlight > 0) return;
  skew = now - Date.now();
  publish({ state, now, events: view?.events ?? [], features });
}

/** Signed out: the channel closes and the clock stops. The last view stays until the next sign-in
 *  replaces it, so nothing still drawn reads an empty game. */
export function stop() {
  live?.close();
  live = null;
  stopClock();
}

async function resync() {
  if (sessionStore.get().phase !== 'playing') return;
  try {
    const g = await api.game();
    adopt(g.state, g.now);
  } catch (err) {
    handled(err);
  }
}

/** Loads the save with the features the server has switched on, and opens the live channel. */
export async function start(flags: Record<string, boolean>): Promise<void> {
  features = FEATURES.filter((f) => flags[f.id]);
  engine = createEngine(actionRegistry(features, () => true));
  inFlight = 0;
  const g = await api.game();
  adopt(g.state, g.now);
  live?.close();
  live = openLive({
    state: (state, now) => adopt(state, now),
    signedOut,
    reopened: () => void resync(),
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void resync();
  });
}

/** Sends a change, retrying with the same request id when the connection drops so it acts once.
 *  Resolves to null when it was refused or never got through. */
async function send<T>(go: () => Promise<T>): Promise<T | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await go();
    } catch (err) {
      if (handled(err)) return null;
      if (!(err instanceof ApiError) || err.code !== 'offline') break;
      await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
    }
  }
  return null;
}

export const game = {
  get: (): GameView => view!,
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  /** Shows the command's effect at once and sends it; the server's answer then replaces the guess. */
  command: (cmd: Command): CommandResult => {
    if (!view) return { ok: false, reason: { code: 'unavailable' } };
    const now = clock();
    const out = engine.command(view.state, now, cmd, seeded(view.state.seed));
    publish({ ...view, state: out.state, now, events: [...view.events, ...out.events].slice(-50) });
    const id = requestId();
    inFlight++;
    void send(() => api.command(id, cmd)).then((r) => {
      inFlight = Math.max(0, inFlight - 1);
      // Refused or unreachable: the guess may be wrong, so read the save afresh.
      if (r) adopt(r.state, r.now);
      else void resync();
    });
    return out.result;
  },
  /** Runs a feature's own route (claim a goal): shown at once, then sent like a command. */
  act: (feature: string, route: string, input: unknown): Json | null => {
    const def = features.find((f) => f.id === feature)?.routes[route];
    if (!view || !def) return null;
    const now = clock();
    const arrived = engine.input(view.state, now, seeded(view.state.seed));
    const ran = def.run(arrived.state, input, now);
    const events = [...view.events, ...arrived.events, ...(ran.events ?? [])].slice(-50);
    publish({ ...view, state: ran.state, now, events });
    const id = requestId();
    inFlight++;
    void send(() => api.feature(feature, route, id, input)).then((r) => {
      inFlight = Math.max(0, inFlight - 1);
      if (r) adopt(r.state, r.now);
      else void resync();
    });
    return ran.result;
  },
};
