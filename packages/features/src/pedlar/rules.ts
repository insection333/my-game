// Handing a lot to the pedlar (session 217): from the Storehouse at one press, paying half again the lot's
// price in gold, and never less than ten minutes of the player's own earning; one favour a lot.
import { countOf, give, take, type GameEvent, type State } from '@idle-clash/kernel';
import { itemOf } from '../shared/catalog.ts';
import { earning, nice, paces } from '../shared/pace.ts';
import { dayOf, handedToday, pedlarOf } from '../shared/pedlar.ts';
import { lotsOf, type Lot, type LotKind } from '../shared/pedlar-lots.ts';
import { isLocked } from '../shared/storehouse.ts';

export { dayOf, handedToday };

export const PEDLAR = {
  /** The pay, as a share of the lot's price. */
  PRICE: 1.5,
  /** And never less than this many seconds of the player's earning. */
  LEAST_SECONDS: 600,
} as const;

/** What a lot pays, in gold. */
export function payFor(state: State, lot: Lot): number {
  const price = (itemOf(lot.item)?.value ?? 0) * lot.count * PEDLAR.PRICE;
  return nice(Math.max(price, earning(paces(state)) * PEDLAR.LEAST_SECONDS));
}

type Answer<R> = { state: State; result: R; events: GameEvent[] };
export type HandInResult = { ok: true; gold: number } | { ok: false; reason: 'none' | 'done' | 'short' | 'locked' };

export function handIn(state: State, kind: LotKind, now: number): Answer<HandInResult> {
  const no = (reason: 'none' | 'done' | 'short' | 'locked'): Answer<HandInResult> => ({
    state,
    result: { ok: false, reason },
    events: [],
  });
  const lot = lotsOf(state, dayOf(now)).find((l) => l.kind === kind);
  if (!lot) return no('none');
  const handed = handedToday(state, now);
  if (handed.includes(kind)) return no('done');
  // A lot locked in the Storehouse is kept from every sale (session 264: the pedlar took it all the same).
  if (isLocked(state, lot.item)) return no('locked');
  if (countOf(state, lot.item) < lot.count) return no('short');
  const gold = payFor(state, lot);
  const out = structuredClone(state);
  take(out, lot.item, lot.count);
  give(out, 'gold', gold);
  const favour = pedlarOf(state).favour + 1;
  out.features.pedlar = { day: dayOf(now), handed: [...handed, kind], favour };
  return {
    state: out,
    result: { ok: true, gold },
    events: [{ type: 'pedlarPaid', at: now, item: lot.item, count: lot.count, gold, favour }],
  };
}

/** Hands in every lot ready at one press (session 256: a completionist pressed three times a day for it), each
 *  as its own Hand in would, its moments folding under the first. */
export function handInAll(
  state: State,
  now: number,
): Answer<{ ok: true; count: number } | { ok: false; reason: 'none' }> {
  let out = state;
  const events: GameEvent[] = [];
  for (const lot of lotsOf(state, dayOf(now))) {
    const r = handIn(out, lot.kind, now);
    if (!r.result.ok) continue;
    out = r.state;
    events.push(...r.events);
  }
  if (!events.length) return { state, result: { ok: false, reason: 'none' }, events: [] };
  return { state: out, result: { ok: true, count: events.length }, events };
}
