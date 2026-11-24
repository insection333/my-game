// The admin page's routes (the brief: offensive names refused and renamed, bans, a player's save
// inspected and mended, a forgotten password reset). Only players named in ADMIN_NAMES may call them;
// each action is recorded in telemetry by player id.
import {
  nameKey,
  nameLook,
  ROUTES,
  type AdminPlayersResponse,
  type AdminPlayerView,
  type AdminResetResponse,
  type AdminSaveResponse,
} from '@idle-clash/contracts';
import { and, asc, eq, sql } from 'drizzle-orm';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { randomInt } from 'node:crypto';
import { hashPassword } from '../auth/passwords.ts';
import { isAdmin, nameHeld, requireAdmin } from '../auth/routes.ts';
import type { Ctx } from '../context.ts';
import { players } from '../db/schema.ts';
import { contractRoute, fail } from '../http.ts';
import { totalLevelOf } from '../game/standing.ts';
import { fireBusiestDay } from '@idle-clash/kernel';
import { settleReports } from '../moderation.ts';
import { audit } from './audit.ts';
import { targetOf } from './target.ts';

const view = (ctx: Ctx, p: typeof players.$inferSelect): AdminPlayerView => ({
  id: p.id,
  name: p.name,
  createdAt: p.createdAt,
  bannedAt: p.bannedAt,
  totalLevel: totalLevelOf(ctx, p.id),
  fireHours: fireHoursOf(ctx, p.id),
});

/** The most the player's fire burned in a day, in hours to a tenth (from their save's fire log). */
const fireHoursOf = (ctx: Ctx, id: string): number => {
  const saved = ctx.store.read(id, ctx.config.now());
  return saved ? Math.round(fireBusiestDay(saved.doc.state) / 360_000) / 10 : 0;
};

const playerOf = (ctx: Ctx, id: string, notYourself?: FastifyRequest) => targetOf(ctx, id, notYourself);

/** A new password the admin can read out: 16 letters and digits, unambiguous ones only. */
function freshPassword(): string {
  const letters = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 16 }, () => letters[randomInt(letters.length)]).join('');
}

export function adminRoutes(app: FastifyInstance, ctx: Ctx): void {
  const admin = requireAdmin(ctx);
  const saveOf = (id: string): AdminSaveResponse => {
    const player = view(ctx, playerOf(ctx, id));
    const saved = ctx.store.read(id, ctx.config.now());
    if (!saved) throw fail(404, 'notFound');
    const repairs = ctx.store.damaged(id).map((d) => ({ at: d.at, repairs: JSON.parse(d.repairs) as string[] }));
    return { player, doc: saved.doc, repairs };
  };

  contractRoute<{ query: string }>(
    app,
    ROUTES.adminPlayers,
    ({ input }) => {
      // Matched anywhere in the name, case aside; % and _ in the query are taken literally.
      const pattern = `%${nameKey(input.query).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      const rows = ctx.db
        .select()
        .from(players)
        .where(and(sql`${players.nameKey} like ${pattern} escape '\\'`, eq(players.role, 'player')))
        .orderBy(asc(players.nameKey))
        .limit(25)
        .all();
      return { players: rows.map((p) => view(ctx, p)) } satisfies AdminPlayersResponse;
    },
    admin,
  );

  contractRoute<{ playerId: string }>(app, ROUTES.adminSave, ({ input }) => saveOf(input.playerId), admin);

  contractRoute<{ playerId: string; name: string }>(
    app,
    ROUTES.adminRename,
    ({ req, input }) => {
      const before = playerOf(ctx, input.playerId).name;
      // Renaming someone into a name on the admin list would make them an admin.
      if (isAdmin(ctx, input.name)) throw fail(422, 'nameNotAllowed');
      if (nameHeld(ctx, input.name, input.playerId)) throw fail(409, 'nameTaken');
      ctx.db
        .update(players)
        .set({ name: input.name, nameKey: nameKey(input.name), nameLook: nameLook(input.name) })
        .where(eq(players.id, input.playerId))
        .run();
      ctx.hiscores.forget();
      settleReports(ctx, input.playerId, ctx.config.now());
      audit(ctx, req, 'rename', input.playerId, { from: before, to: input.name });
      return view(ctx, playerOf(ctx, input.playerId));
    },
    admin,
  );

  contractRoute<{ playerId: string; banned: boolean }>(
    app,
    ROUTES.adminBan,
    ({ req, input }) => {
      playerOf(ctx, input.playerId, input.banned ? req : undefined);
      ctx.db
        .update(players)
        .set({ bannedAt: input.banned ? ctx.config.now() : null })
        .where(eq(players.id, input.playerId))
        .run();
      ctx.hiscores.forget();
      if (input.banned) settleReports(ctx, input.playerId, ctx.config.now());
      if (input.banned) {
        ctx.sessions.endAll(input.playerId);
        ctx.live.closePlayer(input.playerId, true);
      }
      audit(ctx, req, input.banned ? 'ban' : 'unban', input.playerId);
      return view(ctx, playerOf(ctx, input.playerId));
    },
    admin,
  );

  // Every read mends a damaged save and keeps the original; this reads it now, so the admin sees what
  // was repaired, and stops nothing else.
  contractRoute<{ playerId: string }>(
    app,
    ROUTES.adminMend,
    async ({ req, input }) => {
      const out = await ctx.queue.run(input.playerId, () => saveOf(input.playerId));
      audit(ctx, req, 'mend', input.playerId);
      return out;
    },
    admin,
  );

  contractRoute<{ playerId: string }>(
    app,
    ROUTES.adminResetPassword,
    async ({ req, input }) => {
      playerOf(ctx, input.playerId);
      const password = freshPassword();
      const passwordHash = await hashPassword(password);
      ctx.db.update(players).set({ passwordHash }).where(eq(players.id, input.playerId)).run();
      ctx.sessions.endAll(input.playerId);
      ctx.live.closePlayer(input.playerId);
      audit(ctx, req, 'resetPassword', input.playerId);
      return { password } satisfies AdminResetResponse;
    },
    admin,
  );
}
