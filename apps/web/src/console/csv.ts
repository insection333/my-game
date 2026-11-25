// The console's rows as a file (session 234): a spreadsheet opens a CSV as it is, so the directory or the
// log can be sorted, counted and kept outside the console. Cells are quoted where they must be, and a cell
// a spreadsheet would run as a formula (a name typed as "=HYPERLINK(…)") is written as text.
import { serverNow } from '../game/clock.ts';

/** A cell as CSV writes it: quoted when it holds a comma, a quote or a line break, and a leading = + - @
 *  (or a tab or a carriage return) made text by a quote mark before it. */
export function cellOf(v: string | number | null): string {
  if (v === null) return '';
  if (typeof v === 'number') return String(v);
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Rows under a header, lines ended as spreadsheets expect, with the mark that tells them it is UTF-8. */
export function csvOf(header: string[], rows: (string | number | null)[][]): string {
  return `\uFEFF${[header, ...rows].map((r) => r.map(cellOf).join(',')).join('\r\n')}\r\n`;
}

/** A day as a spreadsheet reads it, "2026-11-24" (UTC, as the realm's day turns). */
export const isoDay = (at: number | null) => (at === null ? null : new Date(at).toISOString().slice(0, 10));
/** A moment as a spreadsheet reads it, "2026-11-24 14:02" (UTC). */
export const isoWhen = (at: number) => new Date(at).toISOString().slice(0, 16).replace('T', ' ');

/** The file's name: what it holds and the realm's day ("players-2026-11-25.csv"). */
export const fileName = (what: string) => `${what}-${isoDay(serverNow())}.csv`;

/** Hands the browser the file to save. */
export function save(name: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.hidden = true;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
