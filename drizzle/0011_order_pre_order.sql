ALTER TABLE `orders` ADD `is_pre_order` boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `orders_payment_status_idx` ON `orders` (`payment_status`);