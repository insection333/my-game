// Castle Clash's gold (SPEC.md section 3, DESIGN.md sections 5, 8 and 11): the plan's two growth curves,
// the required treasury and the edict it powers, upkeep, the deep vault, and the burn that destroys 95%
// of all gold spent and puts 5% in the war chest.
import {
  BUILDING_IDS,
  COMBAT,
  DECREE_WEEK_SECONDS,
  ECONOMY,
  RELIC,
  RELICS,
  SIEGE,
  SINKS,
  TECH,
  UNIT_IDS,
  YOUNG,
  type TechId,
} from '@idle-clash/content';
import type { Castle } from './castle.ts';
import { lift, modifiers } from './effects.ts';

const WEEK = DECREE_WEEK_SECONDS * 1000;

export const upgradeGoldCost = (base: number, level: number): number => Math.round(base * ECONOMY.COST_GROWTH ** level);

/** A young castle's share of a siege's fee, a spy's bribe and a stronghold's bounty, by its rating
 *  (session 167): rating ÷ 2,400, up to whole. */
export const youth = (rating: number): number => Math.min(1, Math.max(1, rating) / YOUNG.RATING);

/** A level's share of its price below level 4 (session 167): (level ÷ 4)², up to whole. */
export const earlyLevel = (level: number): number => Math.min(1, (Math.max(0, level) / YOUNG.FULL_PRICE_LEVEL) ** 2);
export const statPower = (base: number, level: number): number => base * Math.max(0, level) ** ECONOMY.STAT_EXPONENT;

/** A burn: 95% destroyed, 5% to the war chest, in whole gold. */
export function splitBurn(gold: number): { destroyed: number; toChest: number } {
  const amount = Math.max(0, Math.floor(gold));
  const toChest = Math.floor(amount * ECONOMY.BURN_TO_WAR_CHEST);
  return { destroyed: amount - toChest, toChest };
}

/** The mean of the seven levels: four buildings, three units. */
export const avgLevel = (c: Castle): number =>
  [...BUILDING_IDS, ...UNIT_IDS].reduce((n, k) => n + c.levels[k], 0) / (BUILDING_IDS.length + UNIT_IDS.length);

/** The treasury an edict needs, measured against the castle and against the lord (DESIGN.md 11.2). */
export function requiredTreasury(c: Castle, totalLevel: number): number {
  const level = Math.max(avgLevel(c), totalLevel / ECONOMY.TREASURY_TOTAL_LEVEL_DIVISOR);
  return Math.round(ECONOMY.TREASURY_BASE * ECONOMY.TREASURY_GROWTH ** level);
}

/** Excavation's idle multiplier, 1 + 0.02 × √depth: it lifts the edict and idle AP (DESIGN.md 7). */
export const idleMultiplier = (c: Castle): number => 1 + SINKS.EXCAVATION_MULT_SLOPE * Math.sqrt(c.excavationDepth);

/** What the deep foundations give, for the page (session 143): the lift to the edict and the flow of AP
 *  now and what the next dig adds, in percent, and the gold the vault keeps for each dig. */
export function excavationGain(c: Castle): { now: number; next: number; vault: number } {
  const deeper = { ...c, excavationDepth: c.excavationDepth + 1 };
  return {
    now: (idleMultiplier(c) - 1) * 100,
    next: (idleMultiplier(deeper) - idleMultiplier(c)) * 100,
    vault: ECONOMY.VAULT_FLAT_PER_DEPTH,
  };
}

/** The edict's bonus now, in percent, or 0 when none is chosen or the treasury is short of the requirement. */
export function edictBonusPct(c: Castle, totalLevel: number): number {
  const req = requiredTreasury(c, totalLevel);
  if (!c.edict || c.treasury < req) return 0;
  const scale = Math.min(ECONOMY.EDICT_MAX_MULT, 1 + ECONOMY.EDICT_LOG_SLOPE * Math.log2(c.treasury / req));
  return ECONOMY.EDICT_BASE_PCT * scale * idleMultiplier(c);
}

/** Below the requirement, the garrison fights at 80% (the plan's unpaid morale). */
export const morale = (c: Castle, totalLevel: number): number =>
  c.treasury < requiredTreasury(c, totalLevel) ? ECONOMY.UNPAID_MORALE : 1;

/** Upkeep owed since the last count: 2% a day, compounding, while an edict is chosen, paused from 48 hours
 *  after the start of the last Call to arms day (DESIGN.md 5.6). Returns the castle and the gold burned. */
export function syncUpkeep(c: Castle, now: number): { castle: Castle; burned: number } {
  if (!c.edict || c.treasury <= 0 || now <= c.lastUpkeepAt) return { castle: { ...c, lastUpkeepAt: now }, burned: 0 };
  const pauseAt = c.lastCtaDateUtc ? Date.parse(`${c.lastCtaDateUtc}T00:00:00Z`) + ECONOMY.UPKEEP_PAUSE_MS : -Infinity;
  const until = Math.min(now, pauseAt);
  // Week by week, each at its own decree's rate (DESIGN.md 5.19).
  let factor = 1;
  for (let from = c.lastUpkeepAt; from < until;) {
    const to = Math.min(until, (Math.floor(from / WEEK) + 1) * WEEK);
    const rate = ECONOMY.UPKEEP_PER_DAY * lift(modifiers(c, from).costs.upkeep);
    factor *= (1 - rate) ** ((to - from) / 86_400_000);
    from = to;
  }
  const kept = Math.floor(c.treasury * factor);
  return { castle: { ...c, treasury: kept, lastUpkeepAt: now }, burned: c.treasury - kept };
}

/** How much of the treasury the deep vault keeps safe: a flat part and a share, never past 75%. */
export function protectedGold(c: Castle, now: number): number {
  const L = c.levels.deepVault;
  const flat = ECONOMY.VAULT_FLAT_PER_LEVEL * L + ECONOMY.VAULT_FLAT_PER_DEPTH * c.excavationDepth;
  const share =
    (ECONOMY.VAULT_PCT_BASE + (ECONOMY.VAULT_PCT_RANGE * L) / (L + ECONOMY.VAULT_PCT_HALF)) *
    lift(modifiers(c, now).vaultProtect);
  return Math.floor(Math.min(ECONOMY.VAULT_MAX_PROTECT * c.treasury, flat + share * c.treasury));
}

/** Gold a siege could take, before vigilance, overextension and the raid cap: past the deep vault and,
 *  given the lord's total level, past the edict's floor (SIEGE.EDICT_FLOOR, session 137). */
export function raidableGold(c: Castle, now: number, totalLevel?: number): number {
  const floor = totalLevel === undefined ? 0 : Math.ceil(requiredTreasury(c, totalLevel) * SIEGE.EDICT_FLOOR);
  return Math.max(0, c.treasury - Math.max(protectedGold(c, now), floor));
}

/** What raising a building or unit one level costs, with this castle's cost effects. */
export function levelCost(c: Castle, base: number, level: number, now: number): number {
  return Math.round(upgradeGoldCost(base, level) * earlyLevel(level) * lift(modifiers(c, now).costs.upgrades));
}

/** A War College rank's gold and war marks, or null at the last rank. */
export function techCost(c: Castle, tech: TechId, now: number): { gold: number; marks: number } | null {
  const rank = c.techs[tech];
  if (rank >= TECH.RANKS) return null;
  const gold = Math.round(TECH.GOLD_BASE * TECH.GOLD_GROWTH ** rank * lift(modifiers(c, now).costs.upgrades));
  return { gold, marks: TECH.MARKS_PER_RANK * (rank + 1) };
}

/** A war relic's next level: war marks and gold, or null at its last level (or no such relic). */
export function relicCost(c: Castle, id: string): { gold: number; marks: number } | null {
  if (!RELICS.some((r) => r.id === id)) return null;
  const level = Object.hasOwn(c.relics, id) ? c.relics[id] : 0;
  if (level >= RELIC.LEVELS) return null;
  return { gold: Math.round(RELIC.GOLD_BASE * RELIC.GOLD_GROWTH ** level), marks: RELIC.MARKS_PER_LEVEL * (level + 1) };
}

/** An excavation's AP and gold, with the castle's cost effects. */
export function excavationCost(c: Castle, now: number): { ap: number; gold: number } {
  const gold = SINKS.EXCAVATION_GOLD_BASE * SINKS.EXCAVATION_GROWTH ** c.excavationDepth;
  return { ap: SINKS.EXCAVATION_AP, gold: Math.round(gold * lift(modifiers(c, now).costs.excavation)) };
}

/** Changing the garrison, trap or castellan: 1% of the required treasury. */
export const defenseChangeCost = (c: Castle, totalLevel: number): number =>
  Math.round(requiredTreasury(c, totalLevel) * COMBAT.DEFENSE_CHANGE_COST_PCT);
