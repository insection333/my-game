// The castle as of the game's clock, for every tab: the server's last word synced on by the same engine
// (castleEngine.syncCastle), with the purse and the lord's total level beside it.
import { castleEngine as E } from '@idle-clash/features';
import { countOf } from '@idle-clash/kernel';
import { useGame } from '../../game/hooks.ts';
import { useCastle } from './store.ts';

export function useSyncedCastle() {
  const { view, busy, refused, targets } = useCastle();
  const { state, now: clock } = useGame();
  const now = Math.max(clock, view?.now ?? 0);
  const castle = view?.castle ? E.syncCastle(view.castle, now).castle : null;
  return {
    view,
    castle,
    now,
    busy,
    refused,
    targets,
    purse: countOf(state, 'gold'),
    totalLevel: view?.totalLevel ?? 0,
  };
}

/** Whether a cost can be paid, from the purse or the treasury as the castle is set to. */
export const affords = (castle: E.Castle, purse: number, gold: number): boolean =>
  E.pay({ castle, purse }, gold) !== null;

/** Whether the castle holds the AP. */
export const hasAp = (castle: E.Castle, ap: number): boolean => castle.activeAp + 1e-9 >= ap;
