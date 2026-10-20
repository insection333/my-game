// The game as the page sees it. The server keeps the save; the page runs the same kernel engine to
// show time passing between answers, and takes the server's state whenever one arrives (a command's
// answer, the live channel, or a fresh read when the tab comes back). The clock ticks only while
// something is moving, so a resting page uses no CPU.
import type { PlayerView } from '@idle-clash/contracts';
import { actionRegistry, FEATURES, type Feature } from '@idle-clash/features';
import { createEngine, seeded, type Command, type CommandResult, type GameEvent, type State } from '@idle-clash/kernel';
import { api, ApiError, requestId } from '../api.ts';
import { replace } from '../router.ts';
import { openLive } from './live.ts';

export interface GameView {
  state: State;
  now: number;
  events: GameEvent[];
  features: readonly Feature[];
}

export type Phase = 'loading' | 'signedOut' | 'playing' | 'offline';
export interface Session {
  phase: Phase;
  player: PlayerView | null;
  features: readonly Feature[];
  /** Transactional email: off until the owner switches it on. */
  email: boolean;
}

let session: Session = { phase: 'loading', player: null, features: [], email: false };
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

const busy = (s: State, now: number) => now < s.fireUntil || Object.values(s.lanes).some((l) => l.current);

function publish(next: GameView | null) {
  view = next;
  emit();
  const needsClock = !!view && busy(view.state, view.now);
  if (needsClock && !timer) timer = setInterval(tick, 1000);
  if (!needsClock && timer) {
    clearInterval(timer);
    timer = null;
  }
}

function setSession(next: Partial<Session>) {
  session = { ...session, ...next };
  emit();
}

function tick() {
  if (document.hidden || !view) return;
  const now = clock();
  const out = engine.advance(view.state, now, seeded(view.state.seed));
  publish({ ...view, state: out.state, now, events: [...view.events, ...out.events].slice(-50) });
}

/** Takes the server's word for the save. */
function adopt(state: State, now: number) {
  skew = now - Date.now();
  publish({ state, now, events: view?.events ?? [], features: session.features });
}

function signedOut() {
  live?.close();
  live = null;
  publish(null);
  setSession({ phase: 'signedOut', player: null });
}

/** What every failed request does first: a lost session sends the player back to the gate. */
function handled(err: unknown): err is ApiError {
  if (err instanceof ApiError && (err.code === 'notSignedIn' || err.code === 'banned')) {
    signedOut();
    return true;
  }
  return false;
}

async function resync() {
  if (session.phase !== 'playing') return;
  try {
    const g = await api.game();
    adopt(g.state, g.now);
  } catch (err) {
    handled(err);
  }
}

async function enter(player: PlayerView) {
  const g = await api.game();
  adopt(g.state, g.now);
  setSession({ phase: 'playing', player });
  live?.close();
  live = openLive({
    state: (state, now) => adopt(state, now),
    signedOut,
    reopened: () => void resync(),
  });
}

/** Asks the server who is here and which features are on, then loads the save. */
export async function boot(): Promise<void> {
  try {
    const me = await api.me();
    const features = FEATURES.filter((f) => me.flags[f.id]);
    engine = createEngine(actionRegistry(features, () => true));
    setSession({ features, email: me.email.enabled });
    if (me.player) await enter(me.player);
    else setSession({ phase: 'signedOut' });
  } catch (err) {
    if (!handled(err)) setSession({ phase: 'offline' });
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void resync();
  });
}

/** Sends a change, retrying with the same request id when the connection drops so it acts once. */
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
  void resync();
  return null;
}

export const game = {
  get: (): GameView => view!,
  session: (): Session => session,
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
    void send(() => api.command(id, cmd)).then((r) => r && adopt(r.state, r.now));
    return out.result;
  },
  signUp: async (name: string, password: string) => enter((await api.signUp(name, password)).player),
  signIn: async (name: string, password: string) => enter((await api.signIn(name, password)).player),
  /** Ends the session and opens the sign-in form. */
  signOut: async () => {
    await api.signOut().catch(() => undefined);
    replace('/welcome/sign-in');
    signedOut();
  },
};
