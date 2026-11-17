// The tour says the fire as it is (session 129): "While you are here the fire burns" stood beside the
// header's Stoke, the fire out until a newcomer's first action lights it; everything a player does keeps
// it lit for the kernel's five minutes.
import { describe, expect, it } from 'vitest';
import { stepWords } from '../src/shell/tour-words.ts';

describe("the tour's fire", () => {
  it('says what keeps it burning, and for how long', () => {
    expect(stepWords('tour.fire')).toBe(
      'All you do keeps the fire lit for 5 min: more XP the longer it burns, and a second Gathering lane.',
    );
    expect(stepWords('tour.lanes')).toBe('Your lanes do the work, and keep at it for up to a day while you are away.');
  });
});
