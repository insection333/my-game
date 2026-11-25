// The console's closer look at a player (session 234): notes admins keep on a player for each other, the
// player's activity (the days they came, the browsers signed in, each of which can be signed out alone,
// and the notices the game sent them), and the directory and the log read a thousand rows at a time, for a file.
import { z } from 'zod';
import { PATHS } from './paths.ts';
import type { RouteContract } from './routes.ts';

const PlayerId = z.string().uuid();
/** The longest note an admin may keep on a player. */
export const NOTE_MAX = 500;
/** The most notes a record shows, newest first. */
export const NOTES_SHOWN = 50;
/** The days of play the Activity tab shows: twelve weeks. */
export const ACTIVITY_DAYS = 84;
/** Rows a page holds when the directory or the log is read for a file: larger than a page shown, and still
 *  short enough that no one read holds the server long (the console's load, session 233). The page reads
 *  them one after another, so players are answered between. */
export const FILE_PAGE = 1_000;
/** The most rows a file holds. */
export const FILE_MOST = 20_000;

export const NoteRequest = z.object({ playerId: PlayerId, text: z.string().trim().min(3).max(NOTE_MAX) }).strict();
export const NoteDeleteRequest = z.object({ playerId: PlayerId, noteId: z.number().int().positive() }).strict();
export const ActivityQuery = z.object({ playerId: PlayerId }).strict();
/** A browser signed in, named by the first characters of its session's hash (never the session itself). */
export const EndSessionRequest = z.object({ playerId: PlayerId, handle: z.string().regex(/^[0-9a-f]{16}$/) }).strict();

/** A note an admin keeps on a player, for the other admins; the player never sees it. */
export interface AdminNote {
  id: number;
  at: number;
  /** The admin who wrote it, by their name then; empty for an admin no longer of the realm. */
  actor: string;
  text: string;
}
export type NoteResult = { ok: true; note: AdminNote } | { ok: false; reason: 'repeated' };

export interface ActivityResponse {
  at: number;
  /** The days they came of the last `ACTIVITY_DAYS`, oldest first ("2026-11-24", UTC). */
  days: string[];
  /** The browsers signed in, the latest seen first. */
  sessions: { handle: string; createdAt: number; lastSeenAt: number; expiresAt: number; online: boolean }[];
  /** The last notices the game sent them, newest first, in the game's words. */
  notices: { at: number; text: string }[];
}

const route = (r: RouteContract) => r;
const example = '00000000-0000-4000-8000-000000000000';
export const CONSOLE_MORE_ROUTES = {
  adminNote: route({
    id: 'adminNote',
    method: 'POST',
    path: PATHS.adminNote,
    auth: 'admin',
    input: NoteRequest,
    example: { playerId: example, text: 'Asked about a lost sword on 24 Nov; gave it back.' },
  }),
  adminNoteDelete: route({
    id: 'adminNoteDelete',
    method: 'POST',
    path: PATHS.adminNoteDelete,
    auth: 'admin',
    input: NoteDeleteRequest,
    example: { playerId: example, noteId: 1 },
  }),
  adminActivity: route({
    id: 'adminActivity',
    method: 'POST',
    path: PATHS.adminActivity,
    auth: 'admin',
    input: ActivityQuery,
    example: { playerId: example },
  }),
  adminEndSession: route({
    id: 'adminEndSession',
    method: 'POST',
    path: PATHS.adminEndSession,
    auth: 'admin',
    input: EndSessionRequest,
    example: { playerId: example, handle: '0123456789abcdef' },
  }),
} satisfies Record<string, RouteContract>;
