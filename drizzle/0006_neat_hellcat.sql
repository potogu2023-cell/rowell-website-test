ALTER TABLE `products` ADD `detailedDescription` text;--> statement-breakpoint
ALTER TABLE `products` ADD `specifications` json;--> statement-breakpoint
ALTER TABLE `products` ADD `particleSize` varchar(50);--> statement-breakpoint
ALTER TABLE `products` ADD `poreSize` varchar(50);--> statement-breakpoint
ALTER TABLE `products` ADD `columnLength` varchar(50);--> statement-breakpoint
ALTER TABLE `products` ADD `innerDiameter` varchar(50);--> statement-breakpoint
ALTER TABLE `products` ADD `phRange` varchar(50);--> statement-breakpoint
ALTER TABLE `products` ADD `maxPressure` varchar(50);--> statement-breakpoint
ALTER TABLE `products` ADD `maxTemperature` varchar(50);--> statement-breakpoint
ALTER TABLE `products` ADD `usp` varchar(50);--> statement-breakpoint
ALTER TABLE `products` ADD `applications` text;--> statement-breakpoint
ALTER TABLE `products` ADD `imageUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `products` ADD `catalogUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `products` ADD `technicalDocsUrl` text;