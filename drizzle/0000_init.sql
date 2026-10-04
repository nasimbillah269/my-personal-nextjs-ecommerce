CREATE TABLE `admins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`email` varchar(191) NOT NULL,
	`password_hash` varchar(100) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admins_id` PRIMARY KEY(`id`),
	CONSTRAINT `admins_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(120) NOT NULL,
	`name` varchar(120) NOT NULL,
	`icon` varchar(40) NOT NULL DEFAULT 'LayoutGrid',
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(40) NOT NULL,
	`type` enum('percent','flat') NOT NULL,
	`value` int NOT NULL,
	`min_order` int NOT NULL DEFAULT 0,
	`usage_limit` int,
	`used_count` int NOT NULL DEFAULT 0,
	`expires_at` datetime,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`product_id` int,
	`product_name` varchar(255) NOT NULL,
	`product_slug` varchar(160) NOT NULL,
	`variant` varchar(60) NOT NULL,
	`price` int NOT NULL,
	`qty` int NOT NULL,
	`emoji` varchar(16) NOT NULL DEFAULT '🌿',
	`tint` varchar(16) NOT NULL DEFAULT '#e6f4ea',
	`image` varchar(255),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_no` varchar(20) NOT NULL,
	`status` enum('pending','confirmed','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`payment_method` enum('cod','bkash','nagad','card') NOT NULL,
	`payment_status` enum('unpaid','pending','paid','refunded') NOT NULL DEFAULT 'unpaid',
	`trx_id` varchar(40),
	`customer_name` varchar(120) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(191) NOT NULL DEFAULT '',
	`division` varchar(40) NOT NULL,
	`area` varchar(120) NOT NULL,
	`address` varchar(500) NOT NULL,
	`note` varchar(500) NOT NULL DEFAULT '',
	`admin_note` varchar(1000) NOT NULL DEFAULT '',
	`delivery` enum('inside','outside') NOT NULL,
	`subtotal` int NOT NULL,
	`discount` int NOT NULL DEFAULT 0,
	`shipping` int NOT NULL DEFAULT 0,
	`total` int NOT NULL,
	`coupon_code` varchar(40),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_order_no_unique` UNIQUE(`order_no`)
);
--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`label` varchar(60) NOT NULL,
	`price` int NOT NULL,
	`old_price` int,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `product_variants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`name` varchar(255) NOT NULL,
	`category_id` int NOT NULL,
	`summary` text NOT NULL,
	`description` text NOT NULL,
	`stock` int NOT NULL DEFAULT 0,
	`image` varchar(255),
	`emoji` varchar(16) NOT NULL DEFAULT '🌿',
	`tint` varchar(16) NOT NULL DEFAULT '#e6f4ea',
	`tags` varchar(500) NOT NULL DEFAULT '',
	`brand` varchar(120) NOT NULL DEFAULT 'Ultimate Organic Life',
	`origin` varchar(120) NOT NULL DEFAULT 'Bangladesh',
	`is_active` boolean NOT NULL DEFAULT true,
	`is_popular` boolean NOT NULL DEFAULT false,
	`is_daily_best` boolean NOT NULL DEFAULT false,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` varchar(64) NOT NULL,
	`value` text NOT NULL,
	CONSTRAINT `settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `items_product_idx` ON `order_items` (`product_id`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `orders_phone_idx` ON `orders` (`phone`);--> statement-breakpoint
CREATE INDEX `orders_created_idx` ON `orders` (`created_at`);--> statement-breakpoint
CREATE INDEX `variants_product_idx` ON `product_variants` (`product_id`);--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category_id`);