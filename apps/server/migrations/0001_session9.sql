CREATE TABLE `hiscores` (
	`player_id` text NOT NULL,
	`skill` text NOT NULL,
	`level` integer NOT NULL,
	`xp` integer NOT NULL,
	`milestones` integer DEFAULT 0 NOT NULL,
	`reached_at` integer NOT NULL,
	PRIMARY KEY(`player_id`, `skill`)
);
--> statement-breakpoint
CREATE INDEX `hiscores_skill_xp` ON `hiscores` (`skill`,`xp`);--> statement-breakpoint
CREATE TABLE `notices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` text NOT NULL,
	`at` integer NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `notices_player_at` ON `notices` (`player_id`,`at`);