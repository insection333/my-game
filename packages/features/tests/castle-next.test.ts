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
    const next = nextForCastle({ ...c, levels: { ...c.levels, outriders: 5 } }, T0);
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
    const next = nextForCastle(at(22, { relics: { [RELICS[0].id]: RELIC.LEVELS, [RELICS[1].id]: 2 } }), T0);
    expect(next).toMatchObject({ kind: 'relic', relic: RELICS[1].id, level: 3 });
  });

  it('then to tempering, the worn relic with the best chance', () => {
    const relics = Object.fromEntries(RELICS.map((r) => [r.id, RELIC.LEVELS]));
    const worn = [RELICS[0].id, RELICS[1].id, RELICS[2].id];
    const tempers = { [RELICS[0].id]: 4, [RELICS[1].id]: 1 };
    const next = nextForCastle(at(30, { relics, equippedRelics: worn, tempers }), T0);
    expect(next).toMatchObject({ kind: 'temper', relic: RELICS[2].id, temper: 1, chance: temperChance(0) });
  });
});
