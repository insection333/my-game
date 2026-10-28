// Deleting an account (the brief: "an account and its data can be deleted"). With the password and a
// confirmation, everything the server holds for the player goes at once: the account, its sessions
// and email tokens, the save and every damaged copy, notices, hiscores, telemetry, and the feedback and
// visits of the closed test. Nothing stays.
import { ROUTES } from '@idle-clash/contracts';
import { eq, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { limit, type Ctx } from '../context.ts';
import { emailTokens, players, sessions, telemetry } from '../db/schema.ts';
import { contractRoute, fail } from '../http.ts';
import { eraseTester } from '../closed-test.ts';
import { checkPassword } from './passwords.ts';
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
    eraseTester(ctx, playerId);
    ctx.notices.remove(playerId);
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
}
