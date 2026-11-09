// The one number formatter. Every number on screen goes through here, so 1,234 and 2.5% and 7.5 s
// look the same everywhere. t() accepts only strings, so a raw number cannot reach the screen.

const whole = new Intl.NumberFormat('en', { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
const tenths = new Intl.NumberFormat('en', { maximumFractionDigits: 1 });
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const timeOfDay = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const dayMonth = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const conjunction = new Intl.ListFormat('en-GB', { type: 'conjunction' });
const ordinals = new Intl.PluralRules('en-GB', { type: 'ordinal' });
const SUFFIX: Record<string, string> = { one: 'st', two: 'nd', few: 'rd', other: 'th' };

const ROMAN: [number, string][] = [
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

export const fmt = {
  /** 1234 → "1,234" */
  int: (n: number): string => whole.format(Math.round(n)),
  /** Where room is short (the header's gold): 12345 → "12,345", but 123456 → "123.5K", 2500000 → "2.5M" */
  short: (n: number): string => (Math.abs(n) < 100_000 ? whole.format(Math.round(n)) : compact.format(n)),
  /** Where room is shortest (a deed's medallion): 100 → "100", 1000 → "1K", 2500000 → "2.5M" */
  compact: (n: number): string => compact.format(n),
  /** 2.5 → "2.5", 1234.5 → "1,234.5" */
  num: (n: number): string => decimal.format(n),
  /** 2.5 → "2.5%" */
  pct: (n: number): string => `${decimal.format(n)}%`,
  /** A chance from 0 to 1 → "37%"; one that rounds to nothing or to certain but is neither says so
   *  ("<1%", ">99%"; session 56), where "0% to win" read as hopeless for a fight that could be won. */
  chance: (p: number): string =>
    p > 0 && p < 0.005
      ? `<${whole.format(1)}%`
      : p < 1 && p >= 0.995
        ? `>${whole.format(99)}%`
        : `${whole.format(Math.round(p * 100))}%`,
  /** 7.5 → "7.5 s"; an action's time to a tenth, never "37.74 s" */
  seconds: (s: number): string => `${tenths.format(s)} s`,
  /** milliseconds → "45 s", "12 min", "3 h 20 min", "2 d 4 h" */
  duration: (ms: number): string => {
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s} s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    if (h < 48) return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
    const d = Math.floor(h / 24);
    return h % 24 ? `${d} d ${h % 24} h` : `${d} d`;
  },
  /** milliseconds → "4:07": a countdown */
  clock: (ms: number): string => {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  },
  /** milliseconds since the epoch → "09:42", in the player's own time zone */
  time: (ms: number): string => timeOfDay.format(ms),
  /** milliseconds since the epoch → "20 Oct 2026", in the player's own time zone */
  date: (ms: number): string => day.format(ms),
  /** A moment in the last while, as a report or a pill says it (session 64): "20:22" today, "9 Nov,
   *  20:22" this year, "9 Nov 2025" before; where every day said its year, even yesterday. */
  when: (at: number, now: number): string => {
    const [a, n] = [new Date(at), new Date(now)];
    if (a.toDateString() === n.toDateString()) return timeOfDay.format(at);
    if (a.getFullYear() === n.getFullYear()) return `${dayMonth.format(at)}, ${timeOfDay.format(at)}`;
    return day.format(at);
  },
  /** ["a", "b", "c"] → "a, b and c": words joined as a sentence joins them */
  list: (items: readonly string[]): string => conjunction.format(items),
  /** 1 → "1st", 22 → "22nd", 113 → "113th": a place on a ladder */
  ordinal: (n: number): string => `${whole.format(n)}${SUFFIX[ordinals.select(n)] ?? 'th'}`,
  /** 4 → "IV", up to 39 */
  roman: (n: number): string => {
    if (!Number.isInteger(n) || n < 1 || n > 39) throw new Error(`roman: ${n} is out of range`);
    let out = '';
    for (const [v, r] of ROMAN) {
      while (n >= v) {
        out += r;
        n -= v;
      }
    }
    return out;
  },
};
