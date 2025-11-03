ALTER TABLE `ai_cache` DROP INDEX `idx_ai_cache_expiresAt`;--> statement-breakpoint
ALTER TABLE `ai_cache` DROP INDEX `idx_ai_cache_hitCount`;--> statement-breakpoint
ALTER TABLE `ai_messages` DROP INDEX `idx_ai_messages_conversationId`;--> statement-breakpoint
ALTER TABLE `ai_messages` DROP INDEX `idx_ai_messages_feedback`;--> statement-breakpoint
ALTER TABLE `ai_messages` DROP INDEX `idx_ai_messages_createdAt`;--> statement-breakpoint
CREATE INDEX `idx_ai_cache_expiresAt` ON `ai_cache` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `idx_ai_cache_hitCount` ON `ai_cache` (`hitCount`);--> statement-breakpoint
CREATE INDEX `idx_ai_messages_conversationId` ON `ai_messages` (`conversationId`);--> statement-breakpoint
CREATE INDEX `idx_ai_messages_feedback` ON `ai_messages` (`feedback`);--> statement-breakpoint
CREATE INDEX `idx_ai_messages_createdAt` ON `ai_messages` (`createdAt`);