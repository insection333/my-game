CREATE TABLE `feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` text NOT NULL,
	`at` integer NOT NULL,
	`page` text NOT NULL,
	`text` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `feedback_at` ON `feedback` (`at`);--> statement-breakpoint
CREATE TABLE `invites` (
	`code` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`used_by` text,
	`used_at` integer
);
--> statement-breakpoint
CREATE TABLE `visits` (
	`player_id` text NOT NULL,
	`day` text NOT NULL,
	PRIMARY KEY(`player_id`, `day`)
);
