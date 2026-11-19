// Session 147: a first step mined in the fire's lane read "Working in your Gathering (the fire) lane",
// the lane's full name dropped into a sentence that already says "lane".
import { describe, expect, it } from 'vitest';
import { inLane } from '../src/goals/view.ts';

describe('the lane a goal is worked in', () => {
  it('names each lane in words that read as a sentence', () => {
    expect(inLane('gathering')).toBe('Working in your Gathering lane');
    expect(inLane('gathering2')).toBe("Working in the fire's Gathering lane");
    expect(inLane('artisan')).toBe('Working in your Artisan lane');
  });
});
