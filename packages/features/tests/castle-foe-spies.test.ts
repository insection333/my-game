// Spies at the day's foes (session 167): the Spy Guild stood idle until lords opened, two weeks in, as
// spies went only against lords. A stronghold's or the fortress's wells may now be poisoned, its gatehouse
// sabotaged or its orders forged from the first day; the work is kept on the lord's own castle with that
// foe, lasts as on a lord, and counts in the battle and the odds alike.
import { describe, expect, it } from 'vitest';
import {
  combatRatio,
  castleSide,
  foeOps,
  foeSpyChance,
  foeSpyRefusal,
  fortressKey,
  fortressSide,
  launchIncursion,
  mercenaries,
  mercenarySide,
  newCastle,
  resolveMercenary,
  spyOnFoe,
  syncCastle,
  winChance,
  bestOffense,
  type Castle,
} from '../src/shared/castle/index.ts';

const T0 = Date.UTC(2026, 10, 22, 9);
const HOUR = 3_600_000;
const fresh = (): Castle => ({ ...syncCastle(newCastle('a', T0), T0).castle, activeAp: 200 });

describe('spies at the day’s foes', () => {
  it("weigh the Spy Guild against the foe's watch", () => {
    expect(foeSpyChance(fresh(), fortressKey(1), 1, T0)).toBeCloseTo(0.5 + 0.35 * Math.log(60 / 80), 5);
  });

  it('poison a stronghold’s wells, and the odds and the battle count it', () => {
    const c = fresh();
    const m = mercenaries(c, T0, 5)[2];
    const done = spyOnFoe(c, m.id, m.level, 'poison', T0, 0);
    expect(done.success).toBe(true);
    expect(foeOps(done.castle, m.id, T0).poison).toBe(1);
    expect(done.castle.activeAp).toBe(c.activeAp - 12);
    const before = winChance(bestOffense(c, mercenarySide(m), T0).r);
    const after = winChance(bestOffense(done.castle, mercenarySide(m, foeOps(done.castle, m.id, T0)), T0).r);
    expect(after).toBeGreaterThan(before);
    const plain = resolveMercenary(c, m, T0, 0.5, 0).r;
    expect(resolveMercenary(done.castle, m, T0, 0.5, 0).r).toBeGreaterThan(plain);
    // It lapses after four hours.
    expect(foeOps(done.castle, m.id, T0 + 4 * HOUR + 1).poison).toBe(0);
  });

  it('sabotage the fortress’s gatehouse and forge its orders; its assault counts both', () => {
    const c = fresh();
    const key = fortressKey(c.incursionTier);
    const sab = spyOnFoe(c, key, 1, 'sabotage', T0, 0).castle;
    const both = spyOnFoe(sab, key, 1, 'forge', T0, 0).castle;
    const side = fortressSide(1, foeOps(both, key, T0));
    expect(side.trap).toBeNull();
    expect(side.shares).not.toEqual(fortressSide(1).shares);
    const r = (x: Castle) => (launchIncursion(x, T0, 0.5) as { r: number }).r;
    expect(r(both)).toBeGreaterThan(r(c));
    expect(combatRatio(castleSide(both, T0, 'attack'), side, 0.5).r).toBeCloseTo(r(both), 9);
  });

  it('refuse scouting, a third poison and a fourth mission in a day', () => {
    let c = fresh();
    const key = fortressKey(1);
    expect(foeSpyRefusal(c, key, 'scout', T0)).toBe('unknown');
    c = spyOnFoe(c, key, 1, 'poison', T0, 0).castle;
    c = spyOnFoe(c, key, 1, 'poison', T0, 0).castle;
    expect(foeSpyRefusal(c, key, 'poison', T0)).toBe('full');
    c = spyOnFoe(c, key, 1, 'forge', T0, 0).castle;
    expect(foeSpyRefusal(c, key, 'sabotage', T0)).toBe('spyLimit');
  });

  it('leave nothing on the foe when an agent is caught, and the network compromised', () => {
    const c = fresh();
    const key = fortressKey(1);
    const caught = spyOnFoe(c, key, 1, 'poison', T0, 0.99);
    expect(caught.success).toBe(false);
    expect(foeOps(caught.castle, key, T0).poison).toBe(0);
    expect(foeSpyChance(caught.castle, key, 1, T0)).toBeLessThan(foeSpyChance(c, key, 1, T0));
  });
});
