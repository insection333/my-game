// The week as the game reckons it (sessions 172 and 174): it turns at Monday 00:00 UTC, as the day turns
// at midnight UTC. One reckoning for the week's contract and the realm's boss.
const DAY = 86_400_000;

/** The Monday a moment's week began (UTC). */
export function weekOf(at: number): string {
  const d = new Date(at);
  const back = (d.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - back)).toISOString().slice(0, 10);
}

/** When the week of `at` ends: the next Monday 00:00 UTC. */
export const weekEnds = (at: number): number => Date.parse(`${weekOf(at)}T00:00:00Z`) + 7 * DAY;
