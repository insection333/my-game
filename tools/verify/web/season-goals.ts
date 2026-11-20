// The season's goals for verify's players (sessions 165 and 166): goals done before the season and in it,
// so the season's ladder, the Hearth's season row and the seasons' deeds read as they will with players.
import { goalsOf, seasonAt } from '@idle-clash/features';
import type { State } from '@idle-clash/kernel';

/** A save with `opened` goals done (supply caches opened), `inSeason` of them in the season at `now`, for
 *  the season's ladder (session 165) and its deeds (session 166). */
export const withGoals = (state: State, opened: number, inSeason = 0, now = 0): State => {
  const season = seasonAt(now);
  return {
    ...state,
    features: {
      ...state.features,
      goals: { ...goalsOf(state), opened },
      ...(season && inSeason ? { seasons: { goals: { [String(season.number)]: inSeason } } } : {}),
    },
  };
};
/** Goals done before this season by a player of long standing. */
export const BEFORE = 600;
