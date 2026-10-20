CREATE TABLE `damaged_saves` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` text NOT NULL,
	`doc` text NOT NULL,
	`repairs` text NOT NULL,
	`at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `saves` (
	`player_id` text PRIMARY KEY NOT NULL,
	`version` integer NOT NULL,
	`rev` integer NOT NULL,
	`doc` text NOT NULL,
	`updated_at` integer NOT NULL
);
