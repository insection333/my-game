// Companions over the year (session 179): the first joins in the first weeks, and every skill's before the
// year is out (each joins between its skill's levels 30 and 90, so before 99), the bosses' as they are beaten.
import { deedsOf } from '../../../packages/features/src/deeds/state.ts';
import { COMPANIONS } from '../../../packages/features/src/shared/companions.ts';
import { DAY, T0 } from '../player.ts';
import type { Year } from './player.ts';

type Check = (ok: boolean, what: string) => void;
/** The first companion's window, in days. */
const FIRST = [5, 30] as const;

export function companionChecks(y: Year, check: Check, lines: string[]): void {
  const done = deedsOf(y.final).done;
  const days = COMPANIONS.map((c) => {
    const at = done[`companion-${c.id}`];
    return { c, day: at === undefined ? Infinity : Math.floor((at - T0) / DAY) + 1 };
  });
  lines.push(`\n## Companions`);
  lines.push(`Joined on days: ${days.map((d) => `${d.c.id} ${d.day === Infinity ? 'not yet' : d.day}`).join(', ')}`);
  const first = Math.min(...days.map((d) => d.day));
  check(
    first >= FIRST[0] && first <= FIRST[1],
    `The first companion joins on day ${first} (between ${FIRST[0]} and ${FIRST[1]})`,
  );
  const skills = days.filter((d) => d.c.skill);
  const late = skills.filter((d) => d.day > 365);
  check(
    !late.length,
    `Every skill's companion joins within the year (${skills.length - late.length} of ${skills.length})`,
  );
}
