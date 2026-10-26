// Mining's content: eight veins and seams over eight tiers, their ores, six finds and the unlock
// ladder. Every number here matches GAME_DESIGN.md; verify's content check compares them with the model.
import type { Find } from '@idle-clash/content';
import { gatheringContent, type GatherAction } from '../shared/gathering.ts';

export const SKILL = 'mining';

export const FINDS: Find[] = [
  { item: 'rough-garnet', rarity: 'uncommon', greater: false },
  { item: 'rough-sapphire', rarity: 'uncommon', greater: true },
  { item: 'ancient-coin', rarity: 'rare', greater: false },
  { item: 'crystal-geode', rarity: 'rare', greater: true },
  { item: 'star-iron-shard', rarity: 'legendary', greater: false },
  { item: 'heart-of-the-mountain', rarity: 'legendary', greater: true },
];

const built = gatheringContent({
  feature: 'mining',
  skill: SKILL,
  tiers: [
    { item: 'copper-ore', value: 1, standard: 'copper-vein', rich: 'deep-copper-seam' },
    { item: 'tin-ore', value: 4, standard: 'tin-vein', rich: 'deep-tin-seam' },
    { item: 'iron-ore', value: 14, standard: 'iron-vein', rich: 'deep-iron-seam' },
    { item: 'coal', value: 30, standard: 'coal-vein', rich: 'deep-coal-seam' },
    { item: 'moonsilver-ore', value: 60, standard: 'moonsilver-vein', rich: 'deep-moonsilver-seam' },
    { item: 'star-iron-ore', value: 100, standard: 'star-iron-vein', rich: 'deep-star-iron-seam' },
    { item: 'ember-ore', value: 160, standard: 'ember-vein', rich: 'deep-ember-seam' },
    { item: 'dawnstone', value: 240, standard: 'dawnstone-vein', rich: 'deep-dawnstone-seam' },
  ],
  perks: [
    { perk: 'quick-strike', effect: { kind: 'speed', pct: 2.5 } },
    { perk: 'plenty', effect: { kind: 'extraYield', pct: 3 } },
    { perk: 'prospectors-eye', effect: { kind: 'findChance', pct: 8 } },
    { perk: 'practised-hands', effect: { kind: 'masteryGain', pct: 6 } },
  ],
  capstones: {
    40: { perk: 'master-miner', effect: { kind: 'extraYield', pct: 10 } },
    99: { perk: 'grandmaster-miner', effect: { kind: 'extraYield', pct: 15 } },
  },
  finds: FINDS,
  findValues: { 'rough-garnet': 100, 'rough-sapphire': 1200, 'ancient-coin': 1000, 'crystal-geode': 12000 },
});

/** Veins and seams: a standard and a deep one per tier. */
export const VEINS: GatherAction[] = built.actions;
export const ITEMS = built.items;
export const LADDER = built.ladder;
