// Woodcutting's content: eight trees over eight tiers, their logs, six finds and the unlock ladder.
// Every number here matches GAME_DESIGN.md; verify's content check compares them with the model.
import type { Find } from '@idle-clash/content';
import { gatheringContent, type GatherAction } from '../shared/gathering.ts';

export const SKILL = 'woodcutting';

/** Six finds (GAME_DESIGN.md section 8). Uncommon ones sell for about 50 actions' worth of their tier's
 *  logs, Rare ones for about 500; Legendary ones are kept as trophies. */
export const FINDS: Find[] = [
  { item: 'birds-nest', rarity: 'uncommon', greater: false },
  { item: 'amber-nugget', rarity: 'uncommon', greater: true },
  { item: 'carved-acorn', rarity: 'rare', greater: false },
  { item: 'heartwood-knot', rarity: 'rare', greater: true },
  { item: 'silverbark-seed', rarity: 'legendary', greater: false },
  { item: 'crown-of-the-old-wood', rarity: 'legendary', greater: true },
];

const built = gatheringContent({
  feature: 'woodcutting',
  skill: SKILL,
  tiers: [
    { item: 'pine-logs', value: 1, standard: 'pine-tree', rich: 'old-pine' },
    { item: 'ash-logs', value: 4, standard: 'ash-tree', rich: 'old-ash' },
    { item: 'oak-logs', value: 14, standard: 'oak-tree', rich: 'old-oak' },
    { item: 'yew-logs', value: 35, standard: 'yew-tree', rich: 'old-yew' },
    { item: 'maple-logs', value: 70, standard: 'maple-tree', rich: 'old-maple' },
    { item: 'silverbark-logs', value: 115, standard: 'silverbark-tree', rich: 'old-silverbark' },
    { item: 'elderwood-logs', value: 180, standard: 'elderwood-tree', rich: 'old-elderwood' },
    { item: 'ancient-logs', value: 270, standard: 'ancient-tree', rich: 'old-ancient' },
  ],
  perks: [
    { perk: 'quick-swing', effect: { kind: 'speed', pct: 2.5 } },
    { perk: 'plenty', effect: { kind: 'extraYield', pct: 3 } },
    { perk: 'woodsmans-eye', effect: { kind: 'findChance', pct: 8 } },
    { perk: 'practised-hands', effect: { kind: 'masteryGain', pct: 6 } },
  ],
  capstones: {
    40: { perk: 'master-woodcutter', effect: { kind: 'extraYield', pct: 10 } },
    99: { perk: 'grandmaster-woodcutter', effect: { kind: 'extraYield', pct: 15 } },
  },
  finds: FINDS,
  findValues: { 'birds-nest': 100, 'amber-nugget': 1200, 'carved-acorn': 1000, 'heartwood-knot': 12000 },
});

/** Trees: a standard and an old one per tier. */
export const TREES: GatherAction[] = built.actions;
export const ITEMS = built.items;
export const LADDER = built.ladder;
