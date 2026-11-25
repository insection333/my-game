// A player's activity in the console (session 234): the days they came in the last twelve weeks, the
// browsers signed in (each can be signed out alone, where Account's press signs out every one), and the
// last notices the game sent them, in the game's words. Read when the Activity tab opens, from three
// indexed reads of one player's rows.
import { ACTIVITY_DAYS, ROUTES, type ActivityResponse } from '@idle-clash/contracts';
import { recap } from '@idle-clash/features';
import type { GameEvent } from '@idle-clash/kernel';
import { and, desc, eq, gt, gte, like } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { requireAdmin } from '../auth/routes.ts';
import type { Ctx } from '../context.ts';
import { notices, sessions, visits } from '../db/schema.ts';
import { contractRoute, fail } from '../http.ts';
import { audit } from './audit.ts';
import { targetOf } from './target.ts';

const DAY = 86_400_000;
/** The notices shown. */
const NOTICES = 20;
/** A session named by the first characters of its hash: enough to tell a player's few apart, and nothing
 *  that lets anyone sign in as them (the hash is of a token the server never keeps). */
const handleOf = (hash: string) => hash.slice(0, 16);

export function activityOf(ctx: Ctx, playerId: string): ActivityResponse {
  const now = ctx.config.now();
  targetOf(ctx, playerId);
  const from = new Date(now - (ACTIVITY_DAYS - 1) * DAY).toISOString().slice(0, 10);
  const days = ctx.db
    .select({ day: visits.day })
    .from(visits)
    .where(and(eq(visits.playerId, playerId), gte(visits.day, from)))
    .orderBy(visits.day)
    .all()
    .map((v) => v.day);
  const open = ctx.live.openSessions(playerId);
  const signedIn = ctx.db
    .select()
    .from(sessions)
    .where(and(eq(sessions.playerId, playerId), gt(sessions.expiresAt, now)))
    .orderBy(desc(sessions.lastSeenAt))
    .all()
    .map((x) => ({
      handle: handleOf(x.tokenHash),
      createdAt: x.createdAt,
      lastSeenAt: x.lastSeenAt,
      expiresAt: x.expiresAt,
      online: open.has(x.tokenHash),
    }));
  const said = ctx.db
    .select()
    .from(notices)
    .where(eq(notices.playerId, playerId))
    .orderBy(desc(notices.id))
    .limit(NOTICES)
    .all()
    .flatMap((n) => {
      const line = recap.noticeLine(JSON.parse(n.data) as GameEvent);
      return line ? [{ at: n.at, text: line.text }] : [];
    });
  return { at: now, days, sessions: signedIn, notices: said };
}

export function activityRoutes(app: FastifyInstance, ctx: Ctx): void {
  const admin = requireAdmin(ctx);
  contractRoute<{ playerId: string }>(app, ROUTES.adminActivity, ({ input }) => activityOf(ctx, input.playerId), admin);
  contractRoute<{ playerId: string; handle: string }>(
    app,
    ROUTES.adminEndSession,
    ({ req, reply, input }) => {
      targetOf(ctx, input.playerId);
      const where = and(eq(sessions.playerId, input.playerId), like(sessions.tokenHash, `${input.handle}%`));
      const found = ctx.db.select({ hash: sessions.tokenHash }).from(sessions).where(where).all();
      // A handle is the start of one hash; were two ever to share it, neither is ended by a guess.
      if (found.length !== 1) throw fail(404, 'notFound');
      ctx.db.delete(sessions).where(eq(sessions.tokenHash, found[0].hash)).run();
      ctx.live.closeSessions(input.playerId, { session: found[0].hash });
      audit(ctx, req, 'endSession', input.playerId);
      return reply.code(204).send();
    },
    admin,
  );
}
