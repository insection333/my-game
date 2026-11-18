// Healing and repairing by as much as the lord chooses (session 134, the owner): a slider picks how much,
// and the cost follows. Whatever is chosen, odd amounts and all, the sums hold: a part never costs less
// than its share of the whole, no split of a heal is cheaper than one heal, nothing heals past whole or
// below nothing, and a bad amount is refused.
import { ECONOMY } from '@idle-clash/content';
import { describe, expect, it } from 'vitest';
import { instantCost, mendNow, newCastle, type Castle } from '../src/shared/castle/index.ts';

const T0 = Date.UTC(2026, 10, 18, 9);
const castle = (over: Partial<Castle>): Castle => ({
  ...newCastle('a', T0),
  levels: { walls: 13, deepVault: 7, watchtower: 9, spyGuild: 11, vanguard: 17, outriders: 5, siege: 3 },
  activeAp: 1_000,
  ...over,
});
const PURSE = 1e12;

describe('a heal of part of the wounds', () => {
  it('heals what is chosen and charges for that much', () => {
    const c = castle({ infirmaryPct: 13.7 });
    const r = mendNow({ castle: c, purse: PURSE }, 'wounds', T0, 7);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.castle.infirmaryPct).toBeCloseTo(6.7);
    expect(PURSE - r.purse).toBe(instantCost(c, 7, T0).gold);
    expect(Number.isInteger(PURSE - r.purse)).toBe(true);
  });

  it('heals no more than there is, and charges for no more', () => {
    const c = castle({ infirmaryPct: 13.7 });
    const r = mendNow({ castle: c, purse: PURSE }, 'wounds', T0, 14);
    expect(r.ok && r.castle.infirmaryPct).toBe(0);
    expect(r.ok && PURSE - r.purse).toBe(instantCost(c, 13.7, T0).gold);
  });

  it('repairs walls by the part chosen, never past whole', () => {
    const c = castle({ wallIntegrity: 81 });
    const part = mendNow({ castle: c, purse: PURSE }, 'walls', T0, 5);
    expect(part.ok && part.castle.wallIntegrity).toBe(86);
    const all = mendNow({ castle: c, purse: PURSE }, 'walls', T0, 100);
    expect(all.ok && all.castle.wallIntegrity).toBe(100);
  });

  it('is never cheaper split than taken at once, in gold or AP', () => {
    for (const wounds of [3, 7.5, 13.7, 29, 30]) {
      const c = castle({ infirmaryPct: wounds });
      const once = mendNow({ castle: c, purse: PURSE }, 'wounds', T0);
      for (const step of [1, 2, 3, 5, 7]) {
        let w = { castle: c, purse: PURSE };
        while (w.castle.infirmaryPct > 0.01) {
          const r = mendNow(w, 'wounds', T0, step);
          expect(r.ok).toBe(true);
          if (!r.ok) break;
          w = { castle: r.castle, purse: r.purse };
        }
        expect(once.ok).toBe(true);
        if (!once.ok) continue;
        expect(PURSE - w.purse).toBeGreaterThanOrEqual(PURSE - once.purse);
        expect(c.activeAp - w.castle.activeAp).toBeGreaterThanOrEqual(c.activeAp - once.castle.activeAp);
        expect(w.castle.infirmaryPct).toBe(0);
      }
    }
  });

  it('charges a whole coin at least for any heal, however small', () => {
    expect(instantCost(castle({}), 0.02, T0).gold).toBeGreaterThanOrEqual(1);
    expect(Number.isInteger(instantCost(castle({}), 0.333, T0).gold)).toBe(true);
  });

  it('refuses an amount that is not a whole percent from 1 to 100', () => {
    const w = { castle: castle({ infirmaryPct: 12 }), purse: PURSE };
    for (const bad of [0, -3, 1.5, 101, Number.NaN, Infinity])
      expect(mendNow(w, 'wounds', T0, bad)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('refuses to heal what is already whole', () => {
    expect(mendNow({ castle: castle({ infirmaryPct: 0 }), purse: PURSE }, 'wounds', T0, 5).ok).toBe(false);
    expect(mendNow({ castle: castle({ wallIntegrity: 100 }), purse: PURSE }, 'walls', T0, 5).ok).toBe(false);
  });

  it('stops short at what the lord can pay', () => {
    const c = castle({ infirmaryPct: 20 });
    const cost = instantCost(c, 20, T0).gold;
    expect(mendNow({ castle: c, purse: cost - 1 }, 'wounds', T0, 20)).toEqual({ ok: false, reason: 'gold' });
    expect(mendNow({ castle: { ...c, activeAp: 1 }, purse: PURSE }, 'wounds', T0, 5)).toEqual({
      ok: false,
      reason: 'ap',
    });
    void ECONOMY;
  });
});
