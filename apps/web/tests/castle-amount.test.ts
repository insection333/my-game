// Gold typed as the game writes it (session 158). The treasury's box took only digits with spaces or commas,
// so "250K", the very way the page says an amount ("Withdraw 250K"), and "1.000.000", how much of the world
// groups thousands, were refused as "not whole gold".
import { describe, expect, it } from 'vitest';
import { goldTyped } from '../src/pages/castle/amount.ts';

describe('gold typed', () => {
  it('reads plain whole gold, grouped as people group it', () => {
    expect(goldTyped('250000')).toBe(250_000);
    expect(goldTyped('250,000')).toBe(250_000);
    expect(goldTyped(' 1 250 000 ')).toBe(1_250_000);
    expect(goldTyped('1.000.000')).toBe(1_000_000);
    expect(goldTyped("1'000'000")).toBe(1_000_000);
  });

  it('reads the short forms the game writes', () => {
    expect(goldTyped('250K')).toBe(250_000);
    expect(goldTyped('250k')).toBe(250_000);
    expect(goldTyped('1.2M')).toBe(1_200_000);
    expect(goldTyped('1,5M')).toBe(1_500_000);
    expect(goldTyped('2 b')).toBe(2_000_000_000);
  });

  it('refuses what is not whole gold', () => {
    for (const bad of [
      '',
      '1.5',
      '-5',
      'abc',
      '1.2345K',
      '12.34.56',
      '1e6',
      'K',
      '10KM',
      '9999999999999999',
      '1,5',
      '12,34',
      '1,000.000',
    ])
      expect(goldTyped(bad), bad).toBeNull();
  });
});
