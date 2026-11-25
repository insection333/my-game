CREATE INDEX `players_created` ON `players` (`created_at`);--> statement-breakpoint
CREATE INDEX `visits_day` ON `visits` (`day`,`player_id`);