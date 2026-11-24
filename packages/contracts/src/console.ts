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

const PlayerId = z.string().uuid();
/** Why an admin changed a player's save, kept in the Audit log beside it. */
export const Reason = z.string().trim().min(3).max(200);
/** Most of anything given or taken at one press. */
export const GRANT_MOST = 1_000_000_000;
export const RecordQuery = z.object({ playerId: PlayerId }).strict();
export const GrantRequest = z
  .object({
    playerId: PlayerId,
    item: z.string().regex(/^[a-z][a-z0-9-]{0,63}$/),
    /** Given when above nought, taken when below. */
    count: z
      .number()
      .int()
      .min(-GRANT_MOST)
      .max(GRANT_MOST)
      .refine((n) => n !== 0),
    reason: Reason,
  })
  .strict();
export const XpRequest = z
  .object({
    playerId: PlayerId,
    skill: z.string().regex(/^[a-z][a-z0-9-]{0,31}$/),
    xp: z.number().int().min(1).max(200_000_000),
    reason: Reason,
  })
  .strict();
export const DeleteRequest = z.object({ playerId: PlayerId, name: z.string().min(1).max(64) }).strict();

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
  adminRecord: route({
    id: 'adminRecord',
    method: 'POST',
    path: PATHS.adminRecord,
    auth: 'admin',
    input: RecordQuery,
    example: { playerId: '00000000-0000-4000-8000-000000000000' },
  }),
  adminGrant: route({
    id: 'adminGrant',
    method: 'POST',
    path: PATHS.adminGrant,
    auth: 'admin',
    input: GrantRequest,
    example: { playerId: '00000000-0000-4000-8000-000000000000', item: 'gold', count: 1000, reason: 'Lost to a fault' },
  }),
  adminXp: route({
    id: 'adminXp',
    method: 'POST',
    path: PATHS.adminXp,
    auth: 'admin',
    input: XpRequest,
    example: { playerId: '00000000-0000-4000-8000-000000000000', skill: 'mining', xp: 500, reason: 'Lost to a fault' },
  }),
  adminSignOut: route({
    id: 'adminSignOut',
    method: 'POST',
    path: PATHS.adminSignOut,
    auth: 'admin',
    input: RecordQuery,
    example: { playerId: '00000000-0000-4000-8000-000000000000' },
  }),
  adminDelete: route({
    id: 'adminDelete',
    method: 'POST',
    path: PATHS.adminDelete,
    auth: 'admin',
    input: DeleteRequest,
    example: { playerId: '00000000-0000-4000-8000-000000000000', name: 'Rowan' },
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

/** A player's record in the console (session 229): who they are, how they stand, what they hold and do,
 *  their castle, and what admins have done to them. */
export interface RecordResponse {
  at: number;
  id: string;
  name: string;
  createdAt: number;
  bannedAt: number | null;
  /** The last day they came ("2026-11-24"), whether a page is open now, and browsers signed in. */
  seen: string | null;
  online: boolean;
  sessions: number;
  listed: boolean;
  mutedUntil: number | null;
  reports: { name: number; cheating: number };
  totalLevel: number;
  /** The most hours their fire burned in a day of the last two (session 156). */
  fireHours: number;
  gold: number;
  /** Kinds of item held, gold aside. */
  kinds: number;
  skills: { skill: string; name: string; level: number; xp: number }[];
  /** Each lane: what it does or did, in the game's words, and why it stopped. */
  lanes: { lane: string; doing: string | null; stopped: string | null }[];
  castle: { level: number; rating: number } | null;
  /** What admins have done to them, newest first. */
  history: AuditEntry[];
  /** Everything that can be given (gold first), by name, for the Grants form. */
  catalog: { id: string; name: string }[];
}
export type GrantResult = { ok: true; held: number } | { ok: false; reason: 'notEnough' | 'unknown' };
export type XpResult = { ok: true; xp: number; level: number } | { ok: false; reason: 'unknown' };
