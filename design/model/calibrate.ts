// Calibrates each foe against its intended matchup: a player at the unlock level, in that tier's
// gear, using the style that beats it (the rat: a newcomer's sword, an even fight).
// Prints FOE_STATS for content.ts. Targets: kill time by tier, ~10 food an hour, the tier's XP rate.
import { writeFileSync } from 'node:fs';
import { FOES, TIER_XP_PER_HOUR, beatenBy, type Style } from './content.ts';
import { odds, tierForLevel, XP_PER_DAMAGE_BY_TIER } from './mechanics.ts';
import { rng } from './rng.ts';

const KILL_SECONDS = [16, 19, 22, 25, 27, 29, 31, 33];
const FOOD_PER_HOUR = 10;
const GOLD_PER_HOUR = [600, 1500, 3500, 7000, 8000, 12000, 17000, 23000]; // a gathering lane's sale value at the tier
const out: Record<string, [number, number, number, number]> = {};
for (const f of FOES) {
  const L = Math.max(1, f.level - 1);
  const tier = tierForLevel(L);
  const style: Style = f.id === 'hollow-rat' ? 'melee' : beatenBy[f.style];
  const p = { style, styleLevel: L, weaponTier: tier, armourTier: tierForLevel(f.hitpoints), hpLevel: f.hitpoints };
  const at = (hp: number, maxHit: number) => odds(p, { ...f, hp, maxHit, xp: 1, gold: 0 }, rng(7), 1500);
  let hp = 100;
  while (3600 / at(hp, 10).killsPerHour < KILL_SECONDS[tier - 1]) hp += 10;
  let maxHit = 10;
  while (at(hp, maxHit + 5).foodPerHour <= FOOD_PER_HOUR && maxHit < 2000) maxHit += 5;
  const kph = at(hp, maxHit).killsPerHour;
  const o = at(hp, maxHit);
  out[f.id] = [
    hp,
    maxHit,
    Math.round(hp * XP_PER_DAMAGE_BY_TIER[f.tier - 1]),
    Math.max(1, Math.round(GOLD_PER_HOUR[tier - 1] / kph)),
  ];
  console.log(
    f.id.padEnd(15),
    'xp/h',
    Math.round(o.xpPerHour),
    'target',
    Math.round(TIER_XP_PER_HOUR[tier - 1] * 1.1),
    'food/h',
    o.foodPerHour.toFixed(1),
    o.verdict,
  );
}
writeFileSync(new URL('./foe-stats.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
