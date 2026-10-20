// Woodcutting's content: eight trees over four tiers, their logs, and the unlock ladder 1 to 40.
// Every number here matches GAME_DESIGN.md; verify's content check compares them with the model.
import { buildLadder, type Find, type Item } from '@idle-clash/content';

export const SKILL = 'woodcutting';

/** Seconds per standard action and XP an hour, by tier (GAME_DESIGN.md section 5). */
const TIER_SECONDS = [7.5, 12.5, 20, 26];
const TIER_XP_PER_HOUR = [5400, 7200, 9300, 12000];
const LOGS = ['pine', 'ash', 'oak', 'yew'];
const LOG_VALUE = [1, 4, 14, 35];

export interface Tree {
  id: string;
  level: number;
  tier: number;
  /** Old trees are slower and give two logs. */
  old: boolean;
  seconds: number;
  xp: number;
  logs: string;
  count: number;
  /** Rare and Legendary finds roll at this multiple per action (the same per hour). */
  findMultiple: number;
}

export const TREES: Tree[] = LOGS.flatMap((log, i) => {
  const seconds = TIER_SECONDS[i];
  const xp = Math.round((TIER_XP_PER_HOUR[i] * seconds) / 3600);
  const level = [1, 10, 20, 30][i];
  const base = { tier: i + 1, logs: `${log}-logs` };
  return [
    { ...base, id: `${log}-tree`, level, old: false, seconds, xp, count: 1, findMultiple: 1 },
    {
      ...base,
      id: `old-${log}`,
      level: level + 4,
      old: true,
      seconds: seconds * 1.5,
      xp: Math.round(xp * 1.3),
      count: 2,
      findMultiple: 1.5,
    },
  ];
});

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
const FIND_VALUE: Record<string, number> = {
  'birds-nest': 100,
  'amber-nugget': 1200,
  'carved-acorn': 1000,
  'heartwood-knot': 12000,
  'silverbark-seed': 0,
  'crown-of-the-old-wood': 0,
};

export const ITEMS: Item[] = [
  ...LOGS.map((log, i): Item => ({ id: `${log}-logs`, kind: 'resource', value: LOG_VALUE[i] })),
  ...FINDS.map((f): Item => ({ id: f.item, kind: 'find', value: FIND_VALUE[f.item] })),
];

export const LADDER = buildLadder(
  TREES.map((tree) => ({ id: tree.id, level: tree.level })),
  [
    { perk: 'quick-swing', effect: { kind: 'speed', pct: 2.5 }, levels: [2, 7, 12, 17, 22, 27, 32, 37] },
    { perk: 'plenty', effect: { kind: 'extraYield', pct: 3 }, levels: [3, 8, 13, 18, 23, 28, 33, 38] },
    { perk: 'woodsmans-eye', effect: { kind: 'findChance', pct: 8 }, levels: [4, 9, 15, 19, 25, 29, 35, 39] },
    { perk: 'practised-hands', effect: { kind: 'masteryGain', pct: 6 }, levels: [6, 11, 16, 21, 26, 31, 36] },
    { perk: 'master-woodcutter', effect: { kind: 'extraYield', pct: 10 }, levels: [40] },
  ],
);
