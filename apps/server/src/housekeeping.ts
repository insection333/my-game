// The server's housekeeping, each hour: sessions that have ended are let go, telemetry older than
// half a year (what it is for, the closed test and the months after launch, is long done by then), the
// record of sieges between lords past its 30 days, reports settled three months ago, and letters past their
// days (read 7, unread 14; refused ones kept 30 for the admin), and the seasons' ladders before the last
// (session 165). The
// tables that keep a player's newest rows (notices, feedback, sessions) trim themselves as they grow.
import { inArray, like, lt } from 'drizzle-orm';
import type { Ctx } from './context.ts';
import { hiscores, telemetry } from './db/schema.ts';
import { oldSeasonRows } from './game/season-ladder.ts';
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
  const old = oldSeasonRows(now);
  const gone = ctx.db
    .selectDistinct({ skill: hiscores.skill })
    .from(hiscores)
    .where(like(hiscores.skill, 'season%:%'))
    .all()
    .map((r) => r.skill)
    .filter(old);
  if (gone.length) ctx.db.delete(hiscores).where(inArray(hiscores.skill, gone)).run();
}
