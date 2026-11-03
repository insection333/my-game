// The server's tables, beside the kernel's saves in the same SQLite file. Change these, then run
// `pnpm --filter @idle-clash/server db:generate`; migrations apply in order when the server starts.
import { sql } from 'drizzle-orm';
import { index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

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
    /** The hiscores show a player once they have played a while (session 20): the time of their first
     *  action, and when an action came half an hour or more after it. */
    firstActAt: integer('first_act_at'),
    listedAt: integer('listed_at'),
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
  (t) => [
    primaryKey({ columns: [t.playerId, t.skill] }),
    index('hiscores_skill_xp').on(t.skill, t.xp),
    // A ladder in its order (session 37), so its top rows are read from the top, not sorted from all.
    index('hiscores_rank').on(t.skill, sql`${t.level} desc`, sql`${t.xp} desc`, t.reachedAt),
  ],
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

// Castle Clash (sessions 28 onward, docs/castle-clash/): each player's castle in one row, the war chest
// in one row, and each player's last 20 reports. A siege or a spy mission reads and writes exactly two
// castle rows, in ascending player id, inside one transaction (DESIGN.md section 3).

/** A player's castle: every level, timer and bounded collection, made when they first open Castle
 *  Clash. Times are epoch milliseconds (UTC); shares are whole percents summing to 100. */
export const playerBastions = sqliteTable(
  'player_bastions',
  {
    userId: text('user_id').primaryKey(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    // Action points and the daily Call to arms (SPEC.md section 2).
    activeAp: real('active_ap').notNull().default(60),
    lastApSyncAt: integer('last_ap_sync_at').notNull(),
    lastCtaDateUtc: text('last_cta_date_utc'),
    streakAtLastCta: integer('streak_at_last_cta').notNull().default(0),
    // The treasury and its edict (section 3).
    bastionTreasury: integer('bastion_treasury').notNull().default(0),
    edict: text('edict'),
    lastUpkeepAt: integer('last_upkeep_at').notNull(),
    payFromTreasury: integer('pay_from_treasury').notNull().default(0),
    // Buildings and units, each from level 1.
    castleWallsLevel: integer('castle_walls_level').notNull().default(1),
    deepVaultLevel: integer('deep_vault_level').notNull().default(1),
    watchtowerLevel: integer('watchtower_level').notNull().default(1),
    spyGuildLevel: integer('spy_guild_level').notNull().default(1),
    vanguardLevel: integer('vanguard_level').notNull().default(1),
    outridersLevel: integer('outriders_level').notNull().default(1),
    siegeLevel: integer('siege_level').notNull().default(1),
    // Drilling: each unit's XP towards its asymptotic bonus (section 5).
    vanguardDrillXp: real('vanguard_drill_xp').notNull().default(0),
    outridersDrillXp: real('outriders_drill_xp').notNull().default(0),
    siegeDrillXp: real('siege_drill_xp').notNull().default(0),
    // War College: four trees' ranks.
    techLogistics: integer('tech_logistics').notNull().default(0),
    techSiegecraft: integer('tech_siegecraft').notNull().default(0),
    techFortification: integer('tech_fortification').notNull().default(0),
    techEspionage: integer('tech_espionage').notNull().default(0),
    // Formations (section 4B): the attack's, set freely; the garrison's, changed at a cost and a cooldown.
    offVPct: integer('off_v_pct').notNull().default(34),
    offOPct: integer('off_o_pct').notNull().default(33),
    offSPct: integer('off_s_pct').notNull().default(33),
    defVPct: integer('def_v_pct').notNull().default(34),
    defOPct: integer('def_o_pct').notNull().default(33),
    defSPct: integer('def_s_pct').notNull().default(33),
    activeTrap: text('active_trap'),
    castellanDoctrine: text('castellan_doctrine'),
    defenseChangedAt: integer('defense_changed_at'),
    // Being scouted pins the garrison for 15 minutes and the treasury for 30 (DESIGN.md section 5.1).
    reconLockdownUntilUtc: integer('recon_lockdown_until_utc'),
    withdrawLockdownUntilUtc: integer('withdraw_lockdown_until_utc'),
    // Shields, vigilance, walls and the infirmary (section 4E).
    shieldUntilUtc: integer('shield_until_utc').notNull(),
    wallIntegrity: real('wall_integrity').notNull().default(100),
    infirmaryPct: real('infirmary_pct').notNull().default(0),
    recoverySyncedAt: integer('recovery_synced_at').notNull(),
    /** Times of the genuine sieges received in the last 12 hours (at most 3). */
    genuineReceived: text('genuine_received').notNull().default('[]'),
    // Sieges launched today, for fatigue.
    siegesDayUtc: text('sieges_day_utc'),
    siegesToday: integer('sieges_today').notNull().default(0),
    // Ratings, marks and the endless sinks.
    bastionRating: integer('bastion_rating').notNull().default(0),
    warMarks: integer('war_marks').notNull().default(0),
    warMarksEarned: integer('war_marks_earned').notNull().default(0),
    excavationDepth: integer('excavation_depth').notNull().default(0),
    incursionTier: integer('incursion_tier').notNull().default(1),
    /** No longer read: a fortress's garrison is known without scouting since session 40. */
    incursionScoutedTier: integer('incursion_scouted_tier').notNull().default(0),
    /** Days all five of the day's strongholds fell (session 38). */
    routs: integer('routs').notNull().default(0),
    /** The orders of the day (session 40), as JSON, or null before the first. */
    orders: text('orders').notNull().default('null'),
    // Bounded collections (JSON, at most 20 entries each).
    relics: text('relics').notNull().default('{}'),
    relicTempers: text('relic_tempers').notNull().default('{}'),
    equippedRelics: text('equipped_relics').notNull().default('[]'),
    activeDebuffs: text('active_debuffs').notNull().default('[]'),
    debuffImmunities: text('debuff_immunities').notNull().default('{}'),
    pairLimits: text('pair_limits').notNull().default('[]'),
  },
  (t) => [index('idx_bastion_matchmaking').on(t.bastionRating, t.shieldUntilUtc)],
);

/** The realm's one row (id 1): the war chest, fed only by burns, from which mercenary bounties are paid. */
export const bastionGlobalState = sqliteTable('bastion_global_state', {
  id: integer('id').primaryKey(),
  warChestReserveGold: integer('war_chest_reserve_gold').notNull().default(0),
  /** All gold destroyed by Castle Clash, for the admin's view of the economy. */
  goldDestroyed: integer('gold_destroyed').notNull().default(0),
});

/** Each player's reports (sieges, spy missions, incursions), the newest 20 kept. Players are named by
 *  id inside `data` and resolved when read, so a deleted account leaves no name behind. */
export const bastionLogs = sqliteTable(
  'bastion_logs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: text('user_id').notNull(),
    createdAt: integer('created_at').notNull(),
    kind: text('kind').notNull(),
    data: text('data').notNull(),
  },
  (t) => [index('bastion_logs_user_at').on(t.userId, t.createdAt)],
);

/** A player's report of another (session 39): an offensive name, or cheating and abuse. No words of the
 *  reporter's own, so nothing here can carry abuse itself. One per reporter, target and reason; a report
 *  made again after it was settled opens it again. Whether the reporter was listed when they reported
 *  weighs it in the admin's queue (a crowd of new accounts counts for little). */
export const reports = sqliteTable(
  'reports',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    reporterId: text('reporter_id').notNull(),
    targetId: text('target_id').notNull(),
    reason: text('reason').notNull(),
    at: integer('at').notNull(),
    reporterListed: integer('reporter_listed').notNull().default(0),
    /** When an admin settled it (dismissed, renamed or banned), or null while it is open. */
    settledAt: integer('settled_at'),
  },
  (t) => [
    uniqueIndex('reports_once').on(t.reporterId, t.targetId, t.reason),
    index('reports_target_open').on(t.targetId, t.settledAt),
    index('reports_reporter_at').on(t.reporterId, t.at),
  ],
);

/** Every siege between two lords for the last 30 days (session 39): who took how much from whom, so an
 *  admin can see gold flowing one way between two accounts (a lord feeding a second account of theirs). */
export const siegeFlows = sqliteTable(
  'siege_flows',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    attackerId: text('attacker_id').notNull(),
    defenderId: text('defender_id').notNull(),
    at: integer('at').notNull(),
    /** Gold the attacker took (their share of the raid). */
    gold: integer('gold').notNull(),
    breach: integer('breach').notNull(),
  },
  (t) => [index('siege_flows_at').on(t.at), index('siege_flows_pair').on(t.attackerId, t.defenderId)],
);
