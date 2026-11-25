// The console's directory of players (session 228): every player, a page of 50 at a time, found by any part
// of their name, filtered (new this week, active this week, away a week or more, banned, reported, muted)
// and sorted (newest, by name, by total level, by the day last seen). Since session 236 every player's row is
// read in one query and kept for half a minute, shared by every admin, every page, filter, sort and file,
// and made afresh at once when an admin acts or an account goes: at 10,000 players a filter or a sort read
// every row's last visit, reports and level again for each page (40 to 52 ms), and a file read them again for
// each thousand, its pages from different moments.
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
import { memo, onChange } from './memo.ts';

const DAY = 86_400_000;
const dayOf = (at: number) => new Date(at).toISOString().slice(0, 10);
/** How long the rows stand, shared: the page says the time they stand at. */
export const DIRECTORY_MS = 30_000;

interface Row extends DirectoryRow {
  key: string;
  /** Muted until, even past (the row's own `mutedUntil` is for now). */
  mute: number | null;
}

const FILTERS: Record<DirectoryFilter, (r: Row, now: number) => boolean> = {
  all: () => true,
  new: (r, now) => r.createdAt >= now - 7 * DAY,
  active: (r, now) => r.seen !== null && r.seen >= dayOf(now - 6 * DAY),
  away: (r, now) => r.seen === null || r.seen < dayOf(now - 6 * DAY),
  banned: (r) => r.bannedAt !== null,
  reported: (r) => r.openReports > 0,
  muted: (r, now) => r.mute !== null && r.mute > now,
};
const byName = (a: Row, b: Row) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
const SORTS: Record<DirectorySort, (a: Row, b: Row) => number> = {
  joined: (a, b) => b.createdAt - a.createdAt || byName(a, b),
  name: byName,
  level: (a, b) => b.totalLevel - a.totalLevel || byName(a, b),
  seen: (a, b) =>
    a.seen === b.seen ? byName(a, b) : a.seen === null ? 1 : b.seen === null ? -1 : a.seen < b.seen ? 1 : -1,
};

export function directoryRoutes(app: FastifyInstance, ctx: Ctx): void {
  // Each player with their last day (kept on their row by a trigger on visits: a lookup of each player's
  // visits held 10,000 players 20 ms), and the levels, reports and mutes each read once in a range of their
  // own (a lookup a player for the level held them another 20).
  const db = ctx.store.sqlite;
  const all = db.prepare(`
    select id, name, name_key, created_at, banned_at, listed_at, seen_day as seen
    from players where role = 'player'`);
  const levels = db.prepare('select player_id id, level n from hiscores where skill = ?');
  const reported = db.prepare(
    'select target_id id, count(*) n from reports where settled_at is null group by target_id',
  );
  const mutes = db.prepare('select player_id id, until n from mail_mutes');
  const mapOf = (rows: unknown[]) => new Map((rows as { id: string; n: number }[]).map((r) => [r.id, r.n]));
  const rows = memo(ctx.config.now, DIRECTORY_MS, () => {
    const level = mapOf(levels.all(TOTAL));
    const reports = mapOf(reported.all());
    const muted = mapOf(mutes.all());
    return (
      all.all() as {
        id: string;
        name: string;
        name_key: string;
        created_at: number;
        banned_at: number | null;
        listed_at: number | null;
        seen: string | null;
      }[]
    ).map((r): Row => ({
      id: r.id,
      name: r.name,
      key: r.name_key,
      createdAt: r.created_at,
      seen: r.seen,
      // A player with no row on the hiscores yet (no XP written) is read from their save.
      totalLevel: level.get(r.id) || totalLevelOf(ctx, r.id),
      bannedAt: r.banned_at,
      listed: r.listed_at !== null,
      openReports: reports.get(r.id) ?? 0,
      mutedUntil: null,
      mute: muted.get(r.id) ?? null,
    }));
  });
  onChange(ctx, rows.forget);

  contractRoute<{ query: string; filter: DirectoryFilter; sort: DirectorySort; page: number; file?: true }>(
    app,
    ROUTES.adminDirectory,
    ({ input }) => {
      const now = ctx.config.now();
      // Matched anywhere in the name, case aside.
      const q = nameKey(input.query.trim());
      const found = rows()
        .filter((r) => (!q || r.key.includes(q)) && FILTERS[input.filter](r, now))
        .sort(SORTS[input.sort]);
      // A larger page for a file (session 234).
      const size = input.file ? FILE_PAGE : DIRECTORY_PAGE;
      const out = found.slice(input.page * size, (input.page + 1) * size).map((r): DirectoryRow => ({
        id: r.id,
        name: r.name,
        createdAt: r.createdAt,
        seen: r.seen,
        totalLevel: r.totalLevel,
        bannedAt: r.bannedAt,
        listed: r.listed,
        openReports: r.openReports,
        mutedUntil: r.mute !== null && r.mute > now ? r.mute : null,
      }));
      return { at: now, rows: out, total: found.length } satisfies DirectoryResponse;
    },
    requireAdmin(ctx),
  );
}
