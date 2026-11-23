// The legendary siege (session 220, the plan *Dead and short content, 23 November*): each season a named
// fortress of five chambers, taken one battle at a time and in order, once a season. Every chamber's garrison
// and trap are the season's own and the same for everyone (friends can talk over the season's puzzle), and its
// strength is fixed for the season from the lord's own fortress tier at their first assault on it, rising two
// tiers a chamber: the last chambers fall to a castle grown in the season, or to the spies' work. Each chamber
// pays war marks; the fifth makes it taken, a deed and, at three seasons, a banner. Pure.
import { FORTRESSES, RECOVERY, SINKS, UNIT_IDS, type UnitId } from '@idle-clash/content';
import type { Castle } from './castle.ts';
import { castleSide, combatRatio, type Side } from './combat.ts';
import { lift, modifiers, noModifiers } from './effects.ts';
import { foeOps, NO_OPS, withOps, type FoeOps } from './foe-spies.ts';

export const LEGEND = {
  CHAMBERS: 5,
  /** AP an assault on a chamber takes. */
  AP: 40,
  /** The first chamber stands this many tiers above the lord's fortress tier at the season's first assault,
   *  and each after it this many more. */
  ABOVE: 2,
  STEP: 2,
  /** War marks a chamber pays, times its place (1 to 5). */
  MARKS: 15,
  /** The fortress tier a castle must have reached to face it. */
  OPENS_AT_TIER: 10,
} as const;

/** The season's fortress: its name, by the season, and each chamber's garrison and trap, drawn from the six
 *  fortresses' in turn so no two chambers of a season match. */
export const LEGENDS = [
  'the-drowned-throne',
  'the-ninefold-gate',
  'the-ember-crown',
  'the-stag-kings-hall',
  'the-hollow-star',
  'the-last-bastion',
] as const;
export const legendOf = (season: number): (typeof LEGENDS)[number] => LEGENDS[(season - 1) % LEGENDS.length];

export interface Chamber {
  n: number;
  tier: number;
  garrison: readonly [number, number, number];
  trap: string;
}

/** The lord's legend this season: the chambers taken, and the tier it stands at (its strength, fixed at the
 *  season's first assault; until then, from the fortress tier now). */
export function legendNow(c: Castle, season: number) {
  const mine = c.legendSeason === season;
  return { taken: mine ? c.legendTaken : 0, base: mine && c.legendBase > 0 ? c.legendBase : c.incursionTier };
}

export function chamberOf(c: Castle, season: number, n: number): Chamber {
  const { base } = legendNow(c, season);
  const f = FORTRESSES[(season * 2 + n) % FORTRESSES.length];
  return { n, tier: base + LEGEND.ABOVE + LEGEND.STEP * n, garrison: f.garrison, trap: f.trap };
}

export const chamberKey = (season: number, n: number): string => `legend:${season}:${n}`;

/** A chamber as a defending side, with the attacker's spies' work on it. */
export function chamberSide(ch: Chamber, ops: FoeOps = NO_OPS): Side {
  const power = SINKS.INCURSION_POWER_BASE * Math.max(1, ch.tier) ** SINKS.INCURSION_POWER_EXP;
  const total = ch.garrison[0] + ch.garrison[1] + ch.garrison[2];
  return withOps(
    {
      base: [power, power, power],
      shares: ch.garrison.map((g) => g / total) as [number, number, number],
      mods: noModifiers(),
      wounded: 0,
      walls: { level: ch.tier, integrity: 100 },
      trap: ch.trap,
      vigilance: 0,
      morale: 1,
      poison: 0,
    },
    ops,
  );
}

/** The chamber that stands next this season, with the spies' work on it, or null when all five are taken or
 *  the castle has not reached the fortress tier that opens it. */
export function nextChamber(c: Castle, season: number, now: number): { chamber: Chamber; side: Side } | null {
  const { taken } = legendNow(c, season);
  if (taken >= LEGEND.CHAMBERS || c.incursionTier < LEGEND.OPENS_AT_TIER) return null;
  const chamber = chamberOf(c, season, taken);
  return { chamber, side: chamberSide(chamber, foeOps(c, chamberKey(season, taken), now)) };
}

export type LegendResult =
  | {
      castle: Castle;
      won: boolean;
      chamber: number;
      r: number;
      attack: number;
      defense: number;
      marks: number;
      /** All five taken by this battle. */
      taken: boolean;
    }
  | 'ap'
  | 'none';

/** Assaults the season's next chamber with the attack's formation. Won: its war marks and drill XP, and the
 *  next chamber; the fifth takes the fortress. Lost: the wounds of a lost battle. `roll` in [0, 1). */
export function assaultLegend(c: Castle, season: number, now: number, roll: number): LegendResult {
  const next = nextChamber(c, season, now);
  if (!next) return 'none';
  if (c.activeAp + 1e-9 < LEGEND.AP) return 'ap';
  const mods = modifiers(c, now);
  const att = castleSide(c, now, 'attack');
  const { attack, defense, r } = combatRatio(att, next.side, roll);
  const { base } = legendNow(c, season);
  const spent: Castle = {
    ...c,
    activeAp: c.activeAp - LEGEND.AP,
    legendSeason: season,
    legendBase: base,
    legendTaken: legendNow(c, season).taken,
  };
  const n = next.chamber.n;
  if (r < 1)
    return {
      castle: {
        ...spent,
        infirmaryPct: Math.min(RECOVERY.INFIRMARY_MAX, c.infirmaryPct + RECOVERY.WOUNDS_LOSER * lift(mods.woundsTaken)),
      },
      won: false,
      chamber: n,
      r,
      attack,
      defense,
      marks: 0,
      taken: false,
    };
  const marks = Math.round(LEGEND.MARKS * (n + 1) * lift(mods.marks));
  const pool = SINKS.INCURSION_DRILL_XP_BASE + SINKS.INCURSION_DRILL_XP_PER_TIER * next.chamber.tier;
  const taken = n + 1 >= LEGEND.CHAMBERS;
  return {
    castle: {
      ...spent,
      legendTaken: n + 1,
      legends: c.legends + (taken ? 1 : 0),
      warMarks: c.warMarks + marks,
      warMarksEarned: c.warMarksEarned + marks,
      drillXp: Object.fromEntries(
        UNIT_IDS.map((u, i) => [u, c.drillXp[u] + Math.round(pool * att.shares[i])]),
      ) as Record<UnitId, number>,
      infirmaryPct: Math.min(RECOVERY.INFIRMARY_MAX, c.infirmaryPct + RECOVERY.WOUNDS_WINNER * lift(mods.woundsTaken)),
    },
    won: true,
    chamber: n,
    r,
    attack,
    defense,
    marks,
    taken,
  };
}
