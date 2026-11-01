// Castle Clash's content (docs/castle-clash/SPEC.md section 5): units and their evolutions, buildings,
// traps, castellans, decrees, the edicts, spy missions, incursion fortresses, the War College and the
// war relics. Ids only: every name a player reads is in the strings file (`castle.*`, Phase 4).
import { GOLD_SCALE } from './constants.ts';

/** Unit indices in the matrix: 0 vanguard, 1 outriders, 2 siege. */
export const UNIT_IDS = ['vanguard', 'outriders', 'siege'] as const;
export type UnitId = (typeof UNIT_IDS)[number];

/** What a passive, a castellan, a tech, a relic or a decree changes. Percents are whole numbers
 *  (10 = +10%); penetration is a share of the walls' bonus (0.05 = 5% more of it bypassed). */
export type CastleEffect =
  | { kind: 'attack' | 'defense'; pct: number; unit?: UnitId }
  | { kind: 'stealth' | 'detection' | 'loot' | 'marks' | 'vaultProtect' | 'recovery' | 'apRate'; pct: number }
  | { kind: 'penetration'; share: number }
  | { kind: 'woundsTaken'; pct: number }
  | { kind: 'trapImmune'; unit: UnitId }
  | { kind: 'wallDamage'; pct: number }
  | { kind: 'apCap'; amount: number }
  | { kind: 'costs'; pct: number; of: 'upgrades' | 'bribes' | 'excavation' | 'repair' | 'upkeep' };

/** A unit's four evolutions, at levels 1, 10, 25 and 50; each from the second adds its passive. */
export const EVOLUTION_LEVELS = [1, 10, 25, 50] as const;
export interface Unit {
  id: UnitId;
  /** Its base in the rating and in combat: statPower(100, level). */
  power: number;
  /** Its base upgrade cost: upgradeGoldCost(base, level). */
  cost: number;
  /** The four evolutions' ids, in order. */
  evolutions: readonly [string, string, string, string];
  /** The passive each of the last three evolutions brings, in addition to the ones before. */
  passives: readonly [CastleEffect, CastleEffect, CastleEffect];
}

export const UNITS: readonly Unit[] = [
  {
    id: 'vanguard',
    power: 100,
    cost: 4000 * GOLD_SCALE,
    evolutions: ['levy-spearmen', 'ironclad-halberdiers', 'sunforged-phalanx', 'immortal-aegis'],
    passives: [
      { kind: 'defense', pct: 10, unit: 'vanguard' },
      { kind: 'woundsTaken', pct: -20 },
      { kind: 'trapImmune', unit: 'vanguard' },
    ],
  },
  {
    id: 'outriders',
    power: 100,
    cost: 4000 * GOLD_SCALE,
    evolutions: ['border-scouts', 'lancer-dragoons', 'shadowmane-cavaliers', 'stormhoof-cataphracts'],
    passives: [
      { kind: 'stealth', pct: 10 },
      { kind: 'loot', pct: 10 },
      { kind: 'attack', pct: 10, unit: 'outriders' },
    ],
  },
  {
    id: 'siege',
    power: 100,
    cost: 4000 * GOLD_SCALE,
    evolutions: ['timber-trebuchets', 'dwarven-bombardiers', 'alchemical-hellcannons', 'arcane-conflux-engines'],
    passives: [
      { kind: 'penetration', share: 0.05 },
      { kind: 'wallDamage', pct: 25 },
      { kind: 'penetration', share: 0.1 },
    ],
  },
];

/** The four buildings. `power` is its base in the rating (the deep vault adds none: a vault is not a
 *  threat, so a peaceful castle is not matched upward for it). */
export const BUILDING_IDS = ['walls', 'deepVault', 'watchtower', 'spyGuild'] as const;
export type BuildingId = (typeof BUILDING_IDS)[number];
export const BUILDINGS: readonly { id: BuildingId; power: number; cost: number }[] = [
  { id: 'walls', power: 100, cost: 5000 * GOLD_SCALE },
  { id: 'deepVault', power: 0, cost: 4000 * GOLD_SCALE },
  { id: 'watchtower', power: 80, cost: 3000 * GOLD_SCALE },
  { id: 'spyGuild', power: 60, cost: 3000 * GOLD_SCALE },
];

/** Castle traps: each takes 20% off one attacking unit (section 4C). */
export const TRAPS: readonly { id: string; against: UnitId }[] = [
  { id: 'boiling-pitch', against: 'vanguard' },
  { id: 'spiked-palisades', against: 'outriders' },
  { id: 'counter-battery', against: 'siege' },
];

/** The three high castellans (section 5.1). */
export const DOCTRINES: readonly { id: string; effects: readonly CastleEffect[] }[] = [
  {
    id: 'iron-marshal',
    effects: [
      { kind: 'penetration', share: 0.1 },
      { kind: 'attack', pct: 10, unit: 'siege' },
      { kind: 'costs', pct: -50, of: 'repair' },
    ],
  },
  {
    id: 'whisper-weaver',
    effects: [
      { kind: 'stealth', pct: 25 },
      { kind: 'attack', pct: 10, unit: 'outriders' },
      { kind: 'costs', pct: -20, of: 'bribes' },
    ],
  },
  {
    id: 'golden-archon',
    effects: [
      { kind: 'vaultProtect', pct: 10 },
      { kind: 'marks', pct: 20 },
      { kind: 'costs', pct: -15, of: 'excavation' },
    ],
  },
];

/** The weekly realm decrees (section 5.3): one each week, in this order, from the first week of 1970.
 *  Each stays within Castle Clash, so the rest of the game's pacing never changes by the week. */
export const DECREES: readonly { id: string; effects: readonly CastleEffect[] }[] = [
  { id: 'iron-ramparts', effects: [{ kind: 'defense', pct: 15 }] },
  { id: 'long-shadows', effects: [{ kind: 'stealth', pct: 15 }] },
  { id: 'open-coffers', effects: [{ kind: 'costs', pct: -50, of: 'upkeep' }] },
  { id: 'war-banners', effects: [{ kind: 'marks', pct: 25 }] },
  { id: 'forge-fires', effects: [{ kind: 'costs', pct: -10, of: 'upgrades' }] },
];

/** The Sovereign Edicts (section 3) and what each lifts in the rest of the game (DESIGN.md section 7). */
export const EDICTS: readonly { id: string; lifts: 'fightGold' | 'xp' | 'finds' }[] = [
  { id: 'harvest', lifts: 'fightGold' },
  { id: 'vigor', lifts: 'xp' },
  { id: 'fortune', lifts: 'finds' },
];

/** The four spy missions (section 4D): AP, the bribe's factor, and what a success leaves on the target. */
export interface SpyMission {
  id: 'scout' | 'poison' | 'sabotage' | 'forge';
  ap: number;
  bribe: number;
  /** A debuff it leaves, with its lifetime and stack cap; null for scouting. */
  debuff: { lasts: number; max: number } | null;
}
export const SPY_MISSIONS: readonly SpyMission[] = [
  { id: 'scout', ap: 8, bribe: 1, debuff: null },
  { id: 'poison', ap: 12, bribe: 1.5, debuff: { lasts: 4 * 3_600_000, max: 2 } },
  { id: 'sabotage', ap: 12, bribe: 1.5, debuff: { lasts: 2 * 3_600_000, max: 1 } },
  { id: 'forge', ap: 12, bribe: 1.5, debuff: { lasts: 2 * 3_600_000, max: 1 } },
];
/** Poison wells: −8% combat power a stack. Forged orders: the garrison drawn 15% of the way to 33/33/34. */
export const POISON_PCT = 8;
export const FORGE_SHIFT = 0.15;
export const FORGE_TARGET = [0.33, 0.33, 0.34] as const;

/** The six incursion fortresses (section 5.4), in turn by tier: tier t meets FORTRESSES[(t − 1) mod 6].
 *  Each holds a garrison (shares of 100) and a trap, which scouting reveals. */
export const FORTRESSES: readonly { id: string; garrison: readonly [number, number, number]; trap: string }[] = [
  { id: 'ashen-redoubt', garrison: [50, 20, 30], trap: 'boiling-pitch' },
  { id: 'citadel-of-the-blind-wyrm', garrison: [20, 30, 50], trap: 'counter-battery' },
  { id: 'sunken-reliquary', garrison: [30, 50, 20], trap: 'spiked-palisades' },
  { id: 'thornwall-keep', garrison: [60, 20, 20], trap: 'spiked-palisades' },
  { id: 'gloaming-spire', garrison: [20, 60, 20], trap: 'counter-battery' },
  { id: 'hollow-crown-hold', garrison: [34, 33, 33], trap: 'boiling-pitch' },
];

/** The War College: four trees of ten ranks. A rank costs GOLD_SCALE × 3000 × 1.35^rank gold and
 *  10 × (rank + 1) war marks, and gives its effects once more. */
export const TECH_IDS = ['logistics', 'siegecraft', 'fortification', 'espionage'] as const;
export type TechId = (typeof TECH_IDS)[number];
export const TECH = { RANKS: 10, GOLD_BASE: 3000 * GOLD_SCALE, GOLD_GROWTH: 1.35, MARKS_PER_RANK: 10 } as const;
export const TECHS: readonly { id: TechId; perRank: readonly CastleEffect[] }[] = [
  { id: 'logistics', perRank: [{ kind: 'apCap', amount: 12 }] },
  {
    id: 'siegecraft',
    perRank: [
      { kind: 'penetration', share: 0.02 },
      { kind: 'attack', pct: 2 },
    ],
  },
  { id: 'fortification', perRank: [{ kind: 'defense', pct: 2 }] },
  {
    id: 'espionage',
    perRank: [
      { kind: 'stealth', pct: 5 },
      { kind: 'detection', pct: 5 },
    ],
  },
];

/** The Reliquary (section 5.5): nine war relics, each of five levels, three worn at once. A relic's
 *  level costs war marks and gold; it gives its effect per level, and its combat score (per level)
 *  counts towards the castle rating among a castle's three best relics, worn or not. */
export const RELIC_SOCKETS = 3;
export const RELIC = { LEVELS: 5, MARKS_PER_LEVEL: 25, GOLD_BASE: 2500 * GOLD_SCALE, GOLD_GROWTH: 1.6 } as const;
export const RELICS: readonly { id: string; perLevel: CastleEffect; score: number }[] = [
  { id: 'banner-of-the-first-king', perLevel: { kind: 'attack', pct: 3 }, score: 150 },
  { id: 'aegis-shard', perLevel: { kind: 'defense', pct: 3 }, score: 150 },
  { id: 'wyrmglass-lens', perLevel: { kind: 'stealth', pct: 6 }, score: 90 },
  { id: 'sentinels-eye', perLevel: { kind: 'detection', pct: 6 }, score: 90 },
  { id: 'oathbound-horn', perLevel: { kind: 'marks', pct: 5 }, score: 60 },
  { id: 'gilded-ledger', perLevel: { kind: 'vaultProtect', pct: 2 }, score: 40 },
  { id: 'ember-of-sieges', perLevel: { kind: 'penetration', share: 0.03 }, score: 120 },
  { id: 'menders-mortar', perLevel: { kind: 'recovery', pct: 10 }, score: 40 },
  { id: 'tidings-stone', perLevel: { kind: 'apRate', pct: 3 }, score: 30 },
];

/** Mercenary strongholds are named from these, drawn from the attacker's id and the day. */
export const MERCENARY_NAMES = {
  first: ['grey', 'red', 'hollow', 'broken', 'iron', 'black', 'thorn', 'salt'],
  second: ['banner', 'hand', 'company', 'oath', 'fang', 'wolves', 'lances', 'crows'],
} as const;
