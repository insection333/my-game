// Days banked (session 253, the plan of 26 November, phase 5): a boss's daily fight and the realm's strike
// were once a day each, lost if the day passed unplayed, so a friend who plays every other day fell behind
// one who plays daily. Each day not fought now banks a fight, up to three, so two visits a week do as well
// as seven for the realm's boss (which still asks by week) and for the boss's wins. Kept as the day last
// fought and the fights left banked after it; a fight never taken has one waiting.
import type { State } from '@idle-clash/kernel';
import { expeditionsOf, type ExpeditionState } from './state.ts';

/** The fights a day's rest can bank, the one of today among them. */
export const BANK_DAYS = 3;
const DAY = 86_400_000;

/** The UTC day a moment falls on (2026-10-28). */
export const dayOf = (at: number): string => new Date(at).toISOString().slice(0, 10);
const dayNumber = (day: string) => Math.floor(Date.parse(day) / DAY);

/** The fights waiting on a day: those banked after the last fight, and one for each day since, up to three. */
export function fightsBanked(last: string | null | undefined, left: number | undefined, today: string): number {
  if (!last) return 1;
  const since = Math.max(0, dayNumber(today) - dayNumber(last));
  if (!Number.isFinite(since)) return 1;
  return Math.min(BANK_DAYS, (left ?? 0) + since);
}

/** The fights a boss has waiting at a moment. */
export function bossFights(state: State, id: string, at: number): number {
  const e = expeditionsOf(state);
  const last = Object.hasOwn(e.bossDay, id) ? e.bossDay[id] : null;
  const left = e.bossLeft && Object.hasOwn(e.bossLeft, id) ? e.bossLeft[id] : 0;
  return fightsBanked(last, left, dayOf(at));
}

/** The strikes the realm's boss has waiting at a moment. */
export function realmFights(state: State, at: number): number {
  const r = expeditionsOf(state).realm;
  return fightsBanked(r?.day, r?.left, dayOf(at));
}

/** The fights waiting for `realm` or a boss's id. */
export const fightsOf = (state: State, id: string, at: number): number =>
  id === 'realm' ? realmFights(state, at) : bossFights(state, id, at);

/** A boss fought: today is its last day, with one fewer banked. */
export function spendBoss(state: State, e: ExpeditionState, id: string, at: number): ExpeditionState {
  const left = Math.max(0, bossFights(state, id, at) - 1);
  return { ...e, bossDay: { ...e.bossDay, [id]: dayOf(at) }, bossLeft: { ...e.bossLeft, [id]: left } };
}

/** The realm's boss struck: today is its last day, with one fewer banked. */
export function spendRealm(state: State, e: ExpeditionState, at: number): ExpeditionState {
  const left = Math.max(0, realmFights(state, at) - 1);
  const part = e.realm ?? { day: null, claimed: null, fallen: 0 };
  return { ...e, realm: { ...part, day: dayOf(at), left } };
}
