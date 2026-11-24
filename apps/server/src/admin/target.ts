// The player an admin acts on (session 231), shared by every admin route that takes one: a player, never the
// console's own account (which has no save, and whose password the server sets from its secret: a ban, a
// rename or a new password given it from the console would lock the console out or hand it on), and, for
// what would end an admin's own use of the console (a ban, a deletion), never the admin themselves.
import { eq } from 'drizzle-orm';
import type { FastifyRequest } from 'fastify';
import type { Ctx } from '../context.ts';
import { players } from '../db/schema.ts';
import { fail } from '../http.ts';

export function targetOf(ctx: Ctx, id: string, notYourself?: FastifyRequest): typeof players.$inferSelect {
  const row = ctx.db.select().from(players).where(eq(players.id, id)).get();
  if (!row || row.role !== 'player') throw fail(404, 'notFound');
  if (notYourself && notYourself.playerId === id) throw fail(409, 'yourself');
  return row;
}

/** Repeats of one admin's press within this long are taken as one (a double click, a retried request). */
export const REPEAT_MS = 2_000;

/** Remembers each admin's last change to a save, so the same one again at once is not made twice: the claim
 *  is false for this very change from this admin within REPEAT_MS, and otherwise takes it (before the change
 *  is made, so two arriving together cannot both pass). */
export function onceAtATime() {
  const last = new Map<string, { key: string; at: number }>();
  return (actor: string, key: string, at: number): boolean => {
    const was = last.get(actor);
    if (was && was.key === key && at - was.at < REPEAT_MS) return false;
    last.set(actor, { key, at });
    return true;
  };
}
