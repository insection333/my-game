// Castle Clash's lazy sync (SPEC.md sections 1 and 2): everything time does to a castle, worked out when
// the castle is next read, never by a job at midnight. AP, upkeep, walls and wounds mending, lapsed
// debuffs (cleared with no immunity), lapsed immunities, old vigilance and pair records, the day's siege
// count and the rating. Idempotent: syncing twice at one moment changes nothing the second time.
import { ESPIONAGE, RECOVERY, SIEGE } from '@idle-clash/content';
import { syncAp } from './ap.ts';
import { formatUtcDate, type Castle, type DebuffKind } from './castle.ts';
import { lift, modifiers } from './effects.ts';
import { syncUpkeep } from './economy.ts';
import { prunePairs } from './pairs.ts';
import { bastionRating } from './rating.ts';

const HOUR = 3_600_000;

/** Walls and wounds mend 5 points an hour (more with Mender's mortar), walls never under 50, wounds
 *  never over 30. */
export function syncRecovery(c: Castle, now: number): Castle {
  const hours = Math.max(0, (now - c.recoverySyncedAt) / HOUR);
  const mend = hours * RECOVERY.PER_HOUR * lift(modifiers(c, now).recovery);
  return {
    ...c,
    wallIntegrity: Math.min(100, Math.max(RECOVERY.WALL_FLOOR, c.wallIntegrity + mend)),
    infirmaryPct: Math.min(RECOVERY.INFIRMARY_MAX, Math.max(0, c.infirmaryPct - mend)),
    recoverySyncedAt: Math.max(c.recoverySyncedAt, now),
  };
}

export interface Synced {
  castle: Castle;
  /** Gold the treasury's upkeep burned since the last sync (to be split 95/5 by the caller). */
  burned: number;
}

export function syncCastle(c: Castle, now: number): Synced {
  const ap = syncAp(c, now);
  const { castle: kept, burned } = syncUpkeep(ap, now);
  const mended = syncRecovery(kept, now);
  const immunities: Partial<Record<DebuffKind, number>> = {};
  for (const [kind, until] of Object.entries(mended.immunities) as [DebuffKind, number][])
    if (until > now) immunities[kind] = until;
  const castle: Castle = {
    ...mended,
    // A debuff that lapses by time is simply gone: no immunity (the plan's anti-collusion rule).
    debuffs: mended.debuffs.filter((d) => d.until > now).slice(-ESPIONAGE.MAX_ENTRIES),
    immunities,
    genuineReceived: mended.genuineReceived.filter((t) => t > now - SIEGE.VIGILANCE_WINDOW_MS),
    pairs: prunePairs(mended.pairs, now),
    siegesToday: mended.siegesDayUtc === formatUtcDate(now) ? mended.siegesToday : 0,
    siegesDayUtc: mended.siegesDayUtc === formatUtcDate(now) ? mended.siegesDayUtc : null,
    reconLockdownUntil:
      mended.reconLockdownUntil !== null && mended.reconLockdownUntil > now ? mended.reconLockdownUntil : null,
    withdrawLockdownUntil:
      mended.withdrawLockdownUntil !== null && mended.withdrawLockdownUntil > now ? mended.withdrawLockdownUntil : null,
    updatedAt: Math.max(mended.updatedAt, now),
  };
  return { castle: { ...castle, rating: Math.max(castle.rating, bastionRating(castle)) }, burned };
}

/** Vigilance stacks now: genuine sieges received in the last 12 hours, at most 2. */
export const vigilanceOf = (c: Castle, now: number): number =>
  Math.min(SIEGE.VIGILANCE_MAX, c.genuineReceived.filter((t) => t > now - SIEGE.VIGILANCE_WINDOW_MS).length);
