CREATE TABLE `reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reporter_id` text NOT NULL,
	`target_id` text NOT NULL,
	`reason` text NOT NULL,
	`at` integer NOT NULL,
	`reporter_listed` integer DEFAULT 0 NOT NULL,
	`settled_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reports_once` ON `reports` (`reporter_id`,`target_id`,`reason`);--> statement-breakpoint
CREATE INDEX `reports_target_open` ON `reports` (`target_id`,`settled_at`);--> statement-breakpoint
CREATE INDEX `reports_reporter_at` ON `reports` (`reporter_id`,`at`);--> statement-breakpoint
CREATE TABLE `siege_flows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`attacker_id` text NOT NULL,
	`defender_id` text NOT NULL,
	`at` integer NOT NULL,
	`gold` integer NOT NULL,
	`breach` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `siege_flows_at` ON `siege_flows` (`at`);--> statement-breakpoint
CREATE INDEX `siege_flows_pair` ON `siege_flows` (`attacker_id`,`defender_id`);