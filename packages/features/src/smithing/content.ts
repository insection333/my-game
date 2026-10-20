// Smithing's content: a bar and six pieces of gear per tier (a sword, a staff and a bow, so each combat
// style has its weapon; a helm, legs and a body), what each takes, six finds and the unlock ladder.
// Every recipe in a tier pays the same XP an hour; numbers match GAME_DESIGN.md section 6.
import { buildLadder, TIER_LEVELS, TIER_SECONDS, TIER_XP_PER_HOUR, type Find, type Item } from '@idle-clash/content';

export const SKILL = 'smithing';

export interface Recipe {
  id: string;
  level: number;
  tier: number;
  kind: 'bar' | 'sword' | 'staff' | 'bow' | 'helm' | 'legs' | 'body';
  takes: { item: string; count: number }[];
  gives: { item: string; count: number }[];
  seconds: number;
  xp: number;
  findMultiple: number;
}

const METALS = ['copper', 'bronze', 'iron', 'steel'];
const LOGS = ['pine-logs', 'ash-logs', 'oak-logs', 'yew-logs'];
const BAR_INPUTS: Record<string, number>[] = [
  { 'copper-ore': 1 },
  { 'copper-ore': 1, 'tin-ore': 1 },
  { 'iron-ore': 2 },
  { 'iron-ore': 1, coal: 2 },
];
const BAR_VALUE = [2, 7, 36, 96];
const LOG_VALUE = [1, 4, 14, 35];
/** Gear by kind: its level within the tier's ten, and how many bars and logs it takes. */
const GEAR = [
  { kind: 'sword', offset: 1, bars: 3, logs: 0 },
  { kind: 'staff', offset: 2, bars: 2, logs: 1 },
  { kind: 'bow', offset: 3, bars: 1, logs: 2 },
  { kind: 'helm', offset: 5, bars: 2, logs: 0 },
  { kind: 'legs', offset: 6, bars: 3, logs: 0 },
  { kind: 'body', offset: 8, bars: 5, logs: 0 },
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
  return [bar, ...gear];
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

/** Bars and gear (gear is worth 40% more than what it takes), and the finds. */
export const ITEMS: Item[] = [
  ...METALS.map((m, i): Item => ({ id: `${m}-bar`, kind: 'resource', value: BAR_VALUE[i] })),
  ...METALS.flatMap((m, i) =>
    GEAR.map((g): Item => ({
      id: `${m}-${g.kind}`,
      kind: 'gear',
      value: Math.round((g.bars * BAR_VALUE[i] + g.logs * LOG_VALUE[i]) * 1.4),
    })),
  ),
  ...FINDS.map((f): Item => ({ id: f.item, kind: 'find', value: FIND_VALUE[f.item] ?? 0 })),
];

export const LADDER = buildLadder(RECIPES, [
  { perk: 'steady-forge', effect: { kind: 'speed', pct: 3 }, levels: [5, 19, 34] },
  { perk: 'thrifty', effect: { kind: 'saveInput', pct: 4 }, levels: [8, 24, 37] },
  { perk: 'smiths-eye', effect: { kind: 'findChance', pct: 8 }, levels: [14, 27, 39] },
  { perk: 'practised-hands', effect: { kind: 'masteryGain', pct: 8 }, levels: [17, 29] },
  { perk: 'master-smith', effect: { kind: 'saveInput', pct: 8 }, levels: [40] },
]);
