// Email confirmation and password recovery. Built and tested, but mounted only when the owner
// switches email on (EMAIL_ENABLED=true); until then these routes do not exist and nothing is sent.
import { nameKey, ROUTES } from '@idle-clash/contracts';
import { and, eq, gt, isNull } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { ipOf, limit, type Ctx } from '../context.ts';
import { emailTokens, players } from '../db/schema.ts';
import { contractRoute, fail } from '../http.ts';
import { hashPassword } from './passwords.ts';
import { requirePlayer } from './routes.ts';
import { newToken, tokenHash } from './sessions.ts';

const HOUR = 3600_000;

function issue(ctx: Ctx, playerId: string, purpose: 'confirm' | 'reset', email: string | null, ttl: number): string {
  const token = newToken();
  const now = ctx.config.now();
  ctx.db
    .insert(emailTokens)
    .values({ tokenHash: tokenHash(token), playerId, purpose, email, createdAt: now, expiresAt: now + ttl })
    .run();
  return token;
}

/** Uses a token once: the row if it is valid for this purpose, else null. */
function redeem(ctx: Ctx, token: string, purpose: 'confirm' | 'reset') {
  const now = ctx.config.now();
  const where = and(
    eq(emailTokens.tokenHash, tokenHash(token)),
    eq(emailTokens.purpose, purpose),
    gt(emailTokens.expiresAt, now),
    isNull(emailTokens.usedAt),
  );
  const row = ctx.db.select().from(emailTokens).where(where).get();
  if (!row) return null;
  ctx.db.update(emailTokens).set({ usedAt: now }).where(eq(emailTokens.tokenHash, row.tokenHash)).run();
  return row;
}

export function emailRoutes(app: FastifyInstance, ctx: Ctx): void {
  const site = ctx.config.origins[0];

  contractRoute<{ email: string }>(
    app,
    ROUTES.setEmail,
    async ({ req, reply, input }) => {
      limit(ctx, reply, `set-email:${req.playerId}`, 5, HOUR);
      ctx.db
        .update(players)
        .set({ email: input.email, emailConfirmedAt: null })
        .where(eq(players.id, req.playerId!))
        .run();
      const token = issue(ctx, req.playerId!, 'confirm', input.email, 24 * HOUR);
      await ctx.mailer.send({
        to: input.email,
        subject: 'Confirm your email for Idle Clash',
        text: `Confirm this address for your Idle Clash account:\n${site}/confirm-email?token=${token}\n\nThe link lasts a day. If you did not ask for this, ignore this email.`,
      });
      return reply.code(202).send();
    },
    requirePlayer(ctx),
  );

  contractRoute<{ token: string }>(app, ROUTES.confirmEmail, async ({ reply, input }) => {
    const row = redeem(ctx, input.token, 'confirm');
    if (!row) throw fail(400, 'tokenInvalid');
    ctx.db
      .update(players)
      .set({ email: row.email, emailConfirmedAt: ctx.config.now() })
      .where(eq(players.id, row.playerId))
      .run();
    return reply.code(204).send();
  });

  contractRoute<{ name: string }>(app, ROUTES.recover, async ({ req, reply, input }) => {
    limit(ctx, reply, `recover:ip:${ipOf(req)}`, 5, HOUR);
    limit(ctx, reply, `recover:name:${nameKey(input.name)}`, 3, HOUR);
    const row = ctx.db
      .select()
      .from(players)
      .where(eq(players.nameKey, nameKey(input.name)))
      .get();
    if (row?.email && row.emailConfirmedAt) {
      const token = issue(ctx, row.id, 'reset', row.email, HOUR);
      await ctx.mailer.send({
        to: row.email,
        subject: 'Reset your Idle Clash password',
        text: `Choose a new password for ${row.name}:\n${site}/reset-password?token=${token}\n\nThe link lasts an hour. If you did not ask for this, ignore this email.`,
      });
    }
    // The same answer whether or not the name exists or has an address, so names cannot be probed.
    return reply.code(202).send();
  });

  contractRoute<{ token: string; password: string }>(app, ROUTES.resetPassword, async ({ reply, input }) => {
    const row = redeem(ctx, input.token, 'reset');
    if (!row) throw fail(400, 'tokenInvalid');
    const passwordHash = await hashPassword(input.password);
    ctx.db.update(players).set({ passwordHash }).where(eq(players.id, row.playerId)).run();
    ctx.sessions.endAll(row.playerId);
    return reply.code(204).send();
  });
}
