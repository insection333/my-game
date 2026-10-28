DROP TABLE `invites`;--> statement-breakpoint
ALTER TABLE `players` ADD `name_look` text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE `players` SET `name_look` = replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(`name`), ' ', ''), '_', ''), '-', ''), 'rn', 'm'), 'vv', 'w'), '1', 'l'), 'i', 'l'), '0', 'o'), '5', 's');--> statement-breakpoint
CREATE INDEX `players_look` ON `players` (`name_look`);--> statement-breakpoint
CREATE INDEX `telemetry_at` ON `telemetry` (`at`);