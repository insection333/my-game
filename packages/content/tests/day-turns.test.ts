// When the realm's day turns, said in the player's own clock (session 115): strongholds, bosses and the
// daily goal turn at midnight UTC, but each said "tomorrow", so a stronghold taken at 09:00 in Sydney
// "stood again tomorrow" two hours before it stood again that same morning.
import { describe, expect, it } from 'vitest';
import { dayTurns } from '../src/index.ts';

const at = (iso: string) => Date.parse(iso);

describe('the day turning', () => {
  it('is said at the time it turns, today or tomorrow in the player’s own clock', () => {
    // 09:00 in Sydney is 22:00 UTC the day before: the day turns at 11:00 Sydney time, the same morning.
    expect(dayTurns(at('2026-11-15T22:00:00Z'), 'Australia/Sydney')).toBe('at 11:00');
    // 13:00 in Sydney is 02:00 UTC: the next turn is 11:00 the next morning.
    expect(dayTurns(at('2026-11-16T02:00:00Z'), 'Australia/Sydney')).toBe('tomorrow at 11:00');
    expect(dayTurns(at('2026-11-16T15:00:00Z'), 'Europe/London')).toBe('tomorrow at 00:00');
    expect(dayTurns(at('2026-11-16T15:00:00Z'), 'America/New_York')).toBe('at 19:00');
  });
});
