// Sign up, sign in, sign out, and who is signed in. Every attempt is rate-limited; a wrong name and
// a wrong password look the same, and take the same time.
import { nameKey, ROUTES, type AuthResponse, type MeResponse, type PlayerView } from '@idle-clash/contracts';
import { newState, seedFrom } from '@idle-clash/kernel';
import { eq } from 'drizzle-orm';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { randomInt, randomUUID } from 'node:crypto';
import { ipOf, limit, type Ctx } from '../context.ts';
import { players } from '../db/schema.ts';
import { contractRoute, fail } from '../http.ts';
import { checkPassword, dummyHash, hashPassword } from './passwords.ts';
import { SESSION_COOKIE, SESSION_DAYS } from './sessions.ts';

const MIN = 60_000;
const HOUR = 60 * MIN;

/** Reads the session cookie and sets req.playerId, refusing banned players. */
export function identify(ctx: Ctx) {
  return (req: FastifyRequest): void => {
    req.playerId = null;
    const token = req.cookies[SESSION_COOKIE];
    if (!token) return;
    const id = ctx.sessions.find(token, ctx.config.now());
    if (!id) return;
    const row = ctx.db.select({ bannedAt: players.bannedAt }).from(players).where(eq(players.id, id)).get();
    if (!row) return;
    if (row.bannedAt) {
      ctx.sessions.end(token);
      throw fail(403, 'banned');
    }
    req.playerId = id;
  };
}

export const requirePlayer = (ctx: Ctx) => {
  const who = identify(ctx);
  return (req: FastifyRequest): void => {
    who(req);
    if (!req.playerId) throw fail(401, 'notSignedIn');
  };
};

function startSession(ctx: Ctx, reply: FastifyReply, playerId: string) {
  const token = ctx.sessions.create(playerId, ctx.config.now());
  reply.setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: ctx.config.secureCookies,
    path: '/',
    maxAge: SESSION_DAYS * 86_400,
  });
}

const view = (row: { id: string; name: string }): PlayerView => ({ id: row.id, name: row.name });

export function authRoutes(app: FastifyInstance, ctx: Ctx): void {
  contractRoute<{ name: string; password: string }>(app, ROUTES.signUp, async ({ req, reply, input }) => {
    limit(ctx, reply, `sign-up:${ipOf(req)}`, 5, HOUR);
    const key = nameKey(input.name);
    if (ctx.db.select({ id: players.id }).from(players).where(eq(players.nameKey, key)).get())
      throw fail(409, 'nameTaken');
    const passwordHash = await hashPassword(input.password);
    const now = ctx.config.now();
    const id = randomUUID();
    try {
      ctx.store.sqlite.transaction(() => {
        ctx.db.insert(players).values({ id, name: input.name, nameKey: key, passwordHash, createdAt: now }).run();
        ctx.store.create(id, newState(seedFrom(randomInt(2 ** 31)), now), now);
      })();
    } catch (err) {
      if (String(err).includes('UNIQUE')) throw fail(409, 'nameTaken');
      throw err;
    }
    startSession(ctx, reply, id);
    ctx.telemetry.record('signUp', id);
    return reply.code(201).send({ player: view({ id, name: input.name }) } satisfies AuthResponse);
  });

  contractRoute<{ name: string; password: string }>(app, ROUTES.signIn, async ({ req, reply, input }) => {
    limit(ctx, reply, `sign-in:ip:${ipOf(req)}`, 20, 15 * MIN);
    limit(ctx, reply, `sign-in:name:${nameKey(input.name)}`, 10, 15 * MIN);
    const row = ctx.db
      .select()
      .from(players)
      .where(eq(players.nameKey, nameKey(input.name)))
      .get();
    const ok = await checkPassword(row?.passwordHash ?? (await dummyHash()), input.password);
    if (!row || !ok) throw fail(401, 'wrongNameOrPassword');
    if (row.bannedAt) throw fail(403, 'banned');
    startSession(ctx, reply, row.id);
    ctx.telemetry.record('signIn', row.id);
    return { player: view(row) } satisfies AuthResponse;
  });

  contractRoute(
    app,
    ROUTES.signOut,
    async ({ req, reply }) => {
      const token = req.cookies[SESSION_COOKIE];
      if (token) ctx.sessions.end(token);
      reply.clearCookie(SESSION_COOKIE, { path: '/' });
      return reply.code(204).send();
    },
    requirePlayer(ctx),
  );

  contractRoute(
    app,
    ROUTES.me,
    ({ req }) => {
      const row = req.playerId ? ctx.db.select().from(players).where(eq(players.id, req.playerId)).get() : undefined;
      return {
        player: row ? view(row) : null,
        flags: ctx.config.flags,
        email: { enabled: ctx.config.emailEnabled },
      } satisfies MeResponse;
    },
    identify(ctx),
  );
}
