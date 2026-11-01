// Castle Clash's castle rating (SPEC.md section 4A): permanent military and fortification power only, on
// the same L^1.05 scale as combat, so it only ever rises and a peaceful vault or excavation never lifts it.
import { BUILDINGS, RELICS, SINKS, UNITS, type UnitId } from '@idle-clash/content';
import type { Castle } from './castle.ts';
import { statPower } from './economy.ts';

/** A unit's drill bonus in percent: 50 × (1 − e^(−xp ÷ 10,000)). */
export const drillPct = (xp: number): number =>
  SINKS.DRILL_MAX_PCT * (1 - Math.exp(-Math.max(0, xp) / SINKS.DRILL_SCALE));

/** The three best war relics owned, by combat score at their levels, worn or not. */
export function topRelicScore(c: Castle): number {
  const scores = RELICS.map((r) => r.score * (Object.hasOwn(c.relics, r.id) ? c.relics[r.id] : 0)).sort(
    (a, b) => b - a,
  );
  return scores.slice(0, 3).reduce((n, s) => n + s, 0);
}

/** A unit's power before formation and fight: statPower(100, level) × (1 + drill). */
export const unitBase = (c: Castle, u: UnitId): number =>
  statPower(UNITS.find((x) => x.id === u)!.power, c.levels[u]) * (1 + drillPct(c.drillXp[u]) / 100);

export function bastionRating(c: Castle): number {
  const buildings = BUILDINGS.reduce((n, b) => n + statPower(b.power, c.levels[b.id]), 0);
  const units = UNITS.reduce((n, u) => n + unitBase(c, u.id), 0);
  return Math.round(buildings + units + topRelicScore(c));
}
