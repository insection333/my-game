CREATE TABLE `mail` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`to_id` text NOT NULL,
	`from_id` text NOT NULL,
	`body` text NOT NULL,
	`at` integer NOT NULL,
	`read_at` integer,
	`flagged` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `mail_to_at` ON `mail` (`to_id`,`at`);--> statement-breakpoint
CREATE INDEX `mail_from_at` ON `mail` (`from_id`,`at`);--> statement-breakpoint
CREATE INDEX `mail_at` ON `mail` (`at`);--> statement-breakpoint
CREATE TABLE `mail_blocks` (
	`blocker_id` text NOT NULL,
	`blocked_id` text NOT NULL,
	`at` integer NOT NULL,
	PRIMARY KEY(`blocker_id`, `blocked_id`)
);
--> statement-breakpoint
CREATE TABLE `mail_mutes` (
	`player_id` text PRIMARY KEY NOT NULL,
	`until` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mail_refused` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from_id` text NOT NULL,
	`to_id` text NOT NULL,
	`body` text NOT NULL,
	`at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `mail_refused_from_at` ON `mail_refused` (`from_id`,`at`);--> statement-breakpoint
CREATE INDEX `mail_refused_at` ON `mail_refused` (`at`);