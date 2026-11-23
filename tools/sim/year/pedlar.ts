// The pedlar as a player meets him (session 217): each lot of the day handed in once it is held, and the day's
// lots kept from the vendor until then.
import { FEATURES } from '@idle-clash/features';
import type { State } from '@idle-clash/kernel';
import { lotsOf } from '../../../packages/features/src/pedlar/lots.ts';
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
