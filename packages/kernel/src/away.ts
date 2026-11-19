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
  /** Those Uncommon finds by item (session 107), for the recap to name and picture; absent in older ones. */
  uncommonItems?: Record<string, number>;
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
  // A lane that ran dry and woke as its ingredient came in kept working: its stop is not news, whether it is
  // running now or waiting quietly for the next to come (it stopped again later than it was said).
  const woke = (e: GameEvent) => {
    if (e.type !== 'laneStopped' || e.reason.code !== 'outOfInputs') return false;
    const l = after.lanes[e.lane];
    return !!l.current?.waited || (!!l.stopped && l.stopped.at > e.at);
  };
  const kept = events.filter((e) => (isNotable(e) || e.type === 'laneStopped') && !plain(e) && !woke(e));
  const uncommonItems: Record<string, number> = {};
  for (const e of events) if (plain(e) && e.type === 'find') uncommonItems[e.item] = (uncommonItems[e.item] ?? 0) + 1;
  return { from: before.lastSeen, to, events: kept, uncommon: events.filter(plain).length, uncommonItems, items, xp };
}

/** One absence told across two reads: what the first said, and what came after it (session 155: a save
 *  written meanwhile by a route the page sends by itself left a later read only the minutes since). */
export function joinAway(first: AwaySummary, then: AwaySummary): AwaySummary {
  const add = (a: Record<string, number>, b: Record<string, number>) => {
    const out = { ...a };
    for (const [k, v] of Object.entries(b)) out[k] = (out[k] ?? 0) + v;
    return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== 0));
  };
  return {
    from: first.from,
    to: then.to,
    events: [...first.events, ...then.events.filter((e) => e.at > first.to)],
    uncommon: first.uncommon + then.uncommon,
    uncommonItems: add(first.uncommonItems ?? {}, then.uncommonItems ?? {}),
    items: add(first.items, then.items),
    xp: add(first.xp, then.xp),
  };
}
