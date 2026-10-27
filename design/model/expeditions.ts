// Expeditions and bosses (step 16), on paper. A run into a region for 1, 2, 4 or 8 hours in the Combat
// lane: six fight stages of ten minutes an hour, each against a foe of the region drawn for it; a
// cache and a camp each hour; a fork whose two roads are drawn and one chosen at the start; one or two
// twists; and the region's boss at the end. Verify compares these numbers with the game's own.
import { FOES, type Foe, type Style } from './content.ts';

export const LENGTHS = [1, 2, 4, 8];
export const STAGE_MINUTES = 10;
export const STAGES_PER_HOUR = 6;

/** Each region's boss: the region's last foe made into a fight of its own (calibrated below). */
export interface Boss extends Foe {
  /** Marks a win pays, before twists and roads. */
  marks: number;
}
const bossOf = (id: string, name: string, style: Style, region: number, gold: number, marks: number): Boss => {
  const top = FOES.filter((f) => f.region === region).at(-1)!;
  return {
    ...top,
    id,
    name,
    style,
    level: top.level + 3,
    hitpoints: top.hitpoints + 3,
    hp: top.hp * BOSS_HP,
    maxHit: Math.round(top.maxHit * BOSS_HIT),
    gold,
    marks,
  };
};
/** A boss has ten times its region's last foe's health and hits 80% harder. */
export const BOSS_HP = 10;
export const BOSS_HIT = 1.8;
export const BOSSES: Boss[] = [
  bossOf('troll-chief', 'The Troll-chief of the hill', 'melee', 1, 2_500, 5),
  bossOf('drowned-warden', 'The Drowned Warden', 'archery', 2, 12_000, 10),
  bossOf('ember-wyrm', 'The Ember Wyrm', 'magic', 3, 30_000, 15),
];
/** A boss find's chance a win: a Rare and a Legendary for each boss. */
export const BOSS_FINDS = { rare: 1 / 12, legendary: 1 / 80 };

/** A cache's worth in gold, by region: the region's top tier of logs, ore or fish. */
export const CACHE_GOLD = [4_800, 7_200, 12_000];
/** A run's fights pay this much more XP and gold than the lane's: its foes are drawn, not chosen. */
export const RUN_PAY = 1.25;
/** How often a stage meets each of the run's three foes, best first: half, a third, a sixth. */
export const FOE_WEIGHTS = [3, 2, 1];
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
export const TWISTS: Twist[] = [
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
export const ROADS: Twist[] = [
  { id: 'high-pass', foeHit: 1.1, caches: 2 },
  { id: 'low-road', foeHit: 0.9, marks: 0.75 },
  { id: 'old-shrine', finds: 2 },
  { id: 'hunters-trail', drops: 1.5 },
  { id: 'wardens-gate', marks: 1.5, bossHp: 1.2 },
];

/** Relics: lasting boosts bought with marks, each in ranks. */
export const RELIC_COSTS = [10, 25, 50, 90, 150];
export const RELICS = {
  /** One for each skill: +1% XP a rank. */
  skillXpPerRank: 1,
  /** Food heals 4% more a rank. */
  foodHealPerRank: 4,
  /** Finds 4% more likely a rank. */
  findsPerRank: 4,
  /** Six more Storehouse spaces a rank, three ranks: up to three more rows. */
  storeSlotsPerRank: 6,
  storeRanks: 3,
};
