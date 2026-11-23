// When the realm's day turns (session 115): strongholds stand again, a boss is no longer rested and a new
// daily goal comes at midnight UTC, which is 11:00 in Sydney and 19:00 in New York. Each said "tomorrow"
// in the player's own clock, wrong for part of every day east or west of Greenwich; it is said as the time.
import { t } from './t.ts';

const DAY = 86_400_000;

/** "at 11:00" when the day turns later on the player's own day, "tomorrow at 00:00" when on their next. */
export function dayTurns(now: number, timeZone?: string): string {
  const next = Math.floor(now / DAY) * DAY + DAY;
  const date = new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric' });
  const time = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit' }).format(next);
  return date.format(next) === date.format(now) ? t('day.turnsAt', { time }) : t('day.turnsTomorrow', { time });
}

/** How many days of the player's own calendar lie between `at` and `now`: 0 today, 1 yesterday. Counted by
 *  date (session 203), as the days the clocks change are 23 and 25 hours long. */
export function daysBefore(at: number, now: number): number {
  const date = (x: number) => {
    const d = new Date(x);
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  };
  return Math.round((date(now) - date(at)) / DAY);
}
