import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar, uniqueIndex, index, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Additional user profile fields
  company: varchar("company", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  country: varchar("country", { length: 100 }),
  industry: varchar("industry", { length: 100 }),
  purchasingRole: varchar("purchasingRole", { length: 100 }),
  annualPurchaseVolume: varchar("annualPurchaseVolume", { length: 100 }),
  customerTier: mysqlEnum("customerTier", ["regular", "vip"]).default("regular"), // Customer tier for admin management
  emailVerified: int("emailVerified").default(0).notNull(), // 0 = not verified, 1 = verified
  password: varchar("password", { length: 255 }), // Hashed password for email/password login
  // AI advisor consent settings
  consentMode: mysqlEnum("consentMode", ["standard", "privacy"]).default("standard"),
  consentTimestamp: timestamp("consentTimestamp"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Products table for HPLC columns and consumables
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  /** Product ID with brand prefix (e.g., WATS-186009298) */
  productId: varchar("productId", { length: 128 }).notNull().unique(),
  /** Original part number without prefix */
  partNumber: varchar("partNumber", { length: 128 }).notNull(),
  /** Brand name */
  brand: varchar("brand", { length: 64 }).notNull(),
  /** Brand prefix (e.g., WATS, AGIL) */
  prefix: varchar("prefix", { length: 16 }).notNull(),
  /** Product type (e.g., HPLC Column, GC Column, SPE Cartridge) */
  productType: varchar("productType", { length: 100 }),
  /** Product name/title */
  name: text("name"),
  /** Product description */
  description: text("description"),
  /** Description quality level: high, medium, low, extracted, none */
  descriptionQuality: mysqlEnum("descriptionQuality", ["high", "medium", "low", "extracted", "none"]).default("none"),
  /** Detailed product description */
  detailedDescription: text("detailedDescription"),
  /** Technical specifications in JSON format */
  specifications: json("specifications"),
  /** Particle size (e.g., 5 µm, 3 µm) */
  particleSize: varchar("particleSize", { length: 50 }),
  /** Pore size (e.g., 100 Å, 120 Å) */
  poreSize: varchar("poreSize", { length: 50 }),
  /** Column length (e.g., 250 mm, 150 mm) */
  columnLength: varchar("columnLength", { length: 50 }),
  /** Inner diameter (e.g., 4.6 mm, 2.1 mm) */
  innerDiameter: varchar("innerDiameter", { length: 50 }),
  /** pH range (e.g., 2-8, 1-14) */
  phRange: varchar("phRange", { length: 50 }),
  /** Maximum pressure (e.g., 400 bar, 600 bar) */
  maxPressure: varchar("maxPressure", { length: 50 }),
  /** Maximum temperature (e.g., 60°C, 80°C) */
  maxTemperature: varchar("maxTemperature", { length: 50 }),
  /** USP classification (e.g., L1, L7, L11) */
  usp: varchar("usp", { length: 50 }),
  /** Phase type/填料类型 (e.g., C18, C8, Phenyl) */
  phaseType: varchar("phaseType", { length: 100 }),
  /** Numeric particle size in µm for filtering */
  particleSizeNum: int("particleSizeNum"),
  /** Numeric pore size in Å for filtering */
  poreSizeNum: int("poreSizeNum"),
  /** Numeric column length in mm for filtering */
  columnLengthNum: int("columnLengthNum"),
  /** Numeric inner diameter in mm for filtering */
  innerDiameterNum: int("innerDiameterNum"),
  /** Minimum pH value */
  phMin: int("phMin"),
  /** Maximum pH value */
  phMax: int("phMax"),
  /** Application areas */
  applications: text("applications"),
  /** Product image URL */
  imageUrl: varchar("imageUrl", { length: 500 }),
  /** Catalog/brochure URL */
  catalogUrl: varchar("catalogUrl", { length: 500 }),
  /** Technical documents URLs (JSON array) */
  technicalDocsUrl: text("technicalDocsUrl"),
  /** Product status: new, active, discontinued */
  status: varchar("status", { length: 32 }).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Categories table for product classification
 * Supports hierarchical structure with unlimited levels
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameEn: varchar("nameEn", { length: 100 }),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  parentId: int("parentId"),
  level: int("level").notNull().default(1),
  displayOrder: int("displayOrder").default(0),
  isVisible: int("isVisible").default(1).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Product-Category junction table for many-to-many relationship
 */
export const productCategories = mysqlTable("product_categories", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  categoryId: int("categoryId").notNull().references(() => categories.id, { onDelete: "cascade" }),
  isPrimary: int("isPrimary").default(0).notNull(), // 1 = primary category, 0 = secondary
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  uniqueProductCategory: uniqueIndex("unique_product_category").on(table.productId, table.categoryId),
}));

export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = typeof productCategories.$inferInsert;

/**
 * Cart/Inquiry List table
 * Stores products added to inquiry list by logged-in users
 */
export const cart = mysqlTable("cart", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  notes: text("notes"), // Customer notes for this product
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Cart = typeof cart.$inferSelect;
export type InsertCart = typeof cart.$inferInsert;

/**
 * Inquiries table
 * Stores submitted inquiry requests from customers
 */
export const inquiries = mysqlTable("inquiries", {
  id: int("id").autoincrement().primaryKey(),
  inquiryNumber: varchar("inquiryNumber", { length: 64 }).notNull().unique(), // e.g., INQ-20231025-001
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["pending", "quoted", "completed", "cancelled"]).default("pending").notNull(),
  urgency: mysqlEnum("urgency", ["normal", "urgent", "very_urgent"]).default("normal").notNull(),
  budgetRange: varchar("budgetRange", { length: 100 }),
  applicationNotes: text("applicationNotes"),
  deliveryAddress: text("deliveryAddress"),
  totalItems: int("totalItems").default(0).notNull(),
  customerNotes: text("customerNotes"),
  adminNotes: text("adminNotes"), // Internal notes from admin
  conversationId: int("conversationId"), // Link to AI conversation if inquiry came from AI advisor
  quotedAt: timestamp("quotedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;

/**
 * Inquiry Items table
 * Stores individual products in each inquiry
 */
export const inquiryItems = mysqlTable("inquiry_items", {
  id: int("id").autoincrement().primaryKey(),
  inquiryId: int("inquiryId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  notes: text("notes"), // Customer notes for this specific product
  quotedPrice: varchar("quotedPrice", { length: 50 }), // Price quoted by admin
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InquiryItem = typeof inquiryItems.$inferSelect;
export type InsertInquiryItem = typeof inquiryItems.$inferInsert;

// ============================================================================
// AI ADVISOR TABLES
// ============================================================================

/**
 * AI Conversations table
 * Stores conversation sessions between users and AI advisor
 */
export const aiConversations = mysqlTable("ai_conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }), // NULL for anonymous users
  sessionId: varchar("sessionId", { length: 64 }).notNull().unique(), // Unique session identifier
  consentMode: mysqlEnum("consentMode", ["standard", "privacy", "anonymous"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // Auto-calculated: createdAt + 120 days for standard mode
  isDeleted: int("isDeleted").default(0).notNull(), // Soft delete flag
}, (table) => ({
  idxUserId: uniqueIndex("idx_ai_conversations_userId").on(table.userId),
  idxSessionId: uniqueIndex("idx_ai_conversations_sessionId").on(table.sessionId),
  idxExpiresAt: uniqueIndex("idx_ai_conversations_expiresAt").on(table.expiresAt),
}));

export type AIConversation = typeof aiConversations.$inferSelect;
export type InsertAIConversation = typeof aiConversations.$inferInsert;

/**
 * AI Messages table
 * Stores individual messages in conversations
 */
export const aiMessages = mysqlTable("ai_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull().references(() => aiConversations.id, { onDelete: "cascade" }),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content"), // Plain text for privacy mode and anonymous users
  contentEncrypted: text("contentEncrypted"), // Encrypted content for standard mode (base64 encoded)
  feedback: mysqlEnum("feedback", ["like", "dislike", "none"]).default("none"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  idxConversationId: index("idx_ai_messages_conversationId").on(table.conversationId),
  idxFeedback: index("idx_ai_messages_feedback").on(table.feedback),
  idxCreatedAt: index("idx_ai_messages_createdAt").on(table.createdAt),
}));

export type AIMessage = typeof aiMessages.$inferSelect;
export type InsertAIMessage = typeof aiMessages.$inferInsert;

/**
 * AI Cache table
 * Stores frequently asked questions and their answers for performance optimization
 */
export const aiCache = mysqlTable("ai_cache", {
  id: int("id").autoincrement().primaryKey(),
  questionHash: varchar("questionHash", { length: 64 }).notNull().unique(), // SHA-256 hash of normalized question
  questionKeywords: text("questionKeywords"), // Space-separated keywords for matching
  questionSample: text("questionSample"), // Sample question text for reference
  answer: text("answer").notNull(), // Cached answer
  hitCount: int("hitCount").default(0).notNull(), // Number of times this cache was used
  likeCount: int("likeCount").default(0).notNull(), // Number of likes
  dislikeCount: int("dislikeCount").default(0).notNull(), // Number of dislikes
  satisfactionRate: decimal("satisfactionRate", { precision: 5, scale: 2 }), // Calculated: likes / (likes + dislikes)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(), // Cache expiration (30 days default)
}, (table) => ({
  idxQuestionHash: uniqueIndex("idx_ai_cache_questionHash").on(table.questionHash),
  idxExpiresAt: index("idx_ai_cache_expiresAt").on(table.expiresAt),
  idxHitCount: index("idx_ai_cache_hitCount").on(table.hitCount),
}));

export type AICache = typeof aiCache.$inferSelect;
export type InsertAICache = typeof aiCache.$inferInsert;

/**
 * AI Conversation Statistics table
 * Daily aggregated statistics for monitoring and optimization
 */
export const aiConversationStats = mysqlTable("ai_conversation_stats", {
  id: int("id").autoincrement().primaryKey(),
  statDate: timestamp("statDate").notNull().unique(), // Date for this statistics record
  totalConversations: int("totalConversations").default(0).notNull(),
  totalMessages: int("totalMessages").default(0).notNull(),
  avgMessagesPerConversation: decimal("avgMessagesPerConversation", { precision: 5, scale: 2 }),
  likes: int("likes").default(0).notNull(),
  dislikes: int("dislikes").default(0).notNull(),
  satisfactionRate: decimal("satisfactionRate", { precision: 5, scale: 2 }), // likes / (likes + dislikes)
  transferToHuman: int("transferToHuman").default(0).notNull(), // Count of conversations transferred to human
  cacheHits: int("cacheHits").default(0).notNull(),
  cacheHitRate: decimal("cacheHitRate", { precision: 5, scale: 2 }), // cacheHits / totalMessages
  llmCost: decimal("llmCost", { precision: 10, scale: 2 }), // Daily LLM API cost in USD
}, (table) => ({
  idxStatDate: uniqueIndex("idx_ai_conversation_stats_statDate").on(table.statDate),
}));

export type AIConversationStats = typeof aiConversationStats.$inferSelect;
export type InsertAIConversationStats = typeof aiConversationStats.$inferInsert;

/**
 * Conversion Funnel table
 * Tracks user journey from website visit to inquiry submission
 */
export const conversionFunnel = mysqlTable("conversion_funnel", {
  id: int("id").autoincrement().primaryKey(),
  statDate: timestamp("statDate").notNull().unique(),
  websiteVisits: int("websiteVisits").default(0).notNull(), // Total unique visitors
  aiConversations: int("aiConversations").default(0).notNull(), // Users who started AI chat
  productClicks: int("productClicks").default(0).notNull(), // Users who clicked product links
  cartAdditions: int("cartAdditions").default(0).notNull(), // Users who added items to cart
  inquiriesSubmitted: int("inquiriesSubmitted").default(0).notNull(), // Users who submitted inquiries
}, (table) => ({
  idxStatDate: uniqueIndex("idx_conversion_funnel_statDate").on(table.statDate),
}));

export type ConversionFunnel = typeof conversionFunnel.$inferSelect;
export type InsertConversionFunnel = typeof conversionFunnel.$inferInsert;

/**
 * AI Question Analysis table
 * Tracks frequently asked questions and their performance
 */
export const aiQuestionAnalysis = mysqlTable("ai_question_analysis", {
  id: int("id").autoincrement().primaryKey(),
  questionHash: varchar("questionHash", { length: 64 }).notNull().unique(),
  questionSample: text("questionSample"), // Sample question text
  askCount: int("askCount").default(0).notNull(), // How many times this question was asked
  likeCount: int("likeCount").default(0).notNull(),
  dislikeCount: int("dislikeCount").default(0).notNull(),
  satisfactionRate: decimal("satisfactionRate", { precision: 5, scale: 2 }),
  lastAskedAt: timestamp("lastAskedAt"),
}, (table) => ({
  idxQuestionHash: uniqueIndex("idx_ai_question_analysis_questionHash").on(table.questionHash),
  idxAskCount: uniqueIndex("idx_ai_question_analysis_askCount").on(table.askCount),
  idxSatisfactionRate: uniqueIndex("idx_ai_question_analysis_satisfactionRate").on(table.satisfactionRate),
}));

export type AIQuestionAnalysis = typeof aiQuestionAnalysis.$inferSelect;
export type InsertAIQuestionAnalysis = typeof aiQuestionAnalysis.$inferInsert;

/**
 * LLM Cost Tracking table
 * Detailed tracking of LLM API costs for budget monitoring
 */
export const llmCostTracking = mysqlTable("llm_cost_tracking", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").references(() => aiConversations.id, { onDelete: "set null" }),
  tokenCount: int("tokenCount").notNull(), // Total tokens used (prompt + completion)
  cost: decimal("cost", { precision: 10, scale: 6 }).notNull(), // Cost in USD
  model: varchar("model", { length: 50 }).default("gpt-3.5-turbo").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  idxConversationId: uniqueIndex("idx_llm_cost_tracking_conversationId").on(table.conversationId),
  idxTimestamp: uniqueIndex("idx_llm_cost_tracking_timestamp").on(table.timestamp),
}));

export type LLMCostTracking = typeof llmCostTracking.$inferSelect;
export type InsertLLMCostTracking = typeof llmCostTracking.$inferInsert;

// ============================================================================
// RESOURCES CENTER TABLES
// ============================================================================

/**
 * Resources/Blog Posts table
 * Stores technical articles, tutorials, and educational content
 */
export const resources = mysqlTable("resources", {
  id: int("id").autoincrement().primaryKey(),
  /** URL-friendly unique identifier */
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  /** Article title */
  title: varchar("title", { length: 255 }).notNull(),
  /** Full content in Markdown format (supports HTML tags like iframe for YouTube) */
  content: text("content").notNull(),
  /** Short excerpt/summary for listing pages */
  excerpt: varchar("excerpt", { length: 500 }),
  /** SEO meta description (150-160 characters) */
  metaDescription: varchar("metaDescription", { length: 200 }),
  /** Cover image URL */
  coverImage: varchar("coverImage", { length: 500 }),
  /** Author name (default: ROWELL Team) */
  authorName: varchar("authorName", { length: 100 }).default("ROWELL Team"),
  /** Article status: draft, published, archived */
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  /** Article language (en, zh, es, etc.) */
  language: varchar("language", { length: 10 }).default("en").notNull(),
  /** Category ID (foreign key to resource_categories) */
  categoryId: int("categoryId"),
  /** View count for analytics */
  viewCount: int("viewCount").default(0).notNull(),
  /** Featured article flag */
  featured: int("featured").default(0).notNull(), // 1 = featured, 0 = normal
  /** Published date/time */
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  idxStatusPublished: index("idx_resources_status_published").on(table.status, table.publishedAt),
  idxCategory: index("idx_resources_category").on(table.categoryId),
  idxFeatured: index("idx_resources_featured").on(table.featured),
  idxLanguage: index("idx_resources_language").on(table.language),
}));

export type Resource = typeof resources.$inferSelect;
export type InsertResource = typeof resources.$inferInsert;

/**
 * Resource Categories table
 * Organizes articles into main topics
 */
export const resourceCategories = mysqlTable("resource_categories", {
  id: int("id").autoincrement().primaryKey(),
  /** Category name */
  name: varchar("name", { length: 100 }).notNull(),
  /** URL-friendly slug */
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  /** Category description */
  description: text("description"),
  /** Display order */
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResourceCategory = typeof resourceCategories.$inferSelect;
export type InsertResourceCategory = typeof resourceCategories.$inferInsert;

/**
 * Resource Tags table
 * Provides fine-grained topic tagging for articles
 */
export const resourceTags = mysqlTable("resource_tags", {
  id: int("id").autoincrement().primaryKey(),
  /** Tag name */
  name: varchar("name", { length: 50 }).notNull().unique(),
  /** URL-friendly slug */
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ResourceTag = typeof resourceTags.$inferSelect;
export type InsertResourceTag = typeof resourceTags.$inferInsert;

/**
 * Resource-Tag junction table
 * Many-to-many relationship between resources and tags
 */
export const resourcePostTags = mysqlTable("resource_post_tags", {
  postId: int("postId").notNull().references(() => resources.id, { onDelete: "cascade" }),
  tagId: int("tagId").notNull().references(() => resourceTags.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  pk: uniqueIndex("pk_resource_post_tags").on(table.postId, table.tagId),
  idxPostId: index("idx_resource_post_tags_postId").on(table.postId),
  idxTagId: index("idx_resource_post_tags_tagId").on(table.tagId),
}));

export type ResourcePostTag = typeof resourcePostTags.$inferSelect;
export type InsertResourcePostTag = typeof resourcePostTags.$inferInsert;


// ============================================================================
// API KEYS TABLE
// ============================================================================

/**
 * API Keys table
 * Stores API keys for external integrations (e.g., social media automation)
 */
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  /** API key value (hashed) */
  keyHash: varchar("keyHash", { length: 255 }).notNull().unique(),
  /** First 8 characters of key for display (e.g., "rowell_a...") */
  keyPrefix: varchar("keyPrefix", { length: 20 }).notNull(),
  /** Human-readable name for this key */
  name: varchar("name", { length: 100 }).notNull(),
  /** Description of what this key is used for */
  description: text("description"),
  /** User who created this key */
  createdBy: int("createdBy").notNull().references(() => users.id, { onDelete: "cascade" }),
  /** Permissions granted to this key (comma-separated) */
  permissions: varchar("permissions", { length: 255 }).notNull().default("resources:create"),
  /** Whether this key is active */
  isActive: int("isActive").default(1).notNull(),
  /** Last time this key was used */
  lastUsedAt: timestamp("lastUsedAt"),
  /** Expiration date (NULL = never expires) */
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  idxKeyHash: uniqueIndex("idx_api_keys_keyHash").on(table.keyHash),
  idxCreatedBy: index("idx_api_keys_createdBy").on(table.createdBy),
  idxIsActive: index("idx_api_keys_isActive").on(table.isActive),
}));

export type APIKey = typeof apiKeys.$inferSelect;
export type InsertAPIKey = typeof apiKeys.$inferInsert;
