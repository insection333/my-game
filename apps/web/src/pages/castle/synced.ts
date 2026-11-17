// The castle as of the game's clock, for every tab: the server's last word synced on by the same engine
// (castleEngine.syncCastle), with the purse and the lord's total level beside it.
import { fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { countOf } from '@idle-clash/kernel';
import { useGame } from '../../game/hooks.ts';
import { useCastle } from './store.ts';

export function useSyncedCastle() {
  const { view, busy, refused, refusedAt, targets, battle } = useCastle();
  const { state, now: clock } = useGame();
  const now = Math.max(clock, view?.now ?? 0);
  const castle = view?.castle ? E.syncCastle(view.castle, now).castle : null;
  return {
    view,
    castle,
    now,
    busy,
    refused,
    refusedAt,
    targets,
    battle,
    purse: countOf(state, 'gold'),
    totalLevel: view?.totalLevel ?? 0,
  };
}

/** Whether a cost can be paid, from the purse or the treasury as the castle is set to. */
export const affords = (castle: E.Castle, purse: number, gold: number): boolean =>
  E.pay({ castle, purse }, gold) !== null;

/** A cost not met, said by how much more is needed and from where ("2.7M more gold needed"), or null when
 *  it can be paid (session 91: a greyed Raise said nothing of why). */
export function shortText(castle: E.Castle, purse: number, gold: number): string | null {
  const from = castle.payFromTreasury ? castle.treasury : purse;
  if (from >= gold) return null;
  const more = fmt.short(gold - from);
  return castle.payFromTreasury ? t('castle.short.treasury', { gold: more }) : t('castle.short.purse', { gold: more });
}

/** Every shortfall of a cost in gold and war marks, each said by how much more is needed (session 126:
 *  the Halls' Study, Forge and Temper were greyed with no word of either). */
export function lacks(castle: E.Castle, purse: number, cost: { gold: number; marks: number }): string[] {
  const gold = shortText(castle, purse, cost.gold);
  const marks = cost.marks - castle.warMarks;
  return [
    ...(gold ? [gold] : []),
    ...(marks > 0
      ? [marks === 1 ? t('castle.short.marksOne') : t('castle.short.marks', { marks: fmt.int(marks) })]
      : []),
  ];
}

/** Whether the castle holds the AP. */
export const hasAp = (castle: E.Castle, ap: number): boolean => castle.activeAp + 1e-9 >= ap;
