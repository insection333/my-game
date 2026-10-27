// Fletching's content: each tier's arrows, Archery's supply, made 25 at a time from one of the tier's
// bars and one of its logs; six finds and the unlock ladder. Every number matches GAME_DESIGN.md
// section 6; verify's content check compares them.
import {
  buildLadder,
  fillPerks,
  TIER_LEVELS,
  TIER_SECONDS,
  TIER_XP_PER_HOUR,
  type Find,
  type Item,
} from '@idle-clash/content';

export const SKILL = 'fletching';

export interface Fletch {
  id: string;
  level: number;
  tier: number;
  takes: { item: string; count: number }[];
  gives: { item: string; count: number }[];
  seconds: number;
  xp: number;
  findMultiple: number;
}

// What Smithing and Woodcutting make, by tier (named here: a feature never imports another).
const METALS = ['copper', 'bronze', 'iron', 'steel', 'moonsilver', 'star-iron', 'embersteel', 'dawnsteel'];
const BAR_VALUE = [2, 7, 36, 96, 117, 208, 286, 468];
const LOGS = ['pine', 'ash', 'oak', 'yew', 'maple', 'silverbark', 'elderwood', 'ancient'].map((l) => `${l}-logs`);
const LOG_VALUE = [1, 4, 14, 35, 70, 115, 180, 270];
/** How many arrows one fletching makes. */
export const BATCH = 25;

export const RECIPES: Fletch[] = METALS.map((metal, i) => {
  const seconds = TIER_SECONDS[i] * 2;
  return {
    id: `${metal}-arrows`,
    level: TIER_LEVELS[i],
    tier: i + 1,
    takes: [
      { item: `${metal}-bar`, count: 1 },
      { item: LOGS[i], count: 1 },
    ],
    gives: [{ item: `${metal}-arrows`, count: BATCH }],
    seconds,
    xp: Math.round((TIER_XP_PER_HOUR[i] * seconds) / 3600),
    findMultiple: 1,
  };
});

export const FINDS: Find[] = [
  { item: 'heron-quill', rarity: 'uncommon', greater: false },
  { item: 'hawk-feather', rarity: 'uncommon', greater: true },
  { item: 'fletchers-knife', rarity: 'rare', greater: false },
  { item: 'waxed-bowstring', rarity: 'rare', greater: true },
  { item: 'arrow-of-the-first-hunt', rarity: 'legendary', greater: false },
  { item: 'quiver-of-the-wild-hunt', rarity: 'legendary', greater: true },
];
const FIND_VALUE: Record<string, number> = {
  'heron-quill': 200,
  'hawk-feather': 3000,
  'fletchers-knife': 2000,
  'waxed-bowstring': 30000,
};

/** Arrows (a supply, each worth its share of the bar and log) and the finds. */
export const ITEMS: Item[] = [
  ...METALS.map((metal, i): Item => ({
    id: `${metal}-arrows`,
    kind: 'supply',
    value: Math.round((BAR_VALUE[i] + LOG_VALUE[i]) / BATCH),
    supply: { style: 'archery', tier: i + 1 },
  })),
  ...FINDS.map((f): Item => ({ id: f.item, kind: 'find', value: FIND_VALUE[f.item] ?? 0 })),
];

export const LADDER = fillPerks(
  buildLadder(RECIPES, []),
  [
    // More arrows, not faster XP: with one recipe a tier, a speed perk would fill most of the ladder.
    { perk: 'fine-fletching', effect: { kind: 'extraYield', pct: 3 } },
    { perk: 'thrifty', effect: { kind: 'saveInput', pct: 4 } },
    { perk: 'fletchers-eye', effect: { kind: 'findChance', pct: 8 } },
    { perk: 'practised-hands', effect: { kind: 'masteryGain', pct: 8 } },
  ],
  {
    40: { perk: 'master-fletcher', effect: { kind: 'saveInput', pct: 8 } },
    99: { perk: 'grandmaster-fletcher', effect: { kind: 'saveInput', pct: 10 } },
  },
);
