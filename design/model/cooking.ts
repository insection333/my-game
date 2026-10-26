// The model's Cooking (session 13), kept beside content.ts. Each tier's fish is cooked two at a time over
// one of that tier's logs; from tier 3 a pie or a stew mixes the tier's fish with the one before, two at
// a time. Cooked food heals about half of the health a fighter has at its tier (the most a meal eaten
// below half health never wastes); a dish heals a quarter more. It sells for what went into it, and for
// that worth it heals more than the vendor's food does for its price from tier 2 on (checks2.ts).
import { TIER_SECONDS, TIER_XP_PER_HOUR, TIERS, VALUE, type Recipe } from './content.ts';

export const COOKED_HEALS = [150, 330, 530, 730, 930, 1230, 1530, 1830];
const DISH_NAMES = ['', '', 'Pike pie', 'Salmon stew', 'Carp pie', 'Eel stew', 'Char pie', 'Sturgeon stew'];

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
    heals: Math.round((COOKED_HEALS[i] * 1.25) / 10) * 10,
  };
  return [cooked, dish];
});
