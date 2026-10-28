// Builds the server: the database, the engine with the switched-on features, and every route.
// Tests call buildApp with their own config (an in-memory database, their own clock and mailer).
import cookie from '@fastify/cookie';
import websocket from '@fastify/websocket';
import { ROUTES } from '@idle-clash/contracts';
import { actionRegistry, FEATURES, type Feature } from '@idle-clash/features';
import { createEngine, PlayerQueue } from '@idle-clash/kernel';
import Fastify, { type FastifyInstance } from 'fastify';
import { emailRoutes } from './auth/email.ts';
import { LogMailer, type Mailer } from './auth/mailer.ts';
import { authRoutes, identify } from './auth/routes.ts';
import { Sessions } from './auth/sessions.ts';
import type { Config } from './config.ts';
import type { Ctx } from './context.ts';
import { ipOf, limit } from './context.ts';
import { openDb } from './db/open.ts';
import { LiveHub } from './game/live.ts';
import { gameRoutes } from './game/routes.ts';
import { contractRoute, harden } from './http.ts';
import { RateLimiter } from './security.ts';
import { adminRoutes } from './admin/routes.ts';
import { closedTestRoutes } from './closed-test.ts';
import { accountRoutes } from './auth/account.ts';
import { Hiscores } from './game/hiscores.ts';
import { Notices } from './game/notices.ts';
import { hearWatching, WATCH_EVERY_MS } from './game/watching.ts';
import { Telemetry } from './telemetry.ts';
import { webRoutes } from './web.ts';
import { backupsHealth } from './ops/status.ts';

export interface Built {
  app: FastifyInstance;
  ctx: Ctx;
  close: () => Promise<void>;
}

export async function buildApp(
  config: Config,
  opts: { mailer?: Mailer; features?: readonly Feature[] } = {},
): Promise<Built> {
  const app = Fastify({
    logger: config.log
      ? { redact: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]'] }
      : false,
    bodyLimit: 16 * 1024,
    // Only a proxy on this machine (Caddy, from session 10) may say who the client is; anyone else's
    // X-Forwarded-For is ignored, so it cannot be used to slip past the per-address limits.
    trustProxy: 'loopback',
  });
  const features = opts.features ?? FEATURES;
  const { db, store, close: closeDb } = openDb(config.dbPath);
  const on = features.filter((f) => config.flags[f.id]);
  const ctx: Ctx = {
    config,
    db,
    store,
    queue: new PlayerQueue(),
    engine: createEngine(actionRegistry(on, () => true)),
    sessions: new Sessions(db),
    limiter: new RateLimiter(),
    mailer: opts.mailer ?? new LogMailer(config.log ? app.log : null),
    live: new LiveHub(),
    telemetry: new Telemetry(db, config.now),
    notices: new Notices(db),
    hiscores: new Hiscores(db),
  };
  app.decorateRequest('playerId', null);
  harden(app, config.origins);
  await app.register(cookie);
  await app.register(websocket, { options: { maxPayload: 4096 } });

  // Up, and the database answers; with how recent the backups are, for the outside uptime check.
  contractRoute(app, ROUTES.health, () => {
    store.sqlite.prepare('select 1').get();
    return { ok: true, backups: backupsHealth(config.backupStatusDir, config.now()) };
  });
  contractRoute<{ message: string; url: string }>(
    app,
    ROUTES.errors,
    async ({ req, reply, input }) => {
      limit(ctx, reply, `errors:${ipOf(req)}`, 30, 60_000);
      req.log.warn({ browserError: input, player: req.playerId }, 'browser error');
      return reply.code(204).send();
    },
    identify(ctx),
  );
  authRoutes(app, ctx);
  accountRoutes(app, ctx);
  adminRoutes(app, ctx);
  closedTestRoutes(app, ctx, features);
  if (config.emailEnabled) emailRoutes(app, ctx);
  gameRoutes(app, ctx, features);
  if (config.webDist) webRoutes(app, config.webDist);
  const watching = setInterval(
    () => void hearWatching(ctx).catch((err: unknown) => app.log.error({ err }, 'hiscores for watchers')),
    WATCH_EVERY_MS,
  );
  watching.unref();
  app.setNotFoundHandler((_req, reply) => reply.code(404).send({ error: { code: 'notFound' } }));

  return {
    app,
    ctx,
    close: async () => {
      clearInterval(watching);
      ctx.live.closeAll();
      await app.close();
      closeDb();
    },
  };
}
