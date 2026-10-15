CREATE TABLE `roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(80) NOT NULL,
	`description` varchar(255) NOT NULL DEFAULT '',
	`permissions` json NOT NULL,
	`is_system` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(191) NOT NULL,
	`name` varchar(120) NOT NULL DEFAULT '',
	`status` enum('subscribed','unsubscribed') NOT NULL DEFAULT 'subscribed',
	`source` varchar(40) NOT NULL DEFAULT 'website',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscribers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `admins` ADD `role_id` int;--> statement-breakpoint
ALTER TABLE `admins` ADD `is_active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `admins` ADD `last_login_at` datetime;--> statement-breakpoint
ALTER TABLE `customers` ADD `is_active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX `subscribers_status_idx` ON `subscribers` (`status`);--> statement-breakpoint
ALTER TABLE `admins` ADD CONSTRAINT `admins_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Built-in Super Admin role; every existing admin keeps full access.
INSERT INTO `roles` (`name`, `description`, `permissions`, `is_system`) VALUES ('Super Admin', 'Full access to everything, including admins and roles.', '["*"]', true);--> statement-breakpoint
UPDATE `admins` SET `role_id` = (SELECT `id` FROM `roles` WHERE `name` = 'Super Admin');
