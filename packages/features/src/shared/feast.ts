// Feasts (session 245): Cooking's best dishes were worth no more than the vendor's food once gold was plenty,
// so the top four may be made into feasts, ten dishes and one greater Uncommon find making ten. A feast heals
// as its dish, and while it is the meal at hand (the food a fight eats first) it lifts the fight: a pie's
// feast its damage, a stew's its combat XP. It works only while eaten: never a lift to keep up by hand.
// Shared, because Cooking makes them and the fighter, the fight's spoils and every rate read them.
import { fmt, t } from '@idle-clash/content';
import { countOf, type State } from '@idle-clash/kernel';
import { foods, itemOf } from './catalog.ts';
import { codeOrder } from './order.ts';

export type FeastLift = 'damage' | 'xp';
export interface Feast {
  /** The dish it is made of, ten at a time. */
  dish: string;
  /** The greater Uncommon find each ten take. */
  find: string;
  lift: FeastLift;
}

/** How much a feast lifts, in percent. */
export const FEAST_PCT = 5;
/** Dishes a feast takes (and feasts it makes) for each find. */
export const FEAST_BATCH = 10;

export const FEASTS: Readonly<Record<string, Feast>> = {
  'carp-feast': { dish: 'carp-pie', find: 'river-pearl', lift: 'damage' },
  'eel-feast': { dish: 'eel-stew', find: 'saffron-threads', lift: 'xp' },
  'char-feast': { dish: 'char-pie', find: 'amber-nugget', lift: 'damage' },
  'sturgeon-feast': { dish: 'sturgeon-stew', find: 'rough-sapphire', lift: 'xp' },
};
export const feastOf = (item: string): Feast | null => (Object.hasOwn(FEASTS, item) ? FEASTS[item] : null);

/** The order a fight eats its food: the most healing first, a feast before a dish that heals as much. */
export function mealOrder(a: { item: string; heals: number }, b: { item: string; heals: number }): number {
  return b.heals - a.heals || Number(!!feastOf(b.item)) - Number(!!feastOf(a.item)) || codeOrder(a.item, b.item);
}

/** The meal at hand: the food carried that a fight eats first, or null with none. */
export function mealAtHand(state: State): string | null {
  const carried = foods()
    .filter((f) => countOf(state, f.id) > 0)
    .map((f) => ({ item: f.id, heals: f.heals! }))
    .sort(mealOrder);
  return carried[0]?.item ?? null;
}

/** What the meal at hand lifts, in percent (0 unless it is a feast of that lift). */
export function feastLift(state: State, lift: FeastLift): number {
  const at = mealAtHand(state);
  const f = at ? feastOf(at) : null;
  return f && f.lift === lift && itemOf(at!) ? FEAST_PCT : 0;
}

const PANEL: Record<FeastLift, string> = { damage: 'food.feast.damage', xp: 'food.feast.xp' };
const ROW: Record<FeastLift, string> = { damage: 'feast.lift.damage', xp: 'feast.lift.xp' };

/** What a feast does, for its item panel ("While your fighter eats it first: +5% damage."), or null. */
export function feastWords(item: string): string | null {
  const f = feastOf(item);
  return f ? t('food.feast', { lift: t(PANEL[f.lift], { pct: fmt.pct(FEAST_PCT) }) }) : null;
}

/** The same, after a row's "Each heals 2,370" ("and lifts damage 5% while eaten first"), or null. */
export function feastRowWords(item: string): string | null {
  const f = feastOf(item);
  return f ? t(ROW[f.lift], { pct: fmt.pct(FEAST_PCT) }) : null;
}
