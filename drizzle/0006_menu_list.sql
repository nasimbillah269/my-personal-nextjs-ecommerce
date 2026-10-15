ALTER TABLE `menus` MODIFY COLUMN `location` enum('header','top-bar','footer-1','footer-2','footer-3');--> statement-breakpoint
ALTER TABLE `menus` ADD `created_by` int;--> statement-breakpoint
ALTER TABLE `menus` ADD CONSTRAINT `menus_created_by_admins_id_fk` FOREIGN KEY (`created_by`) REFERENCES `admins`(`id`) ON DELETE set null ON UPDATE no action;