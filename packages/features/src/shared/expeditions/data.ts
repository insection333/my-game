// Expeditions and bosses (GAME_DESIGN.md section 9, step 16): a run into a region for 1, 2, 4 or 8
// hours, six ten-minute fight stages an hour with a cache and a camp among them, one or two twists, a
// fork whose road is chosen at the start, and the region's boss at the end. Shared, because relics
// bought with the marks runs pay reach every skill, the fighter and the Storehouse. Verify compares
// these numbers with the paper model's (design/model/expeditions.ts).
import { FOES, REGIONS, regionOf, type Foe, type Region, type Trait } from '../combat/foes.ts';

export const LENGTHS = [1, 2, 4, 8] as const;
export const STAGE_MINUTES = 10;
export const STAGES_PER_HOUR = 6;

/** A boss: its tier's last foe made into a fight of its own, with ten times its health, hitting 80% harder,
 *  three levels above it. Two in each region (session 210): one at the region's last tier, and one a tier or
 *  two below it, so bosses come from the first week and a region's runs do not all end alike. */
export interface Boss extends Foe {
  region: Region;
  /** Marks a win pays, before twists and roads. */
  marks: number;
  /** Its Rare and its Legendary find. */
  finds: { rare: string; legendary: string };
  /** What its Rare find sells for. */
  rareValue: number;
}
export const BOSS_HP = 10;
export const BOSS_HIT = 1.8;
const bossOf = (
  id: string,
  region: Region,
  tier: number,
  style: Foe['style'],
  gold: number,
  marks: number,
  finds: Boss['finds'],
  rareValue: number,
  trait: Trait,
): Boss => {
  const top = FOES.filter((f) => f.tier === tier && regionOf(f.tier) === region).at(-1)!;
  return {
    ...top,
    id,
    style,
    level: top.level + 3,
    hitpoints: top.hitpoints + 3,
    hp: top.hp * BOSS_HP,
    maxHit: Math.round(top.maxHit * BOSS_HIT),
    gold,
    region,
    marks,
    finds,
    rareValue,
    trait,
  };
};
const finds = (rare: string, legendary: string) => ({ rare, legendary });
/** By level, weakest first. Each fights its own way (session 211, `Trait` in combat/foes.ts). */
export const BOSSES: readonly Boss[] = [
  bossOf('barrow-king', 'march', 2, 'magic', 800, 3, finds('barrow-ring', 'wight-kings-sceptre'), 700, {
    kind: 'rise',
    at: 1 / 3,
    grows: 0.2,
  }),
  bossOf('troll-chief', 'march', 4, 'melee', 2_500, 5, finds('chieftains-torc', 'crown-of-the-hill'), 2_000, {
    kind: 'rage',
    below: 0.5,
    hit: 1.25,
  }),
  bossOf('mire-mother', 'fen', 5, 'melee', 6_000, 8, finds('mire-pearl', 'mire-mothers-egg'), 4_500, {
    kind: 'mend',
    streak: 3,
    heals: 0.05,
    times: 3,
  }),
  bossOf('drowned-warden', 'fen', 6, 'archery', 12_000, 10, finds('sunken-locket', 'wardens-lantern'), 8_000, {
    kind: 'ward',
    dealt: 0.6,
  }),
  bossOf('storm-roc', 'peaks', 7, 'archery', 20_000, 12, finds('roc-talon', 'stormfeather'), 14_000, {
    kind: 'plumage',
    dealt: 0.7,
  }),
  bossOf('ember-wyrm', 'peaks', 8, 'magic', 30_000, 15, finds('wyrm-scale', 'heart-of-the-wyrm'), 20_000, {
    kind: 'shift',
    at: 0.5,
    to: 'archery',
  }),
];
export const bossById = (id: string) => BOSSES.find((b) => b.id === id);
/** A region's bosses, weakest first. */
export const bossesIn = (region: Region) => BOSSES.filter((b) => b.region === region);
/** A region's last boss: the one at its last tier, and the boss every run met before session 210. */
export const bossIn = (region: Region) => bossesIn(region).at(-1)!;
/** The bosses a run into a region may meet: those the player's Hitpoints has opened, or the weakest. */
export const runBosses = (region: Region, hitpoints: number): Boss[] => {
  const all = bossesIn(region);
  const open = all.filter((b) => b.hitpoints <= hitpoints);
  return open.length ? open : all.slice(0, 1);
};
/** A boss find's chance a win. A boss's Legendary find makes its wins pay half again as many marks. */
export const BOSS_FINDS = { rare: 1 / 12, legendary: 1 / 80 };
export const LEGENDARY_MARKS = 1.5;

/** A cache's worth in gold, by region: the region's top tier of logs, ore or fish. */
export const CACHE_GOLD: Record<Region, number> = { march: 4_800, fen: 7_200, peaks: 12_000 };
/** A run's fights pay this much more XP and gold than the lane's: its foes are drawn, not chosen. */
export const RUN_PAY = 1.25;
/** Marks a fight stage pays. */
export const STAGE_MARKS = 1;

export interface Twist {
  id: string;
  /** Hits land this much as often; food heals this much; foes hit this much harder. */
  hit?: number;
  heal?: number;
  foeHit?: number;
  /** Fight stages, finds, drops, caches, marks, a boss's health, camps' healing, XP: multiplied. */
  stages?: number;
  finds?: number;
  drops?: number;
  caches?: number;
  marks?: number;
  bossHp?: number;
  camp?: number;
  xp?: number;
}
export const TWISTS: readonly Twist[] = [
  { id: 'fog', hit: 0.9, finds: 2 },
  { id: 'wolves', heal: 0.75, drops: 1.5 },
  { id: 'old-roads', stages: 0.75 },
  { id: 'warband', foeHit: 1.15, marks: 1.5 },
  { id: 'caravans', caches: 1.5, bossHp: 1.25 },
  { id: 'storm', camp: 0.5, xp: 1.1 },
];
/** The chance a run carries a second twist. */
export const SECOND_TWIST = 0.4;
/** The roads at the fork: each changes the run's second half. */
export const ROADS: readonly Twist[] = [
  { id: 'high-pass', foeHit: 1.1, caches: 2 },
  { id: 'low-road', foeHit: 0.9, marks: 0.75 },
  { id: 'old-shrine', finds: 2 },
  { id: 'hunters-trail', drops: 1.5 },
  { id: 'wardens-gate', marks: 1.5, bossHp: 1.2 },
];
export const twistOf = (id: string) => TWISTS.find((t) => t.id === id) ?? ROADS.find((t) => t.id === id);
/** Several twists (and a road) together: each number multiplied. */
export const product = (mods: readonly Twist[], key: Exclude<keyof Twist, 'id'>): number =>
  mods.reduce((m, t) => m * (t[key] ?? 1), 1);

/** How often a stage meets each of the run's three foes, best first: half, a third, a sixth. */
export const FOE_WEIGHTS = [3, 2, 1];

/** The region's foes a Hitpoints level opens. */
export const openFoes = (region: Region, hpLevel: number): Foe[] =>
  FOES.filter((f) => regionOf(f.tier) === region && f.hitpoints <= hpLevel);

export { REGIONS, type Region };
