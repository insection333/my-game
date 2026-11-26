// Cooking's content: each tier's fish cooked two at a time over one of that tier's logs, and from tier 3
// a pie or a stew mixing the tier's fish with the one before; from tier 5 the dish's feast (session 245),
// ten dishes and a greater Uncommon find making ten; six finds and the unlock ladder. Cooked food heals
// about half the health a fighter has at its tier and sells for what went into it; every number matches
// GAME_DESIGN.md section 6.
import {
  buildLadder,
  fillPerks,
  TIER_LEVELS,
  TIER_SECONDS,
  TIER_XP_PER_HOUR,
  type Find,
  type Item,
} from '@idle-clash/content';
import { FEAST_BATCH, FEASTS } from '../shared/feast.ts';

export const SKILL = 'cooking';

export interface Dish {
  id: string;
  level: number;
  tier: number;
  kind: 'fish' | 'dish' | 'feast';
  takes: { item: string; count: number }[];
  gives: { item: string; count: number }[];
  seconds: number;
  xp: number;
  findMultiple: number;
}

// What Fishing and Woodcutting give, by tier (named here: a feature never imports another).
const FISH = ['perch', 'trout', 'pike', 'salmon', 'moon-carp', 'silver-eel', 'ember-char', 'dawn-sturgeon'];
const FISH_VALUE = [1, 2, 6, 14, 28, 46, 72, 108];
const LOGS = ['pine', 'ash', 'oak', 'yew', 'maple', 'silverbark', 'elderwood', 'ancient'].map((l) => `${l}-logs`);
const LOG_VALUE = [1, 4, 14, 35, 70, 115, 180, 270];
const HEALS = [150, 330, 530, 730, 930, 1230, 1530, 1830];
/** From tier 3: the tier's pie or stew. */
const DISHES = ['', '', 'pike-pie', 'salmon-stew', 'carp-pie', 'eel-stew', 'char-pie', 'sturgeon-stew'];

export const RECIPES: Dish[] = FISH.flatMap((fish, i) => {
  const seconds = TIER_SECONDS[i] * 3;
  const xp = Math.round((TIER_XP_PER_HOUR[i] * seconds) / 3600);
  const cooked: Dish = {
    id: `cooked-${fish}`,
    level: TIER_LEVELS[i],
    tier: i + 1,
    kind: 'fish',
    takes: [
      { item: fish, count: 2 },
      { item: LOGS[i], count: 1 },
    ],
    gives: [{ item: `cooked-${fish}`, count: 2 }],
    seconds,
    xp,
    findMultiple: 1,
  };
  if (i < 2) return [cooked];
  const dish: Dish = {
    id: DISHES[i],
    level: TIER_LEVELS[i] + 5,
    tier: i + 1,
    kind: 'dish',
    takes: [
      { item: fish, count: 1 },
      { item: FISH[i - 1], count: 1 },
      { item: LOGS[i], count: 1 },
    ],
    gives: [{ item: DISHES[i], count: 2 }],
    seconds,
    xp,
    findMultiple: 1,
  };
  // From tier 5, the dish's feast, at the dish's own level (so no perk on the ladder moves).
  const feast = Object.entries(FEASTS).find(([, f]) => f.dish === DISHES[i]);
  if (!feast) return [cooked, dish];
  const made: Dish = {
    id: feast[0],
    level: dish.level,
    tier: i + 1,
    kind: 'feast',
    takes: [
      { item: DISHES[i], count: FEAST_BATCH },
      { item: feast[1].find, count: 1 },
    ],
    gives: [{ item: feast[0], count: FEAST_BATCH }],
    seconds,
    xp,
    findMultiple: 1,
  };
  return [cooked, dish, made];
});

/** What a dish heals: 1.3 times its tier's cooked fish, in tens (session 245: a quarter more until then, so
 *  the best dish healed less than the vendor's best food). */
const dishHeals = (i: number) => Math.floor((HEALS[i] * 1.3) / 10) * 10;
const dishValue = (i: number) => Math.round((FISH_VALUE[i] + FISH_VALUE[i - 1] + LOG_VALUE[i]) / 2);
/** The greater finds' prices, named here (their skills' contents hold them). */
const GREATER_VALUE: Record<string, number> = {
  'river-pearl': 1200,
  'saffron-threads': 3000,
  'amber-nugget': 1200,
  'rough-sapphire': 1200,
};

export const FINDS: Find[] = [
  { item: 'wild-herbs', rarity: 'uncommon', greater: false },
  { item: 'saffron-threads', rarity: 'uncommon', greater: true },
  { item: 'grandmothers-recipe', rarity: 'rare', greater: false },
  { item: 'silver-ladle', rarity: 'rare', greater: true },
  { item: 'ever-warm-pot', rarity: 'legendary', greater: false },
  { item: 'cauldron-of-plenty', rarity: 'legendary', greater: true },
];
const FIND_VALUE: Record<string, number> = {
  'wild-herbs': 200,
  'saffron-threads': 3000,
  'grandmothers-recipe': 2000,
  'silver-ladle': 30000,
};

/** Cooked fish and dishes (food: each sells for half of what went into its cooking), and the finds. */
export const ITEMS: Item[] = [
  ...FISH.map((fish, i): Item => ({
    id: `cooked-${fish}`,
    kind: 'food',
    value: Math.round((2 * FISH_VALUE[i] + LOG_VALUE[i]) / 2),
    heals: HEALS[i],
  })),
  ...DISHES.flatMap((id, i): Item[] =>
    id
      ? [
          {
            id,
            kind: 'food',
            value: dishValue(i),
            heals: dishHeals(i),
          },
        ]
      : [],
  ),
  // A feast heals as its dish and is worth its dish and a tenth of its find.
  ...Object.entries(FEASTS).map(([id, f]): Item => {
    const i = DISHES.indexOf(f.dish);
    return {
      id,
      kind: 'food',
      value: dishValue(i) + Math.round(GREATER_VALUE[f.find] / FEAST_BATCH),
      heals: dishHeals(i),
    };
  }),
  ...FINDS.map((f): Item => ({ id: f.item, kind: 'find', value: FIND_VALUE[f.item] ?? 0 })),
];

export const LADDER = fillPerks(
  buildLadder(RECIPES, []),
  [
    { perk: 'steady-flame', effect: { kind: 'speed', pct: 3 } },
    { perk: 'thrifty', effect: { kind: 'saveInput', pct: 4 } },
    { perk: 'cooks-eye', effect: { kind: 'findChance', pct: 8 } },
    { perk: 'practised-hands', effect: { kind: 'masteryGain', pct: 8 } },
  ],
  {
    40: { perk: 'master-cook', effect: { kind: 'saveInput', pct: 8 } },
    99: { perk: 'grandmaster-cook', effect: { kind: 'saveInput', pct: 10 } },
  },
);
