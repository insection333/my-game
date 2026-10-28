// Sign up, sign in, sign out, and who is signed in. Every attempt is rate-limited; a wrong name and
// a wrong password look the same, and take the same time.
import { nameKey, nameLook, ROUTES, type AuthResponse, type MeResponse, type PlayerView } from '@idle-clash/contracts';
import { newState, seedFrom } from '@idle-clash/kernel';
import { and, eq, ne, or } from 'drizzle-orm';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { randomInt, randomUUID } from 'node:crypto';
import { ipOf, limit, type Ctx } from '../context.ts';
import { players } from '../db/schema.ts';
import { contractRoute, fail } from '../http.ts';
import { nameAllowed } from './names.ts';
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

/** Whether a name is on the server's admin list. */
export const isAdmin = (ctx: Ctx, name: string) => ctx.config.adminNames.some((n) => nameKey(n) === nameKey(name));

/** A signed-in player on the admin list; anyone else is refused. */
export const requireAdmin = (ctx: Ctx) => {
  const who = identify(ctx);
  return (req: FastifyRequest): void => {
    who(req);
    if (!req.playerId) throw fail(401, 'notSignedIn');
    const row = ctx.db.select({ name: players.name }).from(players).where(eq(players.id, req.playerId)).get();
    if (!row || !isAdmin(ctx, row.name)) throw fail(403, 'notAdmin');
  };
};

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

/** Whether a name is held by another player, as written or as it looks at a glance ("AshIing" for
 *  Ashling): no one may pass for someone else on the hiscores. */
export const nameHeld = (ctx: Ctx, name: string, except?: string): boolean =>
  !!ctx.db
    .select({ id: players.id })
    .from(players)
    .where(
      and(
        or(eq(players.nameKey, nameKey(name)), eq(players.nameLook, nameLook(name))),
        except ? ne(players.id, except) : undefined,
      ),
    )
    .get();

export function authRoutes(app: FastifyInstance, ctx: Ctx): void {
  contractRoute<{ name: string; password: string }>(app, ROUTES.signUp, async ({ req, reply, input }) => {
    limit(ctx, reply, `sign-up:${ipOf(req)}`, 5, HOUR);
    const key = nameKey(input.name);
    // A name on the admin list is refused too: whoever took it would be an admin. The owner signs up
    // first and lists the name after, and a listed name freed by deleting its account stays refused.
    if (!nameAllowed(input.name) || isAdmin(ctx, input.name)) throw fail(422, 'nameNotAllowed');
    if (nameHeld(ctx, input.name)) throw fail(409, 'nameTaken');
    const passwordHash = await hashPassword(input.password);
    const now = ctx.config.now();
    const id = randomUUID();
    try {
      ctx.store.sqlite.transaction(() => {
        // Checked again where nothing can come between the check and the insert.
        if (nameHeld(ctx, input.name)) throw fail(409, 'nameTaken');
        ctx.db
          .insert(players)
          .values({ id, name: input.name, nameKey: key, nameLook: nameLook(input.name), passwordHash, createdAt: now })
          .run();
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
    // Guesses at a name are limited from each address, so a stranger guessing at a player's name
    // cannot lock that player out; the looser limit across all addresses stops a crowd of them.
    const key = nameKey(input.name);
    limit(ctx, reply, `sign-in:ip:${ipOf(req)}`, 20, 15 * MIN);
    limit(ctx, reply, `sign-in:name:${key}:${ipOf(req)}`, 10, 15 * MIN);
    limit(ctx, reply, `sign-in:name:${key}`, 100, 15 * MIN);
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
        admin: row ? isAdmin(ctx, row.name) : false,
      } satisfies MeResponse;
    },
    identify(ctx),
  );
}
