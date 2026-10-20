// The one number formatter. Every number on screen goes through here, so 1,234 and 2.5% and 7.5 s
// look the same everywhere. t() accepts only strings, so a raw number cannot reach the screen.

const whole = new Intl.NumberFormat('en', { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

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
  /** 2.5 → "2.5", 1234.5 → "1,234.5" */
  num: (n: number): string => decimal.format(n),
  /** 2.5 → "2.5%" */
  pct: (n: number): string => `${decimal.format(n)}%`,
  /** 7.5 → "7.5 s" */
  seconds: (s: number): string => `${decimal.format(s)} s`,
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
  /** milliseconds since the epoch → "20 Oct 2026", in the player's own time zone */
  date: (ms: number): string => day.format(ms),
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
