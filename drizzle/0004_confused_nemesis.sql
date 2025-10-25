CREATE TABLE `cart` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cart_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inquiryNumber` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`status` enum('pending','quoted','completed','cancelled') NOT NULL DEFAULT 'pending',
	`urgency` enum('normal','urgent','very_urgent') NOT NULL DEFAULT 'normal',
	`budgetRange` varchar(100),
	`applicationNotes` text,
	`deliveryAddress` text,
	`totalItems` int NOT NULL DEFAULT 0,
	`customerNotes` text,
	`adminNotes` text,
	`quotedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inquiries_id` PRIMARY KEY(`id`),
	CONSTRAINT `inquiries_inquiryNumber_unique` UNIQUE(`inquiryNumber`)
);
--> statement-breakpoint
CREATE TABLE `inquiry_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inquiryId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`notes` text,
	`quotedPrice` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inquiry_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(255);