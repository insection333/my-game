// Browsers a player has signed in on (session 290). A name's sign-in tries are limited across every
// address, so that a crowd guessing from many places is stopped; but once a crowd had spent them, the
// player too was refused, from anywhere, for as long as the crowd kept on (and one IPv6 home holds many
// networks). A browser that has signed in to an account carries a mark of it, a keyed hash of the
// player's id, which lets it past the name's limit alone: every address's own limits still hold, and
// the password is checked as ever. The mark says nothing to anyone without the server's key.
import { eq } from 'drizzle-orm';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Ctx } from '../context.ts';
import { serverSettings } from '../db/schema.ts';

export const KNOWN_COOKIE = 'ic_known';
/** Accounts one browser is known for (a family's tablet), the latest first. */
const KEEP = 3;
const DAYS = 365;
const KEY = 'known-key';
const MARK = /^[A-Za-z0-9_-]{22}$/;

const keys = new WeakMap<Ctx['db'], Buffer>();

/** The server's key for the marks, made once and kept with its settings. */
function keyOf(ctx: Ctx): Buffer {
  const held = keys.get(ctx.db);
  if (held) return held;
  const row = ctx.db.select().from(serverSettings).where(eq(serverSettings.key, KEY)).get();
  let key = row ? Buffer.from(row.value, 'hex') : null;
  if (!key || key.length !== 32) {
    key = randomBytes(32);
    ctx.db
      .insert(serverSettings)
      .values({ key: KEY, value: key.toString('hex') })
      .onConflictDoUpdate({ target: serverSettings.key, set: { value: key.toString('hex') } })
      .run();
  }
  keys.set(ctx.db, key);
  return key;
}

const markOf = (ctx: Ctx, playerId: string) =>
  createHmac('sha256', keyOf(ctx)).update(playerId).digest('base64url').slice(0, 22);

const marksIn = (req: FastifyRequest) =>
  (req.cookies[KNOWN_COOKIE] ?? '')
    .split('.')
    .filter((m) => MARK.test(m))
    .slice(0, KEEP);

/** Whether this browser has signed in to the player's account before. */
export function knownHere(ctx: Ctx, req: FastifyRequest, playerId: string): boolean {
  const mark = Buffer.from(markOf(ctx, playerId));
  return marksIn(req).some((m) => timingSafeEqual(Buffer.from(m), mark));
}

/** Marks this browser as one the player signs in on. */
export function markKnown(ctx: Ctx, req: FastifyRequest, reply: FastifyReply, playerId: string): void {
  const mark = markOf(ctx, playerId);
  const marks = [mark, ...marksIn(req).filter((m) => m !== mark)].slice(0, KEEP);
  reply.setCookie(KNOWN_COOKIE, marks.join('.'), {
    httpOnly: true,
    sameSite: 'lax',
    secure: ctx.config.secureCookies,
    path: '/api/auth',
    maxAge: DAYS * 86_400,
  });
}
