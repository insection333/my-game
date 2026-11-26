// Items worth nothing (session 276): the first two tiers' runes, whetstones and arrows have no price, so they
// could not be sold, and a fighter carries the best supply held, so an earlier tier's is never used again: they
// held a space in the Storehouse for good. Now they can be thrown away, all at once; never gear (an heirloom is
// worth nothing too), a find or food, nor what a running lane uses, what is locked, or the pedlar's want.
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { FEATURES } from '../src/index.ts';
import { worthless } from '../src/shared/storehouse.ts';
import { throwAway } from '../src/storehouse/tidy.ts';
import { setLock } from '../src/storehouse/tidy.ts';

const T0 = Date.UTC(2026, 10, 20, 9);
const store = FEATURES.find((f) => f.id === 'storehouse')!;
const route = (s: State, item: string) => store.routes.throwAway.run(s, { item }, T0);

describe('an item worth nothing', () => {
  it('is the first tiers’ runes, whetstones and arrows, never gear, a find or food', () => {
    for (const id of ['spark-rune', 'gale-rune', 'copper-whetstones', 'bronze-arrows'])
      expect(worthless(id)).toBe(true);
    for (const id of ['troll-blade', 'tide-rune', 'pine-logs', 'birds-nest', 'bread', 'nothing'])
      expect(worthless(id)).toBe(false);
  });

  it('is thrown away whole, freeing its space, and refused where it must stay', () => {
    const s: State = { ...newState(4, T0), items: { 'spark-rune': 40_000, 'tide-rune': 10, 'troll-blade': 1 } };
    const out = route(s, 'spark-rune');
    expect(out.result).toEqual({ ok: true, count: 40_000 });
    expect(out.state.items['spark-rune']).toBeUndefined();
    expect(route(s, 'tide-rune').result).toMatchObject({ ok: false, reason: { code: 'notWorthless' } });
    expect(route(s, 'troll-blade').result).toMatchObject({ ok: false, reason: { code: 'notWorthless' } });
    expect(throwAway(setLock(s, 'spark-rune', true).state, 'spark-rune', T0).result).toMatchObject({
      ok: false,
      reason: { code: 'locked' },
    });
    expect(route({ ...s, items: {} }, 'spark-rune').result).toMatchObject({
      ok: false,
      reason: { code: 'nothingToThrow' },
    });
  });

  it('stays while a running lane uses it: a Magic fighter carrying the runes', () => {
    const s: State = {
      ...newState(4, T0),
      items: { 'spark-rune': 500, 'copper-staff': 1, bread: 10 },
      features: { combat: { worn: { weapon: 'copper-staff' }, health: null, healthAt: 0, retreated: null } },
    };
    s.lanes.combat.current = { action: { feature: 'combat', id: 'hollow-rat' }, startedAt: T0, endsAt: T0 + 6_000 };
    expect(route(s, 'spark-rune').result).toMatchObject({ ok: false, reason: { code: 'inUse' } });
  });
});
