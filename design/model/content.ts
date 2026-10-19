// Design-time content for Idle Clash version 1. This is the paper model's data;
// session 3 onward moves it into packages/features/*/content.ts behind Zod schemas.

export type SkillId =
  | 'woodcutting' | 'mining' | 'smithing'
  | 'melee' | 'archery' | 'magic' | 'hitpoints';
export type Style = 'melee' | 'archery' | 'magic';

export const SKILLS: { id: SkillId; name: string; lane: 'gathering' | 'artisan' | 'combat' }[] = [
  { id: 'woodcutting', name: 'Woodcutting', lane: 'gathering' },
  { id: 'mining', name: 'Mining', lane: 'gathering' },
  { id: 'smithing', name: 'Smithing', lane: 'artisan' },
  { id: 'melee', name: 'Melee', lane: 'combat' },
  { id: 'archery', name: 'Archery', lane: 'combat' },
  { id: 'magic', name: 'Magic', lane: 'combat' },
  { id: 'hitpoints', name: 'Hitpoints', lane: 'combat' },
];

export const TIERS = [
  { tier: 1, metal: 'Copper', level: 1, log: 'Pine', ore: 'Copper ore' },
  { tier: 2, metal: 'Bronze', level: 10, log: 'Ash', ore: 'Tin ore' },
  { tier: 3, metal: 'Iron', level: 20, log: 'Oak', ore: 'Iron ore' },
  { tier: 4, metal: 'Steel', level: 30, log: 'Yew', ore: 'Coal' },
] as const;

// Base pace per tier: seconds for a standard gathering action (and per input unit in Smithing),
// and the XP per hour that action pays before mastery and perks.
export const TIER_SECONDS = [7.5, 12.5, 20, 26];
export const TIER_XP_PER_HOUR = [5400, 7200, 9300, 12000];

// Vendor prices: a gathering lane sells for about 600, 1,500, 3,500 and 7,000 gold an hour by tier.
export const VALUE = {
  log: [1, 4, 14, 35], // pine, ash, oak, yew
  ore: [1, 4, 14, 30], // copper, tin, iron, coal
  bar: [2, 7, 36, 96], // copper, bronze, iron, steel: about 1.3 times their ores
};

export interface GatherAction {
  id: string; skill: 'woodcutting' | 'mining'; name: string; level: number; tier: number;
  kind: 'standard' | 'rich'; seconds: number; xp: number; item: string; qty: number; findMult: number;
}

function gatherActions(skill: 'woodcutting' | 'mining'): GatherAction[] {
  const out: GatherAction[] = [];
  for (const t of TIERS) {
    const i = t.tier - 1;
    const res = skill === 'woodcutting' ? `${t.log} logs` : t.ore;
    const base = skill === 'woodcutting' ? `${t.log} tree` : `${t.ore.replace(' ore', '')} vein`;
    const rich = skill === 'woodcutting' ? `Old ${t.log.toLowerCase()}` : `Deep ${t.ore.replace(' ore', '').toLowerCase()} seam`;
    const s = TIER_SECONDS[i];
    const xp = Math.round((TIER_XP_PER_HOUR[i] * s) / 3600);
    out.push({ id: `${skill}.${i + 1}`, skill, name: base, level: t.level, tier: t.tier, kind: 'standard', seconds: s, xp, item: res, qty: 1, findMult: 1 });
    out.push({ id: `${skill}.${i + 1}r`, skill, name: rich, level: t.level + 4, tier: t.tier, kind: 'rich', seconds: s * 1.5, xp: Math.round(xp * 1.3), item: res, qty: 2, findMult: 1.5 });
  }
  return out;
}
export const WOODCUTTING = gatherActions('woodcutting');
export const MINING = gatherActions('mining');

export interface Recipe {
  id: string; name: string; level: number; tier: number; kind: string;
  inputs: Record<string, number>; seconds: number; xp: number; value: number;
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
};
export const SMITHING: Recipe[] = TIERS.flatMap((t) => {
  const i = t.tier - 1;
  const unit = TIER_SECONDS[i];
  const rate = TIER_XP_PER_HOUR[i] / 3600;
  const barInputs = BAR_INPUTS[t.tier];
  const barUnits = Object.values(barInputs).reduce((a, b) => a + b, 0);
  const bar: Recipe = {
    id: `smithing.bar${t.tier}`, name: `${t.metal} bar`, level: t.level, tier: t.tier, kind: 'bar',
    inputs: barInputs, seconds: unit * barUnits, xp: 0, value: VALUE.bar[i],
  };
  bar.xp = Math.round(rate * bar.seconds);
  const gear = GEAR.map((g): Recipe => {
    const inputs: Record<string, number> = { [`${t.metal} bar`]: g.bars };
    if (g.logs) inputs[`${t.log} logs`] = g.logs;
    const seconds = unit * (g.bars + g.logs);
    return {
      id: `smithing.${g.kind}${t.tier}`, name: `${t.metal} ${g.kind}`, level: t.level + g.offset, tier: t.tier,
      kind: g.kind, inputs, seconds, xp: Math.round(rate * seconds),
      value: Math.round((g.bars * VALUE.bar[i] + g.logs * VALUE.log[i]) * 1.4),
    };
  });
  return [bar, ...gear];
});

// [hp, maxHit, xp per kill, gold per kill], written by design/model/calibrate.ts
import FOE_STATS_JSON from './foe-stats.json' with { type: 'json' };
export const FOE_STATS = FOE_STATS_JSON as Record<string, [number, number, number, number]>;

export interface Foe {
  id: string; name: string; style: Style; level: number; hp: number; maxHit: number; xp: number;
  hitpoints: number; gold: number; drop: string; tier: number;
}
export const beatenBy: Record<Style, Style> = { archery: 'melee', magic: 'archery', melee: 'magic' };
// A foe opens at a Hitpoints level, so every style can reach it. hp, maxHit, xp and gold are calibrated
// by design/model/calibrate.ts against the intended matchup: the style that beats it, in tier gear.
const foe = (id: string, name: string, style: Style, level: number, hitpoints: number, drop: string, tier: number): Foe => {
  const [hp, maxHit, xp, gold] = FOE_STATS[id] ?? [100, 10, 36, 1];
  return { id, name, style, level, hitpoints, drop, tier, hp, maxHit, xp, gold };
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
];

export const FOODS = [
  { id: 'bread', name: 'Bread', heals: 140, price: 20, level: 1 },
  { id: 'meat-pie', name: 'Meat pie', heals: 320, price: 50, level: 10 },
  { id: 'hearty-stew', name: 'Hearty stew', heals: 600, price: 110, level: 20 },
];

// Six finds per skill: a lesser and a greater at each rarity. Greater finds come only from tier 3-4 actions.
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
export const FINDS: Record<Exclude<SkillId, 'hitpoints'>, [string, string][]> = {
  woodcutting: [["Bird's nest", 'Amber nugget'], ['Carved acorn', 'Heartwood knot'], ['Silverbark seed', 'Crown of the old wood']],
  mining: [['Rough garnet', 'Rough sapphire'], ['Ancient coin', 'Crystal geode'], ['Star-iron shard', 'Heart of the mountain']],
  smithing: [['Lucky horseshoe', 'Masterwork rivets'], ["Guild smith's seal", 'Quenching flask'], ['Ember of the first forge', "Old king's hammer"]],
  melee: [['Battle trophy', "Raider's war-horn"], ['Torn banner', "Warlord's seal"], ['Shard of a king’s blade', "Troll-chief's tooth"]],
  archery: [['Goose fletchings', "Hunter's charm"], ['Silver arrowhead', "Bowman's ring"], ['Moonlit bowstring', 'Eagle-feather circlet']],
  magic: [['Glimmer stone', 'Wisp lantern'], ['Rune-scratched tablet', "Wight's ring"], ['Star-glass orb', "Sorcerer's eye"]],
};

// Mastery: cumulative completions for steps 1-10, and what each step gives.
export const MASTERY_STEPS = [30, 90, 210, 450, 900, 1800, 3600, 7200, 14400, 28800];
export const MASTERY_PER_STEP = { speed: 0.03, extraYield: 0.06, findChance: 0 };

export const STOREHOUSE = { startSlots: 24, slotsPerEnlargement: 6, costs: [40000, 90000, 100000, 120000, 180000, 200000, 230000, 250000] };
export const FIRE = { xpBonus: 0.15, extraGatheringLanes: 1, idleMinutesBeforeOut: 5 };
