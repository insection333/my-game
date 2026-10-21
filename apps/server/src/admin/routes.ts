// The admin page's routes (the brief: offensive names refused and renamed, bans, a player's save
// inspected and mended, a forgotten password reset). Only players named in ADMIN_NAMES may call them;
// each action is recorded in telemetry by player id.
import {
  nameKey,
  ROUTES,
  type AdminPlayersResponse,
  type AdminPlayerView,
  type AdminResetResponse,
  type AdminSaveResponse,
} from '@idle-clash/contracts';
import { and, asc, eq, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { randomInt } from 'node:crypto';
import { hashPassword } from '../auth/passwords.ts';
import { isAdmin, requireAdmin } from '../auth/routes.ts';
import type { Ctx } from '../context.ts';
import { hiscores, players } from '../db/schema.ts';
import { contractRoute, fail } from '../http.ts';

const view = (ctx: Ctx, p: typeof players.$inferSelect): AdminPlayerView => {
  const total = ctx.db
    .select({ level: hiscores.level })
    .from(hiscores)
    .where(and(eq(hiscores.playerId, p.id), eq(hiscores.skill, 'total')))
    .get();
  return { id: p.id, name: p.name, createdAt: p.createdAt, bannedAt: p.bannedAt, totalLevel: total?.level ?? 7 };
};

const playerOf = (ctx: Ctx, id: string) => {
  const row = ctx.db.select().from(players).where(eq(players.id, id)).get();
  if (!row) throw fail(404, 'notFound');
  return row;
};

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
  const record = (action: string, by: string, target: string) =>
    ctx.telemetry.record(`admin.${action}`, by, { target });

  contractRoute<{ query: string }>(
    app,
    ROUTES.adminPlayers,
    ({ input }) => {
      // Matched anywhere in the name, case aside; % and _ in the query are taken literally.
      const pattern = `%${nameKey(input.query).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      const rows = ctx.db
        .select()
        .from(players)
        .where(sql`${players.nameKey} like ${pattern} escape '\\'`)
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
      playerOf(ctx, input.playerId);
      // Renaming someone into a name on the admin list would make them an admin.
      if (isAdmin(ctx, input.name)) throw fail(422, 'nameNotAllowed');
      const key = nameKey(input.name);
      const taken = ctx.db.select({ id: players.id }).from(players).where(eq(players.nameKey, key)).get();
      if (taken && taken.id !== input.playerId) throw fail(409, 'nameTaken');
      ctx.db.update(players).set({ name: input.name, nameKey: key }).where(eq(players.id, input.playerId)).run();
      record('rename', req.playerId!, input.playerId);
      return view(ctx, playerOf(ctx, input.playerId));
    },
    admin,
  );

  contractRoute<{ playerId: string; banned: boolean }>(
    app,
    ROUTES.adminBan,
    ({ req, input }) => {
      playerOf(ctx, input.playerId);
      ctx.db
        .update(players)
        .set({ bannedAt: input.banned ? ctx.config.now() : null })
        .where(eq(players.id, input.playerId))
        .run();
      if (input.banned) {
        ctx.sessions.endAll(input.playerId);
        ctx.live.closePlayer(input.playerId);
      }
      record(input.banned ? 'ban' : 'unban', req.playerId!, input.playerId);
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
      record('mend', req.playerId!, input.playerId);
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
      record('resetPassword', req.playerId!, input.playerId);
      return { password } satisfies AdminResetResponse;
    },
    admin,
  );
}
