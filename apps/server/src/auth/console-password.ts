// The console's account choosing its own password (session 237): at its first sign-in, while it holds the
// first password it was made with ("Password", the owner's), every admin route refuses it until this is done;
// and at any time after, from the console. The current password is asked, the new one must be the players'
// length and neither the one it replaces nor the first; the console's other sessions end, this one stays.
import { ROUTES } from '@idle-clash/contracts';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { audit } from '../admin/audit.ts';
import { limit, type Ctx } from '../context.ts';
import { players } from '../db/schema.ts';
import { contractRoute, fail } from '../http.ts';
import { checkPassword, hashPassword } from './passwords.ts';
import { requireSignedIn } from './routes.ts';
import { SESSION_COOKIE, tokenHash } from './sessions.ts';

const HOUR = 3_600_000;

export function consolePasswordRoutes(app: FastifyInstance, ctx: Ctx): void {
  contractRoute<{ current: string; password: string }>(
    app,
    ROUTES.consolePassword,
    async ({ req, reply, input }) => {
      // The console's own account alone, whether or not it still holds its first password; asked once the
      // input is read, so a malformed request is answered as malformed whoever sends it.
      if (!req.staff) throw fail(403, 'notAdmin');
      const id = req.playerId!;
      limit(ctx, reply, `password:${id}`, 5, HOUR);
      const row = ctx.db.select().from(players).where(eq(players.id, id)).get();
      if (!row || !(await checkPassword(row.passwordHash, input.current))) throw fail(401, 'wrongPassword');
      const first = ctx.config.staff.first;
      if (input.password === input.current || (first && input.password.toLowerCase() === first.toLowerCase()))
        throw fail(422, 'samePassword', { fields: ['password'] });
      const passwordHash = await hashPassword(input.password);
      ctx.db.update(players).set({ passwordHash, mustChangePassword: false }).where(eq(players.id, id)).run();
      const token = req.cookies[SESSION_COOKIE] ?? '';
      ctx.sessions.endOthers(id, token);
      ctx.live.closeSessions(id, { keep: tokenHash(token) });
      audit(ctx, req, 'consolePassword', null);
      return reply.code(204).send();
    },
    requireSignedIn(ctx),
  );
}
