// The spies at the day's foes on the page (session 167): their work on a foe is said on its row, a line a
// kind with when it lapses; and a fortress no roll takes as it stands, but one the spies' full work would
// bring within reach, says to send them rather than that the troops need levels.
import { castleEngine as E } from '@idle-clash/features';
import { describe, expect, it } from 'vitest';
import { opsLines, spiesWouldTake } from '../src/pages/castle/FoeSpies.tsx';

const T0 = Date.UTC(2026, 10, 22, 9);
const castle = (level: number, tier: number): E.Castle => {
  const c = E.newCastle('a', T0);
  const levels = Object.fromEntries(Object.keys(c.levels).map((k) => [k, level])) as E.Castle['levels'];
  return E.syncCastle({ ...c, levels, incursionTier: tier, activeAp: 200 }, T0).castle;
};

describe("the spies' work, said", () => {
  it('says each kind on the row with when it lapses, and nothing before', () => {
    const c = castle(1, 1);
    const key = E.fortressKey(1);
    expect(opsLines(c, key, T0)).toEqual([]);
    const poisoned = E.spyOnFoe(E.spyOnFoe(c, key, 1, 'poison', T0, 0).castle, key, 1, 'poison', T0, 0).castle;
    const lines = opsLines(E.spyOnFoe(poisoned, key, 1, 'sabotage', T0, 0).castle, key, T0);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/^Wells poisoned: their troops −16% until /);
    expect(lines[1]).toMatch(/^Gatehouse sabotaged: their trap fails until /);
  });

  it('points to the spies where their work would bring the fortress within reach', () => {
    // Find a tier the troops cannot take as it stands but could with the spies' full work.
    const c = castle(3, 1);
    const none = { poison: 0, sabotage: 0, forge: 0 };
    let tier = 1;
    while (E.winChance(E.bestOffense(c, E.fortressSide(tier, none), T0).r) > 0) tier++;
    expect(spiesWouldTake(c, (ops) => E.fortressSide(tier, ops), T0)).toBe(true);
    let far = tier;
    while (spiesWouldTake(c, (ops) => E.fortressSide(far, ops), T0)) far++;
    expect(far).toBeGreaterThan(tier);
  });
});
