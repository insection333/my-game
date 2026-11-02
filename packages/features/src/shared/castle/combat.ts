// Castle Clash's battle (SPEC.md section 4C, DESIGN.md 5.12): the 3 × 3 bilinear matrix with the flank
// penalty, traps and wall penetration, between two sides each made of three units and their shares. A
// side is a castle (in attack or in defence) or an incursion's fortress.
import { COMBAT, FORGE_SHIFT, FORGE_TARGET, POISON_PCT, SIEGE, TRAPS, UNIT_IDS } from '@idle-clash/content';
import { fractions, type Castle, type DebuffKind } from './castle.ts';
import { lift, modifiers, unitIndex, type Modifiers } from './effects.ts';
import { morale } from './economy.ts';
import { unitBase } from './rating.ts';

type Three = [number, number, number];

export interface Side {
  /** Each unit's power before shares (statPower × drill). */
  base: Three;
  /** Shares as fractions summing to 1. */
  shares: Three;
  mods: Modifiers;
  /** Percent wounded. */
  wounded: number;
  /** Defence only: walls, trap, vigilance stacks, morale, poison stacks. */
  walls: { level: number; integrity: number };
  trap: string | null;
  vigilance: number;
  morale: number;
  poison: number;
}

/** The flank penalty for a share over 60%: 1 − 0.5 × (p − 0.6). */
export const flankMult = (p: number): number =>
  p > COMBAT.FLANK_THRESHOLD ? 1 - COMBAT.FLANK_SLOPE * (p - COMBAT.FLANK_THRESHOLD) : 1;

/** Unit i's tactical multiplier against the other side's shares: Σⱼ otherⱼ × M[i][j]. */
export const tacMult = (i: number, other: readonly number[]): number =>
  other.reduce((n, o, j) => n + o * COMBAT.MATRIX[i][j], 0);

/** The walls' defence bonus: 0.6 × L ÷ (L + 25), scaled by integrity. */
export const wallBonus = (level: number, integrity: number): number =>
  ((COMBAT.WALL_BONUS_MAX * level) / (level + COMBAT.WALL_BONUS_HALF)) * (integrity / 100);

/** The share of the walls' bonus an attack bypasses: 0.25 × its siege share, and its penetration effects. */
export const penetration = (att: Side): number =>
  Math.min(COMBAT.PENETRATION_MAX, COMBAT.PENETRATION_PER_SIEGE_SHARE * att.shares[2] + att.mods.penetration);

/** The active debuffs on a castle at a moment, by kind (stacks). */
export function debuffStacks(c: Castle, now: number): Record<DebuffKind, number> {
  const out: Record<DebuffKind, number> = { poison: 0, sabotage: 0, forge: 0 };
  for (const d of c.debuffs) if (d.until > now) out[d.kind] += d.stacks;
  return out;
}

/** Garrison shares drawn 15% of the way towards 33/33/34 (forged orders). */
export const forged = (s: Three): Three => s.map((x, i) => x + FORGE_SHIFT * (FORGE_TARGET[i] - x)) as Three;

/** A castle as a side. In defence, `fair` says whether the sabotage on it bites: only in a siege within
 *  the genuine rating bound (DESIGN.md 11.5). */
export function castleSide(
  c: Castle,
  now: number,
  role: 'attack' | 'defense',
  opts: { totalLevel?: number; fair?: boolean } = {},
): Side {
  const debuffs = role === 'defense' && opts.fair ? debuffStacks(c, now) : { poison: 0, sabotage: 0, forge: 0 };
  const shares = fractions(role === 'attack' ? c.offense : c.defense);
  const vigil = c.genuineReceived.filter((t) => t > now - SIEGE.VIGILANCE_WINDOW_MS).length;
  return {
    base: UNIT_IDS.map((u) => unitBase(c, u)) as Three,
    shares: debuffs.forge > 0 ? forged(shares) : shares,
    mods: modifiers(c, now),
    wounded: c.infirmaryPct,
    walls: { level: c.levels.walls, integrity: c.wallIntegrity },
    trap: debuffs.sabotage > 0 ? null : c.activeTrap,
    vigilance: Math.min(SIEGE.VIGILANCE_MAX, vigil),
    morale: role === 'defense' ? morale(c, opts.totalLevel ?? 0) : 1,
    poison: Math.min(2, debuffs.poison),
  };
}

/** An attack's power against a defending side: shares × power × flank × matrix × trap, with its own
 *  attack effects and wounds. */
export function attackPower(att: Side, def: Side): number {
  const trapped = TRAPS.find((t) => t.id === def.trap);
  let total = 0;
  for (let i = 0; i < 3; i++) {
    const unit = UNIT_IDS[i];
    const effects = lift(att.mods.attack + att.mods.unitAttack[unit]);
    const trap = trapped && unitIndex(trapped.against) === i && !att.mods.trapImmune.includes(unit);
    total +=
      att.shares[i] *
      att.base[i] *
      effects *
      flankMult(att.shares[i]) *
      tacMult(i, def.shares) *
      (trap ? 1 - COMBAT.TRAP_PENALTY : 1);
  }
  return total * lift(-att.wounded);
}

/** A defence's power against an attack: its units by the matrix, behind walls the attack partly bypasses,
 *  with vigilance, morale, poison and wounds. */
export function defensePower(def: Side, att: Side): number {
  let total = 0;
  for (let j = 0; j < 3; j++) {
    const unit = UNIT_IDS[j];
    const effects = lift(def.mods.defense + def.mods.unitDefense[unit]);
    total += def.shares[j] * def.base[j] * effects * flankMult(def.shares[j]) * tacMult(j, att.shares);
  }
  const walls = 1 + wallBonus(def.walls.level, def.walls.integrity) * (1 - penetration(att));
  const vigilance = 1 + SIEGE.VIGILANCE_DEFENSE * def.vigilance;
  const poison = 1 - (POISON_PCT / 100) * def.poison;
  return total * walls * vigilance * def.morale * poison * lift(-def.wounded);
}

/** R = attacker × uniform(0.96, 1.04) ÷ defender, from a roll in [0, 1). */
export function combatRatio(att: Side, def: Side, roll: number): { attack: number; defense: number; r: number } {
  const attack = attackPower(att, def);
  const defense = defensePower(def, att);
  const spread = 1 - COMBAT.ROLL_SPREAD + 2 * COMBAT.ROLL_SPREAD * roll;
  return { attack, defense, r: defense > 0 ? (attack * spread) / defense : Infinity };
}

/** A battle's account, for its report (session 38): each side's strength, and the day's fortune (the
 *  roll's ±10%, as a fraction) from which the ratio came. */
export const battleAccount = (attack: number, defense: number, r: number) => ({
  attack: Math.round(attack),
  defense: Math.round(defense),
  fortune: defense > 0 && attack > 0 && Number.isFinite(r) ? Math.round(((r * defense) / attack - 1) * 1000) / 1000 : 0,
});

/** The plan's three outcomes, by R. */
export type Outcome = 'repelled' | 'graze' | 'decisive';
export const outcomeOf = (r: number): Outcome =>
  r < SIEGE.GRAZE_FROM ? 'repelled' : r < SIEGE.DECISIVE_FROM ? 'graze' : 'decisive';

/** The share of the raidable gold taken: none when repelled, 0.2 to 1 across a grazing breach, all of it
 *  in a decisive one. */
export function lootFactor(r: number): number {
  const o = outcomeOf(r);
  if (o === 'repelled') return 0;
  if (o === 'decisive') return 1;
  return (
    SIEGE.GRAZE_LOOT_MIN +
    (1 - SIEGE.GRAZE_LOOT_MIN) * ((r - SIEGE.GRAZE_FROM) / (SIEGE.DECISIVE_FROM - SIEGE.GRAZE_FROM))
  );
}
