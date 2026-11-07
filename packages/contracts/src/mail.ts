// Letters between players (session 45): short plain messages kept in each player's inbox, behind the bell.
// Sending is held to strict limits (a cooldown, ten players a day, 250 characters, no foul language), a
// player can block another from writing to them (and unblock them), and an admin can read the mail to keep
// it clean, as the terms of service say.
import { z } from 'zod';
import { PlayerName } from './fields.ts';
import { PATHS } from './paths.ts';
import type { Look, RouteContract } from './routes.ts';

/** The most a message may hold, and the most kept in an inbox (the oldest goes first). */
export const MAIL = { MAX_CHARS: 250, INBOX: 20, PLAYERS_A_DAY: 10, COOLDOWN_MS: 15_000 } as const;

export const SendMail = z.object({ to: PlayerName, body: z.string().min(1).max(1000) }).strict();
export const MailId = z.object({ id: z.number().int().positive() }).strict();
export const BlockPlayer = z.object({ name: PlayerName, blocked: z.boolean() }).strict();
export const AdminMailQuery = z
  .object({
    player: PlayerName.optional(),
    other: PlayerName.optional(),
    text: z.string().max(100).optional(),
    flagged: z.boolean(),
  })
  .strict();
export const AdminMailAction = z.object({ player: PlayerName, action: z.enum(['warn', 'mute', 'unmute']) }).strict();

/** The sender of the game's own letters (an admin's warning): not a player, so never answered or blocked. */
export const REALM = 'realm';

export interface Letter {
  id: number;
  /** The sender's name; empty for the game's own letters (`realm`). */
  from: string;
  realm: boolean;
  look: Look | null;
  body: string;
  at: number;
  read: boolean;
}
export interface InboxResponse {
  letters: Letter[];
  unread: number;
  /** The players you have blocked from writing to you. */
  blocked: string[];
  /** Until when you may not send (an admin's mute), or null. */
  mutedUntil: number | null;
}
/** Why a message was not sent, each said to its sender in words of its own. */
export const MAIL_REFUSALS = [
  'language',
  'noPlayer',
  'blocked',
  'muted',
  'cooldown',
  'tooManyPlayers',
  'self',
  'empty',
  'tooLong',
] as const;
export type MailRefusal = (typeof MAIL_REFUSALS)[number];
export type SendResult = { ok: true } | { ok: false; reason: MailRefusal };

export interface AdminLetter {
  id: number;
  /** The sender's name; empty for the game's own letters (a warning). */
  from: string;
  to: string;
  body: string;
  at: number;
  /** Written after its sender had a refused attempt that day (a try at getting round the filter). */
  flagged: boolean;
}
export interface AdminRefused {
  from: string;
  to: string;
  body: string;
  at: number;
}
export interface AdminMailResponse {
  letters: AdminLetter[];
  refused: AdminRefused[];
  /** Senders with refused attempts in the last day, most first. */
  watch: { name: string; refused: number; muted: boolean }[];
}

const route = (r: RouteContract) => r;
export const MAIL_ROUTES = {
  mailInbox: route({
    id: 'mailInbox',
    method: 'POST',
    path: PATHS.mailInbox,
    auth: 'player',
    input: null,
    example: null,
  }),
  mailSend: route({
    id: 'mailSend',
    method: 'POST',
    path: PATHS.mailSend,
    auth: 'player',
    input: SendMail,
    example: { to: 'Rowan', body: 'Well fought at the walls.' },
  }),
  mailRead: route({ id: 'mailRead', method: 'POST', path: PATHS.mailRead, auth: 'player', input: null, example: null }),
  mailDelete: route({
    id: 'mailDelete',
    method: 'POST',
    path: PATHS.mailDelete,
    auth: 'player',
    input: MailId,
    example: { id: 1 },
  }),
  mailBlock: route({
    id: 'mailBlock',
    method: 'POST',
    path: PATHS.mailBlock,
    auth: 'player',
    input: BlockPlayer,
    example: { name: 'Rowan', blocked: true },
  }),
  adminMail: route({
    id: 'adminMail',
    method: 'POST',
    path: PATHS.adminMail,
    auth: 'admin',
    input: AdminMailQuery,
    example: { flagged: true },
  }),
  adminMailAction: route({
    id: 'adminMailAction',
    method: 'POST',
    path: PATHS.adminMailAction,
    auth: 'admin',
    input: AdminMailAction,
    example: { player: 'Rowan', action: 'warn' },
  }),
} satisfies Record<string, RouteContract>;
