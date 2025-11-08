CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`keyHash` varchar(255) NOT NULL,
	`keyPrefix` varchar(20) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`createdBy` int NOT NULL,
	`permissions` varchar(255) NOT NULL DEFAULT 'resources:create',
	`isActive` int NOT NULL DEFAULT 1,
	`lastUsedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_keys_keyHash_unique` UNIQUE(`keyHash`),
	CONSTRAINT `idx_api_keys_keyHash` UNIQUE(`keyHash`)
);
--> statement-breakpoint
ALTER TABLE `api_keys` ADD CONSTRAINT `api_keys_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_api_keys_createdBy` ON `api_keys` (`createdBy`);--> statement-breakpoint
CREATE INDEX `idx_api_keys_isActive` ON `api_keys` (`isActive`);