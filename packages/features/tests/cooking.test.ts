// Fishing and Cooking, the food loop: a cast brings in its fish, Cooking makes two at a time from two
// fish and a log, and a fighter eats what was cooked beside what was bought, the most healing first.
import { XP_TABLE } from '@idle-clash/content';
import { createEngine, newState, seeded, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { actionRegistry, FEATURES } from '../src/index.ts';
import { odds } from '../src/shared/combat/fight.ts';
import { fighterOf, mealsOf } from '../src/shared/combat/state.ts';
import { FOES } from '../src/shared/combat/data.ts';

const T0 = Date.UTC(2026, 9, 27, 9);
const engine = createEngine(actionRegistry(FEATURES, () => true));
const rng = seeded(13);
const at = (skills: Record<string, number>, items: Record<string, number>): State => ({
  ...newState(13, T0),
  skills: Object.fromEntries(Object.entries(skills).map(([s, l]) => [s, { xp: XP_TABLE[l] }])),
  items,
});

describe('the food loop', () => {
  it('fishes perch from the shallows', () => {
    let s = engine.command(
      at({}, {}),
      T0,
      { type: 'start', lane: 'gathering', action: { feature: 'fishing', id: 'perch-shallows' } },
      rng,
    ).state;
    s = engine.advance(s, T0 + 60_000, rng).state;
    expect(s.items.perch).toBeGreaterThanOrEqual(8);
    expect(s.skills.fishing.xp).toBeGreaterThan(0);
  });

  it('cooks two perch over a pine log into two cooked perch, and stops when the logs run out', () => {
    let s = engine.command(
      at({}, { perch: 6, 'pine-logs': 2 }),
      T0,
      { type: 'start', lane: 'artisan', action: { feature: 'cooking', id: 'cooked-perch' } },
      rng,
    ).state;
    s = engine.advance(s, T0 + 10 * 60_000, rng).state;
    expect(s.items['cooked-perch']).toBeGreaterThanOrEqual(4);
    expect(s.items['pine-logs'] ?? 0).toBe(0);
    expect(s.lanes.artisan.current).toBeNull();
  });

  it("makes a pike pie from a pike, a trout and an oak log, once Cooking reaches the pie's level", () => {
    const start = { type: 'start' as const, lane: 'artisan' as const, action: { feature: 'cooking', id: 'pike-pie' } };
    const items = { pike: 1, trout: 1, 'oak-logs': 1 };
    expect(engine.command(at({ cooking: 24 }, items), T0, start, rng).result).toMatchObject({
      reason: { code: 'levelTooLow' },
    });
    let s = engine.command(at({ cooking: 25 }, items), T0, start, rng).state;
    s = engine.advance(s, T0 + 2 * 60_000, rng).state;
    expect(s.items['pike-pie']).toBe(2);
  });

  it('eats cooked food beside bought food, the most healing first', () => {
    const s = at({ hitpoints: 20 }, { bread: 5, 'cooked-pike': 3, 'meat-pie': 2 });
    expect(mealsOf(s).map((m) => [m.item, m.heals])).toEqual([
      ['cooked-pike', 530],
      ['meat-pie', 320],
      ['bread', 140],
    ]);
  });

  it("counts a cooked meal at what it would sell for, so Your odds' gold an hour stays true", () => {
    const foe = FOES.find((f) => f.id === 'grave-wight')!;
    const s: State = {
      ...at({ melee: 20, hitpoints: 20 }, { 'iron-sword': 1 }),
      features: { combat: { worn: { weapon: 'iron-sword' }, health: null, healthAt: 0, retreated: null } },
    };
    const p = fighterOf(s, foe)!;
    // The same meal with no worth: the same fights, so the difference is what the meals cost.
    const free = odds(p, foe, { item: 'nothing', heals: 530 });
    const cooked = odds(p, foe, { item: 'cooked-pike', heals: 530 });
    expect(cooked.foodPerHour).toBeGreaterThan(0);
    expect(free.goldPerHour - cooked.goldPerHour).toBeCloseTo(cooked.foodPerHour * 13, 6);
  });
});
