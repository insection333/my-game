// The day's bosses (session 239): one press sets the day's fights (the realm's boss and the bosses the player
// fares well against that wait today), and the Combat lane fights them one after another as
// `expeditions:bosses`. Which fight it is on is read from the save alone, so the lane, the arena and the page
// agree: the first of the day's list not yet fought today.
import type { State } from '@idle-clash/kernel';
import { expeditionsOf } from './state.ts';

/** The UTC day a moment falls on: the day a boss rests after it is fought. */
export const dayOf = (at: number): string => new Date(at).toISOString().slice(0, 10);

const fought = (state: State, id: string, day: string): boolean => {
  const e = expeditionsOf(state);
  return id === 'realm' ? e.realm?.day === day : Object.hasOwn(e.bossDay, id) && e.bossDay[id] === day;
};

/** The fights left in the day's list at a moment, in order: none once all are fought, or when the list was set
 *  on another day. */
export function roundLeft(state: State, at: number): string[] {
  const e = expeditionsOf(state);
  const day = dayOf(at);
  if (!e.round || e.round.day !== day) return [];
  return e.round.foes.filter((id) => !fought(state, id, day));
}

/** The fight the day's bosses is on at a moment: the realm's boss (`realm`) or a boss's id, or null. */
export const roundOn = (state: State, at: number): string | null => roundLeft(state, at)[0] ?? null;
