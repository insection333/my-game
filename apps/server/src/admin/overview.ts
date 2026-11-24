// The console's Overview (session 228): the realm at a glance. Players (all told, new, active today, this
// week and this month, online now, listed, banned), how many come back on their second and seventh days,
// the last fortnight's sign-ups and players day by day, what waits for moderation, the realm's season, boss
// and work, and the server's own health. Counted from the tables as they stand; the console's own account
// is no player and stands in none of it.
import { ROUTES, type AdminOverviewResponse, type DayCount } from '@idle-clash/contracts';
import { realmBossIn, realmName, realmWorkIn, realmWorkName, seasonAt, seasonView, weekOf } from '@idle-clash/features';
import type { FastifyInstance } from 'fastify';
import { requireAdmin } from '../auth/routes.ts';
import type { Ctx } from '../context.ts';
import { contractRoute } from '../http.ts';
import { backupsHealth } from '../ops/status.ts';
import { buildOf } from '../web.ts';

const DAY = 86_400_000;
const dayOf = (at: number) => new Date(at).toISOString().slice(0, 10);
const pct = (part: number, of: number) => (of ? Math.round((part / of) * 100) : null);

export function overviewRoutes(app: FastifyInstance, ctx: Ctx): void {
  const startedAt = ctx.config.now();
  const db = ctx.store.sqlite;
  const one = (q: string, ...args: unknown[]) => (db.prepare(q).get(...args) as { n: number | null }).n ?? 0;
  contractRoute(
    app,
    ROUTES.adminOverview,
    () => {
      const now = ctx.config.now();
      const today = dayOf(now);
      const dayStart = Date.parse(`${today}T00:00:00Z`);
      const player = "role = 'player'";
      const daysAgo = (n: number) => dayOf(now - n * DAY);
      const activeSince = (from: string) =>
        one(
          `select count(distinct v.player_id) n from visits v join players p on p.id = v.player_id and p.${player} where v.day >= ?`,
          from,
        );
      const players = {
        total: one(`select count(*) n from players where ${player}`),
        newToday: one(`select count(*) n from players where ${player} and created_at >= ?`, dayStart),
        newWeek: one(`select count(*) n from players where ${player} and created_at >= ?`, now - 7 * DAY),
        activeToday: activeSince(today),
        activeWeek: activeSince(daysAgo(6)),
        activeMonth: activeSince(daysAgo(29)),
        online: ctx.live.online,
        listed: one(`select count(*) n from players where ${player} and listed_at is not null`),
        banned: one(`select count(*) n from players where ${player} and banned_at is not null`),
      };
      // Back on their second day: a visit the day after they joined. On their seventh: any visit six or more
      // days after. Each over the players who have had that day.
      const joinedDay = "date(p.created_at / 1000, 'unixepoch')";
      const cohort = (from: number, to: number) =>
        one(`select count(*) n from players p where p.${player} and p.created_at >= ? and p.created_at < ?`, from, to);
      const day2Of = cohort(now - 30 * DAY, dayStart - DAY);
      const day7Of = cohort(now - 60 * DAY, dayStart - 6 * DAY);
      const day2 = one(
        `select count(*) n from players p where p.${player} and p.created_at >= ? and p.created_at < ? and exists
         (select 1 from visits v where v.player_id = p.id and v.day = date(${joinedDay}, '+1 day'))`,
        now - 30 * DAY,
        dayStart - DAY,
      );
      const day7 = one(
        `select count(*) n from players p where p.${player} and p.created_at >= ? and p.created_at < ? and exists
         (select 1 from visits v where v.player_id = p.id and v.day >= date(${joinedDay}, '+6 day'))`,
        now - 60 * DAY,
        dayStart - 6 * DAY,
      );
      const days: DayCount[] = Array.from({ length: 14 }, (_, i) => {
        const day = daysAgo(13 - i);
        const from = Date.parse(`${day}T00:00:00Z`);
        return {
          day,
          signUps: one(
            `select count(*) n from players where ${player} and created_at >= ? and created_at < ?`,
            from,
            from + DAY,
          ),
          active: one(
            `select count(*) n from visits v join players p on p.id = v.player_id and p.${player} where v.day = ?`,
            day,
          ),
        };
      });
      const moderation = {
        openReports: one('select count(*) n from reports where settled_at is null'),
        reported: one('select count(distinct target_id) n from reports where settled_at is null'),
        refusedToday: one('select count(*) n from mail_refused where at >= ?', dayStart),
        muted: one('select count(*) n from mail_mutes where until > ?', now),
        feedbackWeek: one('select count(*) n from feedback where at >= ?', now - 7 * DAY),
      };
      const season = seasonAt(now);
      const week = weekOf(now);
      const boss = ctx.realm.standing('', now, null);
      const work = season ? ctx.realmWorks.standing('', now) : null;
      const realm: AdminOverviewResponse['realm'] = {
        season: season ? { title: seasonView(now)!.title, endsAt: season.end } : null,
        boss: {
          name: realmName(realmBossIn(week).id),
          needed: boss.needed,
          strikes: boss.strikes,
          strikers: one('select count(*) n from realm_strikes where week = ?', week),
          fell: boss.fell,
        },
        work: work
          ? {
              name: realmWorkName(realmWorkIn(work.season)),
              needed: work.needed,
              given: work.given,
              givers: work.givers,
              done: work.given >= work.needed,
            }
          : null,
      };
      const pageSize = (db.prepare('pragma page_size').get() as { page_size: number }).page_size;
      const pages = (db.prepare('pragma page_count').get() as { page_count: number }).page_count;
      const server = {
        build: ctx.config.webDist ? buildOf(ctx.config.webDist) : null,
        startedAt,
        memoryMb: Math.round(process.memoryUsage().rss / 1_048_576),
        databaseMb: Math.round(((pageSize * pages) / 1_048_576) * 10) / 10,
        saves: one('select count(*) n from saves'),
        backups: backupsHealth(ctx.config.backupStatusDir, now),
        errorsDay: one("select count(*) n from telemetry where type = 'browserError' and at >= ?", now - DAY),
      };
      return {
        at: now,
        players,
        retention: { day2: pct(day2, day2Of), day2Of, day7: pct(day7, day7Of), day7Of },
        days,
        moderation,
        realm,
        server,
      } satisfies AdminOverviewResponse;
    },
    requireAdmin(ctx),
  );
}
