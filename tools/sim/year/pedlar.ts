// The pedlar as a player meets him (session 217): each lot of the day handed in once it is held, and the day's
// lots kept from the vendor until then.
import { FEATURES } from '@idle-clash/features';
import type { State } from '@idle-clash/kernel';
import { lotsOf } from '../../../packages/features/src/shared/pedlar-lots.ts';
import { dayOf } from '../../../packages/features/src/pedlar/rules.ts';

/** The items the day's lots want, kept from the vendor. */
export const pedlarWants = (state: State, now: number): string[] => lotsOf(state, dayOf(now)).map((l) => l.item);

export function handInLots(state: State, now: number): { state: State; lots: number } {
  const route = FEATURES.find((f) => f.id === 'pedlar')!.routes.handIn;
  let s = state;
  let lots = 0;
  for (const kind of ['find', 'material', 'dish'] as const) {
    const r = route.run(s, { kind }, now);
    if ((r.result as { ok: boolean }).ok) [s, lots] = [r.state, lots + 1];
  }
  return { state: s, lots };
}

/** The realm's work (session 218): a quarter of the gold above a reserve given each day, as a player with
 *  nothing else to buy would. Played without a server, so the gifts are counted by no one; what is measured is
 *  the gold that leaves the purse. */
export const REALM_RESERVE = 20_000_000;
export function giveToRealm(state: State, now: number): { state: State; given: number } {
  const gold = state.items.gold ?? 0;
  const amount = Math.floor((gold - REALM_RESERVE) / 4);
  if (amount < 1_000_000) return { state, given: 0 };
  const r = FEATURES.find((f) => f.id === 'steading')!.routes.give.run(state, { gold: amount }, now);
  return (r.result as { ok: boolean }).ok ? { state: r.state, given: amount } : { state, given: 0 };
}
