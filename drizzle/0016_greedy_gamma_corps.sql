ALTER TABLE `ai_cache` DROP INDEX `ai_cache_questionHash_unique`;--> statement-breakpoint
ALTER TABLE `ai_cache` DROP INDEX `idx_ai_cache_questionHash`;--> statement-breakpoint
ALTER TABLE `ai_conversation_stats` DROP INDEX `ai_conversation_stats_statDate_unique`;--> statement-breakpoint
ALTER TABLE `ai_conversation_stats` DROP INDEX `idx_ai_conversation_stats_statDate`;--> statement-breakpoint
ALTER TABLE `ai_conversations` DROP INDEX `ai_conversations_sessionId_unique`;--> statement-breakpoint
ALTER TABLE `ai_conversations` DROP INDEX `idx_ai_conversations_userId`;--> statement-breakpoint
ALTER TABLE `ai_conversations` DROP INDEX `idx_ai_conversations_sessionId`;--> statement-breakpoint
ALTER TABLE `ai_conversations` DROP INDEX `idx_ai_conversations_expiresAt`;--> statement-breakpoint
ALTER TABLE `ai_question_analysis` DROP INDEX `ai_question_analysis_questionHash_unique`;--> statement-breakpoint
ALTER TABLE `ai_question_analysis` DROP INDEX `idx_ai_question_analysis_questionHash`;--> statement-breakpoint
ALTER TABLE `ai_question_analysis` DROP INDEX `idx_ai_question_analysis_askCount`;--> statement-breakpoint
ALTER TABLE `ai_question_analysis` DROP INDEX `idx_ai_question_analysis_satisfactionRate`;--> statement-breakpoint
ALTER TABLE `api_keys` DROP INDEX `api_keys_keyHash_unique`;--> statement-breakpoint
ALTER TABLE `api_keys` DROP INDEX `idx_api_keys_keyHash`;--> statement-breakpoint
ALTER TABLE `categories` DROP INDEX `categories_slug_unique`;--> statement-breakpoint
ALTER TABLE `conversion_funnel` DROP INDEX `conversion_funnel_statDate_unique`;--> statement-breakpoint
ALTER TABLE `conversion_funnel` DROP INDEX `idx_conversion_funnel_statDate`;--> statement-breakpoint
ALTER TABLE `inquiries` DROP INDEX `inquiries_inquiryNumber_unique`;--> statement-breakpoint
ALTER TABLE `llm_cost_tracking` DROP INDEX `idx_llm_cost_tracking_conversationId`;--> statement-breakpoint
ALTER TABLE `llm_cost_tracking` DROP INDEX `idx_llm_cost_tracking_timestamp`;--> statement-breakpoint
ALTER TABLE `product_categories` DROP INDEX `unique_product_category`;--> statement-breakpoint
ALTER TABLE `products` DROP INDEX `products_productId_unique`;--> statement-breakpoint
ALTER TABLE `resource_categories` DROP INDEX `resource_categories_slug_unique`;--> statement-breakpoint
ALTER TABLE `resource_post_tags` DROP INDEX `pk_resource_post_tags`;--> statement-breakpoint
ALTER TABLE `resource_tags` DROP INDEX `resource_tags_name_unique`;--> statement-breakpoint
ALTER TABLE `resource_tags` DROP INDEX `resource_tags_slug_unique`;--> statement-breakpoint
ALTER TABLE `resources` DROP INDEX `resources_slug_unique`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_openId_unique`;--> statement-breakpoint
DROP INDEX `idx_ai_cache_expiresAt` ON `ai_cache`;--> statement-breakpoint
DROP INDEX `idx_ai_cache_hitCount` ON `ai_cache`;--> statement-breakpoint
DROP INDEX `idx_ai_messages_feedback` ON `ai_messages`;--> statement-breakpoint
DROP INDEX `idx_ai_messages_createdAt` ON `ai_messages`;--> statement-breakpoint
ALTER TABLE `ai_cache` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `ai_conversation_stats` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `ai_conversations` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `ai_messages` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `ai_question_analysis` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `api_keys` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `cart` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `categories` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `conversion_funnel` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `inquiries` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `inquiry_items` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `llm_cost_tracking` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `product_categories` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `products` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `resource_categories` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `resource_tags` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `resources` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `users` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `ai_cache` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `ai_conversations` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `ai_messages` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `api_keys` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `cart` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `categories` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `inquiries` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `inquiry_items` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `llm_cost_tracking` MODIFY COLUMN `timestamp` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `product_categories` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `resource_categories` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `resource_post_tags` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `resource_tags` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `resources` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
CREATE INDEX `ai_cache_questionHash_unique` ON `ai_cache` (`questionHash`);--> statement-breakpoint
CREATE INDEX `idx_ai_cache_questionHash` ON `ai_cache` (`questionHash`);--> statement-breakpoint
CREATE INDEX `ai_conversation_stats_statDate_unique` ON `ai_conversation_stats` (`statDate`);--> statement-breakpoint
CREATE INDEX `idx_ai_conversation_stats_statDate` ON `ai_conversation_stats` (`statDate`);--> statement-breakpoint
CREATE INDEX `ai_conversations_sessionId_unique` ON `ai_conversations` (`sessionId`);--> statement-breakpoint
CREATE INDEX `idx_ai_conversations_userId` ON `ai_conversations` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_ai_conversations_sessionId` ON `ai_conversations` (`sessionId`);--> statement-breakpoint
CREATE INDEX `idx_ai_conversations_expiresAt` ON `ai_conversations` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `idx_ai_messages_feedback_new` ON `ai_messages` (`feedback`);--> statement-breakpoint
CREATE INDEX `idx_ai_messages_createdAt_new` ON `ai_messages` (`createdAt`);--> statement-breakpoint
CREATE INDEX `ai_question_analysis_questionHash_unique` ON `ai_question_analysis` (`questionHash`);--> statement-breakpoint
CREATE INDEX `idx_ai_question_analysis_questionHash` ON `ai_question_analysis` (`questionHash`);--> statement-breakpoint
CREATE INDEX `idx_ai_question_analysis_askCount` ON `ai_question_analysis` (`askCount`);--> statement-breakpoint
CREATE INDEX `idx_ai_question_analysis_satisfactionRate` ON `ai_question_analysis` (`satisfactionRate`);--> statement-breakpoint
CREATE INDEX `api_keys_keyHash_unique` ON `api_keys` (`keyHash`);--> statement-breakpoint
CREATE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE INDEX `conversion_funnel_statDate_unique` ON `conversion_funnel` (`statDate`);--> statement-breakpoint
CREATE INDEX `idx_conversion_funnel_statDate` ON `conversion_funnel` (`statDate`);--> statement-breakpoint
CREATE INDEX `inquiries_inquiryNumber_unique` ON `inquiries` (`inquiryNumber`);--> statement-breakpoint
CREATE INDEX `idx_llm_cost_tracking_conversationId` ON `llm_cost_tracking` (`conversationId`);--> statement-breakpoint
CREATE INDEX `idx_llm_cost_tracking_timestamp` ON `llm_cost_tracking` (`timestamp`);--> statement-breakpoint
CREATE INDEX `unique_product_category` ON `product_categories` (`productId`,`categoryId`);--> statement-breakpoint
CREATE INDEX `products_productId_unique` ON `products` (`productId`);--> statement-breakpoint
CREATE INDEX `resource_categories_slug_unique` ON `resource_categories` (`slug`);--> statement-breakpoint
CREATE INDEX `pk_resource_post_tags` ON `resource_post_tags` (`postId`,`tagId`);--> statement-breakpoint
CREATE INDEX `resource_tags_name_unique` ON `resource_tags` (`name`);--> statement-breakpoint
CREATE INDEX `resource_tags_slug_unique` ON `resource_tags` (`slug`);--> statement-breakpoint
CREATE INDEX `resources_slug_unique` ON `resources` (`slug`);--> statement-breakpoint
CREATE INDEX `users_openId_unique` ON `users` (`openId`);