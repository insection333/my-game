// Combat's content, shared by the four combat skills and the combat feature (GAME_DESIGN.md section 9):
// the triangle, foes, foods, the XP rules, each skill's unlock ladder and each style's six finds.
// Not a feature: Melee, Archery, Magic, Hitpoints and Combat all read it, and it names none of them.
import { TIER_LEVELS, type Find, type Ladder, type Style, type Unlock } from '@idle-clash/content';

export const STYLE_SKILLS: readonly Style[] = ['melee', 'archery', 'magic'];
export const HITPOINTS = 'hitpoints';

/** Melee beats Archery, Archery beats Magic, Magic beats Melee. */
export const BEATS: Record<Style, Style> = { melee: 'archery', archery: 'magic', magic: 'melee' };
export type Matchup = 'advantage' | 'even' | 'disadvantage';
export const matchup = (you: Style, foe: Style): Matchup =>
  BEATS[you] === foe ? 'advantage' : BEATS[foe] === you ? 'disadvantage' : 'even';
/** Your damage and the damage you take, by matchup. */
export const TRIANGLE: Record<Matchup, { dealt: number; taken: number }> = {
  advantage: { dealt: 1.25, taken: 0.75 },
  even: { dealt: 1, taken: 1 },
  disadvantage: { dealt: 0.8, taken: 1.25 },
};

/** Both sides swing every 3 seconds; the next foe arrives 3 seconds after a defeat. */
export const SWING_S = 3;
export const BASE_HEALTH = 300;
/** Health returns this much every 6 seconds, in a fight or out of one. */
export const REGEN_PER_6S = 10;
/** Food is eaten below this share of health; below BASE_RETREAT_PCT with none left, you retreat. */
export const EAT_BELOW = 0.5;
/** Style XP per point of damage dealt, by foe tier; Hitpoints gets this share of it. */
export const XP_PER_DAMAGE = [0.3, 0.32, 0.34, 0.35];
export const HITPOINTS_XP_SHARE = 0.4;
/** Foes more than five levels below you teach less: 4% less a level, down to 40%. */
export const easyFoeXp = (you: number, foe: number) => Math.min(1, Math.max(0.4, 1 - 0.04 * (you - foe - 5)));
/** Mastery on a foe: 3% more damage and 6% more drops a step. */
export const MASTERY_DAMAGE_PER_STEP = 3;
export const MASTERY_DROPS_PER_STEP = 6;

export interface Foe {
  id: string;
  style: Style;
  level: number;
  /** The Hitpoints level that opens it. */
  hitpoints: number;
  tier: number;
  hp: number;
  maxHit: number;
  gold: number;
  drop: string;
}

// Calibrated by the paper model against each foe's intended matchup (verify compares them).
export const FOES: readonly Foe[] = [
  {
    id: 'hollow-rat',
    style: 'melee',
    level: 2,
    hitpoints: 1,
    tier: 1,
    hp: 100,
    maxHit: 20,
    gold: 5,
    drop: 'copper-ore',
  },
  {
    id: 'goblin-slinger',
    style: 'archery',
    level: 4,
    hitpoints: 2,
    tier: 1,
    hp: 100,
    maxHit: 30,
    gold: 4,
    drop: 'pine-logs',
  },
  {
    id: 'marsh-wisp',
    style: 'magic',
    level: 6,
    hitpoints: 3,
    tier: 1,
    hp: 100,
    maxHit: 30,
    gold: 4,
    drop: 'copper-bar',
  },
  {
    id: 'orc-raider',
    style: 'melee',
    level: 15,
    hitpoints: 14,
    tier: 2,
    hp: 130,
    maxHit: 55,
    gold: 8,
    drop: 'tin-ore',
  },
  {
    id: 'orc-bowman',
    style: 'archery',
    level: 19,
    hitpoints: 18,
    tier: 2,
    hp: 140,
    maxHit: 65,
    gold: 8,
    drop: 'bronze-bar',
  },
  {
    id: 'grave-wight',
    style: 'magic',
    level: 24,
    hitpoints: 22,
    tier: 3,
    hp: 220,
    maxHit: 80,
    gold: 22,
    drop: 'iron-ore',
  },
  {
    id: 'hill-troll',
    style: 'melee',
    level: 29,
    hitpoints: 27,
    tier: 3,
    hp: 270,
    maxHit: 95,
    gold: 22,
    drop: 'oak-logs',
  },
  {
    id: 'fell-huntsman',
    style: 'archery',
    level: 37,
    hitpoints: 34,
    tier: 4,
    hp: 420,
    maxHit: 110,
    gold: 49,
    drop: 'steel-bar',
  },
];
export const foeById = (id: string) => FOES.find((f) => f.id === id);

export interface Food {
  id: string;
  heals: number;
  price: number;
  /** The Hitpoints level from which the vendor sells it. */
  level: number;
}
export const FOODS: readonly Food[] = [
  { id: 'bread', heals: 140, price: 20, level: 1 },
  { id: 'meat-pie', heals: 320, price: 50, level: 10 },
  { id: 'hearty-stew', heals: 600, price: 110, level: 20 },
];

const PERK_LINES: Record<Style, [string, string, string, string, string]> = {
  melee: ['heavy-blows', 'sure-strike', 'parry', 'spoils-of-war', 'master-of-melee'],
  archery: ['drawn-deep', 'steady-aim', 'light-step', 'spoils-of-the-hunt', 'master-of-archery'],
  magic: ['kindled-will', 'focus', 'ward', 'spoils-of-the-wild', 'master-of-magic'],
};

/** A style's ladder: a tier of weapon at 1, 10, 20 and 30; four perk lines in turn on every other level; a capstone. */
export function styleLadder(style: Style): Ladder {
  const ladder: Unlock[][] = Array.from({ length: 40 }, () => []);
  TIER_LEVELS.forEach((level, i) => ladder[level - 1].push({ type: 'tier', tier: i + 1, use: 'wield', style }));
  const [damage, accuracy, guard, spoils, master] = PERK_LINES[style];
  const lines = [
    { perk: damage, effect: { kind: 'damage', pct: 3 } },
    { perk: accuracy, effect: { kind: 'accuracy', pct: 2 } },
    { perk: guard, effect: { kind: 'guard', pct: 2.5 } },
    { perk: spoils, effect: { kind: 'spoils', pct: 6 } },
  ] as const;
  const ranks = [0, 0, 0, 0];
  let next = 0;
  for (let level = 2; level <= 39; level++) {
    if (ladder[level - 1].length) continue;
    const i = next++ % lines.length;
    ranks[i]++;
    ladder[level - 1].push({ type: 'perk', perk: lines[i].perk, rank: ranks[i], effect: { ...lines[i].effect } });
  }
  ladder[39].push({ type: 'perk', perk: master, rank: 1, effect: { kind: 'damage', pct: 8 } });
  return ladder;
}

/** Hitpoints: armour tiers, the foes it opens, the vendor's foods, named perks, and Toughness on every level after 1. */
export function hitpointsLadder(): Ladder {
  const ladder: Unlock[][] = Array.from({ length: 40 }, () => []);
  TIER_LEVELS.forEach((level, i) => ladder[level - 1].push({ type: 'tier', tier: i + 1, use: 'wear' }));
  for (const f of FOES) ladder[f.hitpoints - 1].push({ type: 'foe', foe: f.id });
  for (const fd of FOODS.slice(1)) ladder[fd.level - 1].push({ type: 'food', item: fd.id });
  const named: Record<number, Unlock> = {
    5: { type: 'perk', perk: 'second-wind', rank: 1, effect: { kind: 'regen', pct: 25 } },
    15: { type: 'perk', perk: 'iron-stomach', rank: 1, effect: { kind: 'foodHeal', pct: 15 } },
    25: { type: 'perk', perk: 'field-dressing', rank: 1, effect: { kind: 'regen', pct: 25 } },
    35: { type: 'perk', perk: 'stubborn', rank: 1, effect: { kind: 'retreatAt', pct: 12 } },
    40: { type: 'perk', perk: 'unbowed', rank: 1, effect: { kind: 'foodHeal', pct: 15 } },
  };
  for (let level = 1; level <= 40; level++) {
    if (named[level]) ladder[level - 1].push(named[level]);
    if (level > 1)
      ladder[level - 1].push({ type: 'perk', perk: 'toughness', rank: 1, effect: { kind: 'maxHealth', amount: 40 } });
  }
  return ladder;
}

const finds = (ids: string[]): Find[] =>
  ids.map((item, i) => ({
    item,
    rarity: (['uncommon', 'rare', 'legendary'] as const)[Math.floor(i / 2)],
    greater: i % 2 === 1,
  }));
export const STYLE_FINDS: Record<Style, Find[]> = {
  melee: finds([
    'battle-trophy',
    'raiders-war-horn',
    'torn-banner',
    'warlords-seal',
    'shard-of-a-kings-blade',
    'troll-chiefs-tooth',
  ]),
  archery: finds([
    'goose-fletchings',
    'hunters-charm',
    'silver-arrowhead',
    'bowmans-ring',
    'moonlit-bowstring',
    'eagle-feather-circlet',
  ]),
  magic: finds([
    'glimmer-stone',
    'wisp-lantern',
    'rune-scratched-tablet',
    'wights-ring',
    'star-glass-orb',
    'sorcerers-eye',
  ]),
};
/** What the vendor pays for a find, by its place in the skill's six (Legendary finds are kept). */
export const FIND_VALUES = [100, 1200, 1000, 12000, 0, 0];

/** Each combat skill's ladder, built once. */
export const LADDERS: Record<Style | typeof HITPOINTS, Ladder> = {
  melee: styleLadder('melee'),
  archery: styleLadder('archery'),
  magic: styleLadder('magic'),
  hitpoints: hitpointsLadder(),
};
