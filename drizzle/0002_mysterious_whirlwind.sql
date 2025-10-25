CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`nameEn` varchar(100),
	`slug` varchar(100) NOT NULL,
	`parentId` int,
	`level` int NOT NULL DEFAULT 1,
	`displayOrder` int DEFAULT 0,
	`isVisible` int NOT NULL DEFAULT 1,
	`description` text,
	`icon` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `product_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`categoryId` int NOT NULL,
	`isPrimary` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_categories_id` PRIMARY KEY(`id`)
);
