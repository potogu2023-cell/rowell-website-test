CREATE TABLE IF NOT EXISTS `resource_categories` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text,
  `displayOrder` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `resource_categories_id` PRIMARY KEY(`id`),
  CONSTRAINT `resource_categories_slug_unique` UNIQUE(`slug`)
);

CREATE TABLE IF NOT EXISTS `resource_tags` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(50) NOT NULL,
  `slug` varchar(50) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `resource_tags_id` PRIMARY KEY(`id`),
  CONSTRAINT `resource_tags_name_unique` UNIQUE(`name`),
  CONSTRAINT `resource_tags_slug_unique` UNIQUE(`slug`)
);

CREATE TABLE IF NOT EXISTS `resources` (
  `id` int AUTO_INCREMENT NOT NULL,
  `slug` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `excerpt` varchar(500),
  `coverImage` varchar(500),
  `authorName` varchar(100) DEFAULT 'ROWELL Team',
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
  `language` varchar(10) NOT NULL DEFAULT 'en',
  `categoryId` int,
  `viewCount` int NOT NULL DEFAULT 0,
  `featured` int NOT NULL DEFAULT 0,
  `publishedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `resources_id` PRIMARY KEY(`id`),
  CONSTRAINT `resources_slug_unique` UNIQUE(`slug`),
  INDEX `idx_resources_status_published` (`status`, `publishedAt`),
  INDEX `idx_resources_category` (`categoryId`),
  INDEX `idx_resources_featured` (`featured`),
  INDEX `idx_resources_language` (`language`)
);

CREATE TABLE IF NOT EXISTS `resource_post_tags` (
  `postId` int NOT NULL,
  `tagId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `pk_resource_post_tags` UNIQUE(`postId`,`tagId`),
  INDEX `idx_resource_post_tags_postId` (`postId`),
  INDEX `idx_resource_post_tags_tagId` (`tagId`),
  CONSTRAINT `resource_post_tags_postId_resources_id_fk` FOREIGN KEY (`postId`) REFERENCES `resources`(`id`) ON DELETE CASCADE,
  CONSTRAINT `resource_post_tags_tagId_resource_tags_id_fk` FOREIGN KEY (`tagId`) REFERENCES `resource_tags`(`id`) ON DELETE CASCADE
);
