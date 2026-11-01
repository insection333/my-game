// Castle Clash on the page: the castle as the server last told it, shared by every tab; loaded when the
// page opens and each minute while it is open; replaced by every action's answer. The engine works out the
// rest from it at the game's clock (castleEngine.syncCastle), exactly as the server does.
import type { CastleAction } from '@idle-clash/contracts';
import type { castleEngine } from '@idle-clash/features';
import { useEffect, useSyncExternalStore } from 'react';
import { api, requestId } from '../../api.ts';
import { useGame } from '../../game/hooks.ts';
import { handled, sessionStore } from '../../game/session.ts';
import { untilLoaded } from '../../Ready.tsx';

export interface CastleSnapshot {
  view: castleEngine.CastleView | null;
  targets: castleEngine.CastleTargets | null;
  /** An action is on its way: buttons wait for it. */
  busy: boolean;
  /** Why the last action was refused, while it is worth reading. */
  refused: string | null;
}

let snapshot: CastleSnapshot = { view: null, targets: null, busy: false, refused: null };
const listeners = new Set<() => void>();
const set = (next: Partial<CastleSnapshot>) => {
  snapshot = { ...snapshot, ...next };
  for (const l of listeners) l();
};
let refusedTimer: ReturnType<typeof setTimeout> | undefined;

// A castle belongs to the lord signed in: when they sign out, it goes, so the next lord in this tab never
// sees it while their own loads.
sessionStore.subscribe(() => {
  if (sessionStore.get().phase === 'signedOut' && (snapshot.view || snapshot.targets))
    set({ view: null, targets: null, busy: false, refused: null });
});

export const castleStore = {
  get: () => snapshot,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export async function loadCastle(first = false): Promise<void> {
  try {
    const view = await (first ? untilLoaded(api.castle.view()) : api.castle.view());
    set({ view });
  } catch (err) {
    handled(err);
  }
}

export async function loadTargets(first = false): Promise<void> {
  try {
    const targets = await (first ? untilLoaded(api.castle.targets()) : api.castle.targets());
    set({ targets });
  } catch (err) {
    handled(err);
  }
}

/** Sends one action and gives back its result (null when it never got through); the answer's castle
 *  replaces the one held, and a refusal is shown for a while. */
export async function castleRun(
  action: CastleAction | 'open',
): Promise<castleEngine.CastleActResponse['result'] | null> {
  if (snapshot.busy) return null;
  set({ busy: true, refused: null });
  try {
    const r = await (action === 'open' ? api.castle.open(requestId()) : api.castle.act(requestId(), action));
    clearTimeout(refusedTimer);
    const refused = r.result.ok ? null : (r.result.reason ?? 'unknown');
    set({ view: r.castle, refused });
    if (refused) refusedTimer = setTimeout(() => set({ refused: null }), 8000);
    if (r.result.ok && (action === 'open' || action.type === 'siege' || action.type === 'spy')) void loadTargets();
    return r.result;
  } catch (err) {
    handled(err);
    return null;
  } finally {
    set({ busy: false });
  }
}

/** Sends one action: whether it was done. */
export const castleAct = async (action: CastleAction | 'open'): Promise<boolean> =>
  (await castleRun(action))?.ok ?? false;

/** Loads the castle when the page opens and each minute while it is open: called once, by the page. */
export function useCastleLoad(): void {
  useEffect(() => {
    void loadCastle(snapshot.view === null);
    const every = setInterval(() => void loadCastle(), 60_000);
    return () => clearInterval(every);
  }, []);
  // Another lord's siege or spy changes this castle on the server: read it again when one is heard.
  const { events } = useGame();
  const struck = events.findLast((e) => e.type === 'castleBesieged' || e.type === 'castleSpyCaught')?.at;
  useEffect(() => {
    if (struck) void loadCastle();
  }, [struck]);
}

/** The castle snapshot, for every part of the page (the page loads it: useCastleLoad). */
export function useCastle(): CastleSnapshot {
  return useSyncExternalStore(castleStore.subscribe, castleStore.get);
}
