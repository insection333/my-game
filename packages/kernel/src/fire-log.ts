// The fire's log (session 156): how long it burned in each hour of the last two days, so the admin page
// can see a fire kept lit round the clock by a script, where the fire rewards playing in person.
import type { State } from './schema.ts';

/** Hours of the fire's log kept in the save: two days, so any day's worth can be read from it. */
export const FIRE_LOG_HOURS = 48;

/** The time the fire burned since the last input, kept an hour at a time for two days (session 156): a
 *  fire that never sleeps is a script's, and the admin page shows it. */
export function logFire(s: State, now: number): void {
  const out = Math.min(now, s.fireUntil);
  if (out <= s.lastSeen) return;
  const log = { ...(s.fireLog ?? {}) };
  for (let from = s.lastSeen; from < out;) {
    const hourEnd = Math.min(out, (Math.floor(from / 3_600_000) + 1) * 3_600_000);
    const key = new Date(from).toISOString().slice(0, 13);
    log[key] = (log[key] ?? 0) + (hourEnd - from);
    from = hourEnd;
  }
  s.fireLog = Object.fromEntries(
    Object.entries(log)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .slice(0, FIRE_LOG_HOURS),
  );
}

/** The most the fire burned in any 24 hours of its log, in milliseconds (the admin page's watch on fires
 *  that never sleep, session 156). */
export function fireBusiestDay(s: State): number {
  const hours = Object.entries(s.fireLog ?? {}).map(([k, ms]) => [Date.parse(`${k}:00:00Z`), ms] as const);
  let most = 0;
  for (const [start] of hours) {
    const sum = hours.filter(([t]) => t >= start && t < start + 24 * 3_600_000).reduce((n, [, ms]) => n + ms, 0);
    most = Math.max(most, sum);
  }
  return most;
}
