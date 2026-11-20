// A letter's time on a device whose clock is wrong (session 158). The game runs on the server's time, so
// the tray said a letter came "Today, 11:46"; the inbox reckoned "today" by the device's own clock and, on a
// phone set a day behind, said the same letter came "20 Nov, 11:46" (or a day ahead, a letter of today
// "19 Nov").
import { fmt } from '@idle-clash/content';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setServerTime } from '../src/game/clock.ts';
import { letterWhen } from '../src/pages/admin-mail-words.ts';
import { dayOf, whenOf } from '../src/pages/days.ts';

const SERVER = Date.UTC(2026, 10, 20, 12);
const HOUR = 3_600_000;

describe('times said on a device whose clock is wrong', () => {
  afterEach(() => vi.useRealTimers());

  it("says them by the server's clock", () => {
    for (const off of [-26 * HOUR, 26 * HOUR]) {
      vi.useFakeTimers({ now: SERVER + off });
      setServerTime(SERVER);
      const letter = SERVER - HOUR;
      expect(whenOf(letter), `${off / HOUR} h`).toBe(fmt.when(letter, SERVER));
      expect(letterWhen(letter)).toBe(fmt.when(letter, SERVER));
      expect(dayOf(Date.UTC(2025, 10, 20, 12))).toBe(fmt.day(Date.UTC(2025, 10, 20, 12), SERVER));
    }
  });
});
