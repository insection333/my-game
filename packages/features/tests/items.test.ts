// Comes from and Used in, answered by every feature's content.
import { describe, expect, it } from 'vitest';
import { FEATURES, items } from '../src/index.ts';

describe('item questions', () => {
  it("says a log comes from its two trees and goes into its tier's bows and staves and the fire under its fish", () => {
    expect(items.comesFrom(FEATURES, 'ash-logs').map((s) => s.action)).toEqual(['ash-tree', 'old-ash']);
    expect(items.usedIn(FEATURES, 'ash-logs').map((s) => [s.action, s.count])).toEqual([
      ['bronze-staff', 1],
      ['bronze-bow', 2],
      ['cooked-trout', 1],
      ['bronze-arrows', 1],
    ]);
  });

  it('says a key is made by Smithing and kept by the standing stones it opens', () => {
    expect(items.comesFrom(FEATURES, 'iron-key').map((s) => s.action)).toEqual(['iron-key']);
    expect(items.usedIn(FEATURES, 'iron-key').map((s) => [s.action, s.count])).toEqual([
      ['tide-stone', 0],
      ['ancient-tide-stone', 0],
    ]);
    expect(items.sourceLabel(items.usedIn(FEATURES, 'iron-key')[0])).toBe(
      'Runecraft: Tide stone (kept, never used up)',
    );
  });

  it("says a fish comes from its shallows and pool and goes into its cooking and the next tier's dish", () => {
    expect(items.comesFrom(FEATURES, 'pike').map((s) => s.action)).toEqual(['pike-shallows', 'deep-pike-pool']);
    expect(items.usedIn(FEATURES, 'pike').map((s) => [s.action, s.count])).toEqual([
      ['cooked-pike', 2],
      ['pike-pie', 1],
      ['salmon-stew', 1],
    ]);
  });

  it('says a find comes from its skill, with its rarity, and that a bar is made and used by Smithing', () => {
    expect(items.comesFrom(FEATURES, 'crystal-geode')).toEqual([
      { feature: 'mining', skill: 'mining', action: null, rarity: 'rare', count: 1 },
    ]);
    expect(items.comesFrom(FEATURES, 'iron-bar').map((s) => s.action)).toEqual(['iron-bar']);
    expect(items.usedIn(FEATURES, 'iron-bar').map((s) => s.action)).toEqual([
      'iron-whetstones',
      'iron-key',
      'iron-sword',
      'iron-staff',
      'iron-bow',
      'iron-helm',
      'iron-legs',
      'iron-body',
      'iron-arrows',
    ]);
  });

  it('names every source by its skill, or by its page where it has none', () => {
    expect(items.comesFrom(FEATURES, 'pine-logs').map(items.sourceLabel)).toContain('Combat: Goblin slinger (×1)');
    for (const i of items.catalog(FEATURES))
      for (const src of [...items.comesFrom(FEATURES, i.id), ...items.usedIn(FEATURES, i.id)])
        expect(items.sourceLabel(src)).toMatch(/^\w/);
  });

  it('knows every item a feature makes or uses', () => {
    const known = new Set(items.catalog(FEATURES).map((i) => i.id));
    for (const f of FEATURES)
      for (const a of f.content.actions ?? [])
        for (const g of [...(a.gives ?? []), ...(a.takes ?? [])]) expect(known.has(g.item)).toBe(true);
  });
});

describe('every item says where it comes from and where it goes', () => {
  it('leaves no item with nothing to say on either side, except a find that is only kept or sold', () => {
    for (const i of items.catalog(FEATURES)) {
      expect(items.comesFrom(FEATURES, i.id).length, `${i.id} comes from`).toBeGreaterThan(0);
      if (i.kind === 'find' && i.value > 0) continue;
      expect(items.usedIn(FEATURES, i.id).length, `${i.id} is used in`).toBeGreaterThan(0);
    }
  });

  it('names the vendor for bought food, and the fight for what a fighter eats, wears or carries', () => {
    const label = (s: items.ItemSource) => items.sourceLabel(s);
    expect(items.comesFrom(FEATURES, 'bread').map(label)).toEqual(['The vendor in Combat: 20 gold each']);
    expect(items.comesFrom(FEATURES, 'wardens-feast').map(label)).toEqual([
      'The vendor in Combat: 480 gold each, from Hitpoints level 80',
    ]);
    expect(items.usedIn(FEATURES, 'bread').map(label)).toEqual(['Combat: eaten by your fighter']);
    expect(items.usedIn(FEATURES, 'copper-sword').map(label)).toEqual(['Combat: wielded in Melee']);
    expect(items.usedIn(FEATURES, 'copper-helm').map(label)).toEqual(['Combat: worn on the head']);
    expect(items.usedIn(FEATURES, 'copper-arrows').map(label)).toEqual(['Combat: carried into Archery fights']);
    expect(items.usedIn(FEATURES, 'copper-arrows')[0]).toMatchObject({ href: '/combat' });
  });
});
