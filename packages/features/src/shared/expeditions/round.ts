// The day's bosses (session 239): one press sets the day's fights (the realm's boss and the bosses the player
// fares well against that wait today), and the Combat lane fights them one after another as
// `expeditions:bosses`. Which fight it is on is read from the save alone, so the lane, the arena and the page
// agree: the first of the day's list not yet fought today.
import type { State } from '@idle-clash/kernel';
import { expeditionsOf } from './state.ts';
import { dayOf, fightsOf } from './bank.ts';

export { dayOf };

/** The fights left in the day's list at a moment, in order: none once all are fought, or when the list was set
 *  on another day. A boss listed for its banked fights (session 253) stands in it as often as it has fights
 *  still waiting, so each fight taken, in the list or out of it, takes its first place. */
export function roundLeft(state: State, at: number): string[] {
  const e = expeditionsOf(state);
  const day = dayOf(at);
  if (!e.round || e.round.day !== day) return [];
  const seen = new Map<string, number>();
  return e.round.foes.filter((id) => {
    seen.set(id, (seen.get(id) ?? 0) + 1);
    return (seen.get(id) ?? 0) <= fightsOf(state, id, at);
  });
}

/** The fight the day's bosses is on at a moment: the realm's boss (`realm`) or a boss's id, or null. */
export const roundOn = (state: State, at: number): string | null => roundLeft(state, at)[0] ?? null;
