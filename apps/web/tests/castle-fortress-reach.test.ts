// A fortress no roll can take (session 139): its row offered Assault for 30 AP beside "0% to win", a
// certain loss, as the strongholds did before session 75. The review sheets' castle a week in found it.
import { castleEngine as E } from '@idle-clash/features';
import { describe, expect, it } from 'vitest';
import { fortressOdds } from '../src/pages/castle/Fortress.tsx';

const T0 = Date.UTC(2026, 10, 18, 9);
const castle = (level: number, tier: number): E.Castle => {
  const c = E.newCastle('a', T0 - 5 * 86_400_000);
  const levels = Object.fromEntries(Object.keys(c.levels).map((k) => [k, level])) as E.Castle['levels'];
  return { ...c, levels, incursionTier: tier };
};

describe("the fortress's odds", () => {
  it('closes a fortress no roll can take', () => {
    const far = fortressOdds(castle(2, 12), T0);
    expect(far.chance).toBe(0);
    expect(far.beyond).toBe(true);
  });

  it('leaves one in reach open, its chance said', () => {
    const near = fortressOdds(castle(10, 3), T0);
    expect(near.chance).toBeGreaterThan(0);
    expect(near.beyond).toBe(false);
  });
});
