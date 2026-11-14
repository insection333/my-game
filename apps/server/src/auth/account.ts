// Deleting an account (the brief: "an account and its data can be deleted"). With the password and a
// confirmation, everything the server holds for the player goes at once: the account, its sessions
// and email tokens, the save and every damaged copy, notices, hiscores, telemetry, the feedback and
// visits, reports made by them or about them and their sieges' record, and their castle (Castle Clash). Nothing stays: another castle's reports and pair limits that
// named them keep the entry, with the id replaced by "departed", and another lord's notices of a siege
// or a caught spy keep it with the name taken out.
import { eraseMail } from '../mail/mail.ts';
import { ROUTES } from '@idle-clash/contracts';
import { eq, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { limit, type Ctx } from '../context.ts';
import { bastionLogs, castleRecords, emailTokens, playerBastions, players, sessions, telemetry } from '../db/schema.ts';
import { contractRoute, fail } from '../http.ts';
import { eraseFeedback } from '../feedback.ts';
import { eraseModeration } from '../moderation.ts';
import { checkPassword, hashPassword } from './passwords.ts';
import { requirePlayer } from './routes.ts';
import { SESSION_COOKIE } from './sessions.ts';

const HOUR = 3_600_000;

/** Removes every row the server keeps for a player. */
export function erase(ctx: Ctx, playerId: string): void {
  ctx.store.sqlite.transaction(() => {
    ctx.db.delete(sessions).where(eq(sessions.playerId, playerId)).run();
    ctx.db.delete(emailTokens).where(eq(emailTokens.playerId, playerId)).run();
    ctx.db.delete(telemetry).where(eq(telemetry.playerId, playerId)).run();
    // Any other record naming them, such as an admin's record of acting on the player.
    ctx.db
      .delete(telemetry)
      .where(sql`instr(${telemetry.data}, ${playerId}) > 0`)
      .run();
    eraseFeedback(ctx, playerId);
    eraseModeration(ctx, playerId);
    eraseMail(ctx, playerId);
    ctx.db.delete(playerBastions).where(eq(playerBastions.userId, playerId)).run();
    ctx.db.delete(bastionLogs).where(eq(bastionLogs.userId, playerId)).run();
    ctx.db.delete(castleRecords).where(eq(castleRecords.userId, playerId)).run();
    ctx.db
      .update(bastionLogs)
      .set({ data: sql`replace(${bastionLogs.data}, ${playerId}, 'departed')` })
      .where(sql`instr(${bastionLogs.data}, ${playerId}) > 0`)
      .run();
    ctx.db
      .update(playerBastions)
      .set({ pairLimits: sql`replace(${playerBastions.pairLimits}, ${playerId}, 'departed')` })
      .where(sql`instr(${playerBastions.pairLimits}, ${playerId}) > 0`)
      .run();
    ctx.notices.remove(playerId);
    const name = ctx.db.select({ name: players.name }).from(players).where(eq(players.id, playerId)).get()?.name;
    if (name) ctx.notices.forgetFoe(name);
    ctx.hiscores.remove(playerId);
    ctx.store.remove(playerId);
    ctx.db.delete(players).where(eq(players.id, playerId)).run();
  })();
  ctx.live.closePlayer(playerId);
}

export function accountRoutes(app: FastifyInstance, ctx: Ctx): void {
  contractRoute<{ password: string }>(
    app,
    ROUTES.deleteAccount,
    async ({ req, reply, input }) => {
      const id = req.playerId!;
      limit(ctx, reply, `delete:${id}`, 5, HOUR);
      const row = ctx.db.select().from(players).where(eq(players.id, id)).get();
      if (!row || !(await checkPassword(row.passwordHash, input.password))) throw fail(401, 'wrongPassword');
      await ctx.queue.run(id, () => erase(ctx, id));
      // Counted, but with no player id: the account is gone.
      ctx.telemetry.record('accountDeleted', null);
      reply.clearCookie(SESSION_COOKIE, { path: '/' });
      return reply.code(204).send();
    },
    requirePlayer(ctx),
  );
  // A password changed by its player (session 105): with the current one, as deleting asks; the page it was
  // changed from stays signed in and every other session ends, as an admin's reset ends them all.
  contractRoute<{ current: string; password: string }>(
    app,
    ROUTES.changePassword,
    async ({ req, reply, input }) => {
      const id = req.playerId!;
      limit(ctx, reply, `password:${id}`, 5, HOUR);
      const row = ctx.db.select().from(players).where(eq(players.id, id)).get();
      if (!row || !(await checkPassword(row.passwordHash, input.current))) throw fail(401, 'wrongPassword');
      const passwordHash = await hashPassword(input.password);
      ctx.db.update(players).set({ passwordHash }).where(eq(players.id, id)).run();
      ctx.sessions.endOthers(id, req.cookies[SESSION_COOKIE] ?? '');
      ctx.telemetry.record('passwordChanged', id);
      return reply.code(204).send();
    },
    requirePlayer(ctx),
  );
}
