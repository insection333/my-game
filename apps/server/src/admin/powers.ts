// What an admin can do to a player beyond the admin page's first powers (session 229): give or take gold or
// any item, give XP in a skill (each with a reason, kept in the Audit log), sign them out everywhere, and
// delete their account (its name typed to be sure). A change to the save goes through the player's own
// queue as their requests do, so it never interleaves with their play, and is told to their open pages.
import { ROUTES, type GrantResult, type XpResult } from '@idle-clash/contracts';
import { levelFor, t } from '@idle-clash/content';
import { allSkills } from '@idle-clash/features';
import { countOf, give, handle, seeded, take, type GameEvent, type SaveDoc } from '@idle-clash/kernel';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { erase } from '../auth/account.ts';
import { requireAdmin } from '../auth/routes.ts';
import { withCastle } from '../castle/mirror.ts';
import type { Ctx } from '../context.ts';
import { players } from '../db/schema.ts';
import { announce } from '../game/announce.ts';
import { contractRoute, fail } from '../http.ts';
import { audit } from './audit.ts';
import { catalogOf } from './record.ts';

const playerOf = (ctx: Ctx, id: string) => {
  const row = ctx.db.select().from(players).where(eq(players.id, id)).get();
  if (!row || row.role !== 'player') throw fail(404, 'notFound');
  return row;
};

/** Changes a player's save as one of their own requests would, brought up to now first, and tells their
 *  open pages. */
async function change<R>(ctx: Ctx, playerId: string, edit: (doc: SaveDoc) => { doc: SaveDoc; result: R }): Promise<R> {
  const t = ctx.config.now();
  let next: SaveDoc | null = null;
  let events: GameEvent[] = [];
  const out = await handle(ctx.queue, ctx.store, playerId, `admin-${randomUUID()}`, t, (doc) => {
    const state = withCastle(ctx, playerId, doc.state, t);
    const arrived = ctx.engine.advance(state, Math.max(t, state.clock), seeded(state.seed));
    events = arrived.events;
    const r = edit({ ...doc, state: arrived.state });
    next = r.doc;
    return r;
  });
  if (next) announce(ctx, playerId, next, events, t);
  return out.result;
}

export function powerRoutes(app: FastifyInstance, ctx: Ctx): void {
  const admin = requireAdmin(ctx);
  const names = new Map(catalogOf().map((i) => [i.id, i.name]));

  contractRoute<{ playerId: string; item: string; count: number; reason: string }>(
    app,
    ROUTES.adminGrant,
    async ({ req, input }) => {
      playerOf(ctx, input.playerId);
      if (!names.has(input.item)) return { ok: false, reason: 'unknown' } satisfies GrantResult;
      const result = await change<GrantResult>(ctx, input.playerId, (doc) => {
        const state = structuredClone(doc.state);
        if (input.count > 0) give(state, input.item, input.count);
        else if (!take(state, input.item, -input.count)) return { doc, result: { ok: false, reason: 'notEnough' } };
        return { doc: { ...doc, state }, result: { ok: true, held: countOf(state, input.item) } };
      });
      if (result.ok)
        audit(ctx, req, input.count > 0 ? 'give' : 'take', input.playerId, {
          item: names.get(input.item)!,
          count: Math.abs(input.count),
          reason: input.reason,
        });
      return result;
    },
    admin,
  );

  contractRoute<{ playerId: string; skill: string; xp: number; reason: string }>(
    app,
    ROUTES.adminXp,
    async ({ req, input }) => {
      playerOf(ctx, input.playerId);
      if (!allSkills().includes(input.skill)) return { ok: false, reason: 'unknown' } satisfies XpResult;
      const result = await change<XpResult>(ctx, input.playerId, (doc) => {
        const state = structuredClone(doc.state);
        const had = Object.hasOwn(state.skills, input.skill) ? state.skills[input.skill].xp : 0;
        const xp = had + input.xp;
        state.skills = { ...state.skills, [input.skill]: { ...state.skills[input.skill], xp } };
        return { doc: { ...doc, state }, result: { ok: true, xp, level: levelFor(xp) } };
      });
      audit(ctx, req, 'xp', input.playerId, { skill: t(`skill.${input.skill}`), xp: input.xp, reason: input.reason });
      return result;
    },
    admin,
  );

  contractRoute<{ playerId: string }>(
    app,
    ROUTES.adminSignOut,
    ({ req, reply, input }) => {
      playerOf(ctx, input.playerId);
      ctx.sessions.endAll(input.playerId);
      ctx.live.closePlayer(input.playerId);
      audit(ctx, req, 'signOut', input.playerId);
      return reply.code(204).send();
    },
    admin,
  );

  contractRoute<{ playerId: string; name: string }>(
    app,
    ROUTES.adminDelete,
    ({ req, reply, input }) => {
      const row = playerOf(ctx, input.playerId);
      // Their name typed as it is, so the wrong player is never deleted by a slip.
      if (row.name !== input.name.trim()) throw fail(422, 'invalidInput', { fields: ['name'] });
      erase(ctx, input.playerId);
      audit(ctx, req, 'delete', null);
      return reply.code(204).send();
    },
    admin,
  );
}
