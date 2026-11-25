CREATE TABLE `admin_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` text NOT NULL,
	`at` integer NOT NULL,
	`actor_id` text NOT NULL,
	`actor_name` text NOT NULL,
	`text` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `admin_notes_player` ON `admin_notes` (`player_id`,`at`);