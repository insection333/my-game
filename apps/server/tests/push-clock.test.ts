// The morning a held notice waits for, on the nights the clocks change (session 201): a notice held through
// the night was set for 08:00 at the evening's offset from UTC, so on the night Sydney's summer time ends it
// came at 07:00, and on the night it begins at 09:00. The morning is now 08:00 at the morning's own offset.
import { describe, expect, it } from 'vitest';
import { localTime, quietEnds } from '../src/push/clock.ts';

const SYDNEY = 'Australia/Sydney';

describe('the morning a notice waits for', () => {
  it('is 08:00 by the morning clock on the nights summer time ends and begins', () => {
    // 23:00 on 3 April 2027 (summer time, UTC+11); the clocks go back at 03:00.
    const ends = quietEnds(Date.UTC(2027, 3, 3, 12, 0), SYDNEY);
    expect(localTime(ends, SYDNEY)).toBe('08:00');
    // 23:00 on 2 October 2027 (UTC+10); the clocks go forward at 02:00.
    const begins = quietEnds(Date.UTC(2027, 9, 2, 13, 0), SYDNEY);
    expect(localTime(begins, SYDNEY)).toBe('08:00');
    // An ordinary night.
    expect(localTime(quietEnds(Date.UTC(2026, 10, 23, 12, 0), SYDNEY), SYDNEY)).toBe('08:00');
  });
});
