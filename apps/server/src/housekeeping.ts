// The server's housekeeping, each hour: sessions that have ended are let go, telemetry older than
// half a year (what it is for, the closed test and the months after launch, is long done by then), the
// record of sieges between lords past its 30 days, reports settled three months ago, and letters past their
// days (read 7, unread 14; refused ones kept 30 for the admin), and the seasons' ladders before the last
// (session 165). The
// tables that keep a player's newest rows (notices, feedback, sessions) trim themselves as they grow.
import { inArray, like, lt, or } from 'drizzle-orm';
import type { Ctx } from './context.ts';
import { hiscores, pushDue, pushSent, realmStrikes, realmWeeks, telemetry } from './db/schema.ts';
import { oldSeasonRows } from './game/season-ladder.ts';
import { oldDeepRows } from './game/deep-ladder.ts';
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
  ctx.social.sweep(now);
  const [old, oldDeep] = [oldSeasonRows(now), oldDeepRows(now)];
  // The seasons' ladders before the last, and the Deep's weeks before the last (session 214).
  const gone = ctx.db
    .selectDistinct({ skill: hiscores.skill })
    .from(hiscores)
    .where(or(like(hiscores.skill, 'season%:%'), like(hiscores.skill, 'deep:%')))
    .all()
    .map((r) => r.skill)
    .filter((skill) => old(skill) || oldDeep(skill));
  if (gone.length) ctx.db.delete(hiscores).where(inArray(hiscores.skill, gone)).run();
  // Notices while away (session 171): a count of a day long past, and anything left waiting for days.
  ctx.db
    .delete(pushSent)
    .where(lt(pushSent.day, new Date(now - 3 * DAY).toISOString().slice(0, 10)))
    .run();
  ctx.db
    .delete(pushDue)
    .where(lt(pushDue.at, now - 2 * DAY))
    .run();
  // The realm's boss (session 174): weeks long gone (a share is owed a week at most).
  const longGone = new Date(now - 35 * DAY).toISOString().slice(0, 10);
  ctx.db.delete(realmStrikes).where(lt(realmStrikes.week, longGone)).run();
  ctx.db.delete(realmWeeks).where(lt(realmWeeks.week, longGone)).run();
}
