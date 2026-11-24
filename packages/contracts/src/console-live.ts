// The console's live operations and system (session 230): who is playing now and who joined last, a letter
// to every player from the keepers of the realm, and the server's own state (its build and health, the
// features switched on, the tables' sizes, the browser errors of the last day).
import { z } from 'zod';
import { PATHS } from './paths.ts';
import type { RouteContract } from './routes.ts';

/** A letter to every player: longer than a player's own (250), as an announcement may need. */
export const BROADCAST_MAX = 1000;
export const BroadcastRequest = z
  .object({
    text: z.string().trim().min(10).max(BROADCAST_MAX),
    /** How many players the admin was told it goes to: a count that has changed since is asked again. */
    to: z.number().int().min(0),
  })
  .strict();

const route = (r: RouteContract) => r;
export const CONSOLE_LIVE_ROUTES = {
  adminLive: route({
    id: 'adminLive',
    method: 'POST',
    path: PATHS.adminLive,
    auth: 'admin',
    input: null,
    example: null,
  }),
  adminBroadcast: route({
    id: 'adminBroadcast',
    method: 'POST',
    path: PATHS.adminBroadcast,
    auth: 'admin',
    input: BroadcastRequest,
    example: { text: 'The realm rests for an hour tonight at 22:00 while the keepers mend the roads.', to: 12 },
  }),
  adminSystem: route({
    id: 'adminSystem',
    method: 'POST',
    path: PATHS.adminSystem,
    auth: 'admin',
    input: null,
    example: null,
  }),
} satisfies Record<string, RouteContract>;

export interface LiveResponse {
  at: number;
  /** Players with a page open now, by name. */
  online: { id: string; name: string }[];
  /** The newest players, newest first. */
  joined: { id: string; name: string; createdAt: number }[];
  /** Players a letter to everyone goes to: everyone not banned. */
  reach: number;
  /** Letters to everyone already sent, newest first. */
  sent: { at: number; actor: string; count: number; text: string }[];
}
export type BroadcastResult = { ok: true; count: number } | { ok: false; reason: 'reachChanged'; reach: number };

export interface SystemResponse {
  at: number;
  build: string | null;
  startedAt: number;
  memoryMb: number;
  databaseMb: number;
  backups: 'fresh' | 'stale' | 'off';
  /** Every feature and whether it is switched on here. */
  features: { id: string; on: boolean }[];
  /** Rows in the tables that grow. */
  tables: { name: string; rows: number }[];
  /** Browser errors of the last day, newest first (by player name, or null for one signed out). */
  errors: { at: number; player: string | null; message: string; url: string }[];
}
