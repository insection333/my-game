// The model's Cooking (session 13), kept beside content.ts. Each tier's fish is cooked two at a time over
// one of that tier's logs; from tier 3 a pie or a stew mixes the tier's fish with the one before, two at
// a time. Cooked food heals about half of the health a fighter has at its tier (the most a meal eaten
// below half health never wastes); a dish heals 1.3 times as much, in tens (a quarter more until session
// 245). It sells for what went into it, and for that worth it heals more than the vendor's food does for its
// price from tier 2 on (checks2.ts). From tier 5 the dish's feast (session 245): ten dishes and one greater
// Uncommon find make ten, healing as the dish, a pie's lifting damage 5% and a stew's combat XP 5% while it
// is the meal at hand.
import { TIER_SECONDS, TIER_XP_PER_HOUR, TIERS, VALUE, type Recipe } from './content.ts';

export const COOKED_HEALS = [150, 330, 530, 730, 930, 1230, 1530, 1830];
const DISH_NAMES = ['', '', 'Pike pie', 'Salmon stew', 'Carp pie', 'Eel stew', 'Char pie', 'Sturgeon stew'];

/** Each tier's feast from tier 5: its name, the greater find it takes and that find's price. */
const FEASTS: Record<number, { name: string; find: string; worth: number }> = {
  5: { name: 'Carp feast', find: 'River pearl', worth: 1200 },
  6: { name: 'Eel feast', find: 'Saffron threads', worth: 3000 },
  7: { name: 'Char feast', find: 'Amber nugget', worth: 1200 },
  8: { name: 'Sturgeon feast', find: 'Rough sapphire', worth: 1200 },
};

export interface Dish extends Recipe {
  /** How many one cooking makes. */
  makes: number;
  heals: number;
}

export const COOKING: Dish[] = TIERS.flatMap((t) => {
  const i = t.tier - 1;
  const unit = TIER_SECONDS[i];
  const xpOf = (s: number) => Math.round((TIER_XP_PER_HOUR[i] * s) / 3600);
  const log = `${t.log} logs`;
  const cooked: Dish = {
    id: `cooking.fish${t.tier}`,
    name: `Cooked ${t.fish.toLowerCase()}`,
    level: t.level,
    tier: t.tier,
    kind: 'fish',
    inputs: { [t.fish]: 2, [log]: 1 },
    seconds: unit * 3,
    xp: xpOf(unit * 3),
    makes: 2,
    value: Math.round((2 * VALUE.fish[i] + VALUE.log[i]) / 2),
    heals: COOKED_HEALS[i],
  };
  if (t.tier < 3) return [cooked];
  const dish: Dish = {
    id: `cooking.dish${t.tier}`,
    name: DISH_NAMES[i],
    level: t.level + 5,
    tier: t.tier,
    kind: 'dish',
    inputs: { [t.fish]: 1, [TIERS[i - 1].fish]: 1, [log]: 1 },
    seconds: unit * 3,
    xp: xpOf(unit * 3),
    makes: 2,
    value: Math.round((VALUE.fish[i] + VALUE.fish[i - 1] + VALUE.log[i]) / 2),
    heals: Math.floor((COOKED_HEALS[i] * 1.3) / 10) * 10,
  };
  const feast = FEASTS[t.tier];
  if (!feast) return [cooked, dish];
  const made: Dish = {
    id: `cooking.feast${t.tier}`,
    name: feast.name,
    level: dish.level,
    tier: t.tier,
    kind: 'feast',
    inputs: { [dish.name]: 10, [feast.find]: 1 },
    seconds: unit * 3,
    xp: xpOf(unit * 3),
    makes: 10,
    value: dish.value + Math.round(feast.worth / 10),
    heals: dish.heals,
  };
  return [cooked, dish, made];
});
