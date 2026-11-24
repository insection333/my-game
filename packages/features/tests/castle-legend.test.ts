// The legendary siege (session 220): each season a named fortress of five chambers, taken in order and once a
// season; every lord meets the same garrisons and traps, its strength fixed from the lord's might at their
// first assault (0.9 of it to 1.11, a step a chamber), a chamber opening each week (session 222); each chamber
// pays war marks, the fifth takes it.
import { newState } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import {
  assaultLegend,
  chamberKey,
  chamberOf,
  chamberOpens,
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
  legendAwaits,
  mirrorFor,
  bestOffense,
  castleSide,
  chamberSide,
  defensePower,
  mightOf,
  noModifiers,
  type Castle,
} from '../src/shared/castle/index.ts';

const T0 = Date.UTC(2027, 0, 5, 9);
/** Late in season 2, its eight chambers open. */
const AT_END = Date.UTC(2027, 1, 20, 9);
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
    const held = [0, 7].map((n) => {
      const side = { ...chamberSide(chamberOf(strong(), 2, n, T0)), trap: null };
      return Math.round((defensePower(side, even) / might) * 100) / 100;
    });
    expect(held).toEqual([0.9, 1.11]);
    expect(chamberOf(strong(), 2, 7, T0).level).toBeGreaterThan(chamberOf(strong(), 2, 0, T0).level);
    // No two chambers of a season alike.
    const all = [0, 1, 2, 3, 4, 5, 6, 7].map((n) => chamberOf(strong(), 2, n, T0));
    expect(new Set(all.map((x) => `${x.garrison.join()}:${x.trap}`)).size).toBe(8);
  });

  it('opens a chamber a week, from the season’s first day, the last in its eighth week', () => {
    const opens = [0, 1, 2, 3, 4, 5, 6, 7].map((n) => chamberOpens(2, n));
    expect(new Date(opens[0]).toISOString().slice(0, 10)).toBe('2026-12-28');
    expect(opens.map((o) => (o - opens[0]) / 86_400_000)).toEqual([0, 7, 14, 21, 28, 35, 42, 49]);
    // Chamber one taken, the second waits for its week.
    const first = assaultLegend(strong(), 2, opens[0] + 3_600_000, 0.99);
    if (typeof first === 'string') throw new Error(first);
    expect(assaultLegend(first.castle, 2, opens[1] - 60_000, 0.99)).toBe('waiting');
    expect(nextChamber(first.castle, 2, opens[0])!.opens).toBe(opens[1]);
    expect(assaultLegend(first.castle, 2, opens[1], 0.99)).toMatchObject({ won: true, chamber: 1 });
  });

  it('takes its chambers in order for war marks, fixed at the first assault, and is taken once a season', () => {
    let c = strong();
    let marks = 0;
    for (let n = 0; n < LEGEND.CHAMBERS; n++) {
      const r = assaultLegend(c, 2, AT_END, 0.99);
      if (typeof r === 'string') throw new Error(r);
      expect(r).toMatchObject({ won: true, chamber: n, taken: n === 7 });
      marks += r.marks;
      // Grown in the season, the legend stays as it was set.
      const levels = Object.fromEntries(Object.keys(c.levels).map((k) => [k, 40 + 6 * (n + 1)])) as Castle['levels'];
      c = { ...r.castle, levels, rating: bastionRating({ ...r.castle, levels }), infirmaryPct: 0 };
      expect(legendNow(c, 2, T0).base).toBe(Math.round(mightOf(strong(), T0)));
    }
    expect(c.legends).toBe(1);
    expect(c.warMarks - strong().warMarks).toBe(marks);
    expect(assaultLegend(c, 2, AT_END, 0.99)).toBe('none');
    // The next season, a new legend from the rating then.
    expect(legendNow(c, 3, T0)).toEqual({ taken: 0, base: Math.round(mightOf(c, T0)) });
  });

  it("asks AP, wounds a lord it holds, and counts the spies' work on its chamber", () => {
    expect(assaultLegend({ ...strong(), activeAp: 10 }, 2, T0, 0.5)).toBe('ap');
    const weak = { ...strong(), levels: syncCastle(newCastle('w', T0), T0).castle.levels };
    const held = assaultLegend(weak, 2, T0, 0);
    if (typeof held === 'string') throw new Error(held);
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

  it("tells the Hearth of the week's chamber standing open, from the save's mirror (session 223)", () => {
    const at = (c: Castle, now: number) => {
      const state = newState(1, now);
      state.features.castle = mirrorFor(c, 0, now);
      return legendAwaits(state, now);
    };
    const day8 = chamberOpens(2, 1) + 86_400_000;
    expect(at({ ...strong(), legendSeason: 2, legendTaken: 1 }, day8)).toEqual({ season: 2, n: 1 });
    // Its second chamber taken, the third waits for its week.
    expect(at({ ...strong(), legendSeason: 2, legendTaken: 2 }, day8)).toBeNull();
    // A season of its own: the first chamber, whatever the last season left.
    expect(at({ ...strong(), legendSeason: 1, legendTaken: 8 }, day8)).toEqual({ season: 2, n: 0 });
    expect(at({ ...strong(), legendSeason: 2, legendTaken: 8 }, day8)).toBeNull();
    expect(at({ ...strong(), incursionTier: 9 }, day8)).toBeNull();
  });
});
