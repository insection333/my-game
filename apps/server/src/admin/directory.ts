// The console's directory of players (session 228): every player, a page of 50 at a time, found by any part
// of their name, filtered (new this week, active this week, away a week or more, banned, reported, muted)
// and sorted (newest, by name, by total level, by the day last seen). One query a page, so it holds at the
// size the realm will grow to.
import {
  DIRECTORY_PAGE,
  FILE_PAGE,
  nameKey,
  ROUTES,
  type DirectoryFilter,
  type DirectoryResponse,
  type DirectoryRow,
  type DirectorySort,
} from '@idle-clash/contracts';
import type { FastifyInstance } from 'fastify';
import { requireAdmin } from '../auth/routes.ts';
import type { Ctx } from '../context.ts';
import { TOTAL } from '../game/hiscores.ts';
import { totalLevelOf } from '../game/standing.ts';
import { contractRoute } from '../http.ts';

const DAY = 86_400_000;
const dayOf = (at: number) => new Date(at).toISOString().slice(0, 10);

const FILTERS: Record<DirectoryFilter, string> = {
  all: '1',
  new: 'p.created_at >= @week',
  active: 'seen >= @weekDay',
  away: '(seen is null or seen < @weekDay)',
  banned: 'p.banned_at is not null',
  reported: 'reports > 0',
  muted: 'muted_until > @now',
};
const SORTS: Record<DirectorySort, string> = {
  joined: 'p.created_at desc',
  name: 'p.name_key asc',
  level: 'level desc, p.name_key asc',
  seen: 'seen is null, seen desc, p.name_key asc',
};

export function directoryRoutes(app: FastifyInstance, ctx: Ctx): void {
  contractRoute<{ query: string; filter: DirectoryFilter; sort: DirectorySort; page: number; file?: true }>(
    app,
    ROUTES.adminDirectory,
    ({ input }) => {
      const now = ctx.config.now();
      // Matched anywhere in the name, case aside; % and _ in the query are taken literally.
      const pattern = `%${nameKey(input.query.trim()).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      const params = { pattern, total: TOTAL, now, week: now - 7 * DAY, weekDay: dayOf(now - 6 * DAY) };
      const rows = `
        select p.id, p.name, p.created_at, p.banned_at, p.listed_at, p.name_key,
          coalesce((select h.level from hiscores h where h.player_id = p.id and h.skill = @total), 0) as level,
          (select max(v.day) from visits v where v.player_id = p.id) as seen,
          (select count(*) from reports r where r.target_id = p.id and r.settled_at is null) as reports,
          (select m.until from mail_mutes m where m.player_id = p.id) as muted_until
        from players p
        where p.role = 'player' and p.name_key like @pattern escape '\\'`;
      const filtered = `select * from (${rows}) p where ${FILTERS[input.filter]}`;
      const db = ctx.store.sqlite;
      const size = input.file ? FILE_PAGE : DIRECTORY_PAGE;
      const total = (db.prepare(`select count(*) n from (${filtered})`).get(params) as { n: number }).n;
      const page = db
        .prepare(`${filtered} order by ${SORTS[input.sort]} limit @limit offset @offset`)
        // A larger page for a file (session 234).
        .all({ ...params, limit: size, offset: input.page * size }) as {
        id: string;
        name: string;
        created_at: number;
        banned_at: number | null;
        listed_at: number | null;
        level: number;
        seen: string | null;
        reports: number;
        muted_until: number | null;
      }[];
      const out: DirectoryRow[] = page.map((r) => ({
        id: r.id,
        name: r.name,
        createdAt: r.created_at,
        seen: r.seen,
        // A player with no row on the hiscores yet (no XP written) is read from their save.
        totalLevel: r.level || totalLevelOf(ctx, r.id),
        bannedAt: r.banned_at,
        listed: r.listed_at !== null,
        openReports: r.reports,
        mutedUntil: r.muted_until !== null && r.muted_until > now ? r.muted_until : null,
      }));
      return { at: now, rows: out, total } satisfies DirectoryResponse;
    },
    requireAdmin(ctx),
  );
}
