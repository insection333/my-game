// Castle Clash's formation steppers: whatever is pressed, the three shares stay whole, within 0 to 100,
// and sum to 100, so a formation the page offers to save is always one the server accepts.
import { describe, expect, it } from 'vitest';
import { step } from '../src/pages/castle/shares.ts';

describe('formation steps', () => {
  it('moves five from the largest other share, or to the smallest', () => {
    expect(step([34, 33, 33], 2, true)).toEqual([29, 33, 38]);
    expect(step([34, 33, 33], 0, false)).toEqual([29, 38, 33]);
  });

  it('stops at the ends: nothing past 100, nothing below 0', () => {
    expect(step([100, 0, 0], 0, true)).toEqual([100, 0, 0]);
    expect(step([98, 1, 1], 0, true)).toEqual([99, 0, 1]);
    expect(step([0, 50, 50], 0, false)).toEqual([0, 50, 50]);
    expect(step([2, 49, 49], 0, false)).toEqual([0, 51, 49]);
  });

  it('keeps every share within 0 to 100 and the sum at 100, from any start and any press', () => {
    // mulberry32: a small seeded generator, so the walk is the same every run.
    let seed = 7;
    const rand = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4_294_967_296;
    };
    for (const start of [
      [100, 0, 0],
      [0, 100, 0],
      [98, 1, 1],
      [3, 2, 95],
      [34, 33, 33],
    ]) {
      let shares = start;
      for (let n = 0; n < 400; n++) {
        shares = step(shares, Math.floor(rand() * 3), rand() < 0.5);
        expect(shares.reduce((a, b) => a + b, 0)).toBe(100);
        for (const x of shares) {
          expect(Number.isInteger(x)).toBe(true);
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(100);
        }
      }
    }
  });
});
