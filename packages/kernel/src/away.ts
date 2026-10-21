// What happened while the player was away, for the recap on their return: the time away, the notable
// events and lane stops in it, and what changed in the Storehouse and in each skill's XP. Built from
// the save before and after advancing it, so it says exactly what the advance credited.
import { isNotable, type GameEvent } from './events.ts';
import type { State } from './schema.ts';
import { xpOf } from './state.ts';

export interface AwaySummary {
  from: number;
  to: number;
  /** Notable events and lane stops, in time order; Uncommon finds the log already holds are counted
   *  in `uncommon` instead (a long day away brings dozens). */
  events: GameEvent[];
  uncommon: number;
  /** Each item's count now less its count before (gold included); unchanged items are left out. */
  items: Record<string, number>;
  /** XP earned in each skill. */
  xp: Record<string, number>;
}

/** Away long enough for a recap: a quarter of an hour since the last real input. */
export const RECAP_AFTER_MS = 15 * 60_000;

export function summarizeAway(before: State, after: State, events: readonly GameEvent[], to: number): AwaySummary {
  const items: Record<string, number> = {};
  for (const id of new Set([...Object.keys(before.items), ...Object.keys(after.items)])) {
    const d = (after.items[id] ?? 0) - (before.items[id] ?? 0);
    if (d !== 0) items[id] = d;
  }
  const xp: Record<string, number> = {};
  for (const skill of Object.keys(after.skills)) {
    const d = xpOf(after, skill) - xpOf(before, skill);
    if (d > 0) xp[skill] = Math.floor(d);
  }
  const plain = (e: GameEvent) => e.type === 'find' && e.rarity === 'uncommon' && !e.first;
  const kept = events.filter((e) => (isNotable(e) || e.type === 'laneStopped') && !plain(e));
  return { from: before.lastSeen, to, events: kept, uncommon: events.filter(plain).length, items, xp };
}
