// Comes from and Used in, answered by every feature's content.
import { describe, expect, it } from 'vitest';
import { FEATURES, items } from '../src/index.ts';

describe('item questions', () => {
  it('says a log comes from its two trees and goes into the bows and staves of its tier', () => {
    expect(items.comesFrom(FEATURES, 'ash-logs').map((s) => s.action)).toEqual(['ash-tree', 'old-ash']);
    expect(items.usedIn(FEATURES, 'ash-logs').map((s) => [s.action, s.count])).toEqual([
      ['bronze-staff', 1],
      ['bronze-bow', 2],
    ]);
  });

  it('says a find comes from its skill, with its rarity, and that a bar is made and used by Smithing', () => {
    expect(items.comesFrom(FEATURES, 'crystal-geode')).toEqual([
      { feature: 'mining', skill: 'mining', action: null, rarity: 'rare', count: 1 },
    ]);
    expect(items.comesFrom(FEATURES, 'iron-bar').map((s) => s.action)).toEqual(['iron-bar']);
    expect(items.usedIn(FEATURES, 'iron-bar').map((s) => s.action)).toEqual([
      'iron-sword',
      'iron-staff',
      'iron-bow',
      'iron-helm',
      'iron-legs',
      'iron-body',
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
