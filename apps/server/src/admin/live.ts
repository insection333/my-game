// The console's live operations and system (session 230). Live: who has a page open now, who joined last,
// and a letter to every player not banned, sent as the game's own letter from the keepers of the realm
// (naming no admin, as a warning does), each inbox keeping its newest as ever, and told at once to every
// open page; the count it goes to is the one the admin was shown, or it is asked again. System: the build,
// the server's health, the features switched on, the size of the tables that grow, and the browser errors
// of the last day.
import { REALM, ROUTES, type BroadcastResult, type LiveResponse, type SystemResponse } from '@idle-clash/contracts';
import { FEATURES } from '@idle-clash/features';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { requireAdmin } from '../auth/routes.ts';
import type { Ctx } from '../context.ts';
import { adminActions, mail, players, telemetry } from '../db/schema.ts';
import { contractRoute } from '../http.ts';
import { announceMail, keepNewest } from '../mail/mail.ts';
import { backupsHealth } from '../ops/status.ts';
import { buildOf } from '../web.ts';
import { audit } from './audit.ts';

const DAY = 86_400_000;
/** The tables that grow with the realm, for the System section. */
const GROWING = ['players', 'saves', 'sessions', 'notices', 'hiscores', 'mail', 'telemetry', 'admin_actions'] as const;

/** Every player a letter to everyone goes to: not banned, and no console account. */
const reachOf = (ctx: Ctx) =>
  ctx.db
    .select({ id: players.id })
    .from(players)
    .where(and(eq(players.role, 'player'), isNull(players.bannedAt)))
    .all()
    .map((p) => p.id);

export function liveRoutes(app: FastifyInstance, ctx: Ctx): void {
  const startedAt = ctx.config.now();
  const admin = requireAdmin(ctx);

  contractRoute(
    app,
    ROUTES.adminLive,
    () => {
      const online = ctx.live.players();
      const named = online.length
        ? ctx.db
            .select({ id: players.id, name: players.name })
            .from(players)
            .where(and(inArray(players.id, online), eq(players.role, 'player')))
            .all()
            .sort((a, b) => a.name.localeCompare(b.name))
        : [];
      const joined = ctx.db
        .select({ id: players.id, name: players.name, createdAt: players.createdAt })
        .from(players)
        .where(eq(players.role, 'player'))
        .orderBy(desc(players.createdAt))
        .limit(10)
        .all();
      const sent = ctx.db
        .select()
        .from(adminActions)
        .where(eq(adminActions.action, 'broadcast'))
        .orderBy(desc(adminActions.id))
        .limit(10)
        .all()
        .map((r) => {
          const d = (r.detail ? JSON.parse(r.detail) : {}) as { count?: number; text?: string };
          return { at: r.at, actor: r.actorName, count: d.count ?? 0, text: d.text ?? '' };
        });
      return { at: ctx.config.now(), online: named, joined, reach: reachOf(ctx).length, sent } satisfies LiveResponse;
    },
    admin,
  );

  contractRoute<{ text: string; to: number }>(
    app,
    ROUTES.adminBroadcast,
    ({ req, input }) => {
      const ids = reachOf(ctx);
      if (ids.length !== input.to)
        return { ok: false, reason: 'reachChanged', reach: ids.length } satisfies BroadcastResult;
      const at = ctx.config.now();
      ctx.store.sqlite.transaction(() => {
        for (const id of ids) {
          ctx.db.insert(mail).values({ toId: id, fromId: REALM, body: input.text, at }).run();
          keepNewest(ctx, id);
        }
      })();
      for (const id of ids) if (ctx.live.has(id)) announceMail(ctx, id);
      audit(ctx, req, 'broadcast', null, { count: ids.length, text: input.text });
      return { ok: true, count: ids.length } satisfies BroadcastResult;
    },
    admin,
  );

  contractRoute(
    app,
    ROUTES.adminSystem,
    () => {
      const now = ctx.config.now();
      const db = ctx.store.sqlite;
      const pragma = (name: string) => (db.prepare(`pragma ${name}`).get() as Record<string, number>)[name];
      const errors = ctx.db
        .select({ at: telemetry.at, playerId: telemetry.playerId, data: telemetry.data, name: players.name })
        .from(telemetry)
        .leftJoin(players, eq(players.id, telemetry.playerId))
        .where(and(eq(telemetry.type, 'browserError')))
        .orderBy(desc(telemetry.id))
        .limit(50)
        .all()
        .filter((e) => e.at >= now - DAY)
        .map((e) => {
          const d = (e.data ? JSON.parse(e.data) : {}) as { message?: string; url?: string };
          return { at: e.at, player: e.name ?? null, message: d.message ?? '', url: d.url ?? '' };
        });
      return {
        at: now,
        build: ctx.config.webDist ? buildOf(ctx.config.webDist) : null,
        startedAt,
        memoryMb: Math.round(process.memoryUsage().rss / 1_048_576),
        databaseMb: Math.round(((pragma('page_size') * pragma('page_count')) / 1_048_576) * 10) / 10,
        backups: backupsHealth(ctx.config.backupStatusDir, now),
        features: FEATURES.map((f) => ({ id: f.id, on: !!ctx.config.flags[f.id] })),
        tables: GROWING.map((name) => ({
          name,
          rows: (db.prepare(`select count(*) n from ${name}`).get() as { n: number }).n,
        })),
        errors,
      } satisfies SystemResponse;
    },
    admin,
  );
}
