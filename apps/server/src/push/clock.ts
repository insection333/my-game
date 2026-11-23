// A player's own clock for their notices (session 171): the day and the hour where their browser is, so a
// notice never comes at night and three a day are counted by their day, not the server's.
const parts = (at: number, tz: string) => {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const p = Object.fromEntries(f.formatToParts(new Date(at)).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, min: +p.minute };
};

/** Whether a time zone's name is one this server's clock knows. */
export function knownZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** The day at `at` in a zone, as 2026-11-23. */
export function localDay(at: number, tz: string): string {
  const p = parts(at, tz);
  return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
}

/** The hours a notice waits through: from 22:00 to 08:00 in the player's clock. */
export const QUIET = { FROM: 22, TO: 8 } as const;

export const isQuiet = (at: number, tz: string): boolean => {
  const h = parts(at, tz).h;
  return h >= QUIET.FROM || h < QUIET.TO;
};

/** A zone's offset from UTC at a moment, in milliseconds. */
const offsetAt = (at: number, tz: string): number => {
  const p = parts(at, tz);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min) - Math.floor(at / 60_000) * 60_000;
};

/** The end of the quiet hours `at` falls in: the next 08:00 in the player's clock, at the morning's own
 *  offset (session 201: at the evening's, the night summer time ended held a notice to 07:00). */
export function quietEnds(at: number, tz: string): number {
  const p = parts(at, tz);
  const day = p.h >= QUIET.FROM ? p.d + 1 : p.d;
  const wall = Date.UTC(p.y, p.m - 1, day, QUIET.TO, 0);
  const guess = wall - offsetAt(at, tz);
  return wall - offsetAt(guess, tz);
}

/** A time of day in the player's clock, as 14:30. */
export function localTime(at: number, tz: string): string {
  const p = parts(at, tz);
  return `${String(p.h).padStart(2, '0')}:${String(p.min).padStart(2, '0')}`;
}
