// The server's housekeeping, each hour: sessions that have ended are let go, telemetry older than
// half a year (what it is for, the closed test and the months after launch, is long done by then), the
// record of sieges between lords past its 30 days, reports settled three months ago, and letters past their
// days (read 7, unread 14; refused ones kept 30 for the admin). The
// tables that keep a player's newest rows (notices, feedback, sessions) trim themselves as they grow.
import { lt } from 'drizzle-orm';
import type { Ctx } from './context.ts';
import { telemetry } from './db/schema.ts';
import { sweepMail } from './mail/mail.ts';
import { sweepModeration } from './moderation.ts';

export { SESSIONS_PER_PLAYER } from './auth/sessions.ts';
export const TELEMETRY_DAYS = 180;
export const HOUSEKEEPING_EVERY_MS = 3_600_000;
const DAY = 24 * 3_600_000;

export function keepHouse(ctx: Ctx): void {
  const now = ctx.config.now();
  ctx.sessions.sweep(now);
  ctx.db
    .delete(telemetry)
    .where(lt(telemetry.at, now - TELEMETRY_DAYS * DAY))
    .run();
  sweepModeration(ctx, now);
  sweepMail(ctx, now);
}
