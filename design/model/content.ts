// Design-time content for Idle Clash version 1. This is the paper model's data;
// session 3 onward moves it into packages/features/*/content.ts behind Zod schemas.

export type SkillId =
  | 'woodcutting'
  | 'mining'
  | 'fishing'
  | 'runecraft'
  | 'smithing'
  | 'cooking'
  | 'fletching'
  | 'melee'
  | 'archery'
  | 'magic'
  | 'hitpoints';
export type GatherSkill = 'woodcutting' | 'mining' | 'fishing' | 'runecraft';
export type Style = 'melee' | 'archery' | 'magic';

export const SKILLS: { id: SkillId; name: string; lane: 'gathering' | 'artisan' | 'combat' }[] = [
  { id: 'woodcutting', name: 'Woodcutting', lane: 'gathering' },
  { id: 'mining', name: 'Mining', lane: 'gathering' },
  { id: 'fishing', name: 'Fishing', lane: 'gathering' },
  { id: 'runecraft', name: 'Runecraft', lane: 'gathering' },
  { id: 'smithing', name: 'Smithing', lane: 'artisan' },
  { id: 'cooking', name: 'Cooking', lane: 'artisan' },
  { id: 'fletching', name: 'Fletching', lane: 'artisan' },
  { id: 'melee', name: 'Melee', lane: 'combat' },
  { id: 'archery', name: 'Archery', lane: 'combat' },
  { id: 'magic', name: 'Magic', lane: 'combat' },
  { id: 'hitpoints', name: 'Hitpoints', lane: 'combat' },
];

/** The top level (version 1 stopped at 40; the expansion climbs to 99 over eight tiers). */
export const MAX_LEVEL = 99;

// Tiers 5 to 8 (the expansion, docs/EXPANSION.md): the Sunken Fen's metals and woods, then the Ashen
// Peaks'. Their gaps grow (15 levels), so the late tiers are earned.
export const TIERS = [
  { tier: 1, metal: 'Copper', level: 1, log: 'Pine', ore: 'Copper ore', fish: 'Perch', rune: 'Spark' },
  { tier: 2, metal: 'Bronze', level: 10, log: 'Ash', ore: 'Tin ore', fish: 'Trout', rune: 'Gale' },
  { tier: 3, metal: 'Iron', level: 20, log: 'Oak', ore: 'Iron ore', fish: 'Pike', rune: 'Tide' },
  { tier: 4, metal: 'Steel', level: 30, log: 'Yew', ore: 'Coal', fish: 'Salmon', rune: 'Earth' },
  { tier: 5, metal: 'Moonsilver', level: 40, log: 'Maple', ore: 'Moonsilver ore', fish: 'Moon carp', rune: 'Moon' },
  { tier: 6, metal: 'Star-iron', level: 55, log: 'Silverbark', ore: 'Star-iron ore', fish: 'Silver eel', rune: 'Star' },
  { tier: 7, metal: 'Embersteel', level: 70, log: 'Elderwood', ore: 'Ember ore', fish: 'Ember char', rune: 'Ember' },
  { tier: 8, metal: 'Dawnsteel', level: 85, log: 'Ancient', ore: 'Dawnstone', fish: 'Dawn sturgeon', rune: 'Dawn' },
] as const;

// Base pace per tier: seconds for a standard gathering action (and per input unit in Smithing),
// and the XP per hour that action pays before mastery and perks.
export const TIER_SECONDS = [7.5, 12.5, 20, 26, 30, 34, 38, 42];
export const TIER_XP_PER_HOUR = [5400, 7200, 9300, 12000, 17000, 22000, 28000, 35000];

// Vendor prices: a gathering lane sells for about 600, 1,500, 3,500 and 7,000 gold an hour by tier,
// then about 8,000, 12,000, 17,000 and 23,000.
export const VALUE = {
  log: [1, 4, 14, 35, 70, 115, 180, 270], // pine, ash, oak, yew, maple, silverbark, elderwood, ancient
  ore: [1, 4, 14, 30, 60, 100, 160, 240], // copper, tin, iron, coal, moonsilver, star-iron, ember, dawnstone
  bar: [2, 7, 36, 96, 117, 208, 286, 468], // about 1.3 times their ores
  fish: [1, 2, 6, 14, 28, 46, 72, 108], // 40% of logs: Fishing pays mostly in the food it saves
  rune: [0, 0, 2, 4, 8, 13, 20, 30], // an eighth of ore: a draw gives eight, so Runecraft pays as Mining
};

export interface GatherAction {
  id: string;
  skill: GatherSkill;
  name: string;
  level: number;
  tier: number;
  kind: 'standard' | 'rich';
  seconds: number;
  xp: number;
  item: string;
  qty: number;
  findMult: number;
}

function gatherActions(skill: GatherSkill): GatherAction[] {
  const out: GatherAction[] = [];
  for (const t of TIERS) {
    const i = t.tier - 1;
    // The ore's own word: "Copper ore" mines from a copper vein, Dawnstone from a dawnstone vein.
    const rock = t.ore.replace(' ore', '');
    const [res, base, rich] = {
      woodcutting: [`${t.log} logs`, `${t.log} tree`, `Old ${t.log.toLowerCase()}`],
      mining: [t.ore, `${rock} vein`, `Deep ${rock.toLowerCase()} seam`],
      fishing: [t.fish, `${t.fish} shallows`, `Deep ${t.fish.toLowerCase()} pool`],
      runecraft: [`${t.rune} rune`, `${t.rune} stone`, `Ancient ${t.rune.toLowerCase()} stone`],
    }[skill];
    const per = skill === 'runecraft' ? 8 : 1;
    const s = TIER_SECONDS[i];
    const xp = Math.round((TIER_XP_PER_HOUR[i] * s) / 3600);
    out.push({
      id: `${skill}.${i + 1}`,
      skill,
      name: base,
      level: t.level,
      tier: t.tier,
      kind: 'standard',
      seconds: s,
      xp,
      item: res,
      qty: per,
      findMult: 1,
    });
    out.push({
      id: `${skill}.${i + 1}r`,
      skill,
      name: rich,
      level: t.level + 4,
      tier: t.tier,
      kind: 'rich',
      seconds: s * 1.5,
      xp: Math.round(xp * 1.3),
      item: res,
      qty: 2 * per,
      findMult: 1.5,
    });
  }
  return out;
}
export const WOODCUTTING = gatherActions('woodcutting');
export const MINING = gatherActions('mining');
export const FISHING = gatherActions('fishing');
export const RUNECRAFT = gatherActions('runecraft');

export interface Recipe {
  id: string;
  name: string;
  level: number;
  tier: number;
  kind: string;
  inputs: Record<string, number>;
  seconds: number;
  xp: number;
  value: number;
  /** How many one making gives (supplies come 25 at a time). */
  makes?: number;
}
// Offsets within each tier's ten levels: bar 0, sword 1, staff 2, bow 3, helm 5, legs 6, body 8.
const GEAR: { kind: string; offset: number; bars: number; logs: number }[] = [
  { kind: 'sword', offset: 1, bars: 3, logs: 0 },
  { kind: 'staff', offset: 2, bars: 2, logs: 1 },
  { kind: 'bow', offset: 3, bars: 1, logs: 2 },
  { kind: 'helm', offset: 5, bars: 2, logs: 0 },
  { kind: 'legs', offset: 6, bars: 3, logs: 0 },
  { kind: 'body', offset: 8, bars: 5, logs: 0 },
];
const BAR_INPUTS: Record<number, Record<string, number>> = {
  1: { 'Copper ore': 1 },
  2: { 'Copper ore': 1, 'Tin ore': 1 },
  3: { 'Iron ore': 2 },
  4: { 'Iron ore': 1, Coal: 2 },
  5: { 'Moonsilver ore': 1, Coal: 1 },
  6: { 'Star-iron ore': 1, Coal: 2 },
  7: { 'Ember ore': 1, Coal: 2 },
  8: { Dawnstone: 1, 'Moonsilver ore': 1, Coal: 2 },
};
export const SMITHING: Recipe[] = TIERS.flatMap((t) => {
  const i = t.tier - 1;
  const unit = TIER_SECONDS[i];
  const rate = TIER_XP_PER_HOUR[i] / 3600;
  const barInputs = BAR_INPUTS[t.tier];
  const barUnits = Object.values(barInputs).reduce((a, b) => a + b, 0);
  const bar: Recipe = {
    id: `smithing.bar${t.tier}`,
    name: `${t.metal} bar`,
    level: t.level,
    tier: t.tier,
    kind: 'bar',
    inputs: barInputs,
    seconds: unit * barUnits,
    xp: 0,
    value: VALUE.bar[i],
  };
  bar.xp = Math.round(rate * bar.seconds);
  const gear = GEAR.map((g): Recipe => {
    const inputs: Record<string, number> = { [`${t.metal} bar`]: g.bars };
    if (g.logs) inputs[`${t.log} logs`] = g.logs;
    const seconds = unit * (g.bars + g.logs);
    return {
      id: `smithing.${g.kind}${t.tier}`,
      name: `${t.metal} ${g.kind}`,
      level: t.level + g.offset,
      tier: t.tier,
      kind: g.kind,
      inputs,
      seconds,
      xp: Math.round(rate * seconds),
      value: Math.round((g.bars * VALUE.bar[i] + g.logs * VALUE.log[i]) * 1.4),
    };
  });
  return [bar, ...gear];
});

// [hp, maxHit, xp per kill, gold per kill], written by design/model/calibrate.ts
import FOE_STATS_JSON from './foe-stats.json' with { type: 'json' };
export const FOE_STATS = FOE_STATS_JSON as unknown as Record<string, [number, number, number, number]>;

export interface Foe {
  id: string;
  name: string;
  style: Style;
  level: number;
  hp: number;
  maxHit: number;
  xp: number;
  hitpoints: number;
  gold: number;
  drop: string;
  tier: number;
  /** The region it is fought in: the march (1), the Sunken Fen (2), the Ashen Peaks (3). */
  region: number;
}
export const beatenBy: Record<Style, Style> = { archery: 'melee', magic: 'archery', melee: 'magic' };
// A foe opens at a Hitpoints level, so every style can reach it. hp, maxHit, xp and gold are calibrated
// by design/model/calibrate.ts against the intended matchup: the style that beats it, in tier gear.
const foe = (
  id: string,
  name: string,
  style: Style,
  level: number,
  hitpoints: number,
  drop: string,
  tier: number,
): Foe => {
  const [hp, maxHit, xp, gold] = FOE_STATS[id] ?? [100, 10, 36, 1];
  const region = tier <= 4 ? 1 : tier <= 6 ? 2 : 3;
  return { id, name, style, level, hitpoints, drop, tier, region, hp, maxHit, xp, gold };
};
export const FOES: Foe[] = [
  foe('hollow-rat', 'Hollow rat', 'melee', 2, 1, 'Copper ore', 1),
  foe('goblin-slinger', 'Goblin slinger', 'archery', 4, 2, 'Pine logs', 1),
  foe('marsh-wisp', 'Marsh wisp', 'magic', 6, 3, 'Copper bar', 1),
  foe('orc-raider', 'Orc raider', 'melee', 15, 14, 'Tin ore', 2),
  foe('orc-bowman', 'Orc bowman', 'archery', 19, 18, 'Bronze bar', 2),
  foe('grave-wight', 'Grave wight', 'magic', 24, 22, 'Iron ore', 3),
  foe('hill-troll', 'Hill troll', 'melee', 29, 27, 'Oak logs', 3),
  foe('fell-huntsman', 'Fell huntsman', 'archery', 37, 34, 'Steel bar', 4),
  // The Sunken Fen (tiers 5 and 6).
  foe('bog-lurker', 'Bog lurker', 'melee', 42, 40, 'Maple logs', 5),
  foe('reed-stalker', 'Reed stalker', 'archery', 46, 44, 'Moonsilver ore', 5),
  foe('drowned-acolyte', 'Drowned acolyte', 'magic', 51, 49, 'Moonsilver bar', 5),
  foe('mire-hulk', 'Mire hulk', 'melee', 57, 55, 'Silverbark logs', 6),
  foe('fen-reaver', 'Fen reaver', 'archery', 62, 60, 'Star-iron ore', 6),
  foe('bog-witch', 'Bog witch', 'magic', 67, 65, 'Star-iron bar', 6),
  // The Ashen Peaks (tiers 7 and 8).
  foe('ash-troll', 'Ash troll', 'melee', 72, 70, 'Elderwood logs', 7),
  foe('peak-slinger', 'Peak slinger', 'archery', 77, 75, 'Ember ore', 7),
  foe('ash-shaman', 'Ash shaman', 'magic', 82, 80, 'Embersteel bar', 7),
  foe('obsidian-golem', 'Obsidian golem', 'melee', 87, 85, 'Ancient logs', 8),
  foe('sky-reaver', 'Sky reaver', 'archery', 92, 90, 'Dawnstone', 8),
  foe('ember-sorcerer', 'Ember sorcerer', 'magic', 97, 95, 'Dawnsteel bar', 8),
];

export const FOODS = [
  { id: 'bread', name: 'Bread', heals: 140, price: 20, level: 1 },
  { id: 'meat-pie', name: 'Meat pie', heals: 320, price: 50, level: 10 },
  { id: 'hearty-stew', name: 'Hearty stew', heals: 600, price: 110, level: 20 },
  { id: 'roast-fowl', name: 'Roast fowl', heals: 1000, price: 190, level: 40 },
  { id: 'hunters-feast', name: "Hunter's feast", heals: 1600, price: 320, level: 60 },
  { id: 'wardens-feast', name: "Warden's feast", heals: 2300, price: 480, level: 80 },
];

// Six finds per skill: a lesser and a greater at each rarity. Greater finds come only from tier 3 and up.
// Uncommon finds use luck, shared by all lanes: each action that finds nothing raises the next chance
// by LUCK_STEP, so finds average 1 in 50 actions but arrive evenly. After LUCK_GUARANTEE_SECONDS of
// active play with no notable moment, the next action's find is certain. Rare and Legendary are
// plain chances, raised by find perks.
export const LUCK_STEP = 0.00062;
export const LUCK_GUARANTEE_SECONDS = 240;
export const RARITY = [
  { id: 'uncommon', name: 'Uncommon', chance: 1 / 50 },
  { id: 'rare', name: 'Rare', chance: 1 / 500 },
  { id: 'legendary', name: 'Legendary', chance: 1 / 5000 },
] as const;
export { FINDS } from './finds.ts';

// Mastery: cumulative completions for steps 1-10, and what each step gives.
export const MASTERY_STEPS = [30, 90, 210, 450, 900, 1800, 3600, 7200, 14400, 28800];
export const MASTERY_PER_STEP = { speed: 0.03, extraYield: 0.06, findChance: 0 };

export const STOREHOUSE = {
  startSlots: 24,
  slotsPerEnlargement: 6,
  costs: [
    40000, 90000, 100000, 120000, 180000, 200000, 230000, 250000, 280000, 300000, 340000, 450000, 460000, 650000,
    700000, 750000, 800000, 850000, 900000, 925000, 950000, 975000, 1000000, 1000000, 1000000,
  ],
};
export const FIRE = { xpBonus: 0.15, extraGatheringLanes: 1, idleMinutesBeforeOut: 5 };
