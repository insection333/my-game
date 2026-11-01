// Castle Clash's endless solo sinks (SPEC.md section 5.4): Drilling (AP into a unit's lasting bonus),
// Deep Foundation Excavation (AP and gold into the vault and the idle multiplier), and Incursions against
// six fortresses in turn, each tier stronger, for war marks and drill XP. Pure.
import { FORTRESSES, RECOVERY, SINKS, SPOILS, UNIT_IDS, type UnitId } from '@idle-clash/content';
import type { Castle } from './castle.ts';
import { castleSide, combatRatio, type Side } from './combat.ts';
import { lift, modifiers, noModifiers } from './effects.ts';
import { excavationCost } from './economy.ts';
import { pay, type Done, type Wallet } from './manage.ts';

/** Drills a unit: 10 AP for 250 drill XP, `times` over. */
export function drill(w: Wallet, unit: UnitId, times: number): Done {
  if (!UNIT_IDS.includes(unit) || !Number.isInteger(times) || times < 1 || times > 50)
    return { ok: false, reason: 'invalid' };
  const ap = SINKS.DRILL_AP * times;
  if (w.castle.activeAp + 1e-9 < ap) return { ok: false, reason: 'ap' };
  const xp = SINKS.DRILL_AP * SINKS.DRILL_XP_PER_AP * times;
  return {
    ok: true,
    castle: {
      ...w.castle,
      activeAp: w.castle.activeAp - ap,
      drillXp: { ...w.castle.drillXp, [unit]: w.castle.drillXp[unit] + xp },
    },
    purse: w.purse,
    burned: 0,
  };
}

/** Digs the foundations a level deeper. */
export function excavate(w: Wallet, now: number): Done {
  const cost = excavationCost(w.castle, now);
  if (w.castle.activeAp + 1e-9 < cost.ap) return { ok: false, reason: 'ap' };
  const paid = pay(w, cost.gold);
  if (!paid) return { ok: false, reason: 'gold' };
  return {
    ok: true,
    castle: {
      ...paid.castle,
      activeAp: paid.castle.activeAp - cost.ap,
      excavationDepth: paid.castle.excavationDepth + 1,
    },
    purse: paid.purse,
    burned: cost.gold,
  };
}

/** The fortress at a tier: the six in turn. */
export const fortressAt = (tier: number) => FORTRESSES[(Math.max(1, tier) - 1) % FORTRESSES.length];

/** A fortress as a defending side: each unit 80 × tier^1.05 strong, behind whole walls of its tier. */
export function fortressSide(tier: number): Side {
  const f = fortressAt(tier);
  const power = SINKS.INCURSION_POWER_BASE * Math.max(1, tier) ** SINKS.INCURSION_POWER_EXP;
  const total = f.garrison[0] + f.garrison[1] + f.garrison[2];
  return {
    base: [power, power, power],
    shares: f.garrison.map((g) => g / total) as [number, number, number],
    mods: noModifiers(),
    wounded: 0,
    walls: { level: tier, integrity: 100 },
    trap: f.trap,
    vigilance: 0,
    morale: 1,
    poison: 0,
  };
}

/** Scouts the tier's fortress: its garrison and trap are shown until the tier is beaten. */
export function scoutIncursion(w: Wallet): Done {
  if (w.castle.incursionScoutedTier === w.castle.incursionTier) return { ok: false, reason: 'unchanged' };
  if (w.castle.activeAp + 1e-9 < SINKS.INCURSION_SCOUT_AP) return { ok: false, reason: 'ap' };
  return {
    ok: true,
    castle: {
      ...w.castle,
      activeAp: w.castle.activeAp - SINKS.INCURSION_SCOUT_AP,
      incursionScoutedTier: w.castle.incursionTier,
    },
    purse: w.purse,
    burned: 0,
  };
}

export interface IncursionResult {
  castle: Castle;
  won: boolean;
  r: number;
  marks: number;
  drillXp: Record<UnitId, number>;
  /** A fortress taken now and then yields more: the armoury (1 in 10), the hoard (1 in 100). */
  spoils: FortressSpoils | null;
}
export type FortressSpoils = 'armoury' | 'hoard';

/** What a fortress taken yields beyond its marks, from a roll in [0, 1). */
export const spoilsOf = (luck: number): FortressSpoils | null =>
  luck < SPOILS.HOARD ? 'hoard' : luck < SPOILS.HOARD + SPOILS.ARMOURY ? 'armoury' : null;

/** Assaults the tier's fortress with the attack's formation. Won (R ≥ 1): war marks and drill XP shared
 *  by the formation, and the next tier, with the spoils `luck` finds. Lost: the wounds of a lost battle.
 *  `roll` and `luck` in [0, 1); a luck of 1 finds nothing. */
export function launchIncursion(c: Castle, now: number, roll: number, luck = 1): IncursionResult | 'ap' {
  if (c.activeAp + 1e-9 < SINKS.INCURSION_AP) return 'ap';
  const tier = c.incursionTier;
  const att = castleSide(c, now, 'attack');
  const { r } = combatRatio(att, fortressSide(tier), roll);
  const mods = modifiers(c, now);
  const spent = { ...c, activeAp: c.activeAp - SINKS.INCURSION_AP };
  const none = { vanguard: 0, outriders: 0, siege: 0 };
  if (r < 1)
    return {
      castle: {
        ...spent,
        infirmaryPct: Math.min(RECOVERY.INFIRMARY_MAX, c.infirmaryPct + RECOVERY.WOUNDS_LOSER * lift(mods.woundsTaken)),
      },
      won: false,
      r,
      marks: 0,
      drillXp: none,
      spoils: null,
    };
  const spoils = spoilsOf(luck);
  const times = spoils === 'hoard' ? SPOILS.HOARD_TIMES : spoils === 'armoury' ? SPOILS.ARMOURY_TIMES : 1;
  const marks = Math.round((SINKS.INCURSION_MARKS_BASE + Math.floor(tier / 2)) * lift(mods.marks) * times);
  const pool = SINKS.INCURSION_DRILL_XP_BASE + SINKS.INCURSION_DRILL_XP_PER_TIER * tier;
  const drillXp = Object.fromEntries(UNIT_IDS.map((u, i) => [u, Math.round(pool * att.shares[i])])) as Record<
    UnitId,
    number
  >;
  return {
    castle: {
      ...spent,
      warMarks: c.warMarks + marks,
      warMarksEarned: c.warMarksEarned + marks,
      incursionTier: tier + 1,
      drillXp: Object.fromEntries(UNIT_IDS.map((u) => [u, c.drillXp[u] + drillXp[u]])) as Record<UnitId, number>,
      infirmaryPct: Math.min(RECOVERY.INFIRMARY_MAX, c.infirmaryPct + RECOVERY.WOUNDS_WINNER * lift(mods.woundsTaken)),
    },
    won: true,
    r,
    marks,
    drillXp,
    spoils,
  };
}
