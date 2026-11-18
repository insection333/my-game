// "Next for your castle" (session 140, the castle review's fifth stage): the castle's nearest milestone and
// how far off it is, so the game's longest stretch has a signpost on every tab. While a troop has an
// evolution ahead, the troop nearest its next one by the gold to get there; then the relics, one at a time
// to their last level, in the Reliquary's order; then tempering, the worn relic with the best chance (a
// temper never ends, so there is always a next). Pure.
import { EVOLUTION_LEVELS, RELIC, RELICS, UNITS, type UnitId } from '@idle-clash/content';
import type { Castle } from './castle.ts';
import { levelCost, relicCost } from './economy.ts';
import { evolutionOf, temperOf } from './effects.ts';
import { temperChance, temperCost } from './temper.ts';

export type NextStep =
  | { kind: 'evolution'; unit: UnitId; evolution: string; level: number; levels: number; gold: number }
  | { kind: 'relic'; relic: string; level: number; gold: number; marks: number }
  | { kind: 'temper'; relic: string; temper: number; chance: number; gold: number; marks: number };

export function nextForCastle(c: Castle, now: number): NextStep | null {
  const evolutions = UNITS.flatMap((u) => {
    const level = c.levels[u.id];
    const next = evolutionOf(level) + 1;
    if (next >= EVOLUTION_LEVELS.length) return [];
    const to = EVOLUTION_LEVELS[next];
    let gold = 0;
    for (let l = level; l < to; l++) gold += levelCost(c, u.cost, l, now);
    return [
      { kind: 'evolution' as const, unit: u.id, evolution: u.evolutions[next], level: to, levels: to - level, gold },
    ];
  });
  if (evolutions.length) return evolutions.sort((a, b) => a.gold - b.gold)[0];
  const forging = RELICS.find((r) => (c.relics[r.id] ?? 0) < RELIC.LEVELS);
  if (forging) {
    const cost = relicCost(c, forging.id)!;
    return { kind: 'relic', relic: forging.id, level: (c.relics[forging.id] ?? 0) + 1, ...cost };
  }
  const tempers = c.equippedRelics.flatMap((id) => {
    const cost = temperCost(c, id);
    const t = temperOf(c, id);
    return cost ? [{ kind: 'temper' as const, relic: id, temper: t + 1, chance: temperChance(t), ...cost }] : [];
  });
  return tempers.sort((a, b) => b.chance - a.chance)[0] ?? null;
}
