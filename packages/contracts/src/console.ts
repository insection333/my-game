// The admin console's own routes (sessions 228 onward): the overview of the realm, the directory of
// players, and the log of what admins did. Every admin route is the console's; these are the ones it
// added beside the admin page's (routes.ts, moderation.ts, mail.ts, closed-test.ts).
import { z } from 'zod';
import { PATHS } from './paths.ts';
import type { RouteContract } from './routes.ts';

export const DIRECTORY_FILTERS = ['all', 'new', 'active', 'away', 'banned', 'reported', 'muted'] as const;
export type DirectoryFilter = (typeof DIRECTORY_FILTERS)[number];
export const DIRECTORY_SORTS = ['joined', 'name', 'level', 'seen'] as const;
export type DirectorySort = (typeof DIRECTORY_SORTS)[number];
/** Players on one page of the directory. */
export const DIRECTORY_PAGE = 50;

export const DirectoryQuery = z
  .object({
    query: z.string().max(64),
    filter: z.enum(DIRECTORY_FILTERS),
    sort: z.enum(DIRECTORY_SORTS),
    page: z.number().int().min(0).max(10_000),
  })
  .strict();

export const AUDIT_PAGE = 100;
export const AuditQuery = z
  .object({
    /** Words in the action, the admin's name or the player's name. */
    query: z.string().max(64),
    before: z.number().int().positive().nullable(),
  })
  .strict();

const route = (r: RouteContract) => r;
export const CONSOLE_ROUTES = {
  adminOverview: route({
    id: 'adminOverview',
    method: 'POST',
    path: PATHS.adminOverview,
    auth: 'admin',
    input: null,
    example: null,
  }),
  adminDirectory: route({
    id: 'adminDirectory',
    method: 'POST',
    path: PATHS.adminDirectory,
    auth: 'admin',
    input: DirectoryQuery,
    example: { query: '', filter: 'all', sort: 'joined', page: 0 },
  }),
  adminAudit: route({
    id: 'adminAudit',
    method: 'POST',
    path: PATHS.adminAudit,
    auth: 'admin',
    input: AuditQuery,
    example: { query: '', before: null },
  }),
} satisfies Record<string, RouteContract>;

/** A day's count, oldest first (UTC days, "2026-11-24"). */
export interface DayCount {
  day: string;
  signUps: number;
  active: number;
}

export interface AdminOverviewResponse {
  at: number;
  players: {
    total: number;
    newToday: number;
    newWeek: number;
    activeToday: number;
    activeWeek: number;
    activeMonth: number;
    online: number;
    listed: number;
    banned: number;
  };
  /** Of the players who joined from 2 to 30 days ago, the share back on their second day; of those who
   *  joined from 7 to 60 days ago, the share who came on their seventh day or later. Null with none. */
  retention: { day2: number | null; day2Of: number; day7: number | null; day7Of: number };
  /** The last 14 days. */
  days: DayCount[];
  moderation: { openReports: number; reported: number; refusedToday: number; muted: number; feedbackWeek: number };
  realm: {
    /** "Season 1: The Greenwood", and when it ends; null before the first season. */
    season: { title: string; endsAt: number } | null;
    /** The realm's boss of the week: its name, the strikes it asks and has, by how many. */
    boss: { name: string; needed: number; strikes: number; strikers: number; fell: boolean } | null;
    /** The season's work: its name, what it asks and has, by how many givers. */
    work: { name: string; needed: number; given: number; givers: number; done: boolean } | null;
  };
  server: {
    build: string | null;
    startedAt: number;
    memoryMb: number;
    databaseMb: number;
    saves: number;
    backups: 'fresh' | 'stale' | 'off';
    errorsDay: number;
  };
}

export interface DirectoryRow {
  id: string;
  name: string;
  createdAt: number;
  /** The last day they came, "2026-11-24", or null. */
  seen: string | null;
  totalLevel: number;
  bannedAt: number | null;
  listed: boolean;
  openReports: number;
  mutedUntil: number | null;
}
export interface DirectoryResponse {
  /** The server's time as it answered. */
  at: number;
  rows: DirectoryRow[];
  /** How many players match, over every page. */
  total: number;
}

export interface AuditEntry {
  id: number;
  at: number;
  /** Who did it (their name then), and to whom (null for no one). */
  actor: string;
  action: string;
  target: string | null;
  targetId: string | null;
  /** What changed, as values the console says in its own words (a name before and after). */
  detail: Record<string, string | number> | null;
}
export interface AuditResponse {
  entries: AuditEntry[];
  /** The id to ask `before` for the next page, or null at the end. */
  more: number | null;
}
