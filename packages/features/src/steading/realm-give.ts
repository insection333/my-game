// Giving to the realm's work (session 218; its numbers in shared/realm-work.ts): gold, or all of a material
// held, at its price; refused once the season's work stands finished. The server counts what is given.
import { countOf, take, type GameEvent, type State } from '@idle-clash/kernel';
import { itemOf } from '../shared/catalog.ts';
import { realmWorkIn, realmWorkOf } from '../shared/realm-work.ts';
import { seasonAt } from '../shared/season.ts';

type Answer<R> = { state: State; result: R; events: GameEvent[] };
export type GiveResult =
  { ok: true; worth: number } | { ok: false; reason: 'noSeason' | 'finished' | 'nothing' | 'short' | 'notMaterial' };

/** Whether an item can be given: a material (a resource) with a price. */
export const givable = (item: string): boolean => {
  const def = itemOf(item);
  return def?.kind === 'resource' && def.value > 0;
};

export function give(state: State, gift: { gold?: number; item?: string }, now: number): Answer<GiveResult> {
  const no = (reason: Exclude<GiveResult, { ok: true }>['reason']): Answer<GiveResult> => ({
    state,
    result: { ok: false, reason },
    events: [],
  });
  const season = seasonAt(now);
  if (!season) return no('noSeason');
  const m = realmWorkOf(state);
  if (m && m.season === season.number && m.given >= m.needed) return no('finished');
  const gold = gift.gold ?? 0;
  const item = gift.item ?? null;
  if (item !== null && !givable(item)) return no('notMaterial');
  const count = item ? countOf(state, item) : 0;
  if (gold <= 0 && count <= 0) return no('nothing');
  if (gold > countOf(state, 'gold')) return no('short');
  const out = structuredClone(state);
  if (gold > 0) take(out, 'gold', gold);
  if (item && count > 0) take(out, item, count);
  const worth = gold + (item ? itemOf(item)!.value * count : 0);
  const work = realmWorkIn(season.number);
  return {
    state: out,
    result: { ok: true, worth },
    events: [{ type: 'realmGiven', at: now, season: season.number, work, worth }],
  };
}
