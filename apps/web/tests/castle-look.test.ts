// Castle Clash's look (session 41): the banner draws the castle as it stands (look.ts, CastleScene),
// every lord and stronghold bears arms of its own that keep the heralds' rule, and every building,
// study, edict, troop at each evolution and war relic the page shows has its drawing.
import { EDICTS, RELICS, TECH_IDS, UNITS } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { describe, expect, it } from 'vitest';
import { buildAt } from '../../../packages/ui/src/art/castle-parts.tsx';
import { storeysAt, towersAt } from '../../../packages/ui/src/art/CastleScene.tsx';
import { armsOf } from '../../../packages/ui/src/icons/heraldry.tsx';
import { hasIcon } from '../../../packages/ui/src/icons/index.tsx';
import { M } from '../../../packages/ui/src/icons/style.tsx';
import { BESIEGED_MS, lookOf } from '../src/pages/castle/look.ts';

const NOW = Date.UTC(2026, 10, 3, 12);
const HOUR = 3_600_000;
const castle = (over: Partial<E.Castle> = {}): E.Castle => ({ ...E.newCastle('lord', NOW - 30 * 24 * HOUR), ...over });
const report = (kind: string, at: number): E.CastleReport => ({ id: at, at, kind, data: {}, foeName: 'Keeper' });

describe("the castle's banner", () => {
  it('draws the walls, keep and towers from their levels, and the walls as they stand', () => {
    const c = castle({ levels: { ...castle().levels, walls: 32, watchtower: 51 }, wallIntegrity: 64 });
    const look = lookOf(c, 500, [], NOW);
    expect(look.walls).toBe(32);
    expect(look.towers).toBe(51);
    expect(look.keep).toBe(E.avgLevel(c));
    expect(look.integrity).toBe(64);
  });

  it('flies the edict only while the treasury pays for it', () => {
    const chosen = castle({ edict: 'vigor', treasury: 0 });
    expect(lookOf(chosen, 500, [], NOW).banner).toBeNull();
    const paid = { ...chosen, treasury: E.requiredTreasury(chosen, 500) * 2 };
    expect(lookOf(paid, 500, [], NOW).banner).toBe('vigor');
    expect(lookOf({ ...paid, edict: null }, 500, [], NOW).banner).toBeNull();
  });

  it('burns for six hours after a siege on the castle, and not for its own sieges', () => {
    expect(lookOf(castle(), 500, [report('siegeIn', NOW - 2 * HOUR)], NOW).besieged).toBe(true);
    expect(lookOf(castle(), 500, [report('siegeIn', NOW - BESIEGED_MS)], NOW).besieged).toBe(false);
    expect(lookOf(castle(), 500, [report('siegeOut', NOW - HOUR)], NOW).besieged).toBe(false);
  });

  it('raises the walls in five materials, the keep in four storeys and the towers in three steps', () => {
    expect(
      [0, 4, 5, 14, 15, 29, 30, 59, 60, 100].map((w) => [buildAt(w).timber, buildAt(w).wall, buildAt(w).cap]),
    ).toEqual([
      [true, M.oak, null],
      [true, M.oak, null],
      [false, M.stone, null],
      [false, M.stone, null],
      [false, buildAt(15).wall, null],
      [false, buildAt(15).wall, null],
      [false, buildAt(15).wall, M.iron],
      [false, buildAt(15).wall, M.iron],
      [false, buildAt(60).wall, M.dawnsteel],
      [false, buildAt(60).wall, M.dawnsteel],
    ]);
    expect(new Set([0, 5, 15, 30, 60].map((w) => buildAt(w).wall)).size).toBe(4);
    expect([1, 4.9, 5, 15, 30, 99].map(storeysAt)).toEqual([1, 1, 2, 3, 4, 4]);
    expect([1, 5, 15, 30, 100].map((w) => towersAt(w).length)).toEqual([0, 2, 3, 4, 4]);
  });
});

describe('arms', () => {
  const seeds = Array.from({ length: 600 }, (_, i) => `lord-${i}`);

  it('are the same for the same bearer every time', () => {
    expect(armsOf('keeper')).toEqual(armsOf('keeper'));
  });

  it("keep the heralds' rule: the division and the charge are the two metals, never the same", () => {
    for (const s of seeds) {
      const a = armsOf(s);
      expect(a.metal).not.toBe(a.charge);
      expect([a.metal, a.charge]).toContain(M.amber);
      expect([M.banner, M.sapphire, M.leaf, M.amethyst, M.coal]).toContain(a.colour);
    }
  });

  it('come in every colour, division and charge across a realm of lords', () => {
    const arms = seeds.map(armsOf);
    expect(new Set(arms.map((a) => a.colour)).size).toBe(5);
    expect(new Set(arms.map((a) => a.division)).size).toBe(7);
    expect(new Set(arms.map((a) => a.figure)).size).toBe(6);
    // Few lords share their arms: at most one in five of a realm this size.
    const keys = new Set(arms.map((a) => `${a.colour.base}${a.metal.base}${a.division}${a.figure}`));
    expect(keys.size).toBeGreaterThan(seeds.length * 0.2);
  });
});

describe("the castle's drawings", () => {
  it('cover every troop at each evolution, every war relic, edict, study and building', () => {
    const names = [
      ...UNITS.flatMap((u) => u.evolutions),
      ...RELICS.map((r) => r.id),
      ...EDICTS.map((e) => `edict-${e.id}`),
      ...TECH_IDS.map((x) => `tech-${x}`),
      'castle-walls',
      'castle-deep-vault',
      'castle-watchtower',
      'castle-spy-guild',
      'crest',
    ];
    expect(names.filter((n) => !hasIcon(n))).toEqual([]);
  });
});
