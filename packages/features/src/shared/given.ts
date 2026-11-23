// Completions given rather than done (session 181): a Rare find used on an action adds 500 to its mastery
// count at once, which is right for mastery; but what counts the times an action was done (a bounty's wins,
// the week's work made) must not take those 500 as done, or one find would finish a bounty or a week's task.
// The finds' completions are kept here by action, and taken off where a count of the work itself is read.
import type { State } from '@idle-clash/kernel';
import { z } from 'zod';
import { partReader } from './part.ts';

const Given = z.record(z.string().max(96), z.number().int().nonnegative());

const givenOf = partReader('given', Given, {});

/** A find's completions on an action, kept as given. */
export function addGiven(state: State, key: string, completions: number): void {
  const had = givenOf(state);
  state.features.given = { ...had, [key]: (Object.hasOwn(had, key) ? had[key] : 0) + completions };
}

/** The times an action was done: its mastery count less what finds gave it. */
export function doneCount(state: State, key: string): number {
  const all = Object.hasOwn(state.mastery, key) ? state.mastery[key] : 0;
  const given = givenOf(state);
  return Math.max(0, all - (Object.hasOwn(given, key) ? given[key] : 0));
}
