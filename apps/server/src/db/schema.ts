// The server's tables, beside the kernel's saves in the same SQLite file. Change these, then run
// `pnpm --filter @idle-clash/server db:generate`; migrations apply in order when the server starts.
import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const players = sqliteTable(
  'players',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    /** The name in lower case: names are unique regardless of case. */
    nameKey: text('name_key').notNull().unique(),
    /** How the name looks at a glance (contracts' nameLook): no two players share it. */
    nameLook: text('name_look').notNull().default(''),
    passwordHash: text('password_hash').notNull(),
    createdAt: integer('created_at').notNull(),
    /** Set only once transactional email is switched on and the player adds one. */
    email: text('email'),
    emailConfirmedAt: integer('email_confirmed_at'),
    bannedAt: integer('banned_at'),
    /** The honours shown beside the name on the hiscores (session 15): a title's id, a banner's. */
    title: text('title'),
    banner: text('banner'),
  },
  (t) => [index('players_email').on(t.email), index('players_look').on(t.nameLook)],
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
  (t) => [index('telemetry_type_at').on(t.type, t.at), index('telemetry_at').on(t.at)],
);

/** The notices tray: each player's notable events and lane stops, newest kept (the last 100). */
export const notices = sqliteTable(
  'notices',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    playerId: text('player_id').notNull(),
    at: integer('at').notNull(),
    /** The event, as the kernel announced it. */
    data: text('data').notNull(),
  },
  (t) => [index('notices_player_at').on(t.playerId, t.at)],
);

/** Hiscores: each player's XP and level in every skill and in total ('total'), kept as saves change. */
export const hiscores = sqliteTable(
  'hiscores',
  {
    playerId: text('player_id').notNull(),
    skill: text('skill').notNull(),
    level: integer('level').notNull(),
    xp: integer('xp').notNull(),
    /** Milestones claimed, shown on the entry (the total row only). */
    milestones: integer('milestones').notNull().default(0),
    /** When this XP was first reached: ties go to whoever got there first. */
    reachedAt: integer('reached_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.playerId, t.skill] }), index('hiscores_skill_xp').on(t.skill, t.xp)],
);

/** Feedback a player sends from Settings: what they wrote and the page they were on. */
export const feedback = sqliteTable(
  'feedback',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    playerId: text('player_id').notNull(),
    at: integer('at').notNull(),
    page: text('page').notNull(),
    text: text('text').notNull(),
  },
  (t) => [index('feedback_at').on(t.at)],
);

/** The days each player came to the game (UTC, 2026-10-28): the closed test's "back on day two". */
export const visits = sqliteTable(
  'visits',
  {
    playerId: text('player_id').notNull(),
    day: text('day').notNull(),
  },
  (t) => [primaryKey({ columns: [t.playerId, t.day] })],
);
