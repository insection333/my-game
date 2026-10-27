// Smithing's content: a bar and six pieces of gear per tier (a sword, a staff and a bow, so each combat
// style has its weapon; a helm, legs and a body), Melee's whetstones and the standing stones' keys, what
// each takes, six finds and the unlock ladder.
// Every recipe in a tier pays the same XP an hour; numbers match GAME_DESIGN.md section 6.
import {
  buildLadder,
  fillPerks,
  TIER_LEVELS,
  TIER_SECONDS,
  TIER_XP_PER_HOUR,
  type Find,
  type Item,
} from '@idle-clash/content';

export const SKILL = 'smithing';

export interface Recipe {
  id: string;
  level: number;
  tier: number;
  kind: 'bar' | 'whetstones' | 'key' | 'sword' | 'staff' | 'bow' | 'helm' | 'legs' | 'body';
  takes: { item: string; count: number }[];
  gives: { item: string; count: number }[];
  seconds: number;
  xp: number;
  findMultiple: number;
}

const METALS = ['copper', 'bronze', 'iron', 'steel', 'moonsilver', 'star-iron', 'embersteel', 'dawnsteel'];
const LOGS = [
  'pine-logs',
  'ash-logs',
  'oak-logs',
  'yew-logs',
  'maple-logs',
  'silverbark-logs',
  'elderwood-logs',
  'ancient-logs',
];
/** Later bars are alloys, so earlier ores keep their use: coal in every bar from steel on. */
const BAR_INPUTS: Record<string, number>[] = [
  { 'copper-ore': 1 },
  { 'copper-ore': 1, 'tin-ore': 1 },
  { 'iron-ore': 2 },
  { 'iron-ore': 1, coal: 2 },
  { 'moonsilver-ore': 1, coal: 1 },
  { 'star-iron-ore': 1, coal: 2 },
  { 'ember-ore': 1, coal: 2 },
  { dawnstone: 1, 'moonsilver-ore': 1, coal: 2 },
];
const BAR_VALUE = [2, 7, 36, 96, 117, 208, 286, 468];
/** How many whetstones one bar makes. */
const SUPPLY_BATCH = 25;
const LOG_VALUE = [1, 4, 14, 35, 70, 115, 180, 270];
/** Gear by kind: its level within the tier's ten, and how many bars and logs it takes. */
const GEAR = [
  { kind: 'sword', offset: 1, bars: 3, logs: 0, slot: 'weapon', style: 'melee' },
  { kind: 'staff', offset: 2, bars: 2, logs: 1, slot: 'weapon', style: 'magic' },
  { kind: 'bow', offset: 3, bars: 1, logs: 2, slot: 'weapon', style: 'archery' },
  { kind: 'helm', offset: 5, bars: 2, logs: 0, slot: 'helm' },
  { kind: 'legs', offset: 6, bars: 3, logs: 0, slot: 'legs' },
  { kind: 'body', offset: 8, bars: 5, logs: 0, slot: 'body' },
] as const;

const list = (r: Record<string, number>) => Object.entries(r).map(([item, count]) => ({ item, count }));

export const RECIPES: Recipe[] = METALS.flatMap((metal, i) => {
  const unit = TIER_SECONDS[i];
  const xpOf = (seconds: number) => Math.round((TIER_XP_PER_HOUR[i] * seconds) / 3600);
  const units = Object.values(BAR_INPUTS[i]).reduce((a, b) => a + b, 0);
  const bar: Recipe = {
    id: `${metal}-bar`,
    level: TIER_LEVELS[i],
    tier: i + 1,
    kind: 'bar',
    takes: list(BAR_INPUTS[i]),
    gives: [{ item: `${metal}-bar`, count: 1 }],
    seconds: unit * units,
    xp: xpOf(unit * units),
    findMultiple: 1,
  };
  // Melee's supply, 25 at a time from a bar, and from tier 2 the key to the tier's standing stones (two
  // bars, kept by Runecraft): both open with the bar, so Smithing's perks stay where they were.
  const whetstones: Recipe = {
    id: `${metal}-whetstones`,
    level: TIER_LEVELS[i],
    tier: i + 1,
    kind: 'whetstones',
    takes: [{ item: `${metal}-bar`, count: 1 }],
    gives: [{ item: `${metal}-whetstones`, count: SUPPLY_BATCH }],
    seconds: unit,
    xp: xpOf(unit),
    findMultiple: 1,
  };
  const key: Recipe[] =
    i === 0
      ? []
      : [
          {
            id: `${metal}-key`,
            level: TIER_LEVELS[i],
            tier: i + 1,
            kind: 'key',
            takes: [{ item: `${metal}-bar`, count: 2 }],
            gives: [{ item: `${metal}-key`, count: 1 }],
            seconds: unit * 2,
            xp: xpOf(unit * 2),
            findMultiple: 1,
          },
        ];
  const gear = GEAR.map((g): Recipe => ({
    id: `${metal}-${g.kind}`,
    level: TIER_LEVELS[i] + g.offset,
    tier: i + 1,
    kind: g.kind,
    takes: list({ [`${metal}-bar`]: g.bars, ...(g.logs ? { [LOGS[i]]: g.logs } : {}) }),
    gives: [{ item: `${metal}-${g.kind}`, count: 1 }],
    seconds: unit * (g.bars + g.logs),
    xp: xpOf(unit * (g.bars + g.logs)),
    findMultiple: 1,
  }));
  return [bar, whetstones, ...key, ...gear];
});

export const FINDS: Find[] = [
  { item: 'lucky-horseshoe', rarity: 'uncommon', greater: false },
  { item: 'masterwork-rivets', rarity: 'uncommon', greater: true },
  { item: 'guild-smiths-seal', rarity: 'rare', greater: false },
  { item: 'quenching-flask', rarity: 'rare', greater: true },
  { item: 'ember-of-the-first-forge', rarity: 'legendary', greater: false },
  { item: 'old-kings-hammer', rarity: 'legendary', greater: true },
];
const FIND_VALUE: Record<string, number> = {
  'lucky-horseshoe': 200,
  'masterwork-rivets': 3000,
  'guild-smiths-seal': 2000,
  'quenching-flask': 30000,
};

/** Bars, whetstones (a supply, each worth its share of the bar), keys and gear (both worth 40% more than
 *  what they take), and the finds. */
export const ITEMS: Item[] = [
  ...METALS.map((m, i): Item => ({ id: `${m}-bar`, kind: 'resource', value: BAR_VALUE[i] })),
  ...METALS.map((m, i): Item => ({
    id: `${m}-whetstones`,
    kind: 'supply',
    value: Math.round(BAR_VALUE[i] / SUPPLY_BATCH),
    supply: { style: 'melee', tier: i + 1 },
  })),
  ...METALS.slice(1).map((m, i): Item => ({
    id: `${m}-key`,
    kind: 'resource',
    value: Math.round(2 * BAR_VALUE[i + 1] * 1.4),
  })),
  ...METALS.flatMap((m, i) =>
    GEAR.map((g): Item => ({
      id: `${m}-${g.kind}`,
      kind: 'gear',
      value: Math.round((g.bars * BAR_VALUE[i] + g.logs * LOG_VALUE[i]) * 1.4),
      gear: { slot: g.slot, tier: i + 1, ...('style' in g ? { style: g.style } : {}) },
    })),
  ),
  ...FINDS.map((f): Item => ({ id: f.item, kind: 'find', value: FIND_VALUE[f.item] ?? 0 })),
];

export const LADDER = fillPerks(
  buildLadder(RECIPES, []),
  [
    { perk: 'steady-forge', effect: { kind: 'speed', pct: 3 } },
    { perk: 'thrifty', effect: { kind: 'saveInput', pct: 4 } },
    { perk: 'smiths-eye', effect: { kind: 'findChance', pct: 8 } },
    { perk: 'practised-hands', effect: { kind: 'masteryGain', pct: 8 } },
  ],
  {
    40: { perk: 'master-smith', effect: { kind: 'saveInput', pct: 8 } },
    99: { perk: 'grandmaster-smith', effect: { kind: 'saveInput', pct: 10 } },
  },
);
