// Wounds that hold a foe beyond reach (session 145). A new lord played their first day: two sieges lost
// wounded a fifth of their troops, and every stronghold then read "Beyond you for now: no roll takes it",
// though healing would bring each back within reach. Where wounds alone hold it beyond, the row says so.
import { castleEngine as E } from '@idle-clash/features';
import { describe, expect, it } from 'vitest';
import { heldByWounds } from '../src/pages/castle/targets.ts';

const T0 = Date.UTC(2026, 10, 19, 2);
const lord = (wounded: number, level = 1): E.Castle => {
  const c = E.newCastle('a', T0 - 3_600_000);
  const levels = Object.fromEntries(Object.keys(c.levels).map((k) => [k, level])) as E.Castle['levels'];
  return { ...c, levels, infirmaryPct: wounded };
};
const fortress = (tier: number) => E.fortressSide(tier);

describe('wounds that hold a foe beyond reach', () => {
  it('names the wounds when healing would bring the foe within reach', () => {
    // A castle and a tier the unwounded lord can take, beyond once they are 30% wounded.
    const pairs = [1, 2, 3, 4, 5, 6].flatMap((level) => [1, 2, 3, 4, 5, 6, 7, 8].map((tier) => ({ level, tier })));
    const edge = pairs.find(
      ({ level, tier }) =>
        E.winChance(E.bestOffense(lord(0, level), fortress(tier), T0).r) > 0 &&
        E.winChance(E.bestOffense(lord(30, level), fortress(tier), T0).r) === 0,
    )!;
    expect(edge).toBeDefined();
    expect(heldByWounds(lord(30, edge.level), fortress(edge.tier), T0)).toBe(true);
    expect(heldByWounds(lord(0, edge.level), fortress(edge.tier), T0)).toBe(false);
  });

  it('stays quiet when there are no wounds, or when healing would not be enough', () => {
    expect(heldByWounds(lord(0), fortress(1), T0)).toBe(false);
    expect(heldByWounds(lord(30), fortress(40), T0)).toBe(false);
  });
});
