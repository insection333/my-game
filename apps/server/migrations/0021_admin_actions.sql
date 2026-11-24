CREATE TABLE `admin_actions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`at` integer NOT NULL,
	`actor_id` text NOT NULL,
	`actor_name` text NOT NULL,
	`action` text NOT NULL,
	`target_id` text,
	`target_name` text,
	`detail` text
);
--> statement-breakpoint
CREATE INDEX `admin_actions_at` ON `admin_actions` (`at`);--> statement-breakpoint
CREATE INDEX `admin_actions_target` ON `admin_actions` (`target_id`);