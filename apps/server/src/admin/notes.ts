// Notes an admin keeps on a player (session 234), for the other admins: what was asked and answered, what
// was given back and why, a warning to watch for. The player never sees them. Each written or struck out is
// in the Audit log; a player's notes go with their account, and a deleted admin's are no longer theirs.
import { NOTES_SHOWN, ROUTES, type AdminNote, type NoteResult } from '@idle-clash/contracts';
import { and, desc, eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { requireAdmin } from '../auth/routes.ts';
import type { Ctx } from '../context.ts';
import { adminNotes, players } from '../db/schema.ts';
import { contractRoute, fail } from '../http.ts';
import { audit } from './audit.ts';
import { onceAtATime, targetOf } from './target.ts';

/** How much of a note the Audit log keeps beside "Wrote a note". */
const LOGGED = 120;
const logged = (text: string) => (text.length > LOGGED ? `${text.slice(0, LOGGED - 1)}…` : text);

/** A player's notes, newest first. */
export function notesOf(ctx: Ctx, playerId: string): AdminNote[] {
  return ctx.db
    .select()
    .from(adminNotes)
    .where(eq(adminNotes.playerId, playerId))
    .orderBy(desc(adminNotes.at), desc(adminNotes.id))
    .limit(NOTES_SHOWN)
    .all()
    .map((n) => ({ id: n.id, at: n.at, actor: n.actorName, text: n.text }));
}

/** On an account deleted: their notes go, and the notes they wrote as an admin are no longer theirs. */
export function eraseNotes(ctx: Ctx, playerId: string): void {
  ctx.db.delete(adminNotes).where(eq(adminNotes.playerId, playerId)).run();
  ctx.db.update(adminNotes).set({ actorId: 'departed', actorName: '' }).where(eq(adminNotes.actorId, playerId)).run();
}

export function noteRoutes(app: FastifyInstance, ctx: Ctx): void {
  const admin = requireAdmin(ctx);
  const claim = onceAtATime();
  contractRoute<{ playerId: string; text: string }>(
    app,
    ROUTES.adminNote,
    ({ req, input }) => {
      targetOf(ctx, input.playerId);
      const now = ctx.config.now();
      // A double press keeps one note.
      if (!claim(req.playerId!, `note:${input.playerId}:${input.text}`, now))
        return { ok: false, reason: 'repeated' } satisfies NoteResult;
      const actorName =
        ctx.db.select({ name: players.name }).from(players).where(eq(players.id, req.playerId!)).get()?.name ?? '';
      const row = ctx.db
        .insert(adminNotes)
        .values({ playerId: input.playerId, at: now, actorId: req.playerId!, actorName, text: input.text })
        .returning()
        .get();
      audit(ctx, req, 'note', input.playerId, { note: logged(input.text) });
      return { ok: true, note: { id: row.id, at: row.at, actor: actorName, text: row.text } } satisfies NoteResult;
    },
    admin,
  );
  contractRoute<{ playerId: string; noteId: number }>(
    app,
    ROUTES.adminNoteDelete,
    ({ req, reply, input }) => {
      targetOf(ctx, input.playerId);
      const where = and(eq(adminNotes.id, input.noteId), eq(adminNotes.playerId, input.playerId));
      const note = ctx.db.select().from(adminNotes).where(where).get();
      if (!note) throw fail(404, 'notFound');
      ctx.db.delete(adminNotes).where(where).run();
      audit(ctx, req, 'unnote', input.playerId, { note: logged(note.text) });
      return reply.code(204).send();
    },
    admin,
  );
}
