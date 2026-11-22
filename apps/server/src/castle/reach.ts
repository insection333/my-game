// The lords in reach of a castle (session 137), shared by the War's targets and a new day's orders (session
// 169: a castle open to lords with none in reach was ordered to besiege one).
import { SIEGE } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import type { CastleStore } from './store.ts';

/** The lords open to lords near your rating, from half to twice it, nearest first; then those in reach
 *  (session 137): the near bracket while three stand there, shielded or not, else a step further; of those,
 *  the unshielded. A castle not yet open to lords is never offered (its Siege was refused as "shielded"). */
export function lordsInReachOf(castles: CastleStore, playerId: string, c: E.Castle, now: number) {
  const widest = SIEGE.BRACKET_STEPS[SIEGE.BRACKET_STEPS.length - 1];
  const open = castles.lordsNear(playerId, c.rating, { low: widest[0], high: widest[1] }).flatMap((l) => {
    const theirs = castles.read(l.id);
    return theirs && E.lordsOpen(theirs, now) ? [{ ...l, shielded: E.isShielded(theirs, now) }] : [];
  });
  return E.lordsInReach(c.rating, open, (l) => !l.shielded);
}

/** Whether a lord stands in reach today, for a day's orders not yet drawn (session 169: a castle open to
 *  lords with none in reach was ordered to besiege one); undefined once today's are drawn. */
export function lordsWithin(castles: CastleStore, playerId: string, c: E.Castle, now: number): boolean | undefined {
  if (c.orders?.day === new Date(now).toISOString().slice(0, 10) || !E.lordsOpen(c, now)) return undefined;
  return lordsInReachOf(castles, playerId, c, now).lords.length > 0;
}
