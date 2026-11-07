CREATE TABLE `castle_records` (
	`user_id` text PRIMARY KEY NOT NULL,
	`sieges_won` integer DEFAULT 0 NOT NULL,
	`sieges_lost` integer DEFAULT 0 NOT NULL,
	`defences_held` integer DEFAULT 0 NOT NULL,
	`defences_lost` integer DEFAULT 0 NOT NULL,
	`strongholds_taken` integer DEFAULT 0 NOT NULL,
	`strongholds_held` integer DEFAULT 0 NOT NULL,
	`spies_done` integer DEFAULT 0 NOT NULL,
	`spies_caught` integer DEFAULT 0 NOT NULL,
	`spies_stopped` integer DEFAULT 0 NOT NULL
);
