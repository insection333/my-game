// Castle Clash: every effect a castle has, gathered from its units' evolutions, its castellan, the War
// College, its worn war relics and this week's realm decree, into one set of modifiers.
import {
  DECREE_WEEK_SECONDS,
  DECREES,
  DOCTRINES,
  EVOLUTION_LEVELS,
  RELICS,
  TECHS,
  UNIT_IDS,
  UNITS,
  type CastleEffect,
  type UnitId,
} from '@idle-clash/content';
import type { Castle } from './castle.ts';

type CostKind = 'upgrades' | 'bribes' | 'excavation' | 'repair' | 'upkeep';

/** Percents are whole numbers (10 = +10%); penetration a share of the walls' bonus. */
export interface Modifiers {
  attack: number;
  defense: number;
  unitAttack: Record<UnitId, number>;
  unitDefense: Record<UnitId, number>;
  stealth: number;
  detection: number;
  loot: number;
  marks: number;
  vaultProtect: number;
  recovery: number;
  apRate: number;
  apCap: number;
  penetration: number;
  woundsTaken: number;
  wallDamage: number;
  trapImmune: UnitId[];
  costs: Record<CostKind, number>;
}

/** No effects at all: a fortress's or a mercenary's side. */
export const noModifiers = (): Modifiers => ({
  attack: 0,
  defense: 0,
  unitAttack: { vanguard: 0, outriders: 0, siege: 0 },
  unitDefense: { vanguard: 0, outriders: 0, siege: 0 },
  stealth: 0,
  detection: 0,
  loot: 0,
  marks: 0,
  vaultProtect: 0,
  recovery: 0,
  apRate: 0,
  apCap: 0,
  penetration: 0,
  woundsTaken: 0,
  wallDamage: 0,
  trapImmune: [],
  costs: { upgrades: 0, bribes: 0, excavation: 0, repair: 0, upkeep: 0 },
});

/** Adds one effect, `times` over (a tech's rank, a relic's level). */
function apply(m: Modifiers, e: CastleEffect, times = 1): void {
  switch (e.kind) {
    case 'attack':
      if (e.unit) m.unitAttack[e.unit] += e.pct * times;
      else m.attack += e.pct * times;
      return;
    case 'defense':
      if (e.unit) m.unitDefense[e.unit] += e.pct * times;
      else m.defense += e.pct * times;
      return;
    case 'penetration':
      m.penetration += e.share * times;
      return;
    case 'trapImmune':
      if (!m.trapImmune.includes(e.unit)) m.trapImmune.push(e.unit);
      return;
    case 'apCap':
      m.apCap += e.amount * times;
      return;
    case 'costs':
      m.costs[e.of] += e.pct * times;
      return;
    default:
      m[e.kind] += e.pct * times;
  }
}

/** A unit's evolution, 0 to 3, by its level (levels 1, 10, 25 and 50). */
export const evolutionOf = (level: number): number => EVOLUTION_LEVELS.filter((l) => level >= l).length - 1;

/** This week's realm decree: floor(now in seconds ÷ 604,800) mod 5 (the plan, with no cron job). */
export const decreeIndex = (now: number): number =>
  Math.floor(Math.floor(now / 1000) / DECREE_WEEK_SECONDS) % DECREES.length;
export const decreeOf = (now: number) => DECREES[decreeIndex(now)];

/** Everything that changes a castle's numbers at a moment (the decree is the week's). */
export function modifiers(c: Castle, now: number): Modifiers {
  const m = noModifiers();
  for (const u of UNITS) {
    const stage = evolutionOf(c.levels[u.id]);
    for (const p of u.passives.slice(0, stage)) apply(m, p);
  }
  const doctrine = DOCTRINES.find((d) => d.id === c.castellan);
  for (const e of doctrine?.effects ?? []) apply(m, e);
  for (const t of TECHS) for (const e of t.perRank) apply(m, e, c.techs[t.id]);
  for (const id of c.equippedRelics) {
    const r = RELICS.find((x) => x.id === id);
    const level = Object.hasOwn(c.relics, id) ? c.relics[id] : 0;
    if (r && level > 0) apply(m, r.perLevel, level);
  }
  for (const e of decreeOf(now).effects) apply(m, e);
  return m;
}

/** A percent as a multiplier, never below zero (−120% is nothing, not a negative). */
export const lift = (pct: number): number => Math.max(0, 1 + pct / 100);

export const unitIndex = (u: UnitId): number => UNIT_IDS.indexOf(u);
