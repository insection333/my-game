// The server's tables from session 171 onward, re-exported by schema.ts (which drizzle-kit reads): notices
// while away and the realm's boss of the week.
import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** The server's own settings, made once and kept (session 171: the keys that sign its notices). */
export const serverSettings = sqliteTable('server_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

/** Where a player's notices while away go (session 171): one row for each browser they switched them on
 *  in, with the time zone it was in, so a notice never comes at night. */
export const pushSubs = sqliteTable(
  'push_subs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    playerId: text('player_id').notNull(),
    endpoint: text('endpoint').notNull().unique(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    tz: text('tz').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [index('push_subs_player').on(t.playerId)],
);

/** Notices waiting to be sent to a player who is away (session 171): a lane foreseen to stop, the lanes
 *  about to rest, a siege. Dropped when the player comes back; sent by the sweep once due. */
export const pushDue = sqliteTable(
  'push_due',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    playerId: text('player_id').notNull(),
    kind: text('kind').notNull(),
    at: integer('at').notNull(),
    data: text('data').notNull(),
  },
  (t) => [index('push_due_at').on(t.at), index('push_due_player').on(t.playerId)],
);

/** How many notices a player was sent on a day of their own clock (session 171): three at most. */
export const pushSent = sqliteTable(
  'push_sent',
  {
    playerId: text('player_id').notNull(),
    day: text('day').notNull(),
    count: integer('count').notNull(),
  },
  (t) => [primaryKey({ columns: [t.playerId, t.day] })],
);

/** The realm's boss of the week (session 174): how many strikes it needs and when it fell. */
export const realmWeeks = sqliteTable('realm_weeks', {
  week: text('week').primaryKey(),
  needed: integer('needed').notNull(),
  fellAt: integer('fell_at'),
});

/** Each player's strikes on the realm's boss in a week, and when their first came (ties on the week's
 *  ladder go to whoever struck first). */
export const realmStrikes = sqliteTable(
  'realm_strikes',
  {
    week: text('week').notNull(),
    playerId: text('player_id').notNull(),
    strikes: integer('strikes').notNull(),
    firstAt: integer('first_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.week, t.playerId] }), index('realm_strikes_week').on(t.week, t.strikes)],
);

/** The realm's work of a season (session 218): the worth it asks (set at its first gift, from the givers of the
 *  season before) and when it was finished. */
export const realmWorkSeasons = sqliteTable('realm_work_seasons', {
  season: integer('season').primaryKey(),
  needed: integer('needed').notNull(),
  doneAt: integer('done_at'),
});

/** Each player's gifts to a season's work, all told, and when their first came. */
export const realmWorkGifts = sqliteTable(
  'realm_work_gifts',
  {
    season: integer('season').notNull(),
    playerId: text('player_id').notNull(),
    worth: integer('worth').notNull(),
    firstAt: integer('first_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.season, t.playerId] })],
);

/** What admins did (session 228), for the console's Audit log: every action on a player or the realm, by
 *  whom, with what it changed. Names are kept as they were then, so the log reads after a rename. */
export const adminActions = sqliteTable(
  'admin_actions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    at: integer('at').notNull(),
    actorId: text('actor_id').notNull(),
    actorName: text('actor_name').notNull(),
    action: text('action').notNull(),
    targetId: text('target_id'),
    targetName: text('target_name'),
    detail: text('detail'),
  },
  (t) => [index('admin_actions_at').on(t.at), index('admin_actions_target').on(t.targetId)],
);

/** Admins' notes on a player (session 234): private to admins, kept in the record, each in the Audit log;
 *  they go with the player's account, and a deleted admin's notes stay unnamed. */
export const adminNotes = sqliteTable(
  'admin_notes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    playerId: text('player_id').notNull(),
    at: integer('at').notNull(),
    actorId: text('actor_id').notNull(),
    actorName: text('actor_name').notNull(),
    text: text('text').notNull(),
  },
  (t) => [index('admin_notes_player').on(t.playerId, t.at)],
);

/** Cheers (session 254): one player's cheer to another, by the UTC day, for the limits (three a day, one a
 *  friend a day). Kept two days. */
export const cheers = sqliteTable(
  'cheers',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    fromId: text('from_id').notNull(),
    toId: text('to_id').notNull(),
    at: integer('at').notNull(),
    day: text('day').notNull(),
  },
  (t) => [index('cheers_from_day').on(t.fromId, t.day), index('cheers_to').on(t.toId)],
);

/** Gifts (session 254): a supply cache one player sends another once a day, waiting until opened. Opened or
 *  not, each is kept a month for the limits and then let go. */
export const gifts = sqliteTable(
  'gifts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    fromId: text('from_id').notNull(),
    toId: text('to_id').notNull(),
    at: integer('at').notNull(),
    day: text('day').notNull(),
    openedAt: integer('opened_at'),
  },
  (t) => [index('gifts_from_day').on(t.fromId, t.day), index('gifts_to').on(t.toId, t.day), index('gifts_at').on(t.at)],
);
