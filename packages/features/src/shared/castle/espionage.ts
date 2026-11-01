// Castle Clash's espionage (SPEC.md section 4D, DESIGN.md 5.8): four missions, the chance of each, and the
// anti-collusion rules. A caught spy never strengthens the defender for everyone: it compromises only that
// attacker's network against that defender and pays the defender war marks. A debuff that lapses by time
// leaves no immunity; only a genuine siege consuming it does (siege.ts).
import { COMBAT, ESPIONAGE, SPY_MISSIONS, type SpyMission } from '@idle-clash/content';
import type { Castle, DebuffKind } from './castle.ts';
import { lift, modifiers } from './effects.ts';
import { raidableGold, statPower } from './economy.ts';
import { pairOf, withPair } from './pairs.ts';

export const missionOf = (id: string): SpyMission | undefined => SPY_MISSIONS.find((m) => m.id === id);

/** Stealth: the spy guild, lifted by stealth effects, less a quarter per compromised-network stack. */
export function stealth(att: Castle, defId: string, now: number): number {
  const cn = pairOf(att, defId, now).cn;
  return (
    statPower(60, att.levels.spyGuild) * lift(modifiers(att, now).stealth) * (1 - ESPIONAGE.COMPROMISED_STEALTH) ** cn
  );
}

/** Detection: the beacon tower, lifted by detection effects. */
export const detection = (def: Castle, now: number): number =>
  statPower(80, def.levels.watchtower) * lift(modifiers(def, now).detection);

/** A mission's chance: clamp(0.5 + 0.35 × ln(stealth ÷ detection), 0.10, 0.90). */
export function spyChance(att: Castle, def: Castle, now: number): number {
  const ratio = stealth(att, def.userId, now) / Math.max(1e-9, detection(def, now));
  const p = ESPIONAGE.CHANCE_BASE + ESPIONAGE.CHANCE_SLOPE * Math.log(ratio);
  return Math.min(ESPIONAGE.CHANCE_MAX, Math.max(ESPIONAGE.CHANCE_MIN, p));
}

/** A mission's AP and bribe, scaled to the stronger of the two castles. */
export function spyCosts(att: Castle, def: Castle, mission: SpyMission, now: number): { ap: number; gold: number } {
  const gold =
    ESPIONAGE.BRIBE_PER_RATING *
    Math.max(att.rating, def.rating, 1) *
    mission.bribe *
    lift(modifiers(att, now).costs.bribes);
  return { ap: mission.ap, gold: Math.round(gold) };
}

export type SpyRefusal = 'self' | 'shielded' | 'pairLimit' | 'immune' | 'full' | 'ap' | 'unknown';

/** Why a mission may not go, or null: refused before anything is spent (DESIGN.md 5.8). */
export function spyRefusal(att: Castle, def: Castle, missionId: string, now: number): SpyRefusal | null {
  const mission = missionOf(missionId);
  if (!mission) return 'unknown';
  if (att.userId === def.userId) return 'self';
  if (def.shieldUntil > now) return 'shielded';
  if (pairOf(att, def.userId, now).spies.length >= ESPIONAGE.PAIR_SPIES) return 'pairLimit';
  if (mission.debuff) {
    const kind = mission.id as DebuffKind;
    const until = def.immunities[kind];
    if (until !== undefined && until > now) return 'immune';
    const stacks = def.debuffs.filter((d) => d.kind === kind && d.until > now).reduce((n, d) => n + d.stacks, 0);
    if (stacks >= mission.debuff.max) return 'full';
  }
  if (att.activeAp + 1e-9 < mission.ap) return 'ap';
  return null;
}

/** What a scouting reveals: the garrison, trap, castellan, worn relics and the gold a siege could take. */
export interface ScoutReport {
  defense: readonly [number, number, number];
  trap: string | null;
  castellan: string | null;
  relics: string[];
  raidable: number;
}

export interface SpyResult {
  attacker: Castle;
  defender: Castle;
  success: boolean;
  /** War marks the defender earned for catching the spy. */
  defenderMarks: number;
}

/** Runs a mission that was not refused (the bribe is the caller's to take). `roll` in [0, 1). */
export function runMission(att: Castle, def: Castle, missionId: string, now: number, roll: number): SpyResult {
  const mission = missionOf(missionId)!;
  const chance = spyChance(att, def, now);
  const pair = pairOf(att, def.userId, now);
  const spent: Castle = { ...att, activeAp: Math.max(0, att.activeAp - mission.ap) };
  if (roll >= chance) {
    // Caught: this pair's network is compromised (a quarter less stealth, 12 hours, up to 3 stacks); the
    // defender earns war marks; nothing else changes for anyone.
    const caught = {
      ...pair,
      spies: [...pair.spies, now],
      cn: Math.min(ESPIONAGE.COMPROMISED_MAX, pair.cn + 1),
      cnUntil: now + ESPIONAGE.COMPROMISED_MS,
    };
    const marks = Math.round(ESPIONAGE.CAUGHT_SPY_MARKS * lift(modifiers(def, now).marks));
    return {
      attacker: withPair(spent, caught, now),
      defender: { ...def, warMarks: def.warMarks + marks, warMarksEarned: def.warMarksEarned + marks },
      success: false,
      defenderMarks: marks,
    };
  }
  const attacker = withPair(spent, { ...pair, spies: [...pair.spies, now] }, now);
  if (mission.id === 'scout')
    return {
      attacker,
      defender: {
        ...def,
        reconLockdownUntil: now + COMBAT.RECON_LOCK_MS,
        withdrawLockdownUntil: now + COMBAT.WITHDRAW_LOCK_MS,
      },
      success: true,
      defenderMarks: 0,
    };
  const kind = mission.id;
  const lasts = mission.debuff!.lasts;
  const live = def.debuffs.filter((d) => d.until > now);
  const held = live.find((d) => d.kind === kind);
  const debuffs = held
    ? live.map((d) =>
        d === held ? { kind, stacks: Math.min(mission.debuff!.max, d.stacks + 1), until: now + lasts } : d,
      )
    : [...live, { kind, stacks: 1, until: now + lasts }];
  return {
    attacker,
    defender: { ...def, debuffs: debuffs.slice(-ESPIONAGE.MAX_ENTRIES) },
    success: true,
    defenderMarks: 0,
  };
}

/** The report a successful scouting brings home. */
export function scoutReport(def: Castle, now: number): ScoutReport {
  return {
    defense: def.defense,
    trap: def.activeTrap,
    castellan: def.castellan,
    relics: [...def.equippedRelics],
    raidable: raidableGold(def, now),
  };
}
