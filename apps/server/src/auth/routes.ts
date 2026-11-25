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
import { SESSION_COOKIE, SESSION_DAYS, tokenHash } from './sessions.ts';
import { STAFF_HOURS } from './staff.ts';

const MIN = 60_000;
const HOUR = 60 * MIN;

/** Reads the session cookie and sets req.playerId, refusing banned players. */
export function identify(ctx: Ctx) {
  return (req: FastifyRequest): void => {
    req.playerId = null;
    req.staff = false;
    const token = req.cookies[SESSION_COOKIE];
    if (!token) return;
    const id = ctx.sessions.find(token, ctx.config.now());
    if (!id) return;
    const row = ctx.db
      .select({ bannedAt: players.bannedAt, role: players.role })
      .from(players)
      .where(eq(players.id, id))
      .get();
    if (!row) return;
    if (row.bannedAt) {
      ctx.sessions.end(token);
      throw fail(403, 'banned');
    }
    // A page names the player it shows (session 208): one of another player, under the session a second
    // tab signed into, is refused rather than acting on the session's player.
    const shown = req.headers['x-player'] ?? (req.query as { player?: unknown } | undefined)?.player;
    if (typeof shown === 'string' && shown && shown !== id) throw fail(409, 'otherPlayer');
    req.playerId = id;
    req.staff = row.role === 'staff';
  };
}

/** Whether a name is on the server's admin list. */
export const isAdmin = (ctx: Ctx, name: string) => ctx.config.adminNames.some((n) => nameKey(n) === nameKey(name));

/** The console's own account, or a signed-in player on the admin list; anyone else is refused. */
export const requireAdmin = (ctx: Ctx) => {
  const who = identify(ctx);
  return (req: FastifyRequest): void => {
    who(req);
    if (!req.playerId) throw fail(401, 'notSignedIn');
    if (req.staff) {
      // Not while it holds the first password it was made with (session 237): its own comes first.
      const first = ctx.db
        .select({ must: players.mustChangePassword })
        .from(players)
        .where(eq(players.id, req.playerId))
        .get()?.must;
      if (first) throw fail(403, 'mustChangePassword');
      return;
    }
    const row = ctx.db.select({ name: players.name }).from(players).where(eq(players.id, req.playerId)).get();
    if (!row || !isAdmin(ctx, row.name)) throw fail(403, 'notAdmin');
  };
};

/** A signed-in player. The console's own account is refused (session 227): it never plays. */
export const requirePlayer = (ctx: Ctx) => {
  const who = identify(ctx);
  return (req: FastifyRequest): void => {
    who(req);
    if (!req.playerId) throw fail(401, 'notSignedIn');
    if (req.staff) throw fail(403, 'staffAccount');
  };
};

/** Anyone signed in, the console's account too (signing out). */
export const requireSignedIn = (ctx: Ctx) => {
  const who = identify(ctx);
  return (req: FastifyRequest): void => {
    who(req);
    if (!req.playerId) throw fail(401, 'notSignedIn');
  };
};

function startSession(ctx: Ctx, reply: FastifyReply, playerId: string, staff = false) {
  const lasts = (staff ? STAFF_HOURS * HOUR : SESSION_DAYS * 24 * HOUR) / 1000;
  keepCookie(ctx, reply, ctx.sessions.create(playerId, ctx.config.now(), lasts * 1000), lasts);
}

/** Gives the browser the session's cookie for another SESSION_DAYS. Sent at sign-in and again whenever the
 *  game is opened (session 157): the server renews a session as it is used, but a cookie given its days
 *  only at sign-in was dropped by the browser on day 30 however often the player came back. */
export function keepCookie(ctx: Ctx, reply: FastifyReply, token: string, seconds = SESSION_DAYS * 86_400) {
  reply.setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: ctx.config.secureCookies,
    path: '/',
    maxAge: seconds,
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
    startSession(ctx, reply, row.id, row.role === 'staff');
    ctx.telemetry.record('signIn', row.id);
    return { player: view(row) } satisfies AuthResponse;
  });

  contractRoute(
    app,
    ROUTES.signOut,
    async ({ req, reply }) => {
      const token = req.cookies[SESSION_COOKIE];
      if (token) ctx.sessions.end(token);
      // Its other tabs stop hearing the player's news too (session 158).
      if (token) ctx.live.closeSessions(req.playerId!, { session: tokenHash(token) });
      reply.clearCookie(SESSION_COOKIE, { path: '/' });
      return reply.code(204).send();
    },
    requireSignedIn(ctx),
  );

  contractRoute(
    app,
    ROUTES.me,
    ({ req, reply }) => {
      const row = req.playerId ? ctx.db.select().from(players).where(eq(players.id, req.playerId)).get() : undefined;
      // The console's session keeps the hours it was given at sign-in (session 227).
      if (row && row.role !== 'staff') keepCookie(ctx, reply, req.cookies[SESSION_COOKIE]!);
      const staff = row?.role === 'staff';
      return {
        player: row ? view(row) : null,
        flags: ctx.config.flags,
        email: { enabled: ctx.config.emailEnabled },
        admin: row ? staff || isAdmin(ctx, row.name) : false,
        staff,
        ...(staff && row?.mustChangePassword ? { mustChangePassword: true } : {}),
      } satisfies MeResponse;
    },
    identify(ctx),
  );
}
