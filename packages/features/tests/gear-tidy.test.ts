// Session 241: gear in one press, and the Storehouse kept tidy. Switching style took a press a piece on the
// gear sheet (a weapon, then each armour piece); now one press fights as a style in the best held for it.
// Smithing for XP leaves stacks of old swords and helms, each a space until sold from its own panel; now old
// gear sells together, never a piece worn, one of a piece tempered, or a piece locked; and a lock keeps an
// item from every sale.
import { XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import '../src/index.ts';
import { combat } from '../src/combat/index.ts';
import { storehouse } from '../src/storehouse/index.ts';
import { combatOf } from '../src/shared/combat/state.ts';
import { storeOf } from '../src/shared/storehouse.ts';
import { itemOf } from '../src/shared/catalog.ts';

const T0 = Date.UTC(2026, 10, 26, 9);
type Answer = { state: State; result: { ok: boolean; [k: string]: unknown } };
const route = (f: typeof combat, name: string, input: object, s: State) => f.routes[name].run(s, input, T0) as Answer;

/** A fighter at Melee and Magic 42 and Hitpoints 42 (tier 5 open) wearing iron, holding older and newer gear. */
function fighter(): State {
  return {
    ...newState(241, T0),
    skills: { melee: { xp: XP_TABLE[42] }, magic: { xp: XP_TABLE[42] }, hitpoints: { xp: XP_TABLE[42] } },
    items: {
      gold: 10,
      'copper-sword': 19,
      'bronze-sword': 3,
      'iron-sword': 1,
      'moonsilver-staff': 1,
      'copper-helm': 4,
      'iron-helm': 1,
      'steel-helm': 1,
      'moonsilver-body': 1,
      'dawnsteel-sword': 1,
      'birds-nest': 5,
    },
    features: {
      combat: { worn: { weapon: 'iron-sword', helm: 'iron-helm' }, health: null, healthAt: 0, retreated: null },
    },
  };
}

describe('fighting as a style', () => {
  it('puts on the best weapon of the style and the best armour, at one press', () => {
    const r = route(combat, 'wearBest', { style: 'magic' }, fighter());
    expect(r.result).toEqual({ ok: true, changed: 3 });
    expect(combatOf(r.state).worn).toEqual({ weapon: 'moonsilver-staff', helm: 'steel-helm', body: 'moonsilver-body' });
    // Never a piece above the player's level (dawnsteel wants 85); armour as good is left on.
    const melee = route(combat, 'wearBest', { style: 'melee' }, r.state);
    expect(combatOf(melee.state).worn.weapon).toBe('iron-sword');
    expect(melee.result).toEqual({ ok: true, changed: 1 });
    expect(route(combat, 'wearBest', { style: 'archery' }, fighter()).result).toEqual({
      ok: false,
      reason: { code: 'noWeapon' },
    });
  });

  it('is offered on the loadout while two styles are held, and while better gear waits', () => {
    const view = combat.slots['combat.loadout']({ state: fighter(), now: T0 }) as {
      fightAs: { id: string; current: boolean }[];
      better: boolean;
    };
    expect(view.fightAs).toEqual([
      { id: 'melee', name: 'Melee', current: true },
      { id: 'magic', name: 'Magic', current: false },
    ]);
    expect(view.better).toBe(true);
  });
});

describe('old gear', () => {
  it('sells gear two tiers or more below what may be worn, keeping the worn and the locked', () => {
    // Tier 5 is open: copper (1), bronze (2) and iron (3) are old; the worn iron sword keeps one.
    const s = fighter();
    s.features.storehouse = { enlargements: 0, locked: ['bronze-sword'] };
    const view = storehouse.slots['store.capacity']({ state: s, now: T0 }) as { sellGear: { label: string } };
    const worth = 19 * itemOf('copper-sword')!.value + 4 * itemOf('copper-helm')!.value;
    expect(view.sellGear.label).toBe(`Sell old gear for ${worth} gold`);
    const r = route(storehouse, 'sellGear', {}, s);
    expect(r.result).toMatchObject({ ok: true, kinds: 2 });
    expect(r.state.items).toMatchObject({ 'bronze-sword': 3, 'iron-sword': 1, 'iron-helm': 1, 'steel-helm': 1 });
    expect(r.state.items['copper-sword'] ?? 0).toBe(0);
    expect(r.state.items['copper-helm'] ?? 0).toBe(0);
    expect(r.state.items['birds-nest']).toBe(5);
    expect(route(storehouse, 'sellGear', {}, r.state).result).toEqual({
      ok: false,
      reason: { code: 'nothingToSell' },
    });
  });

  it('keeps a locked item from every sale, and a lock through an enlargement', () => {
    let s = fighter();
    s.items.gold = 1_000_000;
    s = route(storehouse, 'lock', { item: 'birds-nest', on: true }, s).state;
    expect(route(storehouse, 'sell', { item: 'birds-nest', count: 1 }, s).result).toEqual({
      ok: false,
      reason: { code: 'locked' },
    });
    expect(route(storehouse, 'sellFinds', {}, s).result.ok).toBe(false);
    s = route(storehouse, 'enlarge', {}, s).state;
    expect(storeOf(s)).toEqual({ enlargements: 1, locked: ['birds-nest'] });
    s = route(storehouse, 'lock', { item: 'birds-nest', on: false }, s).state;
    expect(storeOf(s)).toEqual({ enlargements: 1 });
    expect(route(storehouse, 'sell', { item: 'birds-nest', count: 1 }, s).result.ok).toBe(true);
  });
});

// The audit of phase 1 (session 243): a Magic player holding only an old iron sword for Melee sold it with the
// rest, leaving Fight as with no Melee weapon.
describe('old gear, the best kept', () => {
  it('keeps one of the best piece held for each slot and style, however old', () => {
    const s = {
      ...newState(243, T0),
      skills: { melee: { xp: XP_TABLE[60] }, magic: { xp: XP_TABLE[60] }, hitpoints: { xp: XP_TABLE[60] } },
      items: { 'iron-sword': 3, 'copper-sword': 2, 'moonsilver-staff': 1 },
      features: {
        combat: { worn: { weapon: 'moonsilver-staff' }, health: null, healthAt: 0, retreated: null },
      },
    } as State;
    const r = route(storehouse, 'sellGear', {}, s);
    expect(r.state.items['iron-sword']).toBe(1);
    expect(r.state.items['copper-sword'] ?? 0).toBe(0);
    expect(route(combat, 'wearBest', { style: 'melee' }, r.state).result).toMatchObject({ ok: true });
  });
});
