// The legendary siege (session 220, the plan *Dead and short content, 23 November*): each season a named
// fortress of eight chambers, taken one battle at a time and in order, once a season, a chamber opening each
// week (session 222). Every chamber's garrison
// and trap are the season's own and the same for everyone (friends can talk over the season's puzzle), and its
// strength is measured against the lord's own might at their first assault on it and fixed for the season,
// each chamber a step stronger: the first falls to a formation set against it, the last only with the spies'
// work and a castle grown in the season. Measured against might, not rating, it asks the same of a lord a
// month in as of one two years in. Each chamber pays war marks; the last makes it taken, a deed and, at three
// seasons, a banner. Pure.
import { ECONOMY, FORTRESSES, RECOVERY, SINKS, TRAPS, UNIT_IDS, type UnitId } from '@idle-clash/content';
import type { Castle } from './castle.ts';
import { attackPower, castleSide, combatRatio, defensePower, type Side } from './combat.ts';
import { lift, modifiers, noModifiers } from './effects.ts';
import { SEASON_DAYS, SEASON_EPOCH } from '../season.ts';
import { foeOps, NO_OPS, withOps, type FoeOps } from './foe-spies.ts';
import { hash } from './mercenaries.ts';

export const LEGEND = {
  CHAMBERS: 8,
  /** AP an assault on a chamber takes. */
  AP: 40,
  /** Each chamber's defence against an even attack, as a share of the lord's might at the season's first
   *  assault: the first a tenth under it, the last a ninth over it. */
  SCALES: [0.9, 0.93, 0.96, 0.99, 1.02, 1.05, 1.08, 1.11] as readonly number[],
  /** War marks a chamber pays, times its place (1 to 5). */
  MARKS: 10,
  /** The fortress tier a castle must have reached to face it. */
  OPENS_AT_TIER: 10,
  /** Days between its chambers opening (session 222): the first as the season opens, then one a week, so a
   *  season's legend is a week-by-week campaign rather than a day's work, the last opening in its eighth week. */
  OPENS_EVERY_DAYS: 7,
} as const;

/** The season's fortress, named by the season (its chambers are drawn by `orderOf`). */
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
  /** Each unit's power, as a stronghold's (statPower at its level). */
  power: number;
  /** The level its units and walls stand at (for its walls, and its host's drawing). */
  level: number;
  garrison: readonly [number, number, number];
  trap: string;
}

type Three = [number, number, number];
const EVEN: Three = [1 / 3, 1 / 3, 1 / 3];
const plain = (base: Three, shares: Three, level: number): Side => ({
  base,
  shares,
  mods: noModifiers(),
  wounded: 0,
  walls: { level, integrity: 100 },
  trap: null,
  vigilance: 0,
  morale: 1,
  poison: 0,
});

/** The season's chambers as the six fortresses' garrisons and traps, in an order drawn from the season
 *  (the same for everyone), so no two chambers of a season match and seasons differ. */
const orderOf = (season: number): number[] =>
  FORTRESSES.map((_, i) => i).sort((a, b) => hash(`legend:${season}:${a}`) - hash(`legend:${season}:${b}`));

/** A castle's might: its attack in even shares, unwounded, against an even defence with no trap. Every
 *  effect it fights with counts (relics, studies, tempers, drill), as in a battle. */
export function mightOf(c: Castle, now: number): number {
  const att = { ...castleSide(c, now, 'attack'), shares: EVEN, wounded: 0 };
  return attackPower(att, plain([1, 1, 1], EVEN, 0));
}

/** The lord's legend this season: the chambers taken, and the might it is measured from (fixed at the
 *  season's first assault; until then, the castle's might now). */
export function legendNow(c: Castle, season: number, now: number) {
  const mine = c.legendSeason === season;
  return {
    taken: mine ? c.legendTaken : 0,
    base: mine && c.legendBase > 0 ? c.legendBase : Math.max(1, Math.round(mightOf(c, now))),
  };
}

/** A chamber: the season's garrison and trap, its units at the power whose defence against an even attack
 *  is its share of the lord's might (walls at the level that power stands at). */
export function chamberOf(c: Castle, season: number, n: number, now: number): Chamber {
  const { base } = legendNow(c, season, now);
  const f = FORTRESSES[orderOf(season)[n % FORTRESSES.length]];
  // Past the sixth, a garrison met before behind the next trap, so no two chambers of a season match.
  const trap = n < FORTRESSES.length ? f.trap : TRAPS[(TRAPS.findIndex((x) => x.id === f.trap) + 1) % TRAPS.length].id;
  const total = f.garrison[0] + f.garrison[1] + f.garrison[2];
  const shares = f.garrison.map((g) => g / total) as Three;
  const target = base * LEGEND.SCALES[n];
  // The walls' level from the power, which is from the walls' level: a few rounds settle it, the power
  // taken last behind the walls the side stands behind.
  const powerAt = (walls: number) => target / defensePower(plain([1, 1, 1], shares, walls), plain([1, 1, 1], EVEN, 0));
  let level = 1;
  for (let i = 0; i < 3; i++) level = Math.max(1, (powerAt(Math.round(level)) / 100) ** (1 / ECONOMY.STAT_EXPONENT));
  return { n, power: powerAt(Math.round(level)), level, garrison: f.garrison, trap };
}

export const chamberKey = (season: number, n: number): string => `legend:${season}:${n}`;

/** When a season's chamber opens: the first with the season, then one a week. */
export const chamberOpens = (season: number, n: number): number =>
  SEASON_EPOCH + ((season - 1) * SEASON_DAYS + n * LEGEND.OPENS_EVERY_DAYS) * 86_400_000;

/** A chamber as a defending side, with the attacker's spies' work on it. */
export function chamberSide(ch: Chamber, ops: FoeOps = NO_OPS): Side {
  const total = ch.garrison[0] + ch.garrison[1] + ch.garrison[2];
  return withOps(
    {
      ...plain([ch.power, ch.power, ch.power], ch.garrison.map((g) => g / total) as Three, Math.round(ch.level)),
      trap: ch.trap,
    },
    ops,
  );
}

/** The chamber that stands next this season, with the spies' work on it, or null when all eight are taken or
 *  the castle has not reached the fortress tier that opens it. */
export function nextChamber(
  c: Castle,
  season: number,
  now: number,
): { chamber: Chamber; side: Side; opens: number } | null {
  const { taken } = legendNow(c, season, now);
  if (taken >= LEGEND.CHAMBERS || c.incursionTier < LEGEND.OPENS_AT_TIER) return null;
  const chamber = chamberOf(c, season, taken, now);
  return {
    chamber,
    side: chamberSide(chamber, foeOps(c, chamberKey(season, taken), now)),
    opens: chamberOpens(season, taken),
  };
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
      /** All eight taken by this battle. */
      taken: boolean;
    }
  | 'ap'
  | 'none'
  /** Its next chamber has not opened yet. */
  | 'waiting';

/** Assaults the season's next chamber with the attack's formation. Won: its war marks and drill XP, and the
 *  next chamber; the last takes the fortress. Lost: the wounds of a lost battle. `roll` in [0, 1). */
export function assaultLegend(c: Castle, season: number, now: number, roll: number): LegendResult {
  const next = nextChamber(c, season, now);
  if (!next) return 'none';
  if (now < next.opens) return 'waiting';
  if (c.activeAp + 1e-9 < LEGEND.AP) return 'ap';
  const mods = modifiers(c, now);
  const att = castleSide(c, now, 'attack');
  const { attack, defense, r } = combatRatio(att, next.side, roll);
  const { base, taken: before } = legendNow(c, season, now);
  const spent: Castle = {
    ...c,
    activeAp: c.activeAp - LEGEND.AP,
    legendSeason: season,
    legendBase: base,
    legendTaken: before,
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
  // Training as the fortress's, a tier above the lord's own a chamber.
  const pool = SINKS.INCURSION_DRILL_XP_BASE + SINKS.INCURSION_DRILL_XP_PER_TIER * (c.incursionTier + n);
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
