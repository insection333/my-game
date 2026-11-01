// Castle Clash's configuration holds the plan's numbers (docs/castle-clash/SPEC.md) and a whole set of
// content: every id unique, every reference to another id real, every split adding up.
import { describe, expect, it } from 'vitest';
import { bastionConfig as c } from '../src/castle/index.ts';

const unique = (ids: readonly string[]) => new Set(ids).size === ids.length;

describe("Castle Clash's configuration", () => {
  it("keeps the plan's own numbers for AP, the matrix, the guardrails and the sinks", () => {
    expect(c.AP).toMatchObject({
      BASE_AP_PER_HOUR: 10,
      BASE_ACTIVE_AP_CAP: 240,
      MAX_STREAK: 14,
      DAILY_CTA_INSTANT_BONUS_AP: 5,
      START_AP: 60,
    });
    expect(c.COMBAT.MATRIX).toEqual([
      [1.0, 1.35, 0.75],
      [0.75, 1.0, 1.35],
      [1.35, 0.75, 1.0],
    ]);
    expect([c.COMBAT.FLANK_THRESHOLD, c.COMBAT.FLANK_SLOPE, c.COMBAT.TRAP_PENALTY]).toEqual([0.6, 0.5, 0.2]);
    expect(c.COMBAT.PENETRATION_PER_SIEGE_SHARE).toBe(0.25);
    expect([c.ESPIONAGE.PAIR_SIEGES, c.ESPIONAGE.PAIR_SPIES, c.ESPIONAGE.COMPROMISED_MAX]).toEqual([2, 3, 3]);
    expect([c.SIEGE.GENUINE_MAX_RATIO, c.SIEGE.GENUINE_MIN_R, c.SIEGE.DECISIVE_FROM]).toEqual([1.35, 0.85, 1.25]);
    expect([c.SIEGE.OVEREXTENSION_RATIO, c.SIEGE.OVEREXTENSION_COST_EXP, c.SIEGE.OVEREXTENSION_REWARD_EXP]).toEqual([
      0.8, 2.5, 2,
    ]);
    expect([c.RECOVERY.WALL_FLOOR, c.RECOVERY.INFIRMARY_MAX, c.RECOVERY.PER_HOUR]).toEqual([50, 30, 5]);
    expect([c.SINKS.DRILL_MAX_PCT, c.SINKS.DRILL_SCALE, c.SINKS.EXCAVATION_MULT_SLOPE]).toEqual([50, 10_000, 0.02]);
    expect(c.ECONOMY.VAULT_MAX_PROTECT).toBe(0.75);
    expect(c.DECREE_WEEK_SECONDS).toBe(7 * 24 * 3600);
  });

  it('splits every burn and every raid into shares that add up to the whole', () => {
    expect(c.ECONOMY.BURN_DESTROYED + c.ECONOMY.BURN_TO_WAR_CHEST).toBeCloseTo(1, 12);
    expect(c.SIEGE.SPOILS_TO_ATTACKER + c.SIEGE.SPOILS_DESTROYED + c.SIEGE.SPOILS_TO_WAR_CHEST).toBeCloseTo(1, 12);
  });

  it('has three units with four evolutions at levels 1, 10, 25 and 50, and three passives each', () => {
    expect(c.UNITS.map((u) => u.id)).toEqual(['vanguard', 'outriders', 'siege']);
    expect(c.EVOLUTION_LEVELS).toEqual([1, 10, 25, 50]);
    for (const u of c.UNITS) {
      expect(u.evolutions).toHaveLength(4);
      expect(u.passives).toHaveLength(3);
    }
    expect(unique(c.UNITS.flatMap((u) => u.evolutions))).toBe(true);
  });

  it('has one trap against each unit, and every fortress keeps a real trap and a whole garrison', () => {
    expect(c.TRAPS.map((t) => t.against)).toEqual(['vanguard', 'outriders', 'siege']);
    expect(c.FORTRESSES).toHaveLength(6);
    for (const f of c.FORTRESSES) {
      expect(f.garrison.reduce((a, b) => a + b, 0)).toBe(100);
      expect(c.TRAPS.some((t) => t.id === f.trap)).toBe(true);
    }
  });

  it('has three castellans, five decrees, three edicts, four missions, four techs and nine relics, each id once', () => {
    expect(c.DOCTRINES).toHaveLength(3);
    expect(c.DECREES).toHaveLength(5);
    expect(c.EDICTS).toHaveLength(3);
    expect(c.SPY_MISSIONS.map((m) => m.id)).toEqual(['scout', 'poison', 'sabotage', 'forge']);
    expect(c.TECHS.map((t) => t.id)).toEqual([...c.TECH_IDS]);
    expect(c.RELICS).toHaveLength(9);
    expect(c.RELIC_SOCKETS).toBe(3);
    const ids = [
      ...c.DOCTRINES,
      ...c.DECREES,
      ...c.EDICTS,
      ...c.TRAPS,
      ...c.FORTRESSES,
      ...c.RELICS,
      ...c.BUILDINGS,
      ...c.UNITS,
    ].map((x) => x.id);
    expect(unique(ids)).toBe(true);
  });

  it('gives poison two stacks for 4 hours, and sabotage and forged orders one for 2', () => {
    const m = Object.fromEntries(c.SPY_MISSIONS.map((x) => [x.id, x.debuff]));
    expect(m.scout).toBeNull();
    expect(m.poison).toEqual({ lasts: 4 * 3_600_000, max: 2 });
    expect(m.sabotage).toEqual({ lasts: 2 * 3_600_000, max: 1 });
    expect(m.forge).toEqual({ lasts: 2 * 3_600_000, max: 1 });
    expect(c.FORGE_TARGET.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
  });
});
