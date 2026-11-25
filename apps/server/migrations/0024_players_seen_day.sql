ALTER TABLE `players` ADD `seen_day` text;--> statement-breakpoint
UPDATE `players` SET `seen_day` = (SELECT max(`day`) FROM `visits` WHERE `visits`.`player_id` = `players`.`id`);--> statement-breakpoint
CREATE TRIGGER `visits_seen_day` AFTER INSERT ON `visits` BEGIN UPDATE `players` SET `seen_day` = NEW.`day` WHERE `id` = NEW.`player_id` AND (`seen_day` IS NULL OR `seen_day` < NEW.`day`); END;
