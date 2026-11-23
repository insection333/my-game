// The Deep's ladder of the week (session 214): the deepest each player reached in the Deep this week, as their
// save keeps it (`weekDeepest`, of the week it was reached in), ranked by depth, the one who got there first
// above. Kept in the hiscores table as `deep:<Monday>`, a row no ladder of skills reads; it begins again each
// Monday 00:00 UTC, and housekeeping lets go of every week's but this one's and the last's.
import { deepOf, weekOf } from '@idle-clash/features';
import type { Ladder } from '@idle-clash/contracts';
import type { State } from '@idle-clash/kernel';

export const DEEP = 'deep';
export const deepKey = (week: string) => `${DEEP}:${week}`;

/** The row to write beside the skills' at `at`: this week's deepest, once there is one. */
export function deepEntries(at: number, state: State) {
  const d = deepOf(state);
  const week = weekOf(at);
  if (d.week !== week || d.weekDeepest <= 0) return [];
  return [{ skill: deepKey(week), xp: d.weekDeepest, level: 0, milestones: 0 }];
}

/** The ladder key of the week at `at`. */
export const deepLadderAt = (at: number): string => deepKey(weekOf(at));

/** The Deep's rows housekeeping may let go at `at`: every week's but this one's and the last's. */
export function oldDeepRows(at: number): (skill: string) => boolean {
  const last = weekOf(at - 7 * 86_400_000);
  return (skill) => {
    const m = /^deep:(\d{4}-\d\d-\d\d)$/.exec(skill);
    return !!m && m[1] < last;
  };
}

/** The week's ladder as Hiscores shows it, named for what it is; none while no one has gone down this week. */
export const deepLadder = (ladder: Ladder): Ladder[] =>
  ladder.rows.length > 0 || ladder.you ? [{ ...ladder, skill: DEEP }] : [];
