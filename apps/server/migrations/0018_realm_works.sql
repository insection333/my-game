CREATE TABLE `realm_work_gifts` (
	`season` integer NOT NULL,
	`player_id` text NOT NULL,
	`worth` integer NOT NULL,
	`first_at` integer NOT NULL,
	PRIMARY KEY(`season`, `player_id`)
);
--> statement-breakpoint
CREATE TABLE `realm_work_seasons` (
	`season` integer PRIMARY KEY NOT NULL,
	`needed` integer NOT NULL,
	`done_at` integer
);
