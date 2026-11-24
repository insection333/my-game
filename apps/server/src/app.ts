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
import { ensureStaff } from './auth/staff.ts';
import type { Config } from './config.ts';
import type { Ctx } from './context.ts';
import { ipOf, limit } from './context.ts';
import { openDb } from './db/open.ts';
import { LiveHub } from './game/live.ts';
import { gameRoutes } from './game/routes.ts';
import { castleRoutes } from './castle/routes.ts';
import { contractRoute, harden } from './http.ts';
import { RateLimiter } from './security.ts';
import { adminRoutes } from './admin/routes.ts';
import { auditRoutes } from './admin/audit.ts';
import { directoryRoutes } from './admin/directory.ts';
import { liveRoutes } from './admin/live.ts';
import { overviewRoutes } from './admin/overview.ts';
import { powerRoutes } from './admin/powers.ts';
import { recordRoutes } from './admin/record.ts';
import { feedbackRoutes } from './feedback.ts';
import { moderationRoutes } from './moderation.ts';
import { profileRoutes } from './game/profile.ts';
import { mailRoutes } from './mail/routes.ts';
import { accountRoutes } from './auth/account.ts';
import { Hiscores } from './game/hiscores.ts';
import { Notices } from './game/notices.ts';
import { hearWatching, WATCH_EVERY_MS } from './game/watching.ts';
import { Telemetry } from './telemetry.ts';
import { tellBuild, webRoutes } from './web.ts';
import { backupsHealth } from './ops/status.ts';
import { HOUSEKEEPING_EVERY_MS, keepHouse } from './housekeeping.ts';
import { Push } from './push/push.ts';
import { Realm } from './game/realm.ts';
import { RealmWorks } from './game/realm-works.ts';
import { pushRoutes } from './push/routes.ts';
import { keysOf, webPushSender } from './push/send.ts';
import { withCastle } from './castle/mirror.ts';

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
    push: null as unknown as Push,
    realm: new Realm(db),
    realmWorks: new RealmWorks(db),
  };
  ctx.push = new Push(
    {
      db,
      engine: ctx.engine,
      now: config.now,
      stateOf: (playerId, at) => {
        const saved = store.read(playerId, at);
        return saved ? withCastle(ctx, playerId, saved.doc.state, at) : null;
      },
      online: (playerId) => ctx.live.has(playerId),
    },
    webPushSender(keysOf(db)),
  );
  // A climb on a ladder is said to the player at once, and kept with their notices (session 49).
  ctx.hiscores.onRankUp = (playerId, events) => {
    ctx.live.publish(playerId, { type: 'events', events });
    ctx.notices.add(playerId, events);
  };
  // The realm's boss fell (session 174): each who struck it hears at once, and their tray keeps it.
  ctx.realm.onFell = (playerId, events) => {
    ctx.live.publish(playerId, { type: 'events', events });
    ctx.notices.add(playerId, events);
  };
  // A stage of the realm's work raised (session 218): each who gave hears at once, and their tray keeps it.
  ctx.realmWorks.onStage = (playerId, events) => {
    ctx.live.publish(playerId, { type: 'events', events });
    ctx.notices.add(playerId, events);
  };
  // A rival passed them (session 173): their tray hears of it, and an open page at once. Never a push.
  ctx.hiscores.onPassed = (playerId, events) => {
    ctx.live.publish(playerId, { type: 'events', events });
    ctx.notices.add(playerId, events);
  };
  app.decorateRequest('playerId', null);
  app.decorateRequest('staff', false);
  // The admin console's own account, from the server's secret (session 227).
  const staff = await ensureStaff(ctx);
  if (staff === 'nameHeld') app.log.warn({ name: config.staff.name }, 'the console account name is held by a player');
  harden(app, config.origins);
  if (config.webDist) tellBuild(app, config.webDist);
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
      // Counted for the console's overview (session 228), by player id only, as all telemetry is.
      ctx.telemetry.record('browserError', req.playerId, {
        message: input.message.slice(0, 300),
        url: input.url.slice(0, 200),
      });
      return reply.code(204).send();
    },
    identify(ctx),
  );
  authRoutes(app, ctx);
  accountRoutes(app, ctx);
  adminRoutes(app, ctx);
  overviewRoutes(app, ctx);
  directoryRoutes(app, ctx);
  auditRoutes(app, ctx);
  recordRoutes(app, ctx);
  powerRoutes(app, ctx);
  liveRoutes(app, ctx);
  feedbackRoutes(app, ctx, features);
  if (config.emailEnabled) emailRoutes(app, ctx);
  gameRoutes(app, ctx, features);
  castleRoutes(app, ctx);
  moderationRoutes(app, ctx);
  profileRoutes(app, ctx);
  mailRoutes(app, ctx);
  pushRoutes(app, ctx);
  if (config.webDist) webRoutes(app, config.webDist);
  const watching = setInterval(
    () => void hearWatching(ctx).catch((err: unknown) => app.log.error({ err }, 'hiscores for watchers')),
    WATCH_EVERY_MS,
  );
  watching.unref();
  const housekeeping = setInterval(() => {
    try {
      keepHouse(ctx);
    } catch (err) {
      app.log.error({ err }, 'housekeeping');
    }
  }, HOUSEKEEPING_EVERY_MS);
  housekeeping.unref();
  // Notices while away (session 171): absences foreseen, and what is due sent, each minute.
  const pushing = setInterval(
    () => void ctx.push.sweep().catch((err: unknown) => app.log.error({ err }, 'notices while away')),
    60_000,
  );
  pushing.unref();
  app.setNotFoundHandler((_req, reply) => reply.code(404).send({ error: { code: 'notFound' } }));

  return {
    app,
    ctx,
    close: async () => {
      clearInterval(watching);
      clearInterval(housekeeping);
      clearInterval(pushing);
      ctx.live.closeAll();
      await app.close();
      closeDb();
    },
  };
}
