// Tempering a war relic (session 35, DESIGN.md 11.11): once a relic is at its last level, war marks and
// gold buy a chance at another temper, without end. The chance falls with each temper (60%, then 15% less
// each time, never below 5%); a success is now and then a masterstroke worth two tempers. Each temper adds
// to the relic's effect and its score in the rating, approaching +50%. A temper that does not take costs
// what it cost and nothing more. Pure: the roll is the caller's.
import { RELIC, RELICS, TEMPER } from '@idle-clash/content';
import { temperOf } from './effects.ts';
import { pay, type Refusal, type Wallet } from './manage.ts';
import type { Castle } from './castle.ts';

/** The chance the next temper of a relic with `tempers` takes. */
export const temperChance = (tempers: number): number =>
  Math.max(TEMPER.CHANCE_MIN, TEMPER.CHANCE_BASE * TEMPER.CHANCE_DECAY ** Math.max(0, tempers));

/** What the next temper costs, or null for a relic not owned at its last level. */
export function temperCost(c: Castle, id: string): { gold: number; marks: number } | null {
  if (!RELICS.some((r) => r.id === id)) return null;
  if (!Object.hasOwn(c.relics, id) || c.relics[id] < RELIC.LEVELS) return null;
  const t = temperOf(c, id);
  return {
    gold: Math.round(TEMPER.GOLD_BASE * TEMPER.GOLD_GROWTH ** t),
    marks: TEMPER.MARKS_BASE + TEMPER.MARKS_PER * t,
  };
}

export type TemperOutcome = 'held' | 'tempered' | 'masterstroke';
export type Tempered =
  ({ ok: true; burned: number; outcome: TemperOutcome; tempers: number } & Wallet) | { ok: false; reason: Refusal };

/** One attempt: paid whatever comes of it. `roll` decides the temper, `luck` a masterstroke, each in [0, 1). */
export function temperRelic(w: Wallet, id: string, roll: number, luck: number): Tempered {
  const cost = temperCost(w.castle, id);
  if (!cost) return { ok: false, reason: Object.hasOwn(w.castle.relics, id) ? 'locked' : 'notOwned' };
  if (w.castle.warMarks < cost.marks) return { ok: false, reason: 'marks' };
  const paid = pay(w, cost.gold);
  if (!paid) return { ok: false, reason: 'gold' };
  const before = temperOf(w.castle, id);
  const outcome: TemperOutcome =
    roll < temperChance(before) ? (luck < TEMPER.MASTERSTROKE ? 'masterstroke' : 'tempered') : 'held';
  const tempers = before + (outcome === 'masterstroke' ? 2 : outcome === 'tempered' ? 1 : 0);
  return {
    ok: true,
    castle: {
      ...paid.castle,
      warMarks: paid.castle.warMarks - cost.marks,
      tempers: { ...paid.castle.tempers, [id]: tempers },
    },
    purse: paid.purse,
    burned: cost.gold,
    outcome,
    tempers,
  };
}
