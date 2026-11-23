// The legendary siege (session 220): each season a named fortress of five chambers, taken in order and once a
// season; every lord meets the same garrisons and traps, its strength fixed from the lord's might at their
// first assault (0.9 of it to 1.16, a step a chamber); each chamber pays war marks, the fifth takes it.
import { describe, expect, it } from 'vitest';
import {
  assaultLegend,
  chamberKey,
  chamberOf,
  foeOps,
  LEGEND,
  legendNow,
  legendOf,
  newCastle,
  nextChamber,
  spyOnFoe,
  syncCastle,
  winChance,
  bastionRating,
  bestOffense,
  castleSide,
  chamberSide,
  defensePower,
  mightOf,
  noModifiers,
  type Castle,
} from '../src/shared/castle/index.ts';

const T0 = Date.UTC(2027, 0, 5, 9);
/** A castle at fortress tier 12, its troops grown far past it, with AP to spend. */
const strong = (): Castle => {
  const c = syncCastle(newCastle('a', T0), T0).castle;
  const levels = Object.fromEntries(Object.keys(c.levels).map((k) => [k, 40])) as Castle['levels'];
  const grown = { ...c, levels, incursionTier: 12, activeAp: 1000 };
  return { ...grown, rating: bastionRating(grown) };
};

describe('the legendary siege', () => {
  it('opens at fortress tier 10, and sets the same garrisons for every lord in a season, others the next', () => {
    expect(nextChamber({ ...strong(), incursionTier: 9 }, 2, T0)).toBeNull();
    const a = chamberOf(strong(), 2, 0, T0);
    const b = chamberOf({ ...strong(), userId: 'b' }, 2, 0, T0);
    expect([a.garrison, a.trap]).toEqual([b.garrison, b.trap]);
    const season = [0, 1, 2, 3, 4].map((n) => chamberOf(strong(), 2, n, T0).garrison.join());
    expect(new Set(season).size).toBeGreaterThan(1);
    expect(legendOf(2)).not.toBe(legendOf(3));
    // Against an even attack (whose own effects aside), each chamber's defence is its share of the lord's might.
    const might = Math.round(mightOf(strong(), T0));
    const even = {
      ...castleSide(strong(), T0, 'attack'),
      shares: [1 / 3, 1 / 3, 1 / 3] as [number, number, number],
      mods: noModifiers(),
    };
    const held = [0, 4].map((n) => {
      const side = { ...chamberSide(chamberOf(strong(), 2, n, T0)), trap: null };
      return Math.round((defensePower(side, even) / might) * 100) / 100;
    });
    expect(held).toEqual([0.9, 1.16]);
    expect(chamberOf(strong(), 2, 4, T0).level).toBeGreaterThan(chamberOf(strong(), 2, 0, T0).level);
  });

  it('takes its chambers in order for war marks, fixed at the first assault, and is taken once a season', () => {
    let c = strong();
    let marks = 0;
    for (let n = 0; n < LEGEND.CHAMBERS; n++) {
      const r = assaultLegend(c, 2, T0, 0.99);
      if (r === 'ap' || r === 'none') throw new Error(String(r));
      expect(r).toMatchObject({ won: true, chamber: n, taken: n === 4 });
      marks += r.marks;
      // Grown in the season, the legend stays as it was set.
      const levels = Object.fromEntries(Object.keys(c.levels).map((k) => [k, 40 + 6 * (n + 1)])) as Castle['levels'];
      c = { ...r.castle, levels, rating: bastionRating({ ...r.castle, levels }), infirmaryPct: 0 };
      expect(legendNow(c, 2, T0).base).toBe(Math.round(mightOf(strong(), T0)));
    }
    expect(c.legends).toBe(1);
    expect(c.warMarks - strong().warMarks).toBe(marks);
    expect(assaultLegend(c, 2, T0, 0.99)).toBe('none');
    // The next season, a new legend from the rating then.
    expect(legendNow(c, 3, T0)).toEqual({ taken: 0, base: Math.round(mightOf(c, T0)) });
  });

  it("asks AP, wounds a lord it holds, and counts the spies' work on its chamber", () => {
    expect(assaultLegend({ ...strong(), activeAp: 10 }, 2, T0, 0.5)).toBe('ap');
    const weak = { ...strong(), levels: syncCastle(newCastle('w', T0), T0).castle.levels };
    const held = assaultLegend(weak, 2, T0, 0);
    if (held === 'ap' || held === 'none') throw new Error(String(held));
    expect(held.won).toBe(false);
    expect(held.castle.infirmaryPct).toBeGreaterThan(weak.infirmaryPct);
    const key = chamberKey(2, 0);
    const spied = spyOnFoe(strong(), key, chamberOf(strong(), 2, 0, T0).level, 'poison', T0, 0).castle;
    const ch = chamberOf(strong(), 2, 0, T0);
    const before = winChance(bestOffense(weak, chamberSide(ch), T0).r);
    const after = winChance(
      bestOffense({ ...spied, levels: weak.levels }, chamberSide(ch, foeOps(spied, key, T0)), T0).r,
    );
    expect(after).toBeGreaterThanOrEqual(before);
    expect(foeOps(spied, key, T0).poison).toBe(1);
  });
});
