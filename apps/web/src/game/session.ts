// Who is here, and whether the game is loaded. Light on purpose: the welcome page needs only this,
// so the engine, the features and their art load as a second part of the page (./store.ts), fetched
// as soon as a player is signed in, or while a visitor fills in the welcome form.
import type { PlayerView } from '@idle-clash/contracts';
import { useSyncExternalStore } from 'react';
import { api, ApiError, showPlayer } from '../api.ts';
import { keepFor } from '../kept.ts';
import { pushOff } from '../push.ts';
import { replace } from '../router.ts';
import { notePlayed } from '../welcome-path.ts';
import type * as Store from './store.ts';

/** `console`: the admin console's own account (session 227), which never loads the game. */
export type Phase = 'loading' | 'signedOut' | 'playing' | 'offline' | 'console';
export type Bounced = 'banned' | 'deleted' | 'ended';
export interface Session {
  phase: Phase;
  player: PlayerView | null;
  /** Which features are switched on, from the server. */
  flags: Record<string, boolean>;
  /** Transactional email: off until the owner switches it on. */
  email: boolean;
  /** Whether this player may open the admin page. */
  admin: boolean;
  /** Whether this is the admin console's own account, which never plays (session 227). */
  staff: boolean;
  /** The console's account still holding its first password: it chooses its own before anything else
   *  (session 237). */
  mustChangePassword: boolean;
  /** Why the session ended, for the welcome page to say: a ban (session 95), or the account deleted
   *  (session 96). */
  bounced: Bounced | null;
}

let session: Session = {
  phase: 'loading',
  player: null,
  flags: {},
  email: false,
  admin: false,
  staff: false,
  mustChangePassword: false,
  bounced: null,
};
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
export function signedOut(why: Bounced | null = null) {
  void game?.then((m) => m.stop());
  keepFor(null);
  showPlayer(null);
  setSession({ phase: 'signedOut', player: null, admin: false, staff: false, mustChangePassword: false, bounced: why });
}

/** Why the welcome page is shown: a ban; or a session that ended in the middle of play (session 157: the
 *  password changed on another device, or the session lapsed) or of the console (session 231: its twelve
 *  hours), said so the player knows to sign in again. */
export const bounceOf = (code: string, phase: Phase): Bounced | null =>
  code === 'banned' ? 'banned' : phase === 'playing' || phase === 'console' ? 'ended' : null;

/** What every failed request does first: a lost session sends the player back to the welcome page. */
export function handled(err: unknown): err is ApiError {
  if (err instanceof ApiError && (err.code === 'notSignedIn' || err.code === 'banned')) {
    signedOut(bounceOf(err.code, session.phase));
    return true;
  }
  // The console's account must choose its own password first (session 237): the console shows only that.
  if (err instanceof ApiError && err.code === 'mustChangePassword') {
    setSession({ mustChangePassword: true });
    return true;
  }
  return false;
}

/** The console's own account: the console, and never the game (session 227). */
/** The console's account has chosen its own password: the console opens. */
export const passwordChosen = () => setSession({ mustChangePassword: false });

function enterConsole(player: PlayerView, mustChangePassword = false) {
  keepFor(player.id);
  showPlayer(player.id);
  setSession({ phase: 'console', player, admin: true, staff: true, mustChangePassword, bounced: null });
  if (!location.pathname.startsWith('/admin')) replace('/admin');
}

async function enter(player: PlayerView) {
  keepFor(player.id);
  showPlayer(player.id);
  const m = await loadGame();
  await m.start(session.flags);
  notePlayed(true);
  setSession({ phase: 'playing', player, bounced: null });
}

/** Asks the server who is here and which features are on, then loads the game for a player. */
export async function boot(): Promise<void> {
  try {
    const me = await api.me();
    setSession({ flags: me.flags, email: me.email.enabled, admin: me.admin, staff: me.staff });
    if (me.player && me.staff) enterConsole(me.player, me.mustChangePassword === true);
    else if (me.player) await enter(me.player);
    else setSession({ phase: 'signedOut' });
  } catch (err) {
    if (!handled(err)) setSession({ phase: 'offline' });
  }
}

export const account = {
  signUp: async (name: string, password: string) => enter((await api.signUp(name, password)).player),
  signIn: async (name: string, password: string) => {
    const { player } = await api.signIn(name, password);
    // Whether the page offers the admin page, or is the console's own account, is the server's to say.
    const me = await api.me().catch(() => null);
    if (me?.staff) return enterConsole(player, me.mustChangePassword === true);
    await enter(player);
    if (me) setSession({ admin: me.admin });
  },
  /** Deletes the account and everything with it, then opens the welcome page. */
  deleteAccount: async (password: string) => {
    await api.deleteAccount(password);
    notePlayed(false);
    replace('/welcome');
    signedOut('deleted');
  },
  /** Ends the session and opens the sign-in form. */
  signOut: async () => {
    // This browser's notices while away go first, while the server still knows whose they are (session
    // 182): left on, a browser signed out went on showing the player's notices.
    await pushOff().catch(() => undefined);
    await api.signOut().catch(() => undefined);
    replace('/welcome/sign-in');
    signedOut();
  },
};
