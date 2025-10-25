ALTER TABLE `users` ADD `company` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `country` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `industry` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `purchasingRole` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `annualPurchaseVolume` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` int DEFAULT 0 NOT NULL;