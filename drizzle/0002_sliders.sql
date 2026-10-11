CREATE TABLE `sliders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(120) NOT NULL,
	`image` varchar(255) NOT NULL,
	`link` varchar(500),
	`sort_order` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sliders_id` PRIMARY KEY(`id`)
);
