// Castle Clash's economy and sinks (SPEC.md sections 3 and 5, DESIGN.md 11): the plan's curves, the
// required treasury and its floor by total level, the edict at half the plan's strength, upkeep and its
// pause, the vault's 75% cap, the burn, the treasury's tax and lockdown, garrison changes, the rating that
// only rises, drilling, excavation, incursions in turn, the weekly decree and mercenaries that never pay
// more than they cost.
import { DECREES, FORTRESSES, ECONOMY } from '@idle-clash/content';
import { describe, expect, it } from 'vitest';
import {
  bastionRating,
  decreeIndex,
  deposit,
  drill,
  drillPct,
  edictBonusPct,
  excavate,
  fortressAt,
  idleMultiplier,
  launchIncursion,
  mercenaries,
  mercenaryBounty,
  morale,
  newCastle,
  protectedGold,
  requiredTreasury,
  setDefense,
  siegeCosts,
  splitBurn,
  statPower,
  syncCastle,
  syncUpkeep,
  upgrade,
  upgradeGoldCost,
  withdraw,
  type Castle,
} from '../src/shared/castle/index.ts';

const H = 3_600_000;
const DAY = 24 * H;
const T0 = (() => {
  let t = Date.UTC(2026, 10, 2);
  while (DECREES[decreeIndex(t)].id !== 'iron-ramparts') t += 7 * DAY;
  return t;
})();
const fresh = (extra: Partial<Castle> = {}): Castle => ({ ...newCastle('a', T0), ...extra });

describe('Castle Clash gold', () => {
  it("keeps the plan's curves: cost × 1.18 a level, power × level^1.05", () => {
    expect(upgradeGoldCost(1000, 10)).toBe(Math.round(1000 * 1.18 ** 10));
    expect(statPower(100, 1)).toBe(100);
    expect(statPower(100, 50)).toBeCloseTo(100 * 50 ** 1.05, 9);
  });

  it('asks a treasury by the castle and, at the least, by the lord (DESIGN.md 11.2)', () => {
    const c = fresh();
    expect(requiredTreasury(c, 0)).toBe(Math.round(100_000 * 1.12));
    expect(requiredTreasury(c, 500)).toBe(Math.round(100_000 * 1.12 ** (500 / 25)));
  });

  it('gives an edict 5% at the requirement, 10% at five times it, nothing under it, and unpaid morale', () => {
    const req = requiredTreasury(fresh(), 0);
    expect(edictBonusPct(fresh({ edict: 'vigor', treasury: req }), 0)).toBeCloseTo(5, 9);
    expect(edictBonusPct(fresh({ edict: 'vigor', treasury: 5 * req }), 0)).toBeCloseTo(10, 9);
    expect(edictBonusPct(fresh({ edict: 'vigor', treasury: 50 * req }), 0)).toBeCloseTo(10, 9);
    expect(edictBonusPct(fresh({ edict: 'vigor', treasury: req - 1 }), 0)).toBe(0);
    expect(edictBonusPct(fresh({ treasury: 5 * req }), 0)).toBe(0);
    expect(morale(fresh({ treasury: req - 1 }), 0)).toBe(0.8);
    expect(morale(fresh({ treasury: req }), 0)).toBe(1);
    // Excavation lifts the edict: depth 25 adds 10%.
    expect(edictBonusPct(fresh({ edict: 'vigor', treasury: req, excavationDepth: 25 }), 0)).toBeCloseTo(5.5, 9);
  });

  it('burns 2% a day of an edict treasury, and pauses 48 hours after the last call day began', () => {
    const c = fresh({ edict: 'harvest', treasury: 1_000_000, lastCtaDateUtc: new Date(T0).toISOString().slice(0, 10) });
    expect(syncUpkeep(c, T0 + DAY).castle.treasury).toBe(Math.floor(1_000_000 * 0.98));
    // Paused after two days, whatever the week: this one is Iron ramparts' (no upkeep effect).
    expect(syncUpkeep(c, T0 + 10 * DAY).castle.treasury).toBe(Math.floor(1_000_000 * 0.98 ** 2));
    // A treasury left through a week of Open coffers pays half upkeep for that week.
    const long = { ...c, lastCtaDateUtc: new Date(T0 + 30 * DAY).toISOString().slice(0, 10) };
    const WEEK = 7 * DAY;
    let expected = 1;
    for (let from = T0; from < T0 + 21 * DAY;) {
      const to = Math.min(T0 + 21 * DAY, (Math.floor(from / WEEK) + 1) * WEEK);
      expected *= (DECREES[decreeIndex(from)].id === 'open-coffers' ? 0.99 : 0.98) ** ((to - from) / DAY);
      from = to;
    }
    expect(syncUpkeep(long, T0 + 21 * DAY).castle.treasury).toBe(Math.floor(1_000_000 * expected));
    expect(expected).toBeGreaterThan(0.98 ** 21);
    expect(syncUpkeep({ ...c, edict: null }, T0 + 10 * DAY).burned).toBe(0);
  });

  it('protects at most 75% of the treasury', () => {
    const vault = { ...fresh().levels, deepVault: 100 };
    expect(protectedGold(fresh({ treasury: 1_000_000, levels: vault }), T0)).toBe(750_000);
    expect(protectedGold(fresh({ treasury: 1e12, levels: vault }), T0) / 1e12).toBeCloseTo(0.2 + 0.55 * (100 / 130), 4);
    expect(protectedGold(fresh({ treasury: 100 }), T0)).toBe(75);
  });

  it('burns 95% and puts 5% in the war chest', () => {
    expect(splitBurn(1001)).toEqual({ destroyed: 951, toChest: 50 });
  });

  it('taxes a withdrawal 20% and refuses it for 30 minutes after a scouting', () => {
    const w = { castle: fresh({ treasury: 1000 }), purse: 0 };
    expect(withdraw(w, 1000, T0)).toMatchObject({ ok: true, purse: 800, burned: 200 });
    expect(withdraw({ ...w, castle: { ...w.castle, withdrawLockdownUntil: T0 + 1 } }, 1000, T0)).toEqual({
      ok: false,
      reason: 'locked',
    });
    expect(deposit({ castle: fresh(), purse: 5 }, 10)).toEqual({ ok: false, reason: 'gold' });
  });

  it('charges 1% of the requirement for a garrison change, then rests 2 hours, and refuses one while scouted', () => {
    const w = { castle: fresh(), purse: 1e9 };
    const one = setDefense(w, { defense: [60, 20, 20] }, 0, T0);
    expect(one).toMatchObject({ ok: true, burned: Math.round(requiredTreasury(w.castle, 0) * 0.01) });
    if (!one.ok) throw new Error();
    expect(setDefense(one, { trap: 'boiling-pitch' }, 0, T0 + H)).toEqual({ ok: false, reason: 'cooling' });
    expect(setDefense(one, { trap: 'boiling-pitch' }, 0, T0 + 2 * H).ok).toBe(true);
    const scouted = { ...w, castle: { ...w.castle, reconLockdownUntil: T0 + 60_000 } };
    expect(setDefense(scouted, { trap: 'boiling-pitch' }, 0, T0)).toEqual({ ok: false, reason: 'locked' });
    expect(setDefense(w, { defense: [50, 50, 1] }, 0, T0)).toEqual({ ok: false, reason: 'invalid' });
  });
});

describe('Castle Clash rating and sinks', () => {
  it('raises the rating with military levels and never with the vault or excavation', () => {
    const c = fresh();
    const r0 = bastionRating(c);
    const up = upgrade({ castle: c, purse: 1e12 }, 'walls', T0);
    if (!up.ok) throw new Error();
    expect(bastionRating(up.castle)).toBeGreaterThan(r0);
    const vault = upgrade({ castle: c, purse: 1e12 }, 'deepVault', T0);
    if (!vault.ok) throw new Error();
    expect(bastionRating(vault.castle)).toBe(r0);
    expect(bastionRating({ ...c, excavationDepth: 40 })).toBe(r0);
    expect(upgrade({ castle: { ...c, levels: { ...c.levels, walls: 100 } }, purse: 1e15 }, 'walls', T0)).toEqual({
      ok: false,
      reason: 'top',
    });
  });

  it('drills towards 50%: 50 × (1 − e^(−xp ÷ 10,000)), 10 AP for 250 XP', () => {
    expect(drillPct(0)).toBe(0);
    expect(drillPct(10_000)).toBeCloseTo(50 * (1 - Math.exp(-1)), 12);
    const d = drill({ castle: fresh({ activeAp: 30 }), purse: 0 }, 'siege', 3);
    expect(d).toMatchObject({ ok: true });
    if (d.ok) expect([d.castle.activeAp, d.castle.drillXp.siege]).toEqual([0, 750]);
  });

  it('digs deeper for AP and gold, lifting the idle multiplier 1 + 0.02 × √depth', () => {
    const e = excavate({ castle: fresh({ activeAp: 60 }), purse: 1e9 }, T0);
    expect(e).toMatchObject({ ok: true, burned: 200_000 });
    expect(idleMultiplier(fresh({ excavationDepth: 100 }))).toBeCloseTo(1.2, 12);
  });

  it('meets the six fortresses in turn and climbs a tier on a win', () => {
    expect([1, 6, 7, 13].map((t) => fortressAt(t).id)).toEqual([
      FORTRESSES[0].id,
      FORTRESSES[5].id,
      FORTRESSES[0].id,
      FORTRESSES[0].id,
    ]);
    const strong = syncCastle(
      fresh({ activeAp: 60, levels: { ...fresh().levels, vanguard: 10, outriders: 10, siege: 10 } }),
      T0,
    ).castle;
    const won = launchIncursion(strong, T0, 0.5);
    if (won === 'ap') throw new Error();
    expect(won.won).toBe(true);
    expect(won.castle.incursionTier).toBe(2);
    expect(won.marks).toBeGreaterThan(0);
    expect(launchIncursion(fresh({ activeAp: 5 }), T0, 0.5)).toBe('ap');
  });

  it('turns the decree each week, five in turn', () => {
    const seen = Array.from({ length: 5 }, (_, i) => DECREES[decreeIndex(T0 + i * 7 * DAY)].id);
    expect(new Set(seen).size).toBe(5);
    expect(decreeIndex(T0 + 5 * 7 * DAY)).toBe(decreeIndex(T0));
  });

  it('draws the same mercenaries all day, new ones the next, and never pays a bounty above the fee', () => {
    const c = syncCastle(fresh({ levels: { ...fresh().levels, vanguard: 20 } }), T0).castle;
    expect(mercenaries(c, T0 + H, 5)).toEqual(mercenaries(c, T0 + 20 * H, 5));
    expect(mercenaries(c, T0 + 25 * H, 5)).not.toEqual(mercenaries(c, T0 + H, 5));
    expect(mercenaryBounty(c.rating, 1e15)).toBeLessThan(siegeCosts(c, 1, T0).gold);
    expect(mercenaryBounty(c.rating, 1000)).toBe(50);
    expect(mercenaryBounty(c.rating, 0)).toBe(0);
  });

  it('keeps the vault cap and edict figures in the configuration', () => {
    expect([ECONOMY.VAULT_MAX_PROTECT, ECONOMY.EDICT_BASE_PCT]).toEqual([0.75, 5]);
  });
});
