CREATE TABLE `cheers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from_id` text NOT NULL,
	`to_id` text NOT NULL,
	`at` integer NOT NULL,
	`day` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `cheers_from_day` ON `cheers` (`from_id`,`day`);--> statement-breakpoint
CREATE INDEX `cheers_to` ON `cheers` (`to_id`);--> statement-breakpoint
CREATE TABLE `gifts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from_id` text NOT NULL,
	`to_id` text NOT NULL,
	`at` integer NOT NULL,
	`day` text NOT NULL,
	`opened_at` integer
);
--> statement-breakpoint
CREATE INDEX `gifts_from_day` ON `gifts` (`from_id`,`day`);--> statement-breakpoint
CREATE INDEX `gifts_to` ON `gifts` (`to_id`,`day`);--> statement-breakpoint
CREATE INDEX `gifts_at` ON `gifts` (`at`);