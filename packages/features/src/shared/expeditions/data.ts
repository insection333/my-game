// Expeditions and bosses (GAME_DESIGN.md section 9, step 16): a run into a region for 1, 2, 4 or 8
// hours, six ten-minute fight stages an hour with a cache and a camp among them, one or two twists, a
// fork whose road is chosen at the start, and the region's boss at the end. Shared, because relics
// bought with the marks runs pay reach every skill, the fighter and the Storehouse. Verify compares
// these numbers with the paper model's (design/model/expeditions.ts).
import { FOES, REGIONS, regionOf, type Foe, type Region } from '../combat/foes.ts';

export const LENGTHS = [1, 2, 4, 8] as const;
export const STAGE_MINUTES = 10;
export const STAGES_PER_HOUR = 6;

/** A boss: its region's last foe made into a fight of its own, with ten times its health, hitting
 *  80% harder, three levels above it. */
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
  style: Foe['style'],
  gold: number,
  marks: number,
  finds: Boss['finds'],
  rareValue: number,
): Boss => {
  const top = FOES.filter((f) => regionOf(f.tier) === region).at(-1)!;
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
  };
};
export const BOSSES: readonly Boss[] = [
  bossOf('troll-chief', 'march', 'melee', 2_500, 5, { rare: 'chieftains-torc', legendary: 'crown-of-the-hill' }, 2_000),
  bossOf(
    'drowned-warden',
    'fen',
    'archery',
    12_000,
    10,
    { rare: 'sunken-locket', legendary: 'wardens-lantern' },
    8_000,
  ),
  bossOf('ember-wyrm', 'peaks', 'magic', 30_000, 15, { rare: 'wyrm-scale', legendary: 'heart-of-the-wyrm' }, 20_000),
];
export const bossById = (id: string) => BOSSES.find((b) => b.id === id);
export const bossIn = (region: Region) => BOSSES.find((b) => b.region === region)!;
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
