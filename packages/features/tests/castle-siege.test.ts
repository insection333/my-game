// Castle Clash's battle and sieges (SPEC.md sections 4C and 4E, DESIGN.md 11): the matrix, the flank
// penalty, traps and penetration; spoils and their burn; overextension and fatigue; genuine sieges,
// vigilance and the truce; and the amendments that keep alts from moving gold or clearing sabotage.
import { DECREES } from '@idle-clash/content';
import { describe, expect, it } from 'vitest';
import {
  attackPower,
  castleSide,
  decreeIndex,
  flankMult,
  launch,
  lootFactor,
  newCastle,
  overextensionReward,
  requiredTreasury,
  resolveSiege,
  siegeCosts,
  siegeRefusal,
  splitSpoils,
  syncCastle,
  tacMult,
  wallBonus,
  type Castle,
} from '../src/shared/castle/index.ts';

const H = 3_600_000;
// A week whose decree changes nothing in battle (Open coffers: half upkeep), so numbers here are pure.
const T0 = (() => {
  const week = 604_800_000;
  let t = Date.UTC(2026, 10, 2);
  while (DECREES[decreeIndex(t)].id !== 'open-coffers') t += week;
  return t;
})();

/** A castle past its shield, every level `level`, synced so its rating is set. */
const lord = (id: string, level: number, extra: Partial<Castle> = {}): Castle => {
  const base = newCastle(id, T0 - 72 * H);
  const levels = Object.fromEntries(Object.keys(base.levels).map((k) => [k, level])) as Castle['levels'];
  return syncCastle({ ...base, levels, activeAp: 240, ...extra }, T0).castle;
};
const LEVELS = { attacker: 300, defender: 300 };

describe('Castle Clash battle', () => {
  it('penalises a share past 60%: 1 − 0.5 × (p − 0.6)', () => {
    expect(flankMult(0.6)).toBe(1);
    expect(flankMult(0.7)).toBeCloseTo(0.95, 12);
    expect(flankMult(1)).toBeCloseTo(0.8, 12);
  });

  it('reads the matrix: vanguard beats outriders, outriders beat siege, siege beats vanguard', () => {
    expect(tacMult(0, [0, 1, 0])).toBe(1.35);
    expect(tacMult(1, [0, 0, 1])).toBe(1.35);
    expect(tacMult(2, [1, 0, 0])).toBe(1.35);
    expect(tacMult(0, [0, 0, 1])).toBe(0.75);
    expect(tacMult(0, [1 / 3, 1 / 3, 1 / 3])).toBeCloseTo((1 + 1.35 + 0.75) / 3, 12);
  });

  it('takes 20% off the trapped unit, and lets siege bypass a quarter of the walls per share', () => {
    const att = castleSide(lord('a', 10, { offense: [100, 0, 0] }), T0, 'attack');
    const open = castleSide(lord('d', 10), T0, 'defense');
    const trapped = { ...open, trap: 'boiling-pitch' };
    expect(attackPower(att, trapped) / attackPower(att, open)).toBeCloseTo(0.8, 12);
    expect(wallBonus(25, 100)).toBeCloseTo(0.125, 12);
    expect(wallBonus(25, 50)).toBeCloseTo(0.0625, 12);
  });

  it('gives a paid garrison a modest edge: equal castles meet within the genuine bound, short of a breach', () => {
    for (const level of [1, 10, 25, 50, 100]) {
      const { r } = resolveSiege(lord('a', level), lord('d', level, { treasury: 1e10 }), T0, 0.5, LEVELS);
      expect(r, `level ${level}`).toBeGreaterThanOrEqual(0.85);
      expect(r, `level ${level}`).toBeLessThan(1);
    }
  });

  it('loots nothing below R 1, 20% to 100% across a grazing breach, all of it from R 1.25', () => {
    expect(lootFactor(0.99)).toBe(0);
    expect(lootFactor(1)).toBeCloseTo(0.2, 12);
    expect(lootFactor(1.125)).toBeCloseTo(0.6, 12);
    expect(lootFactor(1.25)).toBe(1);
    expect(lootFactor(3)).toBe(1);
  });
});

describe('Castle Clash sieges', () => {
  it('splits raided gold: the defender loses all of it, the attacker gets 65%, 30% destroyed, 5% to the chest', () => {
    const s = splitSpoils(1_000_001);
    expect(s.toAttacker + s.destroyed + s.toChest).toBe(1_000_001);
    expect(s.toAttacker).toBe(650_000);
    expect(s.toChest).toBe(50_000);
  });

  it('raids a weaker treasury on a breach, and never more than twice the defender required treasury', () => {
    const att = lord('a', 30);
    const def = lord('d', 25, { treasury: 900_000_000 });
    const r = resolveSiege(launch(att, 'd', 20, T0), def, T0, 0.5, LEVELS);
    expect(r.outcome).not.toBe('repelled');
    const cap = 2 * requiredTreasury(def, LEVELS.defender);
    expect(r.spoils.raided).toBeLessThanOrEqual(cap);
    expect(r.defender.treasury).toBe(def.treasury - r.spoils.raided);
    expect(r.attackerMarks).toBeGreaterThan(0);
    expect(r.defender.wallIntegrity).toBeLessThan(100);
  });

  it('pays a repelled siege nothing and the defender war marks', () => {
    const att = lord('a', 5);
    const def = lord('d', 6, { treasury: 10_000_000 });
    const r = resolveSiege(launch(att, 'd', 20, T0), def, T0, 0, LEVELS);
    expect(r.outcome).toBe('repelled');
    expect(r.spoils.raided).toBe(0);
    expect(r.defenderMarks).toBe(4);
    expect(r.defender.treasury).toBe(10_000_000);
  });

  it('charges more and pays less against a far weaker castle, and more after three sieges a day', () => {
    const att = lord('a', 20);
    expect(siegeCosts(att, 0.4, T0).gold / siegeCosts(att, 1, T0).gold).toBeCloseTo(2 ** 2.5, 2);
    expect(overextensionReward(0.4)).toBeCloseTo(0.25, 12);
    let busy = att;
    for (const d of ['x', 'y', 'z']) busy = launch(busy, d, 20, T0);
    const fourth = siegeCosts(busy, 1, T0);
    expect(fourth.ap).toBeCloseTo(20 * 1.2, 12);
    expect(fourth.gold).toBe(Math.round(siegeCosts(att, 1, T0).gold * 1.35));
  });

  it('refuses a third siege on one castle within 24 hours, a shielded castle, and itself', () => {
    let att = lord('a', 20);
    att = launch(launch(att, 'd', 20, T0), 'd', 20, T0 + H);
    expect(siegeRefusal(att, 'd', false, 20, T0 + 2 * H)).toBe('pairLimit');
    expect(siegeRefusal(att, 'e', false, 20, T0 + 2 * H)).toBeNull();
    expect(siegeRefusal(att, 'd', false, 20, T0 + 25 * H)).toBeNull();
    expect(siegeRefusal(att, 'e', true, 20, T0)).toBe('shielded');
    expect(siegeRefusal(att, 'a', false, 20, T0)).toBe('self');
  });

  it('ends the attacker own shield when it launches a siege', () => {
    const att = { ...lord('a', 20), shieldUntil: T0 + 10 * H };
    expect(launch(att, 'd', 20, T0).shieldUntil).toBe(T0);
  });

  it('counts a genuine siege only within the rating bound and from R 0.85: vigilance, then a truce on the third', () => {
    const att = lord('a', 20);
    let def = lord('d', 20);
    for (let i = 0; i < 2; i++) {
      const r = resolveSiege(launch(att, 'd', 20, T0 + i * H), def, T0 + i * H, 0.5, LEVELS);
      expect(r.genuine).toBe(true);
      def = r.defender;
    }
    expect(def.genuineReceived).toHaveLength(2);
    const third = resolveSiege(att, def, T0 + 2 * H, 0.5, LEVELS);
    expect(third.truce).toBe(true);
    expect(third.defender.shieldUntil).toBe(T0 + 8 * H);
    expect(third.defender.genuineReceived).toEqual([]);
    // A far stronger defender (an alt's target is its main): never genuine, whatever R.
    const weak = lord('w', 5);
    const strong = lord('s', 20);
    expect(resolveSiege(weak, strong, T0, 1, LEVELS).genuine).toBe(false);
  });

  it('lets sabotage bite and be consumed only in a fair siege; a weak alt can neither use nor clear it', () => {
    const poisoned = (c: Castle): Castle => ({ ...c, debuffs: [{ kind: 'poison', stacks: 2, until: T0 + 4 * H }] });
    const def = poisoned(lord('d', 20));
    const fair = resolveSiege(lord('a', 20), def, T0, 0.5, LEVELS);
    expect(fair.genuine).toBe(true);
    expect(fair.consumed).toEqual(['poison']);
    expect(fair.defender.debuffs).toEqual([]);
    expect(fair.defender.immunities.poison).toBe(T0 + 4 * H);
    // The same castle against a far weaker alt: the poison does not weaken it, and stays, with no immunity.
    const alt = resolveSiege(lord('w', 4), def, T0, 0.5, LEVELS);
    const clean = resolveSiege(lord('w', 4), lord('d', 20), T0, 0.5, LEVELS);
    expect(alt.defensePower).toBeCloseTo(clean.defensePower, 9);
    expect(alt.consumed).toEqual([]);
    expect(alt.defender.debuffs).toHaveLength(1);
    expect(alt.defender.immunities.poison).toBeUndefined();
  });
});
