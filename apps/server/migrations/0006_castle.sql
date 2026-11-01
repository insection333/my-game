CREATE TABLE `bastion_global_state` (
	`id` integer PRIMARY KEY NOT NULL,
	`war_chest_reserve_gold` integer DEFAULT 0 NOT NULL,
	`gold_destroyed` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bastion_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`kind` text NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `bastion_logs_user_at` ON `bastion_logs` (`user_id`,`created_at` DESC);--> statement-breakpoint
CREATE TABLE `player_bastions` (
	`user_id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`active_ap` real DEFAULT 60 NOT NULL,
	`last_ap_sync_at` integer NOT NULL,
	`last_cta_date_utc` text,
	`streak_at_last_cta` integer DEFAULT 0 NOT NULL,
	`bastion_treasury` integer DEFAULT 0 NOT NULL,
	`edict` text,
	`last_upkeep_at` integer NOT NULL,
	`pay_from_treasury` integer DEFAULT 0 NOT NULL,
	`castle_walls_level` integer DEFAULT 1 NOT NULL,
	`deep_vault_level` integer DEFAULT 1 NOT NULL,
	`watchtower_level` integer DEFAULT 1 NOT NULL,
	`spy_guild_level` integer DEFAULT 1 NOT NULL,
	`vanguard_level` integer DEFAULT 1 NOT NULL,
	`outriders_level` integer DEFAULT 1 NOT NULL,
	`siege_level` integer DEFAULT 1 NOT NULL,
	`vanguard_drill_xp` real DEFAULT 0 NOT NULL,
	`outriders_drill_xp` real DEFAULT 0 NOT NULL,
	`siege_drill_xp` real DEFAULT 0 NOT NULL,
	`tech_logistics` integer DEFAULT 0 NOT NULL,
	`tech_siegecraft` integer DEFAULT 0 NOT NULL,
	`tech_fortification` integer DEFAULT 0 NOT NULL,
	`tech_espionage` integer DEFAULT 0 NOT NULL,
	`off_v_pct` integer DEFAULT 34 NOT NULL,
	`off_o_pct` integer DEFAULT 33 NOT NULL,
	`off_s_pct` integer DEFAULT 33 NOT NULL,
	`def_v_pct` integer DEFAULT 34 NOT NULL,
	`def_o_pct` integer DEFAULT 33 NOT NULL,
	`def_s_pct` integer DEFAULT 33 NOT NULL,
	`active_trap` text,
	`castellan_doctrine` text,
	`defense_changed_at` integer,
	`recon_lockdown_until_utc` integer,
	`withdraw_lockdown_until_utc` integer,
	`shield_until_utc` integer NOT NULL,
	`wall_integrity` real DEFAULT 100 NOT NULL,
	`infirmary_pct` real DEFAULT 0 NOT NULL,
	`recovery_synced_at` integer NOT NULL,
	`genuine_received` text DEFAULT '[]' NOT NULL,
	`sieges_day_utc` text,
	`sieges_today` integer DEFAULT 0 NOT NULL,
	`bastion_rating` integer DEFAULT 0 NOT NULL,
	`war_marks` integer DEFAULT 0 NOT NULL,
	`war_marks_earned` integer DEFAULT 0 NOT NULL,
	`excavation_depth` integer DEFAULT 0 NOT NULL,
	`incursion_tier` integer DEFAULT 1 NOT NULL,
	`incursion_scouted_tier` integer DEFAULT 0 NOT NULL,
	`relics` text DEFAULT '{}' NOT NULL,
	`equipped_relics` text DEFAULT '[]' NOT NULL,
	`active_debuffs` text DEFAULT '[]' NOT NULL,
	`debuff_immunities` text DEFAULT '{}' NOT NULL,
	`pair_limits` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_bastion_matchmaking` ON `player_bastions` (`bastion_rating`,`shield_until_utc`);--> statement-breakpoint
-- The realm's one row: the war chest starts empty and fills only from burns.
INSERT OR IGNORE INTO `bastion_global_state` (`id`, `war_chest_reserve_gold`, `gold_destroyed`) VALUES (1, 0, 0);
