// Spies against the day's foes (session 167): a stronghold's or the fortress's wells poisoned, its gatehouse
// sabotaged or its orders forged, as a lord's may be, so the Spy Guild has work from the first day (spies on
// lords wait until lords open). The garrison and trap of a foe are known, so there is nothing to scout. The
// work is kept on the attacker's row with that foe's pair (`ops`), lasts as long as on a lord, and counts in
// the foe's side as it stands (the odds and the battle alike). A caught spy compromises that pair's network,
// as against a lord; no one earns war marks for it.
import { ESPIONAGE, SPY_MISSIONS, type SpyMission } from '@idle-clash/content';
import type { Castle, DebuffKind } from './castle.ts';
import { forged, type Side } from './combat.ts';
import { statPower } from './economy.ts';
import { spyCosts, stealth } from './espionage.ts';
import { pairOf, withPair } from './pairs.ts';

export type FoeOps = Record<DebuffKind, number>;
export const NO_OPS: FoeOps = { poison: 0, sabotage: 0, forge: 0 };

/** The fortress at a tier as a foe's key, beside a stronghold's own id (`merc:<day>:<n>`). */
export const fortressKey = (tier: number): string => `fortress:${tier}`;

/** The missions that work on a foe: all but scouting. */
export const FOE_MISSIONS: readonly SpyMission[] = SPY_MISSIONS.filter((m) => m.debuff !== null);

/** The spies' work standing on a foe now, by kind (stacks). */
export function foeOps(c: Pick<Castle, 'pairs'>, foe: string, now: number): FoeOps {
  const out: FoeOps = { ...NO_OPS };
  for (const o of pairOf(c, foe, now).ops ?? []) out[o.kind] += o.stacks;
  return out;
}

/** When each kind of work on a foe lapses (the latest), for the page. */
export function foeOpsUntil(c: Pick<Castle, 'pairs'>, foe: string, now: number): Partial<Record<DebuffKind, number>> {
  const out: Partial<Record<DebuffKind, number>> = {};
  for (const o of pairOf(c, foe, now).ops ?? []) out[o.kind] = Math.max(out[o.kind] ?? 0, o.until);
  return out;
}

/** A foe's side with the spies' work on it: poisoned wells, a sabotaged trap, forged orders. */
export function withOps(side: Side, ops: FoeOps): Side {
  return {
    ...side,
    poison: Math.min(2, side.poison + ops.poison),
    trap: ops.sabotage > 0 ? null : side.trap,
    shares: ops.forge > 0 ? forged(side.shares) : side.shares,
  };
}

/** A mission's chance against a foe of this level: the Spy Guild's stealth against the foe's watch at its
 *  level, looser than a lord's watchtower (session 169), as against a lord's otherwise (DESIGN.md 5.8). */
export function foeSpyChance(c: Castle, foe: string, level: number, now: number): number {
  const ratio = stealth(c, foe, now) / Math.max(1e-9, statPower(ESPIONAGE.FOE_WATCH_BASE, Math.max(1, level)));
  const p = ESPIONAGE.CHANCE_BASE + ESPIONAGE.CHANCE_SLOPE * Math.log(ratio);
  return Math.min(ESPIONAGE.CHANCE_MAX, Math.max(ESPIONAGE.CHANCE_MIN, p));
}

/** A mission's AP and bribe against a foe: as against a lord of your own rating. */
export const foeSpyCosts = (c: Castle, mission: SpyMission, now: number) => spyCosts(c, c, mission, now);

export type FoeSpyRefusal = 'unknown' | 'spyLimit' | 'full' | 'ap';

/** Why a mission may not go against a foe, or null. */
export function foeSpyRefusal(c: Castle, foe: string, missionId: string, now: number): FoeSpyRefusal | null {
  const mission = FOE_MISSIONS.find((m) => m.id === missionId);
  if (!mission) return 'unknown';
  if (pairOf(c, foe, now).spies.length >= ESPIONAGE.PAIR_SPIES) return 'spyLimit';
  if (foeOps(c, foe, now)[mission.id as DebuffKind] >= mission.debuff!.max) return 'full';
  if (c.activeAp + 1e-9 < mission.ap) return 'ap';
  return null;
}

/** A mission against a foe that was not refused (the bribe is the caller's to take). `roll` in [0, 1). */
export function spyOnFoe(
  c: Castle,
  foe: string,
  level: number,
  missionId: string,
  now: number,
  roll: number,
): { castle: Castle; success: boolean; chance: number } {
  const mission = FOE_MISSIONS.find((m) => m.id === missionId)!;
  const chance = foeSpyChance(c, foe, level, now);
  const pair = pairOf(c, foe, now);
  const spent: Castle = { ...c, activeAp: Math.max(0, c.activeAp - mission.ap) };
  const spies = [...pair.spies, now];
  if (roll >= chance) {
    const caught = {
      ...pair,
      spies,
      cn: Math.min(ESPIONAGE.COMPROMISED_MAX, pair.cn + 1),
      cnUntil: now + ESPIONAGE.COMPROMISED_MS,
    };
    return { castle: withPair(spent, caught, now), success: false, chance };
  }
  const kind = mission.id as DebuffKind;
  const ops = pair.ops ?? [];
  const held = ops.find((o) => o.kind === kind);
  const until = now + mission.debuff!.lasts;
  const next = held
    ? ops.map((o) => (o === held ? { kind, stacks: Math.min(mission.debuff!.max, o.stacks + 1), until } : o))
    : [...ops, { kind, stacks: 1, until }];
  return { castle: withPair(spent, { ...pair, spies, ops: next }, now), success: true, chance };
}
