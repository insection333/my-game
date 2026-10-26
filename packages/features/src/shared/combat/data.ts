// Combat's content, shared by the four combat skills and the combat feature (GAME_DESIGN.md section 9):
// the triangle, foes, foods, the XP rules, each skill's unlock ladder and each style's six finds.
// Not a feature: Melee, Archery, Magic, Hitpoints and Combat all read it, and it names none of them.
import {
  fillPerks,
  MAX_LEVEL,
  TIER_LEVELS,
  type Effect,
  type Find,
  type Ladder,
  type Style,
  type Unlock,
} from '@idle-clash/content';
import { FOES } from './foes.ts';

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
export const XP_PER_DAMAGE = [0.3, 0.32, 0.34, 0.35, 0.34, 0.31, 0.3, 0.28];
/** Hitpoints XP equals the style XP (0.4 before the climb to 99, which left Hitpoints far behind). */
export const HITPOINTS_XP_SHARE = 1;
/** Foes more than five levels below you teach less: 4% less a level, down to 40%. */
export const easyFoeXp = (you: number, foe: number) => Math.min(1, Math.max(0.4, 1 - 0.04 * (you - foe - 5)));
/** Mastery on a foe: 3% more damage and 6% more drops a step. */
export const MASTERY_DAMAGE_PER_STEP = 3;
export const MASTERY_DROPS_PER_STEP = 6;

export { FOES, foeById, regionOf, REGIONS, type Foe, type Region } from './foes.ts';

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
  { id: 'roast-fowl', heals: 1000, price: 190, level: 40 },
  { id: 'hunters-feast', heals: 1600, price: 320, level: 60 },
  { id: 'wardens-feast', heals: 2300, price: 480, level: 80 },
];

const PERK_LINES: Record<Style, [string, string, string, string, string, string]> = {
  melee: ['heavy-blows', 'sure-strike', 'parry', 'spoils-of-war', 'master-of-melee', 'grandmaster-of-melee'],
  archery: [
    'drawn-deep',
    'steady-aim',
    'light-step',
    'spoils-of-the-hunt',
    'master-of-archery',
    'grandmaster-of-archery',
  ],
  magic: ['kindled-will', 'focus', 'ward', 'spoils-of-the-wild', 'master-of-magic', 'grandmaster-of-magic'],
};

/** A style's ladder: a tier of weapon at each tier's level; four perk lines in turn on every other level
 *  (past 40 at half strength); capstones at 40 and 99. */
export function styleLadder(style: Style): Ladder {
  const ladder: Unlock[][] = Array.from({ length: MAX_LEVEL }, () => []);
  TIER_LEVELS.forEach((level, i) => ladder[level - 1].push({ type: 'tier', tier: i + 1, use: 'wield', style }));
  const [damage, accuracy, guard, spoils, master, grandmaster] = PERK_LINES[style];
  return fillPerks(
    ladder,
    [
      { perk: damage, effect: { kind: 'damage', pct: 3 } },
      { perk: accuracy, effect: { kind: 'accuracy', pct: 2 } },
      { perk: guard, effect: { kind: 'guard', pct: 2.5 } },
      { perk: spoils, effect: { kind: 'spoils', pct: 6 } },
    ],
    {
      40: { perk: master, effect: { kind: 'damage', pct: 8 } },
      99: { perk: grandmaster, effect: { kind: 'damage', pct: 10 } },
    },
  );
}

/** Hitpoints: armour tiers, the foes it opens, the vendor's foods, named perks (every five levels to 40,
 *  then every ten, at half strength), and Toughness on every level after 1. */
export function hitpointsLadder(): Ladder {
  const ladder: Unlock[][] = Array.from({ length: MAX_LEVEL }, () => []);
  TIER_LEVELS.forEach((level, i) => ladder[level - 1].push({ type: 'tier', tier: i + 1, use: 'wear' }));
  for (const f of FOES) ladder[f.hitpoints - 1].push({ type: 'foe', foe: f.id });
  for (const fd of FOODS.slice(1)) ladder[fd.level - 1].push({ type: 'food', item: fd.id });
  const perk = (perk: string, rank: number, effect: Effect): Unlock => ({ type: 'perk', perk, rank, effect });
  const named: Record<number, Unlock> = {
    5: perk('second-wind', 1, { kind: 'regen', pct: 25 }),
    15: perk('iron-stomach', 1, { kind: 'foodHeal', pct: 15 }),
    25: perk('field-dressing', 1, { kind: 'regen', pct: 25 }),
    35: perk('stubborn', 1, { kind: 'retreatAt', pct: 12 }),
    40: perk('unbowed', 1, { kind: 'foodHeal', pct: 15 }),
    45: perk('second-wind', 2, { kind: 'regen', pct: 12.5 }),
    55: perk('iron-stomach', 2, { kind: 'foodHeal', pct: 7.5 }),
    65: perk('field-dressing', 2, { kind: 'regen', pct: 12.5 }),
    75: perk('iron-stomach', 3, { kind: 'foodHeal', pct: 7.5 }),
    85: perk('second-wind', 3, { kind: 'regen', pct: 12.5 }),
    95: perk('field-dressing', 3, { kind: 'regen', pct: 12.5 }),
    99: perk('unbroken', 1, { kind: 'foodHeal', pct: 20 }),
  };
  for (let level = 1; level <= MAX_LEVEL; level++) {
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
