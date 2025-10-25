CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` varchar(128) NOT NULL,
	`partNumber` varchar(128) NOT NULL,
	`brand` varchar(64) NOT NULL,
	`prefix` varchar(16) NOT NULL,
	`name` text,
	`description` text,
	`status` varchar(32) NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_productId_unique` UNIQUE(`productId`)
);
