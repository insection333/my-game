ALTER TABLE `players` ADD `first_act_at` integer;--> statement-breakpoint
ALTER TABLE `players` ADD `listed_at` integer;--> statement-breakpoint
-- Players already on the hiscores before the rule stay on them.
UPDATE `players` SET `listed_at` = `created_at`, `first_act_at` = `created_at` WHERE `id` IN (SELECT `player_id` FROM `hiscores`);