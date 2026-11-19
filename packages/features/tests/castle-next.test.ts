// "Next for your castle" (session 140, the castle review's fifth stage): the castle's nearest milestone, with
// how far off it is, so the game's longest stretch has a signpost. While a troop has an evolution ahead, the
// troop nearest to its next (by the gold to get there); then the relics, one at a time to their last level;
// then tempering, the worn relic with the best chance. Pure.
import { EVOLUTION_LEVELS, RELIC, RELICS, UNITS } from '@idle-clash/content';
import { describe, expect, it } from 'vitest';
import { levelCost, newCastle, nextForCastle, temperChance, type Castle } from '../src/shared/castle/index.ts';

const T0 = Date.UTC(2026, 10, 18, 9);
const at = (level: number, extra: Partial<Castle> = {}): Castle => {
  const c = newCastle('a', T0 - 30 * 86_400_000);
  const levels = Object.fromEntries(Object.keys(c.levels).map((k) => [k, level])) as Castle['levels'];
  return { ...c, levels, ...extra };
};

describe('next for your castle', () => {
  it('names the troop nearest its next evolution, with the levels and gold to get there', () => {
    const c = at(4);
    const next = nextForCastle({ ...c, levels: { ...c.levels, outriders: 5 } }, T0, 1e12);
    const outriders = UNITS.find((u) => u.id === 'outriders')!;
    expect(next).toEqual({
      kind: 'evolution',
      unit: 'outriders',
      evolution: outriders.evolutions[1],
      level: EVOLUTION_LEVELS[1],
      levels: 1,
      gold: levelCost(c, outriders.cost, 5, T0),
    });
  });

  it('turns to the relics once every troop has evolved a fourth time', () => {
    const next = nextForCastle(at(22, { relics: { [RELICS[0].id]: RELIC.LEVELS, [RELICS[1].id]: 2 } }), T0, 1e12);
    expect(next).toMatchObject({ kind: 'relic', relic: RELICS[1].id, level: 3 });
  });

  it('then to tempering, the worn relic with the best chance', () => {
    const relics = Object.fromEntries(RELICS.map((r) => [r.id, RELIC.LEVELS]));
    const worn = [RELICS[0].id, RELICS[1].id, RELICS[2].id];
    const tempers = { [RELICS[0].id]: 4, [RELICS[1].id]: 1 };
    const next = nextForCastle(at(30, { relics, equippedRelics: worn, tempers }), T0, 1e12);
    expect(next).toMatchObject({ kind: 'temper', relic: RELICS[2].id, temper: 1, chance: temperChance(0) });
  });

  it('puts a step to hand before one out of reach (session 144)', () => {
    // A week in: 1.4M gold and 26 war marks; the next evolution is millions away, a relic's first level
    // 250K and 25 war marks.
    const week = at(2, { warMarks: 26 });
    expect(nextForCastle(week, T0, 1_400_000)).toMatchObject({ kind: 'relic', relic: RELICS[0].id, level: 1 });
    // Too few war marks for the relic: the evolution, though out of reach, is the nearer.
    expect(nextForCastle({ ...week, warMarks: 10 }, T0, 1_400_000)).toMatchObject({ kind: 'evolution' });
  });

  it('keeps the evolution first when both are to hand', () => {
    expect(nextForCastle(at(4, { warMarks: 500 }), T0, 1e12)).toMatchObject({ kind: 'evolution' });
  });

  it("counts the treasury as the lord's gold when the castle pays from it", () => {
    // Both to hand from a full treasury: the evolution, as ever. From an empty one, with the purse full,
    // nothing is to hand, and the relic's 250K is the least still to find.
    const fromTreasury = at(4, { warMarks: 500, payFromTreasury: true, treasury: 1e12 });
    expect(nextForCastle(fromTreasury, T0, 0)).toMatchObject({ kind: 'evolution' });
    expect(nextForCastle({ ...fromTreasury, treasury: 0 }, T0, 1e12)).toMatchObject({ kind: 'relic' });
  });
});
