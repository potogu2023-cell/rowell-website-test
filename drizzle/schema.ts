import { mysqlTable, mysqlSchema, AnyMySqlColumn, index, int, varchar, text, decimal, timestamp, foreignKey, mysqlEnum, json } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const aiCache = mysqlTable("ai_cache", {
	id: int().autoincrement().notNull(),
	questionHash: varchar({ length: 64 }).notNull(),
	questionKeywords: text(),
	questionSample: text(),
	answer: text().notNull(),
	hitCount: int().default(0).notNull(),
	likeCount: int().default(0).notNull(),
	dislikeCount: int().default(0).notNull(),
	satisfactionRate: decimal({ precision: 5, scale: 2 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
},
(table) => [
	index("ai_cache_questionHash_unique").on(table.questionHash),
	index("idx_ai_cache_questionHash").on(table.questionHash),
]);

export const aiConversationStats = mysqlTable("ai_conversation_stats", {
	id: int().autoincrement().notNull(),
	statDate: timestamp({ mode: 'string' }).notNull(),
	totalConversations: int().default(0).notNull(),
	totalMessages: int().default(0).notNull(),
	avgMessagesPerConversation: decimal({ precision: 5, scale: 2 }),
	likes: int().default(0).notNull(),
	dislikes: int().default(0).notNull(),
	satisfactionRate: decimal({ precision: 5, scale: 2 }),
	transferToHuman: int().default(0).notNull(),
	cacheHits: int().default(0).notNull(),
	cacheHitRate: decimal({ precision: 5, scale: 2 }),
	llmCost: decimal({ precision: 10, scale: 2 }),
},
(table) => [
	index("ai_conversation_stats_statDate_unique").on(table.statDate),
	index("idx_ai_conversation_stats_statDate").on(table.statDate),
]);

export const aiConversations = mysqlTable("ai_conversations", {
	id: int().autoincrement().notNull(),
	userId: int().references(() => users.id, { onDelete: "cascade" } ),
	sessionId: varchar({ length: 64 }).notNull(),
	consentMode: mysqlEnum(['standard','privacy','anonymous']).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	expiresAt: timestamp({ mode: 'string' }),
	isDeleted: int().default(0).notNull(),
},
(table) => [
	index("ai_conversations_sessionId_unique").on(table.sessionId),
	index("idx_ai_conversations_userId").on(table.userId),
	index("idx_ai_conversations_sessionId").on(table.sessionId),
	index("idx_ai_conversations_expiresAt").on(table.expiresAt),
]);

export const aiMessages = mysqlTable("ai_messages", {
	id: int().autoincrement().notNull(),
	conversationId: int().notNull().references(() => aiConversations.id, { onDelete: "cascade" } ),
	role: mysqlEnum(['user','assistant','system']).notNull(),
	content: text(),
	contentEncrypted: text(),
	feedback: mysqlEnum(['like','dislike','none']).default('none'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_ai_messages_conversationId").on(table.conversationId),
	index("idx_ai_messages_feedback_new").on(table.feedback),
	index("idx_ai_messages_createdAt_new").on(table.createdAt),
]);

export const aiQuestionAnalysis = mysqlTable("ai_question_analysis", {
	id: int().autoincrement().notNull(),
	questionHash: varchar({ length: 64 }).notNull(),
	questionSample: text(),
	askCount: int().default(0).notNull(),
	likeCount: int().default(0).notNull(),
	dislikeCount: int().default(0).notNull(),
	satisfactionRate: decimal({ precision: 5, scale: 2 }),
	lastAskedAt: timestamp({ mode: 'string' }),
},
(table) => [
	index("ai_question_analysis_questionHash_unique").on(table.questionHash),
	index("idx_ai_question_analysis_questionHash").on(table.questionHash),
	index("idx_ai_question_analysis_askCount").on(table.askCount),
	index("idx_ai_question_analysis_satisfactionRate").on(table.satisfactionRate),
]);

export const apiKeys = mysqlTable("api_keys", {
	id: int().autoincrement().notNull(),
	keyHash: varchar({ length: 255 }).notNull(),
	keyPrefix: varchar({ length: 20 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	createdBy: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	permissions: varchar({ length: 255 }).default('resources:create').notNull(),
	isActive: int().default(1).notNull(),
	lastUsedAt: timestamp({ mode: 'string' }),
	expiresAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("api_keys_keyHash_unique").on(table.keyHash),
	index("idx_api_keys_createdBy").on(table.createdBy),
	index("idx_api_keys_isActive").on(table.isActive),
]);

export const cart = mysqlTable("cart", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	productId: int().notNull(),
	quantity: int().default(1).notNull(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const categories = mysqlTable("categories", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	nameEn: varchar({ length: 100 }),
	slug: varchar({ length: 100 }).notNull(),
	parentId: int(),
	level: int().default(1).notNull(),
	displayOrder: int().default(0),
	isVisible: int().default(1).notNull(),
	description: text(),
	icon: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("categories_slug_unique").on(table.slug),
]);

export const conversionFunnel = mysqlTable("conversion_funnel", {
	id: int().autoincrement().notNull(),
	statDate: timestamp({ mode: 'string' }).notNull(),
	websiteVisits: int().default(0).notNull(),
	aiConversations: int().default(0).notNull(),
	productClicks: int().default(0).notNull(),
	cartAdditions: int().default(0).notNull(),
	inquiriesSubmitted: int().default(0).notNull(),
},
(table) => [
	index("conversion_funnel_statDate_unique").on(table.statDate),
	index("idx_conversion_funnel_statDate").on(table.statDate),
]);

export const inquiries = mysqlTable("inquiries", {
	id: int().autoincrement().notNull(),
	inquiryNumber: varchar({ length: 64 }).notNull(),
	userId: int().notNull(),
	status: mysqlEnum(['pending','quoted','completed','cancelled']).default('pending').notNull(),
	urgency: mysqlEnum(['normal','urgent','very_urgent']).default('normal').notNull(),
	budgetRange: varchar({ length: 100 }),
	applicationNotes: text(),
	deliveryAddress: text(),
	totalItems: int().default(0).notNull(),
	customerNotes: text(),
	adminNotes: text(),
	quotedAt: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	conversationId: int(),
},
(table) => [
	index("inquiries_inquiryNumber_unique").on(table.inquiryNumber),
]);

export const inquiryItems = mysqlTable("inquiry_items", {
	id: int().autoincrement().notNull(),
	inquiryId: int().notNull(),
	productId: int().notNull(),
	quantity: int().default(1).notNull(),
	notes: text(),
	quotedPrice: varchar({ length: 50 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const llmCostTracking = mysqlTable("llm_cost_tracking", {
	id: int().autoincrement().notNull(),
	conversationId: int().references(() => aiConversations.id, { onDelete: "set null" } ),
	tokenCount: int().notNull(),
	cost: decimal({ precision: 10, scale: 6 }).notNull(),
	model: varchar({ length: 50 }).default('gpt-3.5-turbo').notNull(),
	timestamp: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_llm_cost_tracking_conversationId").on(table.conversationId),
	index("idx_llm_cost_tracking_timestamp").on(table.timestamp),
]);

export const productCategories = mysqlTable("product_categories", {
	id: int().autoincrement().notNull(),
	productId: int().notNull().references(() => products.id, { onDelete: "cascade" } ),
	categoryId: int().notNull().references(() => categories.id, { onDelete: "cascade" } ),
	isPrimary: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("unique_product_category").on(table.productId, table.categoryId),
]);

export const products = mysqlTable("products", {
	id: int().autoincrement().notNull(),
	productId: varchar({ length: 128 }).notNull(),
	partNumber: varchar({ length: 128 }).notNull(),
	brand: varchar({ length: 64 }).notNull(),
	prefix: varchar({ length: 16 }).notNull(),
	name: text(),
	description: text(),
	status: varchar({ length: 32 }).default('new').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	detailedDescription: text(),
	specifications: json(),
	particleSize: varchar({ length: 50 }),
	poreSize: varchar({ length: 50 }),
	columnLength: varchar({ length: 50 }),
	innerDiameter: varchar({ length: 50 }),
	phRange: varchar({ length: 50 }),
	maxPressure: varchar({ length: 50 }),
	maxTemperature: varchar({ length: 50 }),
	usp: varchar({ length: 50 }),
	applications: text(),
	imageUrl: varchar({ length: 500 }),
	catalogUrl: varchar({ length: 500 }),
	technicalDocsUrl: text(),
	phaseType: varchar({ length: 100 }),
	particleSizeNum: int(),
	poreSizeNum: int(),
	columnLengthNum: int(),
	innerDiameterNum: int(),
	phMin: int(),
	phMax: int(),
	productType: varchar({ length: 100 }),
	descriptionQuality: mysqlEnum(['high','medium','low','extracted','none']).default('none'),
},
(table) => [
	index("products_productId_unique").on(table.productId),
]);

export const resourceCategories = mysqlTable("resource_categories", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	description: text(),
	displayOrder: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("resource_categories_slug_unique").on(table.slug),
]);

export const resourcePostTags = mysqlTable("resource_post_tags", {
	postId: int().notNull().references(() => resources.id, { onDelete: "cascade" } ),
	tagId: int().notNull().references(() => resourceTags.id, { onDelete: "cascade" } ),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("pk_resource_post_tags").on(table.postId, table.tagId),
	index("idx_resource_post_tags_postId").on(table.postId),
	index("idx_resource_post_tags_tagId").on(table.tagId),
]);

export const resourceTags = mysqlTable("resource_tags", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 50 }).notNull(),
	slug: varchar({ length: 50 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("resource_tags_name_unique").on(table.name),
	index("resource_tags_slug_unique").on(table.slug),
]);

export const resources = mysqlTable("resources", {
	id: int().autoincrement().notNull(),
	slug: varchar({ length: 255 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	excerpt: varchar({ length: 500 }),
	metaDescription: varchar({ length: 200 }),
	coverImage: varchar({ length: 500 }),
	authorName: varchar({ length: 100 }).default('ROWELL Team'),
	status: mysqlEnum(['draft','published','archived']).default('draft').notNull(),
	language: varchar({ length: 10 }).default('en').notNull(),
	categoryId: int(),
	viewCount: int().default(0).notNull(),
	featured: int().default(0).notNull(),
	publishedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("resources_slug_unique").on(table.slug),
	index("idx_resources_status_published").on(table.status, table.publishedAt),
	index("idx_resources_category").on(table.categoryId),
	index("idx_resources_featured").on(table.featured),
	index("idx_resources_language").on(table.language),
]);

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }).notNull(),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['user','admin']).default('user').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	company: varchar({ length: 255 }),
	phone: varchar({ length: 50 }),
	country: varchar({ length: 100 }),
	industry: varchar({ length: 100 }),
	purchasingRole: varchar({ length: 100 }),
	annualPurchaseVolume: varchar({ length: 100 }),
	emailVerified: int().default(0).notNull(),
	password: varchar({ length: 255 }),
	customerTier: mysqlEnum(['regular','vip']).default('regular'),
	consentMode: mysqlEnum(['standard','privacy']).default('standard'),
	consentTimestamp: timestamp({ mode: 'string' }),
},
(table) => [
	index("users_openId_unique").on(table.openId),
]);
