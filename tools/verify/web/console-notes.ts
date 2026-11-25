// The keeper as the console sees them (session 234): two notes admins kept, and twelve weeks of visits, so
// the record's notes and its calendar of days played are seen at every width.
import type { Ctx } from '../../../apps/server/src/context.ts';
import { visits } from '../../../apps/server/src/db/schema.ts';

const DAY = 86_400_000;

export async function consoleNotes(
  ctx: Ctx,
  url: string,
  staff: { name: string; value: string },
  keeper: string,
  now: number,
): Promise<void> {
  // Most days of the twelve weeks, as a player a year in comes, a run of days away among them.
  for (let n = 0; n < 84; n++)
    if (n % 7 !== 3 && (n < 30 || n > 36))
      ctx.db
        .insert(visits)
        .values({ playerId: keeper, day: new Date(now - n * DAY).toISOString().slice(0, 10) })
        .onConflictDoNothing()
        .run();
  for (const text of [
    'Asked on 3 Nov about a staff lost when the realm restarted; gave it back (see the Audit log).',
    'Plays from two browsers, a phone and a desktop: both are theirs.',
  ]) {
    const r = await fetch(`${url}/api/admin/note`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: url, cookie: `${staff.name}=${staff.value}` },
      body: JSON.stringify({ playerId: keeper, text }),
    });
    if (!r.ok) throw new Error(`A note on the keeper: ${r.status} ${await r.text()}`);
  }
}
