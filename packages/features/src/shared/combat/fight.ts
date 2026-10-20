// How a fight resolves (GAME_DESIGN.md section 9), as one pure function of the fighter, the foe, the
// health and food they start with, and a source of random numbers. The engine plays each fight with
// the seed its repetition drew; "Your odds" plays 200 of them with a fixed seed.
import { BASE_RETREAT_PCT, type Modifiers, type Style } from '@idle-clash/content';
import { seeded } from '@idle-clash/kernel';
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

export function fight(p: Fighter, foe: Foe, rng: () => number, health: number, meals: readonly Meal[]): Fought {
  const mu = TRIANGLE[matchup(p.style, foe.style)];
  const hit = clamp(0.66 + 0.012 * (p.styleLevel - foe.level) + p.perks.accuracy / 100);
  const maxHit = 10 * (3 + Math.floor(p.styleLevel / 12) + p.weaponTier);
  const dealtMult = mu.dealt * (1 + p.perks.damage / 100 + (MASTERY_DAMAGE_PER_STEP / 100) * p.mastery);
  const foeHit = clamp(0.62 + 0.02 * (foe.level - p.hpLevel));
  const guard = (1 - 0.025 * p.armour) * (1 - p.perks.guard / 100) * mu.taken;
  const regen = regenPerSecond(p) * SWING_S;
  const heal = 1 + p.hpPerks.foodHeal / 100;
  const most = maxHealth(p);
  const retreatAt = retreatShare(p);
  const pantry = meals.filter((m) => m.count > 0).map((m) => ({ ...m }));
  const eaten: Record<string, number> = {};
  let [foeHp, t, dealt, taken] = [foe.hp, 0, 0, 0];
  while (foeHp > 0) {
    t += SWING_S;
    if (rng() < hit) {
      const d = Math.min(foeHp, (1 + Math.floor(rng() * maxHit)) * dealtMult);
      foeHp -= d;
      dealt += d;
    }
    if (foeHp <= 0) break;
    if (rng() < foeHit) {
      const d = (1 + Math.floor(rng() * foe.maxHit)) * guard;
      health -= d;
      taken += d;
    }
    health = Math.min(most, health + regen);
    const meal = pantry.find((m) => m.count > 0);
    if (health < most * EAT_BELOW && meal) {
      health += meal.heals * heal;
      meal.count--;
      eaten[meal.item] = (eaten[meal.item] ?? 0) + 1;
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
  retreatRate: number;
}

/** "Your odds": 200 fights in a row with the best food carried (as much as they need), a fixed seed. */
export function odds(p: Fighter, foe: Foe, meal: Omit<Meal, 'count'> | null, n = 200): Odds {
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
  const price = meal ? (FOODS.find((fd) => fd.id === meal.item)?.price ?? 0) : 0;
  const goldPerHour = defeats * foe.gold * (1 + p.perks.spoils / 100) - foodPerHour * price;
  const retreatRate = retreats / n;
  const verdict: Verdict =
    retreatRate > 0.02 ? 'tooStrong' : foodPerHour < 4 ? 'easy' : foodPerHour < 25 ? 'fair' : 'costly';
  return { verdict, xpPerHour, foodPerHour, goldPerHour, retreatRate };
}
