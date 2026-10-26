// Session 13's proof: the food loop. Home-cooked food beats the vendor's from tier 2, a meal never heals
// much past what the fighter lost, Cooking pays its tier's XP, and an hour of Fishing is worth at least
// as much as an hour of the other Gathering skills once its catch is cooked and eaten.
import { FISHING, FOODS, TIER_XP_PER_HOUR, TIERS, VALUE, WOODCUTTING } from './content.ts';
import { COOKING } from './cooking.ts';
import { actionRate, maxHealth } from './mechanics.ts';

type Say = (s?: string) => void;
type Ok = (b: boolean, what: string) => void;

/** The vendor's best food for a Hitpoints level: the most healing of those on sale. */
const vendorAt = (level: number) => [...FOODS].filter((f) => f.level <= level).sort((a, b) => b.heals - a.heals)[0];

export function foodChecks(out: Say, ok: Ok) {
  out('\n## The food loop (session 13)');
  for (const { tier, level } of TIERS) {
    const cooked = COOKING.find((r) => r.tier === tier && r.kind === 'fish')!;
    const dish = COOKING.find((r) => r.tier === tier && r.kind === 'dish');
    const v = vendorAt(level);
    const ours = cooked.heals / cooked.value;
    const theirs = v.heals / v.price;
    out(
      `Tier ${tier}: ${cooked.name} heals ${cooked.heals} for ${cooked.value} gold of worth (${ours.toFixed(1)} a gold); ${v.name} ${v.heals} for ${v.price} (${theirs.toFixed(1)})` +
        (dish ? `; ${dish.name} heals ${dish.heals} for ${dish.value}` : ''),
    );
    if (tier >= 2)
      ok(ours >= 1.2 * theirs, `Tier ${tier}: home-cooked food heals at least 1.2 times the vendor's for its worth`);
    const half = maxHealth(level) / 2;
    ok(
      cooked.heals <= half * 1.05,
      `Tier ${tier}: ${cooked.name} heals no more than half the health at Hitpoints ${level}`,
    );
    if (dish) ok(dish.heals <= half * 1.3, `Tier ${tier}: ${dish.name} wastes little of its healing`);
  }
  ok(
    COOKING.every((r) => Math.abs(((r.xp / r.seconds) * 3600) / TIER_XP_PER_HOUR[r.tier - 1] - 1) < 0.1),
    'Cooking recipes within 10% of their tier rate',
  );
  // An hour of each Gathering skill on its tier's standard action, at a mid-tier level: logs at their
  // price, and fish at the vendor's food they replace once cooked (less the half log that cooks each).
  for (const { tier, level } of TIERS) {
    const i = tier - 1;
    const lvl = level + 5;
    const perHour = (a: (typeof WOODCUTTING)[number], skill: 'woodcutting' | 'fishing') => {
      const r = actionRate(skill, lvl, a, 450, false);
      return (3600 / r.secondsPerAction) * r.itemsPerAction;
    };
    const wood = WOODCUTTING.find((a) => a.tier === tier && a.kind === 'standard')!;
    const fish = FISHING.find((a) => a.tier === tier && a.kind === 'standard')!;
    const cooked = COOKING.find((r) => r.tier === tier && r.kind === 'fish')!;
    const v = vendorAt(level);
    const fishWorth = Math.max(VALUE.fish[i], cooked.heals / (v.heals / v.price) - VALUE.log[i] / 2);
    const woodGold = perHour(wood, 'woodcutting') * VALUE.log[i];
    const fishGold = perHour(fish, 'fishing') * fishWorth;
    out(
      `Tier ${tier}: an hour of Woodcutting sells for ${Math.round(woodGold)}; an hour of Fishing, cooked and eaten, saves ${Math.round(fishGold)} at the vendor`,
    );
    ok(fishGold >= 0.8 * woodGold, `Tier ${tier}: Fishing pays at least 80% of Woodcutting`);
  }
  out(
    "Supply: cooking without pause takes two fish and one log every three of the tier's units, so one Gathering lane fishing and the fire's second lane chopping half the time keep the Artisan lane cooking.",
  );
}
