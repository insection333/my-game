// Today and Yesterday across the clocks' change (session 203): the tray and the castle's reports took
// yesterday as 24 hours before today's midnight, but the day the clocks go back is 25 hours long and the day
// they go forward 23, so on the day after each, yesterday's notices were headed by their date, and just
// after midnight a report from yesterday could read as the day before it. Days are now counted by date.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { daysBefore } from '../src/days.ts';

let tz: string | undefined;
beforeEach(() => {
  tz = process.env.TZ;
  process.env.TZ = 'Australia/Sydney';
});
afterEach(() => {
  process.env.TZ = tz;
});

const at = (y: number, m: number, d: number, h: number, min = 0) => new Date(y, m - 1, d, h, min).getTime();

describe('days before', () => {
  it('counts the day after the clocks go back (a day of 25 hours) as yesterday', () => {
    expect(daysBefore(at(2027, 4, 4, 20), at(2027, 4, 5, 0, 30))).toBe(1);
    expect(daysBefore(at(2027, 4, 4, 0, 30), at(2027, 4, 5, 23, 30))).toBe(1);
  });

  it('counts the day after the clocks go forward (a day of 23 hours) as yesterday', () => {
    expect(daysBefore(at(2027, 10, 3, 9), at(2027, 10, 4, 0, 30))).toBe(1);
    expect(daysBefore(at(2027, 10, 3, 23, 30), at(2027, 10, 4, 12))).toBe(1);
  });

  it('counts today, yesterday and earlier days on an ordinary week', () => {
    expect(daysBefore(at(2026, 11, 23, 1), at(2026, 11, 23, 23))).toBe(0);
    expect(daysBefore(at(2026, 11, 22, 23, 59), at(2026, 11, 23, 0, 1))).toBe(1);
    expect(daysBefore(at(2026, 11, 20, 12), at(2026, 11, 23, 12))).toBe(3);
  });
});
