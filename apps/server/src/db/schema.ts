// The server's tables, beside the kernel's saves in the same SQLite file. Change these, then run
// `pnpm --filter @idle-clash/server db:generate`; migrations apply in order when the server starts.
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const players = sqliteTable(
  'players',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    /** The name in lower case: names are unique regardless of case. */
    nameKey: text('name_key').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: integer('created_at').notNull(),
    /** Set only once transactional email is switched on and the player adds one. */
    email: text('email'),
    emailConfirmedAt: integer('email_confirmed_at'),
    bannedAt: integer('banned_at'),
  },
  (t) => [index('players_email').on(t.email)],
);

/** A signed-in browser. Only the SHA-256 of the token is stored; the token lives in the cookie. */
export const sessions = sqliteTable(
  'sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    playerId: text('player_id').notNull(),
    createdAt: integer('created_at').notNull(),
    expiresAt: integer('expires_at').notNull(),
    lastSeenAt: integer('last_seen_at').notNull(),
  },
  (t) => [index('sessions_player').on(t.playerId)],
);

/** One-use tokens sent by email: to confirm an address or to reset a password. */
export const emailTokens = sqliteTable('email_tokens', {
  tokenHash: text('token_hash').primaryKey(),
  playerId: text('player_id').notNull(),
  purpose: text('purpose', { enum: ['confirm', 'reset'] }).notNull(),
  email: text('email'),
  createdAt: integer('created_at').notNull(),
  expiresAt: integer('expires_at').notNull(),
  usedAt: integer('used_at'),
});

/** Telemetry: notable events, sessions and stop reasons, by player id only (no personal details). */
export const telemetry = sqliteTable(
  'telemetry',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    playerId: text('player_id'),
    type: text('type').notNull(),
    at: integer('at').notNull(),
    data: text('data'),
  },
  (t) => [index('telemetry_type_at').on(t.type, t.at)],
);
