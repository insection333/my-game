// Supplies for all three styles: Fletching makes arrows 25 at a time, Runecraft draws runes eight at a
// time at stones its keys open (the key is kept), and a fighter uses the best supply their level allows,
// one a foe, dealing more damage for it; Your odds counts what the supplies are worth.
import { XP_TABLE } from '@idle-clash/content';
import { createEngine, newState, seeded, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { actionRegistry, combatData, FEATURES } from '../src/index.ts';
import { fight, odds } from '../src/shared/combat/fight.ts';
import { fighterOf } from '../src/shared/combat/state.ts';
import type { LoadoutView } from '../src/combat/slots.ts';

const loadoutOf = (s: State) =>
  FEATURES.find((f) => f.id === 'combat')!.slots['combat.loadout']({ state: s, now: T0 }) as unknown as LoadoutView;

const T0 = Date.UTC(2026, 9, 27, 10);
const engine = createEngine(actionRegistry(FEATURES, () => true));
const rng = seeded(14);
const at = (skills: Record<string, number>, items: Record<string, number>, weapon?: string): State => ({
  ...newState(14, T0),
  skills: Object.fromEntries(Object.entries(skills).map(([s, l]) => [s, { xp: XP_TABLE[l] }])),
  items,
  features: weapon ? { combat: { worn: { weapon }, health: null, healthAt: 0, retreated: null } } : {},
});
const start = (feature: string, id: string, lane: 'gathering' | 'artisan' | 'combat') =>
  ({ type: 'start', lane, action: { feature, id } }) as const;

describe('making supplies', () => {
  it('fletches 25 iron arrows from an iron bar and an oak log', () => {
    let s = engine.command(
      at({ fletching: 20 }, { 'iron-bar': 1, 'oak-logs': 1 }),
      T0,
      start('fletching', 'iron-arrows', 'artisan'),
      rng,
    ).state;
    s = engine.advance(s, T0 + 60_000, rng).state;
    expect(s.items['iron-arrows']).toBeGreaterThanOrEqual(25);
  });

  it('draws runes at a stone only with its key, and keeps the key', () => {
    const tide = start('runecraft', 'tide-stone', 'gathering');
    expect(engine.command(at({ runecraft: 20 }, {}), T0, tide, rng).result).toMatchObject({
      reason: { code: 'needsKey', detail: { item: 'iron-key' } },
    });
    let s = engine.command(at({ runecraft: 20 }, { 'iron-key': 1 }), T0, tide, rng).state;
    s = engine.advance(s, T0 + 25_000, rng).state;
    expect(s.items['tide-rune']).toBeGreaterThanOrEqual(8);
    expect(s.items['iron-key']).toBe(1);
  });

  it('smiths 25 whetstones from a bar, and binds a key from two', () => {
    let s = engine.command(
      at({ smithing: 20 }, { 'iron-bar': 3 }),
      T0,
      start('smithing', 'iron-whetstones', 'artisan'),
      rng,
    ).state;
    s = engine.advance(s, T0 + 21_000, rng).state;
    expect(s.items['iron-whetstones']).toBeGreaterThanOrEqual(25);
    s = engine.command(s, T0 + 21_000, start('smithing', 'iron-key', 'artisan'), rng).state;
    s = engine.advance(s, T0 + 70_000, rng).state;
    expect(s.items['iron-key']).toBe(1);
  });
});

describe('using supplies', () => {
  const foe = combatData.foeById('grave-wight')!;

  it("uses the best arrows the fighter's level allows", () => {
    const arrows = { 'copper-arrows': 50, 'iron-arrows': 50, 'steel-arrows': 50 };
    expect(fighterOf(at({ archery: 25 }, { 'iron-bow': 1, ...arrows }, 'iron-bow'), foe)?.supply).toEqual({
      item: 'iron-arrows',
      pct: 9,
    });
    expect(fighterOf(at({ archery: 25 }, { 'iron-bow': 1 }, 'iron-bow'), foe)?.supply).toBeNull();
  });

  it('shows the supply in the loadout, or which skill makes it', () => {
    expect(loadoutOf(at({ archery: 25 }, { 'iron-bow': 1, 'iron-arrows': 50 }, 'iron-bow')).supply).toMatchObject({
      item: 'iron-arrows',
      name: 'Iron arrows ×50',
      line: '+9% damage, one a foe',
    });
    expect(loadoutOf(at({ archery: 25 }, { 'iron-bow': 1 }, 'iron-bow')).supply).toMatchObject({
      item: null,
      name: 'No arrows',
      line: 'Fletching makes them',
      skill: 'fletching',
    });
    expect(loadoutOf(at({}, {})).supply).toBeNull();
  });

  it('deals more damage with a supply: the same fights end sooner', () => {
    const p = fighterOf(at({ archery: 25, hitpoints: 25 }, { 'iron-bow': 1 }, 'iron-bow'), foe)!;
    const time = (q: typeof p) => {
      let total = 0;
      for (let k = 0; k < 50; k++) {
        const r = seeded(k);
        let i = 0;
        total += fight(q, foe, () => r('f', i++), 1000, []).seconds;
      }
      return total;
    };
    expect(time({ ...p, supply: { item: 'iron-arrows', pct: 9 } })).toBeLessThan(time(p));
  });

  it('uses one supply for each foe fought', () => {
    let s = engine.command(
      at({ archery: 25, hitpoints: 25 }, { 'iron-bow': 1, 'iron-arrows': 40, 'hearty-stew': 50 }, 'iron-bow'),
      T0,
      start('combat', 'grave-wight', 'combat'),
      rng,
    ).state;
    s = engine.advance(s, T0 + 10 * 60_000, rng).state;
    const fought = 40 - (s.items['iron-arrows'] ?? 0);
    expect(fought).toBeGreaterThan(5);
    expect(fought).toBeLessThan(40);
  });

  it("counts the supplies used at what they would sell for in Your odds' gold", () => {
    const p = fighterOf(at({ archery: 90, hitpoints: 90 }, { 'dawnsteel-bow': 1 }, 'dawnsteel-bow'), foe)!;
    const meal = { item: 'hearty-stew', heals: 600 };
    const worthless = odds({ ...p, supply: { item: 'nothing', pct: 20 } }, foe, meal);
    const used = odds({ ...p, supply: { item: 'dawnsteel-arrows', pct: 20 } }, foe, meal);
    expect(worthless.goldPerHour - used.goldPerHour).toBeGreaterThan(0);
  });
});
