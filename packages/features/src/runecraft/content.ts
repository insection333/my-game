// Runecraft's content: eight standing stones over eight tiers (each tier's stone and its ancient stone),
// the runes they give eight at a time (Magic's supply), six finds and the unlock ladder. Every stone past
// the first needs that tier's key, which Smithing binds and the player keeps. Every number matches
// GAME_DESIGN.md; verify's content check compares them.
import type { Find } from '@idle-clash/content';
import { gatheringContent, type GatherAction } from '../shared/gathering.ts';

export const SKILL = 'runecraft';

export const FINDS: Find[] = [
  { item: 'chalk-stub', rarity: 'uncommon', greater: false },
  { item: 'cracked-rune', rarity: 'uncommon', greater: true },
  { item: 'seers-stone', rarity: 'rare', greater: false },
  { item: 'rubbing-of-a-lost-rune', rarity: 'rare', greater: true },
  { item: 'rune-of-the-old-kings', rarity: 'legendary', greater: false },
  { item: 'star-chart-of-the-ancients', rarity: 'legendary', greater: true },
];

const RUNES = ['spark', 'gale', 'tide', 'earth', 'moon', 'star', 'ember', 'dawn'];
/** An eighth of the tier's ore: a draw gives eight, so Runecraft pays as Mining does. */
const VALUE = [0, 0, 2, 4, 8, 13, 20, 30];
/** The key each tier's stones need (named here: a feature never imports another). */
const KEYS = [null, 'bronze', 'iron', 'steel', 'moonsilver', 'star-iron', 'embersteel', 'dawnsteel'];

const built = gatheringContent({
  feature: 'runecraft',
  skill: SKILL,
  tiers: RUNES.map((rune, i) => ({
    item: `${rune}-rune`,
    value: VALUE[i],
    standard: `${rune}-stone`,
    rich: `ancient-${rune}-stone`,
    per: 8,
    ...(KEYS[i] ? { needs: `${KEYS[i]}-key` } : {}),
  })),
  perks: [
    { perk: 'quick-draw', effect: { kind: 'speed', pct: 2.5 } },
    { perk: 'plenty', effect: { kind: 'extraYield', pct: 3 } },
    { perk: 'seers-eye', effect: { kind: 'findChance', pct: 8 } },
    { perk: 'practised-hands', effect: { kind: 'masteryGain', pct: 6 } },
  ],
  capstones: {
    40: { perk: 'master-runecrafter', effect: { kind: 'extraYield', pct: 10 } },
    99: { perk: 'grandmaster-runecrafter', effect: { kind: 'extraYield', pct: 15 } },
  },
  finds: FINDS,
  findValues: { 'chalk-stub': 100, 'cracked-rune': 1200, 'seers-stone': 1000, 'rubbing-of-a-lost-rune': 12000 },
  supplyFor: 'magic',
});

/** Standing stones: each tier's stone and its ancient stone. */
export const STONES: GatherAction[] = built.actions;
export const ITEMS = built.items;
export const LADDER = built.ladder;
