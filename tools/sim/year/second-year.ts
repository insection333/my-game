// The second year (session 209, the plan *Dead and short content, 23 November*): the steady player plays on
// to two years, and the report says what each system still gives once the climb is done: the last day each
// kind of first came, the firsts and deeds of each quarter of year two, the longest wait for a first, and
// what each currency holds with nothing new to buy. Figures for now; each becomes a check as the plan's
// parts land (session 221). Held already: the lanes keep working and the Storehouse never fills.
import type { Year } from './player.ts';

type Check = (ok: boolean, what: string) => void;
export const TWO_YEARS = 730;
const YEAR = 365;
const QUARTERS: [number, number][] = [
  [366, 456],
  [457, 547],
  [548, 638],
  [639, 730],
];
const M = (n: number) => `${(n / 1e6).toFixed(1)}M`;

/** The kind of a first, as the year counts them ("castle:temper" stays itself; "level:mining" is a level). */
const kindOf = (f: string) => (f.startsWith('castle:') ? f : f.split(':')[0]);

export function secondYearChecks(y: Year, check: Check, lines: string[]): void {
  if (y.days.length < TWO_YEARS) return;
  lines.push(`\n## The second year (the steady player, days ${YEAR + 1} to ${TWO_YEARS})`);

  // The last day each kind of first came, over both years: where a system stops giving anything new.
  const last = new Map<string, number>();
  const counts = new Map<string, [number, number]>();
  for (const d of y.days)
    for (const f of d.firsts) {
      const k = kindOf(f);
      last.set(k, d.day);
      const c = counts.get(k) ?? [0, 0];
      c[d.day <= YEAR ? 0 : 1]++;
      counts.set(k, c);
    }
  const byLast = [...last.entries()].sort((a, b) => a[1] - b[1]);
  lines.push(
    `The last first of each kind (day; in year one, in year two): ${byLast
      .map(([k, d]) => `${k} ${d} (${counts.get(k)![0]}, ${counts.get(k)![1]})`)
      .join('; ')}`,
  );

  // Each quarter of year two: days with a first, the longest wait, the deeds and titles, and what came.
  for (const [from, to] of QUARTERS) {
    const days = y.days.filter((d) => d.day >= from && d.day <= to);
    const withFirst = days.filter((d) => d.firsts.length).length;
    let gap = 0;
    let longest = 0;
    for (const d of days) {
      gap = d.firsts.length ? 0 : gap + 1;
      longest = Math.max(longest, gap);
    }
    const deeds = days.reduce((n, d) => n + d.firsts.filter((f) => f === 'deed' || f === 'title').length, 0);
    const titles = days.reduce((n, d) => n + d.firsts.filter((f) => f === 'title').length, 0);
    const kinds = new Map<string, number>();
    for (const d of days) for (const f of d.firsts) kinds.set(kindOf(f), (kinds.get(kindOf(f)) ?? 0) + 1);
    const mix = [...kinds.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ${n}`)
      .join(', ');
    lines.push(
      `Days ${from} to ${to}: a first on ${withFirst} of ${days.length} days, the longest wait ${longest} days; ${deeds} deeds (${titles} titles); ${mix || 'nothing'}`,
    );
  }

  // What each currency holds at each quarter's end: one that only grows has nothing left to buy.
  const at = [YEAR, ...QUARTERS.map(([, to]) => to)];
  const held = (f: (d: Year['days'][number]) => number) => at.map((n) => f(y.days[n - 1])).join(', ');
  lines.push(`Held at days ${at.join(', ')}:`);
  lines.push(`- gold ${at.map((n) => M(y.days[n - 1].gold)).join(', ')}`);
  lines.push(`- expedition marks ${held((d) => d.marks)}`);
  lines.push(`- the Deep's deepest ${held((d) => d.deepest ?? 0)}`);
  lines.push(`- war marks ${held((d) => d.castle?.held ?? 0)}`);
  const castle = at.map((n) => y.days[n - 1].castle);
  lines.push(
    `- the castle: level ${castle.map((c) => c?.level.toFixed(1) ?? '-').join(', ')}; evolution ${castle.map((c) => c?.evolution ?? '-').join(', ')}; incursion tier ${castle.map((c) => c?.tier ?? '-').join(', ')}`,
  );

  // Held already in year two, as in year one.
  const second = y.days.filter((d) => d.day > YEAR);
  const full = second.reduce((n, d) => n + (d.stops.storehouseFull ?? 0), 0);
  check(full === 0, `The second year: no lane stops for a full Storehouse (${full})`);
  const away = second.length * (24 * 3600 - y.kind.visits.reduce((n, v) => n + v.minutes * 60, 0));
  for (const lane of ['gathering', 'artisan', 'combat']) {
    const idle = second.reduce((n, d) => n + (d.idle[lane] ?? 0), 0) / away;
    check(
      idle <= 0.05,
      `The second year: the ${lane} lane works at least 95% of the time away (${(idle * 100).toFixed(1)}% idle)`,
    );
  }
}
