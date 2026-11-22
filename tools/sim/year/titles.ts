// Titles of every kind over the year (session 180): never more than two months between one and the next,
// from the first day to the year's end, by points or by deed, as the steady player earns them.
import { HONOURS } from '../../../packages/features/src/deeds/honours.ts';
import { deedsOf } from '../../../packages/features/src/deeds/state.ts';
import { DAY, T0 } from '../player.ts';
import type { Year } from './player.ts';

type Check = (ok: boolean, what: string) => void;
const YEAR = 365;
/** The most days between one title and the next (and from the last to the year's end). */
export const TITLE_GAP = 60;

/** The day each title opened for the player: by its points (`points[day]`), its deed, or the first of its deeds. */
export function titleDays(y: Year, points: readonly number[]): [string, number][] {
  const done = deedsOf(y.final).done;
  const dayAt = (at: number | undefined) => (at === undefined ? Infinity : Math.floor((at - T0) / DAY) + 1);
  return HONOURS.filter((h) => h.kind === 'title' && h.unlock)
    .map((h): [string, number] => {
      const u = h.unlock!;
      if ('points' in u) {
        const d = points.findIndex((p) => p >= u.points);
        return [h.id, d < 0 ? Infinity : d];
      }
      if ('deed' in u) return [h.id, dayAt(done[u.deed])];
      return [h.id, Math.min(...u.anyOf().map((id) => dayAt(done[id])))];
    })
    .sort((a, b) => a[1] - b[1]);
}

export function titleChecks(y: Year, points: readonly number[], check: Check, lines: string[]): void {
  const days = titleDays(y, points).filter(([, d]) => d <= YEAR);
  let gap = 0;
  let after = 0;
  let from = 0;
  for (const [, d] of [...days, ['end', YEAR] as const]) {
    if (d - from > gap) [gap, after] = [d - from, from];
    from = d;
  }
  lines.push(`Titles of every kind: ${days.map(([id, d]) => `${id} ${d}`).join(', ')}`);
  check(
    gap <= TITLE_GAP,
    `Never more than ${TITLE_GAP} days without a new title (the longest ${gap}, from day ${after}; ${days.length} titles in the year)`,
  );
}
