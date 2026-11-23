// Handing a lot to the pedlar (session 217): from the Storehouse at one press, paying half again the lot's
// price in gold, and never less than ten minutes of the player's own earning; one favour a lot.
import { countOf, give, take, type GameEvent, type State } from '@idle-clash/kernel';
import { itemOf } from '../shared/catalog.ts';
import { earning, nice, paces } from '../shared/pace.ts';
import { pedlarOf } from '../shared/pedlar.ts';
import { lotsOf, type Lot, type LotKind } from './lots.ts';

export const PEDLAR = {
  /** The pay, as a share of the lot's price. */
  PRICE: 1.5,
  /** And never less than this many seconds of the player's earning. */
  LEAST_SECONDS: 600,
} as const;

export const dayOf = (at: number): string => new Date(at).toISOString().slice(0, 10);

/** What a lot pays, in gold. */
export function payFor(state: State, lot: Lot): number {
  const price = (itemOf(lot.item)?.value ?? 0) * lot.count * PEDLAR.PRICE;
  return nice(Math.max(price, earning(paces(state)) * PEDLAR.LEAST_SECONDS));
}

/** The lots handed in today. */
export const handedToday = (state: State, at: number): LotKind[] => {
  const p = pedlarOf(state);
  return p.day === dayOf(at) ? p.handed : [];
};

type Answer<R> = { state: State; result: R; events: GameEvent[] };
export type HandInResult = { ok: true; gold: number } | { ok: false; reason: 'none' | 'done' | 'short' };

export function handIn(state: State, kind: LotKind, now: number): Answer<HandInResult> {
  const no = (reason: 'none' | 'done' | 'short'): Answer<HandInResult> => ({
    state,
    result: { ok: false, reason },
    events: [],
  });
  const lot = lotsOf(state, dayOf(now)).find((l) => l.kind === kind);
  if (!lot) return no('none');
  const handed = handedToday(state, now);
  if (handed.includes(kind)) return no('done');
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
