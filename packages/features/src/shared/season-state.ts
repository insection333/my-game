// The seasons' part of the save (session 166): the goals done in each season, by its number, counted as a
// short goal or a day's goal is claimed (goals/rules.ts). The season's ladder counts the same goals on the
// server; this part lets the save itself know what a player did in each season, for the deeds and titles a
// season brings. Older saves have none: a season counts from the first goal claimed after it is read.
import type { GameEvent, State } from '@idle-clash/kernel';
import { z } from 'zod';
import { partReader } from './part.ts';
import { seasonAt, TWISTS } from './season.ts';

export const SeasonsState = z
  .object({
    /** Goals done in each season, keyed by its number. */
    goals: z.record(z.string().regex(/^\d{1,4}$/), z.number().int().nonnegative()).default({}),
    /** The last season said to the player (its moment shown once). */
    seen: z.number().int().nonnegative().default(0),
  })
  .strict();
export type SeasonsState = z.infer<typeof SeasonsState>;

export const seasonsOf: (state: State) => SeasonsState = partReader('seasons', SeasonsState, { goals: {}, seen: 0 });

/** One more goal done in the season at `at` (none before the first). */
export function noteSeasonGoal(state: State, at: number): void {
  const season = seasonAt(at);
  if (!season) return;
  const s = seasonsOf(state);
  const key = String(season.number);
  state.features.seasons = { ...s, goals: { ...s.goals, [key]: (Object.hasOwn(s.goals, key) ? s.goals[key] : 0) + 1 } };
}

/** The most goals done in any one season with this twist. */
export function bestInTwist(state: State, twist: string): number {
  const at = TWISTS.findIndex((t) => t.id === twist);
  if (at < 0) return 0;
  return Math.max(
    0,
    ...Object.entries(seasonsOf(state).goals)
      .filter(([n]) => (Number(n) - 1) % TWISTS.length === at)
      .map(([, count]) => count),
  );
}

/** Seasons in which at least `goals` goals were done. */
export const seasonsPlayed = (state: State, goals: number): number =>
  Object.values(seasonsOf(state).goals).filter((n) => n >= goals).length;

/** Whether the season at `now` has yet to be said to the player. */
export const seasonUnseen = (state: State, now: number): boolean => {
  const season = seasonAt(now);
  return !!season && seasonsOf(state).seen < season.number;
};

/** Notes the season at `now` as said, and the event that says it (null if it already was). */
export function openSeason(state: State, now: number): GameEvent | null {
  const season = seasonAt(now);
  const s = seasonsOf(state);
  if (!season || s.seen >= season.number) return null;
  state.features.seasons = { ...s, seen: season.number };
  const before = String(season.number - 1);
  const last = Object.hasOwn(s.goals, before) ? s.goals[before] : 0;
  return { type: 'seasonOpened', at: now, number: season.number, twist: season.twist.id, last };
}
