CREATE TABLE `ai_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`questionHash` varchar(64) NOT NULL,
	`questionKeywords` text,
	`questionSample` text,
	`answer` text NOT NULL,
	`hitCount` int NOT NULL DEFAULT 0,
	`likeCount` int NOT NULL DEFAULT 0,
	`dislikeCount` int NOT NULL DEFAULT 0,
	`satisfactionRate` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `ai_cache_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_cache_questionHash_unique` UNIQUE(`questionHash`),
	CONSTRAINT `idx_ai_cache_questionHash` UNIQUE(`questionHash`),
	CONSTRAINT `idx_ai_cache_expiresAt` UNIQUE(`expiresAt`),
	CONSTRAINT `idx_ai_cache_hitCount` UNIQUE(`hitCount`)
);
--> statement-breakpoint
CREATE TABLE `ai_conversation_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`statDate` timestamp NOT NULL,
	`totalConversations` int NOT NULL DEFAULT 0,
	`totalMessages` int NOT NULL DEFAULT 0,
	`avgMessagesPerConversation` decimal(5,2),
	`likes` int NOT NULL DEFAULT 0,
	`dislikes` int NOT NULL DEFAULT 0,
	`satisfactionRate` decimal(5,2),
	`transferToHuman` int NOT NULL DEFAULT 0,
	`cacheHits` int NOT NULL DEFAULT 0,
	`cacheHitRate` decimal(5,2),
	`llmCost` decimal(10,2),
	CONSTRAINT `ai_conversation_stats_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_conversation_stats_statDate_unique` UNIQUE(`statDate`),
	CONSTRAINT `idx_ai_conversation_stats_statDate` UNIQUE(`statDate`)
);
--> statement-breakpoint
CREATE TABLE `ai_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sessionId` varchar(64) NOT NULL,
	`consentMode` enum('standard','privacy','anonymous') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`isDeleted` int NOT NULL DEFAULT 0,
	CONSTRAINT `ai_conversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_conversations_sessionId_unique` UNIQUE(`sessionId`),
	CONSTRAINT `idx_ai_conversations_userId` UNIQUE(`userId`),
	CONSTRAINT `idx_ai_conversations_sessionId` UNIQUE(`sessionId`),
	CONSTRAINT `idx_ai_conversations_expiresAt` UNIQUE(`expiresAt`)
);
--> statement-breakpoint
CREATE TABLE `ai_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text,
	`contentEncrypted` text,
	`feedback` enum('like','dislike','none') DEFAULT 'none',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_messages_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_ai_messages_conversationId` UNIQUE(`conversationId`),
	CONSTRAINT `idx_ai_messages_feedback` UNIQUE(`feedback`),
	CONSTRAINT `idx_ai_messages_createdAt` UNIQUE(`createdAt`)
);
--> statement-breakpoint
CREATE TABLE `ai_question_analysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`questionHash` varchar(64) NOT NULL,
	`questionSample` text,
	`askCount` int NOT NULL DEFAULT 0,
	`likeCount` int NOT NULL DEFAULT 0,
	`dislikeCount` int NOT NULL DEFAULT 0,
	`satisfactionRate` decimal(5,2),
	`lastAskedAt` timestamp,
	CONSTRAINT `ai_question_analysis_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_question_analysis_questionHash_unique` UNIQUE(`questionHash`),
	CONSTRAINT `idx_ai_question_analysis_questionHash` UNIQUE(`questionHash`),
	CONSTRAINT `idx_ai_question_analysis_askCount` UNIQUE(`askCount`),
	CONSTRAINT `idx_ai_question_analysis_satisfactionRate` UNIQUE(`satisfactionRate`)
);
--> statement-breakpoint
CREATE TABLE `conversion_funnel` (
	`id` int AUTO_INCREMENT NOT NULL,
	`statDate` timestamp NOT NULL,
	`websiteVisits` int NOT NULL DEFAULT 0,
	`aiConversations` int NOT NULL DEFAULT 0,
	`productClicks` int NOT NULL DEFAULT 0,
	`cartAdditions` int NOT NULL DEFAULT 0,
	`inquiriesSubmitted` int NOT NULL DEFAULT 0,
	CONSTRAINT `conversion_funnel_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversion_funnel_statDate_unique` UNIQUE(`statDate`),
	CONSTRAINT `idx_conversion_funnel_statDate` UNIQUE(`statDate`)
);
--> statement-breakpoint
CREATE TABLE `llm_cost_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int,
	`tokenCount` int NOT NULL,
	`cost` decimal(10,6) NOT NULL,
	`model` varchar(50) NOT NULL DEFAULT 'gpt-3.5-turbo',
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `llm_cost_tracking_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_llm_cost_tracking_conversationId` UNIQUE(`conversationId`),
	CONSTRAINT `idx_llm_cost_tracking_timestamp` UNIQUE(`timestamp`)
);
--> statement-breakpoint
ALTER TABLE `inquiries` ADD `conversationId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `consentMode` enum('standard','privacy') DEFAULT 'standard';--> statement-breakpoint
ALTER TABLE `users` ADD `consentTimestamp` timestamp;--> statement-breakpoint
ALTER TABLE `ai_conversations` ADD CONSTRAINT `ai_conversations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_messages` ADD CONSTRAINT `ai_messages_conversationId_ai_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `ai_conversations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `llm_cost_tracking` ADD CONSTRAINT `llm_cost_tracking_conversationId_ai_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `ai_conversations`(`id`) ON DELETE set null ON UPDATE no action;