// Expeditions' content: a run into each region (opened by the Hitpoints level that opens its first
// foe), each boss fought alone once a day (opened by its own), and the bosses' six finds.
import type { Find, Item } from '@idle-clash/content';
import { FOES, regionOf } from '../shared/combat/data.ts';
import { BOSSES, REGIONS } from '../shared/expeditions/data.ts';
import type { FeatureContent } from '../define.ts';

const opensAt = (region: string) =>
  Math.min(...FOES.filter((f) => regionOf(f.tier) === region).map((f) => f.hitpoints));

/** A boss's finds: the Rare sells; the Legendary is kept (it makes its boss's wins pay more marks). */
const ITEMS: Item[] = BOSSES.flatMap((b) => [
  { id: b.finds.rare, kind: 'find', value: b.rareValue },
  { id: b.finds.legendary, kind: 'find', value: 0 },
]);

const FINDS: Find[] = BOSSES.flatMap((b) => [
  { item: b.finds.rare, rarity: 'rare', greater: false },
  { item: b.finds.legendary, rarity: 'legendary', greater: false },
]);

export const CONTENT: FeatureContent = {
  items: ITEMS,
  actions: [
    ...REGIONS.map((r) => ({ id: r, level: opensAt(r) })),
    ...BOSSES.map((b) => ({ id: b.id, level: b.hitpoints, gives: [{ item: b.drop, count: 1 }] })),
  ],
  finds: FINDS,
};
