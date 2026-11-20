// A season's own ladder (session 165): the goals a player finishes from the season's opening (each short goal
// and each day's goal claimed, as their supply caches count them). Goals are set by each player's own pace,
// about a quarter of an hour of their work each, so a friend who joins late stands level with a player a year
// in, where the XP earned would rank by stage (a player a year in earns many times a newcomer's XP an hour), and
// every player starts again each eight weeks. Kept in the hiscores table beside the skills' rows, as rows no
// ladder of skills reads: `goals:all` is the goals done as last written, `seasonfrom:N` where season N is
// counted from (written once, from `goals:all` before the player's first record in the season, so a goal
// claimed by that very request counts), and `season:N` the goals done in it (its level 0, ranked by count).
import { goalsOf, seasonAt } from '@idle-clash/features';
import type { State } from '@idle-clash/kernel';

export const SEASON = 'season';
export const seasonKey = (n: number) => `${SEASON}:${n}`;
const fromKey = (n: number) => `seasonfrom:${n}`;
const ALL = 'goals:all';

/** Whether a row is not a skill's or the total (a season's, or what one counts from). */
export const isSeasonRow = (skill: string) => skill.includes(':');

/** Whether a row is only kept to count from, never a ladder. */
export const isQuiet = (skill: string) => skill === ALL || skill.startsWith('seasonfrom:');

interface Entry {
  skill: string;
  xp: number;
  level: number;
  milestones: number;
}

/** The season's rows to write beside the skills' at `at`, from the save and the rows as last written
 *  (`had`, read before this write); none before the first season. */
export function seasonEntries(at: number, state: State, had: ReadonlyMap<string, { xp: number }>): Entry[] {
  const done = goalsOf(state).opened;
  const row = (skill: string, xp: number): Entry => ({ skill, xp, level: 0, milestones: 0 });
  const season = seasonAt(at);
  if (!season) return [row(ALL, done)];
  const from = Math.min(had.get(fromKey(season.number))?.xp ?? had.get(ALL)?.xp ?? 0, done);
  return [row(ALL, done), row(fromKey(season.number), from), row(seasonKey(season.number), done - from)];
}

/** The ladder key of the season at `at`, or null before the first. */
export const seasonLadderAt = (at: number): string | null => {
  const season = seasonAt(at);
  return season ? seasonKey(season.number) : null;
};

/** The season rows housekeeping may let go at `at`: every season's but this one's and the last's. */
export function oldSeasonRows(at: number): (skill: string) => boolean {
  const n = seasonAt(at)?.number ?? 0;
  return (skill) => {
    const m = /^season(?:from)?:(\d+)$/.exec(skill);
    return !!m && Number(m[1]) < n - 1;
  };
}
