// Session 248: the edict grows with the castle. A castle raised for a year gave back the same edict as one a
// month old (+6.6% XP on day 30, +6.9% on day 365); every edict is now lifted 2% for each average level above
// the first, to half again at most, so a castle raised high gives more back to the rest of the game.
import { ECONOMY } from '@idle-clash/content';
import { describe, expect, it } from 'vitest';
import {
  avgLevel,
  edictBonusPct,
  edictGrowth,
  newCastle,
  requiredTreasury,
  type Castle,
} from '../src/shared/castle/index.ts';

const T0 = Date.UTC(2026, 10, 26);
const at = (level: number, extra: Partial<Castle> = {}): Castle => {
  const c = newCastle('lord', T0);
  const levels = Object.fromEntries(Object.keys(c.levels).map((k) => [k, level])) as Castle['levels'];
  return { ...c, levels, ...extra };
};

describe('the edict and the castle', () => {
  it('grows 2% a level above the first, to half again', () => {
    expect(edictGrowth(at(1))).toBe(1);
    expect(edictGrowth(at(22))).toBeCloseTo(1.42, 9);
    expect(edictGrowth(at(60))).toBe(ECONOMY.EDICT_LEVEL_MAX);
    expect(avgLevel(at(22))).toBe(22);
  });

  it('lifts the edict paid for by as much', () => {
    const c = at(22, { edict: 'vigor' });
    const req = requiredTreasury(c, 0);
    expect(edictBonusPct({ ...c, treasury: req }, 0)).toBeCloseTo(ECONOMY.EDICT_BASE_PCT * 1.42, 9);
    expect(edictBonusPct({ ...c, treasury: req - 1 }, 0)).toBe(0);
  });
});
