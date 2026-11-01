// Castle Clash's action points (SPEC.md section 2): stateless and lazy. AP flows only on a day whose Call
// to arms was answered, from that moment (and retroactively from that day's midnight) to the day's end;
// on a day not yet answered, what would have flowed waits as the reserve, claimed with the call.
import { AP } from '@idle-clash/content';
import { daysBetween, endOfUtcDay, formatUtcDate, startOfUtcDay, type Castle } from './castle.ts';
import { lift, modifiers } from './effects.ts';
import { idleMultiplier } from './economy.ts';

const HOUR = 3_600_000;

/** The AP cap: 240, and more with Logistics. */
export const apCap = (c: Castle, now: number): number => AP.BASE_ACTIVE_AP_CAP + modifiers(c, now).apCap;

/** AP an hour before the streak: 10, lifted by excavation's idle multiplier and the Tidings stone
 *  (DESIGN.md section 7). */
export const apPerHour = (c: Castle, now: number): number =>
  AP.BASE_AP_PER_HOUR * idleMultiplier(c) * lift(modifiers(c, now).apRate);

const streakMult = (streak: number) => 1 + (Math.min(streak, AP.MAX_STREAK) * AP.STREAK_PCT_PER_DAY) / 100;

/** The streak as of today: the last call's, less three for each full day missed since. */
export function effectiveStreak(c: Castle, now: number): number {
  if (c.lastCtaDateUtc === null) return 0;
  const missed = Math.max(0, daysBetween(c.lastCtaDateUtc, formatUtcDate(now)) - 1);
  return Math.max(0, c.streakAtLastCta - AP.STREAK_LOSS_PER_MISSED_DAY * missed);
}

/** Today's reserve: AP that has flowed since midnight, waiting for today's call (0 once answered). */
export function pendingReserve(c: Castle, now: number): number {
  if (c.lastCtaDateUtc === formatUtcDate(now)) return 0;
  const hours = Math.max(0, Math.min(24, (now - startOfUtcDay(now)) / HOUR));
  return hours * apPerHour(c, now) * streakMult(effectiveStreak(c, now));
}

/** Step A of the plan's sync: credits the hours of the last call's day not yet credited. AP is never
 *  lowered by it, even when a call lifted it past the cap (DESIGN.md 5.2). Idempotent. */
export function syncAp(c: Castle, now: number): Castle {
  if (c.lastCtaDateUtc === null) return c;
  const activeUntil = endOfUtcDay(c.lastCtaDateUtc);
  if (c.lastApSyncAt >= activeUntil) return c;
  const creditEnd = Math.min(now, activeUntil);
  const hours = Math.max(0, (creditEnd - c.lastApSyncAt) / HOUR);
  const credit = hours * apPerHour(c, now) * streakMult(c.streakAtLastCta);
  const ap = Math.max(c.activeAp, Math.min(apCap(c, now), c.activeAp + credit));
  return { ...c, activeAp: ap, lastApSyncAt: Math.max(c.lastApSyncAt, creditEnd) };
}

export type CallResult =
  { ok: true; castle: Castle; gained: number; streak: number } | { ok: false; reason: 'claimed' };

/** Answers today's Call to arms: the streak grows by one, today's reserve is claimed at the new streak's
 *  rate from midnight, with 5 AP more, up to 25 past the cap. The castle must already be synced. */
export function claimCallToArms(c: Castle, now: number): CallResult {
  const today = formatUtcDate(now);
  if (c.lastCtaDateUtc === today) return { ok: false, reason: 'claimed' };
  const streak = Math.min(AP.MAX_STREAK, effectiveStreak(c, now) + 1);
  const hours = Math.max(0, (now - startOfUtcDay(now)) / HOUR);
  const reserve = hours * apPerHour(c, now) * streakMult(streak);
  const ap = Math.max(
    c.activeAp,
    Math.min(apCap(c, now) + AP.CTA_OVERCAP, c.activeAp + reserve + AP.DAILY_CTA_INSTANT_BONUS_AP),
  );
  return {
    ok: true,
    castle: { ...c, activeAp: ap, streakAtLastCta: streak, lastCtaDateUtc: today, lastApSyncAt: now },
    gained: ap - c.activeAp,
    streak,
  };
}

/** Spends AP, or null when there is not enough. */
export const spendAp = (c: Castle, ap: number): Castle | null =>
  c.activeAp + 1e-9 >= ap ? { ...c, activeAp: Math.max(0, c.activeAp - ap) } : null;
