// Dates across the year's turn (session 197): a day or a moment said "9 Nov" this year and "9 Nov 2025" in
// another, so in the last week of December the next week's contract came "4 Jan 2027", the realm's next boss
// came "4 Jan 2027" and AP was full "1 Jan 2027", each without the hour it turns; and on New Year's Day a deed
// done the night before said "31 Dec 2026". Within half a year either way a date is said as this year's are.
import { describe, expect, it } from 'vitest';
import { fmt } from '../src/index.ts';

const at = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min).getTime();
const hm = (ms: number) => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(ms);

describe('dates across the turn of the year', () => {
  it('say a moment in the coming days with its day and hour', () => {
    const next = at(2027, 1, 4, 11);
    expect(fmt.when(next, at(2026, 12, 29, 9))).toBe(`4 Jan, ${hm(next)}`);
    expect(fmt.when(at(2027, 1, 1, 2, 30), at(2026, 12, 31, 22))).toBe(`1 Jan, ${hm(at(2027, 1, 1, 2, 30))}`);
  });

  it('say a day just past without its year, and one long past with it', () => {
    expect(fmt.day(at(2026, 12, 31, 23), at(2027, 1, 1, 9))).toBe('31 Dec');
    expect(fmt.when(at(2026, 12, 31, 23), at(2027, 1, 1, 9))).toBe(`31 Dec, ${hm(at(2026, 12, 31, 23))}`);
    expect(fmt.day(at(2025, 11, 9), at(2026, 11, 23))).toBe('9 Nov 2025');
    expect(fmt.day(at(2026, 2, 1), at(2026, 11, 23))).toBe('1 Feb');
  });
});
