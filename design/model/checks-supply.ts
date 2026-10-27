// Session 14's proof: supplies for all three styles. With each style using its tier's supply, the style
// the triangle favours still wins against every foe; a supply pays for itself (the extra gold, and the
// extra XP at what the tier's gathering pays for XP, are worth more than the supplies used); Fletching
// pays its tier's XP; Runecraft pays as Mining does.
import {
  beatenBy,
  FOES,
  MINING,
  RUNECRAFT,
  SMITHING,
  TIER_SECONDS,
  TIER_XP_PER_HOUR,
  TIERS,
  VALUE,
  type Style,
} from './content.ts';
import { actionRate, odds, tierForLevel, type Fighter } from './mechanics.ts';
import { rng } from './rng.ts';
import { FLETCHING, SMITHING_SUPPLIES, SUPPLIES, SUPPLY_DAMAGE } from './supplies.ts';

type Say = (s?: string) => void;
type Ok = (b: boolean, what: string) => void;
const STYLES: Style[] = ['melee', 'archery', 'magic'];

/** A fighter at a level in that level's tier of gear, with or without that tier's supply. */
const fighter = (style: Style, level: number, supplied: boolean): Fighter => {
  const tier = tierForLevel(level);
  const s = SUPPLIES.find((x) => x.style === style && x.tier === tier)!;
  return {
    style,
    styleLevel: level,
    weaponTier: tier,
    armourTier: tier,
    hpLevel: level,
    ...(supplied ? { supply: { pct: SUPPLY_DAMAGE[tier - 1], value: s.value } } : {}),
  };
};

/** What an XP is worth in gold at a tier: what an hour of that tier's Woodcutting sells for, a XP. */
const goldPerXp = (tier: number) =>
  ((3600 / TIER_SECONDS[tier - 1]) * VALUE.log[tier - 1]) / TIER_XP_PER_HOUR[tier - 1];

export function supplyChecks(out: Say, ok: Ok) {
  out('\n## Supplies (session 14)');
  for (const f of FOES) {
    const lvl = Math.max(1, f.level - 1);
    const at = (s: Style, supplied: boolean) => odds(fighter(s, lvl, supplied), f, rng(lvl * 977 + f.level), 400);
    // The style that beats the foe's, and the one the foe's beats.
    const adv = beatenBy[f.style];
    const dis = STYLES.find((s) => beatenBy[s] === f.style)!;
    const a = at(adv, true);
    const d = at(dis, true);
    ok(a.xpPerHour > d.xpPerHour && a.foodPerHour <= d.foodPerHour, `${f.name}: with supplies, ${adv} still wins`);
    const bare = at(adv, false);
    const gain = (a.xpPerHour - bare.xpPerHour) * goldPerXp(f.tier) + (a.goldPerHour - bare.goldPerHour);
    const used = a.killsPerHour * SUPPLIES.find((x) => x.style === adv && x.tier === tierForLevel(lvl))!.value;
    out(
      `${f.name} (${adv}, level ${lvl}): +${Math.round((a.xpPerHour / bare.xpPerHour - 1) * 100)}% XP an hour; supplies worth ${Math.round(used)} an hour bring ${Math.round(gain + used)}`,
    );
    ok(gain > 0, `${f.name}: ${adv}'s supply pays for itself`);
  }
  ok(
    [...FLETCHING, ...SMITHING_SUPPLIES].every(
      (r) => Math.abs(((r.xp / r.seconds) * 3600) / TIER_XP_PER_HOUR[r.tier - 1] - 1) < 0.1,
    ),
    'Fletching and Smithing supply recipes within 10% of their tier rate',
  );
  // From tier 3, where a rune's worth is not lost to rounding to whole gold.
  for (const { tier } of TIERS.filter((t) => t.tier >= 3)) {
    const rune = RUNECRAFT.find((a) => a.tier === tier && a.kind === 'standard')!;
    const ore = MINING.find((a) => a.tier === tier && a.kind === 'standard')!;
    const runeGold = rune.qty * VALUE.rune[tier - 1];
    const oreGold = ore.qty * VALUE.ore[tier - 1];
    ok(
      runeGold >= 0.75 * oreGold && runeGold <= 1.34 * oreGold,
      `Tier ${tier}: a draw of runes sells for about what a vein's ore does (${runeGold} and ${oreGold})`,
    );
  }
  out(
    'Supply: an hour of Fletching makes arrows for two to three hours of fights at the same tier; an hour of Runecraft draws runes for three or more.',
  );
}

/** The forge's supply: how much of the time Mining must work to keep smelting fed, at each tier. */
export function forgeSupply(say: Say) {
  say('\n## Supply: can mining keep the forge fed?');
  for (const { tier: t, level: opens } of TIERS) {
    const share = (kind: 'standard' | 'rich', mastery: number) => {
      const mine = MINING.find((a) => a.tier === t && a.kind === kind)!;
      const r = actionRate('mining', opens + 5, mine, mastery, false);
      const orePerHour = (3600 / r.secondsPerAction) * r.itemsPerAction;
      const bar = SMITHING.find((x) => x.id === `smithing.bar${t}`)!;
      const oresPerHour = (3600 / bar.seconds) * Object.values(bar.inputs).reduce((a, b) => a + b, 0);
      return Math.round((oresPerHour / orePerHour) * 100);
    };
    say(
      `Tier ${t}: smelting without pause needs mining ${share('standard', 450)}% of the time on a fresh vein, ${share('rich', 3600)}% on a mastered deep seam`,
    );
  }
}
