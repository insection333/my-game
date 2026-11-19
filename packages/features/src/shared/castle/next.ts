// "Next for your castle" (session 140, the castle review's fifth stage): the castle's nearest milestone and
// how far off it is, so the game's longest stretch has a signpost. Three kinds: a troop's next evolution, a
// relic's next level, the next temper (which never ends, so there is always a next); the one nearest to
// hand is named (session 144). Pure.
import { EVOLUTION_LEVELS, RELIC, RELICS, UNITS, type UnitId } from '@idle-clash/content';
import type { Castle } from './castle.ts';
import { levelCost, relicCost } from './economy.ts';
import { evolutionOf, temperOf } from './effects.ts';
import { temperChance, temperCost } from './temper.ts';

export type NextStep =
  | { kind: 'evolution'; unit: UnitId; evolution: string; level: number; levels: number; gold: number }
  | { kind: 'relic'; relic: string; level: number; gold: number; marks: number }
  | { kind: 'temper'; relic: string; temper: number; chance: number; gold: number; marks: number };

/** The castle's next step, nearest to hand (session 144: the next evolution led for a year while a relic's
 *  level stood ready to forge): the next evolution of the troop nearest its own, the next relic level, and
 *  the next temper of the worn relic with the best chance, taken in this order: one the lord can pay for now
 *  (gold from the purse, or the treasury when the castle pays from it, and the war marks), the evolution
 *  first among those; then the one with the least gold still to find among those whose war marks are held;
 *  then the evolution. `purse` is the lord's gold. */
export function nextForCastle(c: Castle, now: number, purse: number): NextStep | null {
  const evolution = UNITS.flatMap((u) => {
    const level = c.levels[u.id];
    const next = evolutionOf(level) + 1;
    if (next >= EVOLUTION_LEVELS.length) return [];
    const to = EVOLUTION_LEVELS[next];
    let gold = 0;
    for (let l = level; l < to; l++) gold += levelCost(c, u.cost, l, now);
    return [
      { kind: 'evolution' as const, unit: u.id, evolution: u.evolutions[next], level: to, levels: to - level, gold },
    ];
  }).sort((a, b) => a.gold - b.gold)[0];
  const forging = RELICS.find((r) => (c.relics[r.id] ?? 0) < RELIC.LEVELS);
  const relic = forging && {
    kind: 'relic' as const,
    relic: forging.id,
    level: (c.relics[forging.id] ?? 0) + 1,
    ...relicCost(c, forging.id)!,
  };
  const temper = c.equippedRelics
    .flatMap((id) => {
      const cost = temperCost(c, id);
      const t = temperOf(c, id);
      return cost ? [{ kind: 'temper' as const, relic: id, temper: t + 1, chance: temperChance(t), ...cost }] : [];
    })
    .sort((a, b) => b.chance - a.chance)[0];
  const steps: NextStep[] = [evolution, relic, temper].filter((x): x is NonNullable<typeof x> => !!x);
  if (!steps.length) return null;
  const funds = c.payFromTreasury ? c.treasury : purse;
  const marksHeld = (x: NextStep) => x.kind === 'evolution' || c.warMarks >= x.marks;
  const short = (x: NextStep) => Math.max(0, x.gold - funds);
  const toHand = steps.find((x) => marksHeld(x) && short(x) === 0);
  if (toHand) return toHand;
  const held = steps.filter(marksHeld).sort((a, b) => short(a) - short(b))[0];
  return held ?? evolution ?? steps[0];
}
