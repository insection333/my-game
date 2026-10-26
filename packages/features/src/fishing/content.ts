// Fishing's content: eight waters over eight tiers (each tier's shallows and its deep pool), their fish,
// six finds and the unlock ladder. Fish sell for 40% of the tier's logs: Fishing pays mostly in the food
// Cooking makes of them. Every number matches GAME_DESIGN.md; verify's content check compares them.
import type { Find } from '@idle-clash/content';
import { gatheringContent, type GatherAction } from '../shared/gathering.ts';

export const SKILL = 'fishing';

export const FINDS: Find[] = [
  { item: 'pearl-mussel', rarity: 'uncommon', greater: false },
  { item: 'river-pearl', rarity: 'uncommon', greater: true },
  { item: 'message-in-a-bottle', rarity: 'rare', greater: false },
  { item: 'drowned-signet', rarity: 'rare', greater: true },
  { item: 'scale-of-the-deep', rarity: 'legendary', greater: false },
  { item: 'fen-kings-crown', rarity: 'legendary', greater: true },
];

/** The fish of each tier, in order (Cooking cooks them). */
export const FISH = [
  'perch',
  'trout',
  'pike',
  'salmon',
  'moon-carp',
  'silver-eel',
  'ember-char',
  'dawn-sturgeon',
] as const;
const VALUE = [1, 2, 6, 14, 28, 46, 72, 108];

const built = gatheringContent({
  feature: 'fishing',
  skill: SKILL,
  tiers: FISH.map((fish, i) => ({
    item: fish,
    value: VALUE[i],
    standard: `${fish}-shallows`,
    rich: `deep-${fish}-pool`,
  })),
  perks: [
    { perk: 'quick-cast', effect: { kind: 'speed', pct: 2.5 } },
    { perk: 'plenty', effect: { kind: 'extraYield', pct: 3 } },
    { perk: 'anglers-eye', effect: { kind: 'findChance', pct: 8 } },
    { perk: 'practised-hands', effect: { kind: 'masteryGain', pct: 6 } },
  ],
  capstones: {
    40: { perk: 'master-angler', effect: { kind: 'extraYield', pct: 10 } },
    99: { perk: 'grandmaster-angler', effect: { kind: 'extraYield', pct: 15 } },
  },
  finds: FINDS,
  findValues: { 'pearl-mussel': 100, 'river-pearl': 1200, 'message-in-a-bottle': 1000, 'drowned-signet': 12000 },
});

/** Waters: each tier's shallows and its deep pool. */
export const WATERS: GatherAction[] = built.actions;
export const ITEMS = built.items;
export const LADDER = built.ladder;
