// Session 151: a newcomer away thirty hours read "Away for 30 h" over a recap of twenty-four hours' work,
// with no word that lanes rest once they have worked a day while the player is away.
import { DEFAULT_CONFIG, newState, summarizeAway } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { recap } from '../src/index.ts';

const H = 3_600_000;

describe('the recap of a long absence', () => {
  it('says the lanes rested once they had worked a day', () => {
    const before = newState(1, 0);
    const away = summarizeAway(before, before, [], 30 * H);
    expect(recap.restedFor(away, DEFAULT_CONFIG.awayCap)).toBe(
      'Lanes work up to 24 h while you are away: yours rested the last 6 h.',
    );
  });

  it('says nothing of it within a day', () => {
    const before = newState(1, 0);
    expect(recap.restedFor(summarizeAway(before, before, [], 23 * H), DEFAULT_CONFIG.awayCap)).toBeNull();
  });
});
