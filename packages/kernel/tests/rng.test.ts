import { describe, expect, it } from 'vitest';
import { seeded } from '../src/index.ts';

describe('seeded rng', () => {
  it('gives the same number for the same seed, stream and counter', () => {
    expect(seeded(42)('gathering', 7)).toBe(seeded(42)('gathering', 7));
  });

  it('differs between seeds, streams and counters', () => {
    const r = seeded(42);
    const values = new Set([r('gathering', 0), r('gathering', 1), r('artisan', 0), seeded(43)('gathering', 0)]);
    expect(values.size).toBe(4);
  });

  it('is uniform enough for 1-in-5,000 finds', () => {
    const r = seeded(7);
    const bins = new Array<number>(20).fill(0);
    let legendary = 0;
    let outside = 0;
    const n = 500_000;
    for (let i = 0; i < n; i++) {
      const x = r('combat', i);
      if (!(x >= 0 && x < 1)) outside++;
      else bins[Math.floor(x * 20)]++;
      if (x < 1 / 5000) legendary++;
    }
    expect(outside).toBe(0);
    for (const b of bins) expect(Math.abs(b / (n / 20) - 1)).toBeLessThan(0.02);
    expect(Math.abs(legendary - 100)).toBeLessThan(32); // about three standard deviations
  });

  it('handles counters beyond 32 bits', () => {
    const r = seeded(1);
    expect(r('x', 2 ** 32)).not.toBe(r('x', 0));
  });
});
