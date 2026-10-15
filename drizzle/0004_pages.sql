CREATE TABLE `pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`title` varchar(255) NOT NULL,
	`short_description` varchar(500) NOT NULL DEFAULT '',
	`content` text NOT NULL,
	`image` varchar(255),
	`banner` varchar(255),
	`template` enum('default','full-width','with-sidebar') NOT NULL DEFAULT 'default',
	`is_active` boolean NOT NULL DEFAULT true,
	`is_featured` boolean NOT NULL DEFAULT false,
	`published_at` datetime,
	`meta_title` varchar(255) NOT NULL DEFAULT '',
	`meta_description` varchar(500) NOT NULL DEFAULT '',
	`meta_keywords` varchar(500) NOT NULL DEFAULT '',
	`sort_order` int NOT NULL DEFAULT 0,
	`author_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `pages_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `pages` ADD CONSTRAINT `pages_author_id_admins_id_fk` FOREIGN KEY (`author_id`) REFERENCES `admins`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `pages_active_idx` ON `pages` (`is_active`,`published_at`);