// Castle Clash's planning: the chance to win matches the battle's own rolls, and the counter-formation is
// never worse than the formation held, and is better against a lopsided garrison.
import { describe, expect, it } from 'vitest';
import {
  bastionRating,
  bestOffense,
  castleSide,
  combatRatio,
  estimatedDefence,
  newCastle,
  oddsWith,
  winChance,
  type Castle,
} from '../src/shared/castle/index.ts';

const T0 = Date.UTC(2026, 10, 9);
function at(level: number, id = 'a'): Castle {
  const c = newCastle(id, T0 - 30 * 86_400_000);
  const levels = Object.fromEntries(Object.keys(c.levels).map((k) => [k, level])) as Castle['levels'];
  const raised = { ...c, levels, shieldUntil: 0, treasury: 1e12 };
  return { ...raised, rating: bastionRating(raised) };
}

describe('Castle Clash planning', () => {
  it('gives the chance to win that the battle rolls give', () => {
    const att = at(20);
    for (const scale of [0.8, 0.95, 1, 1.1, 1.3]) {
      const def = { ...at(Math.round(20 * scale), 'b'), defense: [60, 20, 20] as const };
      const a = castleSide(att, T0, 'attack');
      const d = castleSide(def, T0, 'defense', { totalLevel: 0 });
      const r = combatRatio(a, d, 0.5).r;
      let wins = 0;
      for (let i = 0; i < 1000; i++) if (combatRatio(a, d, (i + 0.5) / 1000).r >= 1) wins++;
      expect(winChance(r)).toBeCloseTo(wins / 1000, 2);
    }
  });

  it('finds a counter-formation never worse than the one held, and better against a lopsided garrison', () => {
    const c = { ...at(20), offense: [34, 33, 33] as const } as unknown as Castle;
    const def = castleSide({ ...at(20, 'b'), defense: [70, 15, 15] } as unknown as Castle, T0, 'defense');
    const held = oddsWith(c, c.offense, def, T0);
    const best = bestOffense(c, def, T0);
    expect(best.r).toBeGreaterThan(held * 1.03);
    expect(best.shares.reduce((a, b) => a + b, 0)).toBe(100);
    expect(oddsWith(c, best.shares, def, T0)).toBeCloseTo(best.r, 6);
  });

  it('estimates a scouted lord of the same rating as about as strong as yourself', () => {
    const c = at(20);
    const seen = { defense: [34, 33, 33], trap: null, castellan: null };
    const est = estimatedDefence(c, seen, c.rating, T0);
    const self = castleSide({ ...c, userId: 'b' }, T0, 'defense', { totalLevel: 0 });
    expect(est.base[0]).toBeCloseTo(self.base[0], 6);
    const half = estimatedDefence(c, seen, c.rating / 2, T0);
    expect(half.base[0]).toBeCloseTo(self.base[0] / 2, 6);
  });
});
