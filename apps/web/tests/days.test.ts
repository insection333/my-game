// Days said as the game says them (session 79's `fmt.day`: "9 Nov" this year, "9 Nov 2025" before), on
// every page, the admin's among them (session 83: its players, testers, reports and repairs said "12 Nov
// 2026"). Only feedback copied out of the game keeps its year, since it is read elsewhere and later.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dayOf } from '../src/pages/days.ts';

const SRC = join(import.meta.dirname, '..', 'src');
const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [join(dir, e.name)] : [],
  );
/** Text that leaves the game, where a day needs its year. */
const LEAVES = new Set(['pages/feedback-copy.ts']);

describe('days on the pages', () => {
  it('say no year this year', () => {
    const now = Date.UTC(2026, 10, 12, 15);
    expect(dayOf(Date.UTC(2026, 10, 9, 12), now)).toBe('9 Nov');
    expect(dayOf(Date.UTC(2025, 10, 9, 12), now)).toBe('9 Nov 2025');
  });

  it("come from the game's own words for a day, save in text that leaves the game", () => {
    const full = files(SRC)
      .filter((f) => readFileSync(f, 'utf8').includes('fmt.date('))
      .map((f) => relative(SRC, f))
      .filter((f) => !LEAVES.has(f));
    expect(full).toEqual([]);
  });
});
