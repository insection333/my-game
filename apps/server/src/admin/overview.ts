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
import { memo, statements } from './memo.ts';
import type { Pulse } from './pulse.ts';

const DAY = 86_400_000;
const dayOf = (at: number) => new Date(at).toISOString().slice(0, 10);
const pct = (part: number, of: number) => (of ? Math.round((part / of) * 100) : null);

/** The Overview's figures stand for this long, shared by every admin (session 233): its page reads itself
 *  again every half minute, and each read made afresh walked the realm's visits. */
export const OVERVIEW_MS = 30_000;

export function overviewRoutes(app: FastifyInstance, ctx: Ctx, pulse: Pulse): void {
  const startedAt = ctx.config.now();
  const db = ctx.store.sqlite;
  const st = statements(db);
  const one = (q: string, ...args: unknown[]) => (st(q).get(...args) as { n: number | null }).n ?? 0;
  const read = memo(ctx.config.now, OVERVIEW_MS, () => overviewOf());
  contractRoute(app, ROUTES.adminOverview, () => read(), requireAdmin(ctx));

  function overviewOf(): AdminOverviewResponse {
    const now = ctx.config.now();
    const today = dayOf(now);
    const dayStart = Date.parse(`${today}T00:00:00Z`);
    const player = "role = 'player'";
    const daysAgo = (n: number) => dayOf(now - n * DAY);
    // Who came today, this week and this month: for each player, whether a visit stands on or after each
    // day, found by the visits' own key (player, day). Counting the month's visits apart held the server
    // 23 ms on a realm of 3,000.
    const came = st(
      `select coalesce(sum(exists(select 1 from visits v where v.player_id = p.id and v.day >= @today)), 0) today,
         coalesce(sum(exists(select 1 from visits v where v.player_id = p.id and v.day >= @week)), 0) week,
         coalesce(sum(exists(select 1 from visits v where v.player_id = p.id and v.day >= @month)), 0) month
       from players p where p.${player}`,
    ).get({ today, week: daysAgo(6), month: daysAgo(29) }) as { today: number; week: number; month: number };
    const players = {
      total: one(`select count(*) n from players where ${player}`),
      newToday: one(`select count(*) n from players where ${player} and created_at >= ?`, dayStart),
      newWeek: one(`select count(*) n from players where ${player} and created_at >= ?`, now - 7 * DAY),
      activeToday: came.today,
      activeWeek: came.week,
      activeMonth: came.month,
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
    // The fortnight, each a count by its day: two grouped queries where there were twenty-eight.
    const from = daysAgo(13);
    const byDay = (rows: { day: string; n: number }[]) => new Map(rows.map((r) => [r.day, r.n]));
    const joined = byDay(
      st(
        `select date(created_at / 1000, 'unixepoch') day, count(*) n from players
           where ${player} and created_at >= ? group by day`,
      ).all(Date.parse(`${from}T00:00:00Z`)) as { day: string; n: number }[],
    );
    const visited = byDay(
      st('select day, count(*) n from visits where day >= ? group by day').all(from) as { day: string; n: number }[],
    );
    const days: DayCount[] = Array.from({ length: 14 }, (_, i) => {
      const day = daysAgo(13 - i);
      return { day, signUps: joined.get(day) ?? 0, active: visited.get(day) ?? 0 };
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
    const pageSize = (st('pragma page_size').get() as { page_size: number }).page_size;
    const pages = (st('pragma page_count').get() as { page_count: number }).page_count;
    const server = {
      build: ctx.config.webDist ? buildOf(ctx.config.webDist) : null,
      startedAt,
      memoryMb: Math.round(process.memoryUsage().rss / 1_048_576),
      databaseMb: Math.round(((pageSize * pages) / 1_048_576) * 10) / 10,
      saves: one('select count(*) n from saves'),
      backups: backupsHealth(ctx.config.backupStatusDir, now),
      errorsDay: one("select count(*) n from telemetry where type = 'browserError' and at >= ?", now - DAY),
      cpuPct: pulse.hour.at(-1)?.cpuPct ?? null,
    };
    return {
      at: now,
      players,
      retention: { day2: pct(day2, day2Of), day2Of, day7: pct(day7, day7Of), day7Of },
      days,
      moderation,
      realm,
      server,
    };
  }
}
