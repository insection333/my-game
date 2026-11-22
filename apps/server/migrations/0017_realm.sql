CREATE TABLE `realm_strikes` (
	`week` text NOT NULL,
	`player_id` text NOT NULL,
	`strikes` integer NOT NULL,
	`first_at` integer NOT NULL,
	PRIMARY KEY(`week`, `player_id`)
);
--> statement-breakpoint
CREATE INDEX `realm_strikes_week` ON `realm_strikes` (`week`,`strikes`);--> statement-breakpoint
CREATE TABLE `realm_weeks` (
	`week` text PRIMARY KEY NOT NULL,
	`needed` integer NOT NULL,
	`fell_at` integer
);
