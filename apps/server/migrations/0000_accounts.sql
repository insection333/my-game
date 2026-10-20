CREATE TABLE `email_tokens` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`purpose` text NOT NULL,
	`email` text,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`email` text,
	`email_confirmed_at` integer,
	`banned_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `players_name_key_unique` ON `players` (`name_key`);--> statement-breakpoint
CREATE INDEX `players_email` ON `players` (`email`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sessions_player` ON `sessions` (`player_id`);--> statement-breakpoint
CREATE TABLE `telemetry` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` text,
	`type` text NOT NULL,
	`at` integer NOT NULL,
	`data` text
);
--> statement-breakpoint
CREATE INDEX `telemetry_type_at` ON `telemetry` (`type`,`at`);