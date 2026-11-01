// Castle Clash on the page: the castle as the server last told it, shared by every tab; loaded when the
// page opens and each minute while it is open; replaced by every action's answer. The engine works out the
// rest from it at the game's clock (castleEngine.syncCastle), exactly as the server does.
import type { CastleAction } from '@idle-clash/contracts';
import type { castleEngine } from '@idle-clash/features';
import { useEffect, useSyncExternalStore } from 'react';
import { api, requestId } from '../../api.ts';
import { handled } from '../../game/session.ts';
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

/** Sends one action; the answer's castle replaces the one held, and a refusal is shown for a while. */
export async function castleAct(action: CastleAction | 'open'): Promise<boolean> {
  if (snapshot.busy) return false;
  set({ busy: true, refused: null });
  try {
    const r = await (action === 'open' ? api.castle.open(requestId()) : api.castle.act(requestId(), action));
    clearTimeout(refusedTimer);
    const refused = r.result.ok ? null : (r.result.reason ?? 'unknown');
    set({ view: r.castle, refused });
    if (refused) refusedTimer = setTimeout(() => set({ refused: null }), 8000);
    if (r.result.ok && (action === 'open' || action.type === 'siege' || action.type === 'spy')) void loadTargets();
    return r.result.ok;
  } catch (err) {
    handled(err);
    return false;
  } finally {
    set({ busy: false });
  }
}

/** Loads the castle when the page opens and each minute while it is open: called once, by the page. */
export function useCastleLoad(): void {
  useEffect(() => {
    void loadCastle(snapshot.view === null);
    const every = setInterval(() => void loadCastle(), 60_000);
    return () => clearInterval(every);
  }, []);
}

/** The castle snapshot, for every part of the page (the page loads it: useCastleLoad). */
export function useCastle(): CastleSnapshot {
  return useSyncExternalStore(castleStore.subscribe, castleStore.get);
}
