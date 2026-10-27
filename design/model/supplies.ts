// The model's supplies (session 14), kept beside content.ts. Each style has one: Archery takes arrows
// (Fletching makes them from a bar and a log, 25 at a time), Magic takes runes (Runecraft draws them at
// the standing stones, eight at a time) and Melee takes whetstones (Smithing makes them from a bar, 25
// at a time), so the triangle stays fair. A fighter uses the best of their style that their level
// allows, one per foe fought, and deals more damage by its tier. The standing stones past the first need
// a key Smithing binds from two bars; a key is kept, never used up.
import { TIER_SECONDS, TIER_XP_PER_HOUR, TIERS, VALUE, type Recipe, type Style } from './content.ts';

/** Damage added by a supply of each tier, as a share. */
export const SUPPLY_DAMAGE = [5, 7, 9, 11, 13, 15, 17, 20];
/** How many supplies one making gives. */
export const SUPPLY_BATCH = 25;

const xpOf = (i: number, seconds: number) => Math.round((TIER_XP_PER_HOUR[i] * seconds) / 3600);

/** Fletching: each tier's arrows, from one of its bars and one of its logs. */
export const FLETCHING: Recipe[] = TIERS.map((t) => {
  const i = t.tier - 1;
  const seconds = TIER_SECONDS[i] * 2;
  return {
    id: `fletching.arrows${t.tier}`,
    name: `${t.metal} arrows`,
    level: t.level,
    tier: t.tier,
    kind: 'arrows',
    inputs: { [`${t.metal} bar`]: 1, [`${t.log} logs`]: 1 },
    seconds,
    xp: xpOf(i, seconds),
    value: Math.round((VALUE.bar[i] + VALUE.log[i]) / SUPPLY_BATCH),
    makes: SUPPLY_BATCH,
  };
});

/** Smithing's part: each tier's whetstones, and from tier 2 its key, opening with the tier's bar (so the
 *  perks on Smithing's other levels stay where they were). */
export const SMITHING_SUPPLIES: Recipe[] = TIERS.flatMap((t) => {
  const i = t.tier - 1;
  const unit = TIER_SECONDS[i];
  const whet: Recipe = {
    id: `smithing.whet${t.tier}`,
    name: `${t.metal} whetstones`,
    level: t.level,
    tier: t.tier,
    kind: 'whetstones',
    inputs: { [`${t.metal} bar`]: 1 },
    seconds: unit,
    xp: xpOf(i, unit),
    value: Math.round(VALUE.bar[i] / SUPPLY_BATCH),
    makes: SUPPLY_BATCH,
  };
  if (t.tier === 1) return [whet];
  const key: Recipe = {
    id: `smithing.key${t.tier}`,
    name: `${t.metal} key`,
    level: t.level,
    tier: t.tier,
    kind: 'key',
    inputs: { [`${t.metal} bar`]: 2 },
    seconds: unit * 2,
    xp: xpOf(i, unit * 2),
    value: Math.round(2 * VALUE.bar[i] * 1.4),
  };
  return [whet, key];
});

/** Every supply: its name, the style that uses it, its tier and what it sells for. */
export interface Supply {
  name: string;
  style: Style;
  tier: number;
  value: number;
}
export const SUPPLIES: Supply[] = TIERS.flatMap((t) => {
  const i = t.tier - 1;
  return [
    { name: `${t.metal} whetstones`, style: 'melee', tier: t.tier, value: Math.round(VALUE.bar[i] / SUPPLY_BATCH) },
    { name: `${t.metal} arrows`, style: 'archery', tier: t.tier, value: FLETCHING[i].value },
    { name: `${t.rune} rune`, style: 'magic', tier: t.tier, value: VALUE.rune[i] },
  ];
});

/** The key a tier's standing stones need (none for the first). */
export const keyFor = (tier: number) => (tier > 1 ? `${TIERS[tier - 1].metal} key` : null);
