// How a fight resolves (GAME_DESIGN.md section 9), as one pure function of the fighter, the foe, the
// health and food they start with, and a source of random numbers. The engine plays each fight with
// the seed its repetition drew; "Your odds" plays 1,000 of them with a fixed seed.
import { BASE_RETREAT_PCT, type Modifiers, type Style } from '@idle-clash/content';
import { seeded } from '@idle-clash/kernel';
import { itemOf } from '../catalog.ts';
import {
  BASE_HEALTH,
  EAT_BELOW,
  easyFoeXp,
  FOODS,
  matchup,
  MASTERY_DAMAGE_PER_STEP,
  REGEN_PER_6S,
  SWING_S,
  TRIANGLE,
  ARMOUR_GUARD_PER_TIER,
  WEAPON_HIT_PER_TIER,
  XP_PER_DAMAGE,
  type Foe,
} from './data.ts';

export interface Fighter {
  style: Style;
  styleLevel: number;
  weaponTier: number;
  /** The tiers of the armour pieces worn, added up (a full steel set: 12). */
  armour: number;
  hpLevel: number;
  /** The style's perks at its level, and Hitpoints' at its level. */
  perks: Modifiers;
  hpPerks: Modifiers;
  /** Mastery step on this foe. */
  mastery: number;
  /** The supply used for this fight (one, whatever its length) and the damage it adds, if any. */
  supply?: { item: string; pct: number } | null;
}

export interface Meal {
  item: string;
  heals: number;
  count: number;
}

export interface Fought {
  /** From the first swing to the next foe's arrival (or to the retreat). */
  seconds: number;
  dealt: number;
  taken: number;
  health: number;
  retreated: boolean;
  /** Food eaten, by item. */
  eaten: Record<string, number>;
}

export const maxHealth = (p: Pick<Fighter, 'hpPerks'>) => BASE_HEALTH + p.hpPerks.maxHealth;
/** The share of health below which a fighter with no food left retreats (Stubborn lowers it). */
export const retreatShare = (p: Pick<Fighter, 'hpPerks'>) => (p.hpPerks.retreatAt || BASE_RETREAT_PCT) / 100;
export const regenPerSecond = (p: Pick<Fighter, 'hpPerks'>) => (REGEN_PER_6S / 6) * (1 + p.hpPerks.regen / 100);
const clamp = (x: number) => Math.min(0.95, Math.max(0.2, x));
const round = (x: number) => Math.round(x * 100) / 100;

/** An expedition's twists on a fight: hits land less often (fog), food heals less (hungry wolves). */
export interface FightTwists {
  hit?: number;
  heal?: number;
}

/** A hit counts as critical when its roll is in the top tenth of what the fighter can deal: the same
 *  rolls as ever, named, so the arena can mark the best of them (session 42). */
export const CRIT_SHARE = 0.9;

/** One swing as the arena shows it: who swung, at what second of the fight, what it did, and both
 *  sides' health after it. A meal is its own entry. */
export type Swing =
  | { t: number; by: 'you' | 'foe'; hit: boolean; damage: number; crit: boolean; health: number; foeHp: number }
  | { t: number; by: 'meal'; item: string; heals: number; health: number; foeHp: number };

export function fight(
  p: Fighter,
  foe: Foe,
  rng: () => number,
  health: number,
  meals: readonly Meal[],
  tw: FightTwists = {},
  /** Told of each swing as it falls (the arena's replay); the fight goes the same without it. */
  log?: (s: Swing) => void,
): Fought {
  const mu = TRIANGLE[matchup(p.style, foe.style)];
  const hit = clamp(0.66 + 0.012 * (p.styleLevel - foe.level) + p.perks.accuracy / 100) * (tw.hit ?? 1);
  const maxHit = 10 * (3 + Math.floor(p.styleLevel / 12)) + WEAPON_HIT_PER_TIER * p.weaponTier;
  const dealtMult =
    mu.dealt * (1 + (p.perks.damage + (p.supply?.pct ?? 0)) / 100 + (MASTERY_DAMAGE_PER_STEP / 100) * p.mastery);
  const foeHit = clamp(0.62 + 0.02 * (foe.level - p.hpLevel));
  const guard = (1 - (ARMOUR_GUARD_PER_TIER / 100) * p.armour) * (1 - p.perks.guard / 100) * mu.taken;
  const regen = regenPerSecond(p) * SWING_S;
  const heal = (1 + p.hpPerks.foodHeal / 100) * (tw.heal ?? 1);
  const most = maxHealth(p);
  const retreatAt = retreatShare(p);
  const pantry = meals.filter((m) => m.count > 0).map((m) => ({ ...m }));
  const eaten: Record<string, number> = {};
  let [foeHp, t, dealt, taken] = [foe.hp, 0, 0, 0];
  while (foeHp > 0) {
    t += SWING_S;
    if (rng() < hit) {
      const roll = 1 + Math.floor(rng() * maxHit);
      const d = Math.min(foeHp, roll * dealtMult);
      foeHp -= d;
      dealt += d;
      log?.({ t, by: 'you', hit: true, damage: d, crit: roll > maxHit * CRIT_SHARE, health, foeHp });
    } else log?.({ t, by: 'you', hit: false, damage: 0, crit: false, health, foeHp });
    if (foeHp <= 0) break;
    if (rng() < foeHit) {
      const roll = 1 + Math.floor(rng() * foe.maxHit);
      const d = roll * guard;
      health -= d;
      taken += d;
      log?.({ t, by: 'foe', hit: true, damage: d, crit: roll > foe.maxHit * CRIT_SHARE, health, foeHp });
    } else log?.({ t, by: 'foe', hit: false, damage: 0, crit: false, health, foeHp });
    health = Math.min(most, health + regen);
    const meal = pantry.find((m) => m.count > 0);
    if (health < most * EAT_BELOW && meal) {
      health += meal.heals * heal;
      meal.count--;
      eaten[meal.item] = (eaten[meal.item] ?? 0) + 1;
      log?.({ t, by: 'meal', item: meal.item, heals: meal.heals * heal, health, foeHp });
    }
    if (health < most * retreatAt)
      return {
        seconds: t,
        dealt: round(dealt),
        taken: round(taken),
        health: round(Math.max(0, health)),
        retreated: true,
        eaten,
      };
  }
  t += SWING_S;
  health = Math.min(most, health + regen);
  return { seconds: t, dealt: round(dealt), taken: round(taken), health: round(health), retreated: false, eaten };
}

/** Style XP for damage dealt to a foe (before the fire and marks). */
export const styleXp = (p: Pick<Fighter, 'styleLevel'>, foe: Foe, dealt: number) =>
  dealt * XP_PER_DAMAGE[foe.tier - 1] * easyFoeXp(p.styleLevel, foe.level);

export type Verdict = 'easy' | 'fair' | 'costly' | 'tooStrong';

export interface Odds {
  verdict: Verdict;
  xpPerHour: number;
  foodPerHour: number;
  goldPerHour: number;
  /** Of which won from foes, and spent on food and supplies. */
  goldWon: number;
  goldSpent: number;
  retreatRate: number;
  /** Seconds from one foe to the next, on average. */
  secondsPerFight: number;
}

/** "Your odds": 1,000 fights in a row with the best food carried (as much as they need), a fixed seed. */
export function odds(p: Fighter, foe: Foe, meal: Omit<Meal, 'count'> | null, n = 1000): Odds {
  const r = seeded(0x0dd5);
  let i = 0;
  const rng = () => r('odds', i++);
  const most = maxHealth(p);
  let [secs, food, dealt, retreats, health] = [0, 0, 0, 0, most];
  for (let k = 0; k < n; k++) {
    const f = fight(p, foe, rng, health, meal ? [{ ...meal, count: Infinity }] : []);
    secs += f.seconds;
    food += Object.values(f.eaten).reduce((a, b) => a + b, 0);
    dealt += f.dealt;
    if (f.retreated) {
      retreats++;
      health = most;
    } else health = f.health;
  }
  const perHour = 3600 / secs;
  const foodPerHour = food * perHour;
  const xpPerHour = styleXp(p, foe, dealt) * perHour;
  const defeats = (n - retreats) * perHour;
  // A meal costs the vendor's price, or (cooked at home) what it would sell for.
  const price = meal ? (FOODS.find((fd) => fd.id === meal.item)?.price ?? itemOf(meal.item)?.value ?? 0) : 0;
  // One supply for each foe fought, at what it would sell for.
  const supplies = p.supply ? n * perHour * (itemOf(p.supply.item)?.value ?? 0) : 0;
  // Gold won and gold spent, apart, so a page can count what lifts the winnings (a Path, an edict).
  const goldWon = defeats * foe.gold * (1 + p.perks.spoils / 100);
  const goldSpent = foodPerHour * price + supplies;
  const goldPerHour = goldWon - goldSpent;
  const retreatRate = retreats / n;
  const verdict: Verdict =
    retreatRate > 0.02 ? 'tooStrong' : foodPerHour < 4 ? 'easy' : foodPerHour < 25 ? 'fair' : 'costly';
  return { verdict, xpPerHour, foodPerHour, goldPerHour, goldWon, goldSpent, retreatRate, secondsPerFight: secs / n };
}
