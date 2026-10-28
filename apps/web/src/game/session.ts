// Who is here, and whether the game is loaded. Light on purpose: the welcome page needs only this,
// so the engine, the features and their art load as a second part of the page (./store.ts), fetched
// as soon as a player is signed in, or while a visitor fills in the welcome form.
import type { PlayerView } from '@idle-clash/contracts';
import { useSyncExternalStore } from 'react';
import { api, ApiError } from '../api.ts';
import { replace } from '../router.ts';
import type * as Store from './store.ts';

export type Phase = 'loading' | 'signedOut' | 'playing' | 'offline';
export interface Session {
  phase: Phase;
  player: PlayerView | null;
  /** Which features are switched on, from the server. */
  flags: Record<string, boolean>;
  /** Transactional email: off until the owner switches it on. */
  email: boolean;
  /** Whether this player may open the admin page. */
  admin: boolean;
}

let session: Session = { phase: 'loading', player: null, flags: {}, email: false, admin: false };
const listeners = new Set<() => void>();

function setSession(next: Partial<Session>) {
  session = { ...session, ...next };
  for (const l of listeners) l();
}

export const sessionStore = {
  get: (): Session => session,
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
export const useSession = (): Session => useSyncExternalStore(sessionStore.subscribe, sessionStore.get);

let game: Promise<typeof Store> | null = null;
/** The game's part of the page: fetched once, the first time anything asks. */
export const loadGame = () => (game ??= import('./store.ts'));

/** The session ended (signed out here, or found ended by the server): back to the welcome page. */
export function signedOut() {
  void game?.then((m) => m.stop());
  setSession({ phase: 'signedOut', player: null, admin: false });
}

/** What every failed request does first: a lost session sends the player back to the welcome page. */
export function handled(err: unknown): err is ApiError {
  if (err instanceof ApiError && (err.code === 'notSignedIn' || err.code === 'banned')) {
    signedOut();
    return true;
  }
  return false;
}

async function enter(player: PlayerView) {
  const m = await loadGame();
  await m.start(session.flags);
  setSession({ phase: 'playing', player });
}

/** Asks the server who is here and which features are on, then loads the game for a player. */
export async function boot(): Promise<void> {
  try {
    const me = await api.me();
    setSession({ flags: me.flags, email: me.email.enabled, admin: me.admin });
    if (me.player) await enter(me.player);
    else setSession({ phase: 'signedOut' });
  } catch (err) {
    if (!handled(err)) setSession({ phase: 'offline' });
  }
}

export const account = {
  signUp: async (name: string, password: string) => enter((await api.signUp(name, password)).player),
  signIn: async (name: string, password: string) => {
    await enter((await api.signIn(name, password)).player);
    // Whether the page offers the admin page is the server's to say.
    void api.me().then(
      (me) => setSession({ admin: me.admin }),
      () => undefined,
    );
  },
  /** Deletes the account and everything with it, then opens the welcome page. */
  deleteAccount: async (password: string) => {
    await api.deleteAccount(password);
    replace('/welcome');
    signedOut();
  },
  /** Ends the session and opens the sign-in form. */
  signOut: async () => {
    await api.signOut().catch(() => undefined);
    replace('/welcome/sign-in');
    signedOut();
  },
};
