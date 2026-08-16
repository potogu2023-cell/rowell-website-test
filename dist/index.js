var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc4) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc4 = __getOwnPropDesc(from, key)) || desc4.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  aiCache: () => aiCache,
  aiConversationStats: () => aiConversationStats,
  aiConversations: () => aiConversations,
  aiMessages: () => aiMessages,
  aiQuestionAnalysis: () => aiQuestionAnalysis,
  apiKeys: () => apiKeys,
  articleProducts: () => articleProducts,
  articles: () => articles,
  authors: () => authors,
  cart: () => cart,
  categories: () => categories,
  conversionFunnel: () => conversionFunnel,
  customerMessages: () => customerMessages,
  inquiries: () => inquiries,
  inquiryItems: () => inquiryItems,
  literature: () => literature,
  literatureProducts: () => literatureProducts,
  llmCostTracking: () => llmCostTracking,
  productCategories: () => productCategories,
  products: () => products,
  resourceCategories: () => resourceCategories,
  resourcePostTags: () => resourcePostTags,
  resourceTags: () => resourceTags,
  resources: () => resources,
  users: () => users,
  uspStandards: () => uspStandards
});
import { mysqlTable, index, int, varchar, text, decimal, timestamp, mysqlEnum, json } from "drizzle-orm/mysql-core";
var aiCache, aiConversationStats, aiConversations, aiMessages, aiQuestionAnalysis, apiKeys, cart, categories, conversionFunnel, inquiries, inquiryItems, llmCostTracking, productCategories, products, resourceCategories, resourcePostTags, resourceTags, resources, users, uspStandards, customerMessages, authors, articles, literature, articleProducts, literatureProducts;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    aiCache = mysqlTable(
      "ai_cache",
      {
        id: int().autoincrement().notNull(),
        questionHash: varchar({ length: 64 }).notNull(),
        questionKeywords: text(),
        questionSample: text(),
        answer: text().notNull(),
        hitCount: int().default(0).notNull(),
        likeCount: int().default(0).notNull(),
        dislikeCount: int().default(0).notNull(),
        satisfactionRate: decimal({ precision: 5, scale: 2 }),
        createdAt: timestamp({ mode: "string" }).default("CURRENT_TIMESTAMP").notNull(),
        expiresAt: timestamp({ mode: "string" }).notNull()
      },
      (table) => [
        index("ai_cache_questionHash_unique").on(table.questionHash),
        index("idx_ai_cache_questionHash").on(table.questionHash)
      ]
    );
    aiConversationStats = mysqlTable(
      "ai_conversation_stats",
      {
        id: int().autoincrement().notNull(),
        statDate: timestamp({ mode: "string" }).notNull(),
        totalConversations: int().default(0).notNull(),
        totalMessages: int().default(0).notNull(),
        avgMessagesPerConversation: decimal({ precision: 5, scale: 2 }),
        likes: int().default(0).notNull(),
        dislikes: int().default(0).notNull(),
        satisfactionRate: decimal({ precision: 5, scale: 2 }),
        transferToHuman: int().default(0).notNull(),
        cacheHits: int().default(0).notNull(),
        cacheHitRate: decimal({ precision: 5, scale: 2 }),
        llmCost: decimal({ precision: 10, scale: 2 })
      },
      (table) => [
        index("ai_conversation_stats_statDate_unique").on(table.statDate),
        index("idx_ai_conversation_stats_statDate").on(table.statDate)
      ]
    );
    aiConversations = mysqlTable(
      "ai_conversations",
      {
        id: int().autoincrement().notNull(),
        userId: int().references(() => users.id, { onDelete: "cascade" }),
        sessionId: varchar({ length: 64 }).notNull(),
        consentMode: mysqlEnum(["standard", "privacy", "anonymous"]).notNull(),
        createdAt: timestamp({ mode: "string" }).default("CURRENT_TIMESTAMP").notNull(),
        expiresAt: timestamp({ mode: "string" }),
        isDeleted: int().default(0).notNull()
      },
      (table) => [
        index("ai_conversations_sessionId_unique").on(table.sessionId),
        index("idx_ai_conversations_userId").on(table.userId),
        index("idx_ai_conversations_sessionId").on(table.sessionId),
        index("idx_ai_conversations_expiresAt").on(table.expiresAt)
      ]
    );
    aiMessages = mysqlTable(
      "ai_messages",
      {
        id: int().autoincrement().notNull(),
        conversationId: int().notNull().references(() => aiConversations.id, { onDelete: "cascade" }),
        role: mysqlEnum(["user", "assistant", "system"]).notNull(),
        content: text(),
        contentEncrypted: text(),
        feedback: mysqlEnum(["like", "dislike", "none"]).default("none"),
        createdAt: timestamp({ mode: "string" }).default("CURRENT_TIMESTAMP").notNull()
      },
      (table) => [
        index("idx_ai_messages_conversationId").on(table.conversationId),
        index("idx_ai_messages_feedback_new").on(table.feedback),
        index("idx_ai_messages_createdAt_new").on(table.createdAt)
      ]
    );
    aiQuestionAnalysis = mysqlTable(
      "ai_question_analysis",
      {
        id: int().autoincrement().notNull(),
        questionHash: varchar({ length: 64 }).notNull(),
        questionSample: text(),
        askCount: int().default(0).notNull(),
        likeCount: int().default(0).notNull(),
        dislikeCount: int().default(0).notNull(),
        satisfactionRate: decimal({ precision: 5, scale: 2 }),
        lastAskedAt: timestamp({ mode: "string" })
      },
      (table) => [
        index("ai_question_analysis_questionHash_unique").on(table.questionHash),
        index("idx_ai_question_analysis_questionHash").on(table.questionHash),
        index("idx_ai_question_analysis_askCount").on(table.askCount),
        index("idx_ai_question_analysis_satisfactionRate").on(table.satisfactionRate)
      ]
    );
    apiKeys = mysqlTable(
      "api_keys",
      {
        id: int().autoincrement().notNull(),
        keyHash: varchar({ length: 255 }).notNull(),
        keyPrefix: varchar({ length: 20 }).notNull(),
        name: varchar({ length: 100 }).notNull(),
        description: text(),
        createdBy: int().notNull().references(() => users.id, { onDelete: "cascade" }),
        permissions: varchar({ length: 255 }).default("resources:create").notNull(),
        isActive: int().default(1).notNull(),
        lastUsedAt: timestamp({ mode: "string" }),
        expiresAt: timestamp({ mode: "string" }),
        createdAt: timestamp({ mode: "string" }).default("CURRENT_TIMESTAMP").notNull(),
        updatedAt: timestamp({ mode: "string" }).defaultNow().onUpdateNow().notNull()
      },
      (table) => [
        index("api_keys_keyHash_unique").on(table.keyHash),
        index("idx_api_keys_createdBy").on(table.createdBy),
        index("idx_api_keys_isActive").on(table.isActive)
      ]
    );
    cart = mysqlTable("cart", {
      id: int().autoincrement().notNull(),
      userId: int().notNull(),
      productId: int().notNull(),
      quantity: int().default(1).notNull(),
      notes: text(),
      createdAt: timestamp({ mode: "string" }).default("CURRENT_TIMESTAMP").notNull(),
      updatedAt: timestamp({ mode: "string" }).defaultNow().onUpdateNow().notNull()
    });
    categories = mysqlTable(
      "categories",
      {
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
        createdAt: timestamp({ mode: "string" }).default("CURRENT_TIMESTAMP").notNull(),
        updatedAt: timestamp({ mode: "string" }).defaultNow().onUpdateNow().notNull()
      },
      (table) => [
        index("categories_slug_unique").on(table.slug)
      ]
    );
    conversionFunnel = mysqlTable(
      "conversion_funnel",
      {
        id: int().autoincrement().notNull(),
        statDate: timestamp({ mode: "string" }).notNull(),
        websiteVisits: int().default(0).notNull(),
        aiConversations: int().default(0).notNull(),
        productClicks: int().default(0).notNull(),
        cartAdditions: int().default(0).notNull(),
        inquiriesSubmitted: int().default(0).notNull()
      },
      (table) => [
        index("conversion_funnel_statDate_unique").on(table.statDate),
        index("idx_conversion_funnel_statDate").on(table.statDate)
      ]
    );
    inquiries = mysqlTable(
      "inquiries",
      {
        id: int().autoincrement().notNull(),
        inquiryNumber: varchar({ length: 64 }).notNull(),
        userId: int().notNull(),
        status: mysqlEnum(["pending", "quoted", "completed", "cancelled"]).default("pending").notNull(),
        urgency: mysqlEnum(["normal", "urgent", "very_urgent"]).default("normal").notNull(),
        budgetRange: varchar({ length: 100 }),
        applicationNotes: text(),
        deliveryAddress: text(),
        totalItems: int().default(0).notNull(),
        customerNotes: text(),
        adminNotes: text(),
        quotedAt: timestamp({ mode: "string" }),
        completedAt: timestamp({ mode: "string" }),
        createdAt: timestamp({ mode: "string" }).default("CURRENT_TIMESTAMP").notNull(),
        updatedAt: timestamp({ mode: "string" }).defaultNow().onUpdateNow().notNull(),
        conversationId: int()
      },
      (table) => [
        index("inquiries_inquiryNumber_unique").on(table.inquiryNumber)
      ]
    );
    inquiryItems = mysqlTable("inquiry_items", {
      id: int().autoincrement().notNull(),
      inquiryId: int().notNull(),
      productId: int().notNull(),
      quantity: int().default(1).notNull(),
      notes: text(),
      quotedPrice: varchar({ length: 50 }),
      createdAt: timestamp({ mode: "string" }).default("CURRENT_TIMESTAMP").notNull()
    });
    llmCostTracking = mysqlTable(
      "llm_cost_tracking",
      {
        id: int().autoincrement().notNull(),
        conversationId: int().references(() => aiConversations.id, { onDelete: "set null" }),
        tokenCount: int().notNull(),
        cost: decimal({ precision: 10, scale: 6 }).notNull(),
        model: varchar({ length: 50 }).default("gpt-3.5-turbo").notNull(),
        timestamp: timestamp({ mode: "string" }).default("CURRENT_TIMESTAMP").notNull()
      },
      (table) => [
        index("idx_llm_cost_tracking_conversationId").on(table.conversationId),
        index("idx_llm_cost_tracking_timestamp").on(table.timestamp)
      ]
    );
    productCategories = mysqlTable(
      "product_categories",
      {
        id: int().autoincrement().notNull(),
        productId: int("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
        categoryId: int("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
        isPrimary: int("is_primary").default(0).notNull(),
        createdAt: timestamp({ mode: "string" }).default("CURRENT_TIMESTAMP").notNull()
      },
      (table) => [
        index("unique_product_category").on(table.productId, table.categoryId)
      ]
    );
    products = mysqlTable(
      "products",
      {
        id: int().autoincrement().notNull(),
        productId: varchar({ length: 128 }).notNull(),
        partNumber: varchar({ length: 128 }).notNull(),
        brand: varchar({ length: 64 }).notNull(),
        prefix: varchar({ length: 16 }).notNull(),
        name: text(),
        description: text(),
        status: varchar({ length: 32 }).default("new").notNull(),
        createdAt: timestamp({ mode: "string" }).default("CURRENT_TIMESTAMP").notNull(),
        updatedAt: timestamp({ mode: "string" }).defaultNow().onUpdateNow().notNull(),
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
        descriptionQuality: mysqlEnum(["high", "medium", "low", "extracted", "none"]).default("none"),
        slug: varchar({ length: 128 }),
        category: varchar({ length: 100 }),
        categoryId: int("category_id").references(() => categories.id, { onDelete: "set null" }),
        metaTitle: varchar({ length: 70 }),
        metaDescription: varchar({ length: 160 })
      },
      (table) => [
        index("products_productId_unique").on(table.productId)
      ]
    );
    resourceCategories = mysqlTable(
      "resource_categories",
      {
        id: int().autoincrement().notNull(),
        name: varchar({ length: 100 }).notNull(),
        slug: varchar({ length: 100 }).notNull(),
        description: text(),
        displayOrder: int().default(0).notNull(),
        createdAt: timestamp({ mode: "string" }).default("CURRENT_TIMESTAMP").notNull(),
        updatedAt: timestamp({ mode: "string" }).defaultNow().onUpdateNow().notNull()
      },
      (table) => [
        index("resource_categories_slug_unique").on(table.slug)
      ]
    );
    resourcePostTags = mysqlTable(
      "resource_post_tags",
      {
        postId: int().notNull().references(() => resources.id, { onDelete: "cascade" }),
        tagId: int().notNull().references(() => resourceTags.id, { onDelete: "cascade" }),
        createdAt: timestamp({ mode: "string" }).default("CURRENT_TIMESTAMP").notNull()
      },
      (table) => [
        index("pk_resource_post_tags").on(table.postId, table.tagId),
        index("idx_resource_post_tags_postId").on(table.postId),
        index("idx_resource_post_tags_tagId").on(table.tagId)
      ]
    );
    resourceTags = mysqlTable(
      "resource_tags",
      {
        id: int().autoincrement().notNull(),
        name: varchar({ length: 50 }).notNull(),
        slug: varchar({ length: 50 }).notNull(),
        createdAt: timestamp({ mode: "string" }).default("CURRENT_TIMESTAMP").notNull()
      },
      (table) => [
        index("resource_tags_name_unique").on(table.name),
        index("resource_tags_slug_unique").on(table.slug)
      ]
    );
    resources = mysqlTable(
      "resources",
      {
        id: int().autoincrement().notNull(),
        title: varchar({ length: 255 }).notNull(),
        slug: varchar({ length: 255 }).notNull(),
        content: text().notNull(),
        excerpt: text(),
        category: varchar({ length: 50 }),
        author: varchar({ length: 100 }),
        publishedAt: timestamp({ mode: "string" }),
        tags: json(),
        status: varchar({ length: 20 }),
        views: int().default(0),
        createdAt: timestamp({ mode: "string" }),
        updatedAt: timestamp({ mode: "string" })
      },
      (table) => [
        index("resources_slug_unique").on(table.slug)
      ]
    );
    users = mysqlTable(
      "users",
      {
        id: int().autoincrement().notNull(),
        openId: varchar({ length: 64 }),
        name: text(),
        email: varchar({ length: 320 }).notNull(),
        loginMethod: varchar({ length: 64 }),
        role: mysqlEnum(["user", "admin"]).default("user").notNull(),
        createdAt: timestamp({ mode: "string" }).default("CURRENT_TIMESTAMP").notNull(),
        updatedAt: timestamp({ mode: "string" }).defaultNow().onUpdateNow().notNull(),
        lastSignedIn: timestamp({ mode: "string" }).default("CURRENT_TIMESTAMP").notNull(),
        company: varchar({ length: 255 }),
        phone: varchar({ length: 50 }),
        country: varchar({ length: 100 }),
        industry: varchar({ length: 100 }),
        purchasingRole: varchar({ length: 100 }),
        annualPurchaseVolume: varchar({ length: 100 }),
        emailVerified: int().default(0).notNull(),
        passwordHash: varchar({ length: 255 }),
        customerTier: mysqlEnum(["regular", "vip"]).default("regular"),
        consentMode: mysqlEnum(["standard", "privacy"]).default("standard"),
        consentTimestamp: timestamp({ mode: "string" })
      },
      (table) => [
        index("users_openId_unique").on(table.openId)
      ]
    );
    uspStandards = mysqlTable(
      "usp_standards",
      {
        id: int().autoincrement().notNull(),
        code: varchar({ length: 10 }).notNull(),
        name: varchar({ length: 100 }).notNull(),
        description: text(),
        chemicalName: varchar("chemical_name", { length: 200 }),
        commonApplications: text("common_applications"),
        isPopular: int("is_popular").default(0).notNull(),
        createdAt: timestamp("created_at", { mode: "string" }).default("CURRENT_TIMESTAMP").notNull(),
        updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow().notNull()
      },
      (table) => [
        index("usp_standards_code_unique").on(table.code),
        index("idx_usp_standards_is_popular").on(table.isPopular)
      ]
    );
    customerMessages = mysqlTable(
      "customer_messages",
      {
        id: int().autoincrement().notNull().primaryKey(),
        // 留言类型：inquiry(询价), message(留言), quote_request(报价请求)
        type: mysqlEnum(["inquiry", "message", "quote_request"]).notNull(),
        // 客户信息
        name: varchar({ length: 100 }).notNull(),
        email: varchar({ length: 255 }).notNull(),
        phone: varchar({ length: 50 }),
        company: varchar({ length: 255 }),
        // 留言内容
        subject: varchar({ length: 255 }),
        message: text().notNull(),
        // 产品信息（如果是产品相关）
        productId: varchar({ length: 50 }),
        productName: varchar({ length: 255 }),
        productPartNumber: varchar({ length: 100 }),
        // 状态管理
        status: mysqlEnum(["new", "read", "replied", "closed"]).default("new").notNull(),
        // IP和用户代理（用于防垃圾）
        ipAddress: varchar({ length: 45 }),
        userAgent: text(),
        // 时间戳
        createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
        updatedAt: timestamp({ mode: "string" }).defaultNow().onUpdateNow().notNull(),
        repliedAt: timestamp({ mode: "string" })
      },
      (table) => [
        index("idx_customer_messages_type").on(table.type),
        index("idx_customer_messages_status").on(table.status),
        index("idx_customer_messages_email").on(table.email),
        index("idx_customer_messages_createdAt").on(table.createdAt),
        index("idx_customer_messages_productId").on(table.productId)
      ]
    );
    authors = mysqlTable(
      "authors",
      {
        id: int("id").autoincrement().notNull(),
        slug: varchar("slug", { length: 100 }).notNull(),
        fullName: varchar("full_name", { length: 100 }).notNull(),
        title: varchar("title", { length: 150 }).notNull(),
        yearsOfExperience: int("years_of_experience").notNull(),
        education: varchar("education", { length: 255 }),
        expertise: text("expertise"),
        biography: text("biography").notNull(),
        photoUrl: varchar("photo_url", { length: 500 }),
        createdAt: timestamp("created_at", { mode: "string" }).default("CURRENT_TIMESTAMP").notNull(),
        updatedAt: timestamp("updated_at", { mode: "string" }).default("CURRENT_TIMESTAMP").notNull()
      },
      (table) => [
        index("authors_slug_unique").on(table.slug),
        index("idx_authors_slug").on(table.slug)
      ]
    );
    articles = mysqlTable(
      "articles",
      {
        id: int("id").autoincrement().notNull(),
        slug: varchar("slug", { length: 200 }).notNull(),
        title: varchar("title", { length: 255 }).notNull(),
        authorId: int("author_id").notNull().references(() => authors.id, { onDelete: "restrict" }),
        category: mysqlEnum("category", ["application-notes", "technical-guides", "industry-trends", "literature-reviews"]).notNull(),
        applicationArea: mysqlEnum("application_area", ["pharmaceutical", "environmental", "food-safety", "biopharmaceutical", "clinical", "chemical"]).notNull(),
        content: text("content").notNull(),
        metaDescription: varchar("meta_description", { length: 255 }),
        keywords: text("keywords"),
        publishedDate: timestamp("published_date", { mode: "string" }).notNull(),
        viewCount: int("view_count").default(0).notNull(),
        createdAt: timestamp("created_at", { mode: "string" }).default("CURRENT_TIMESTAMP").notNull(),
        updatedAt: timestamp("updated_at", { mode: "string" }).default("CURRENT_TIMESTAMP").notNull()
      },
      (table) => [
        index("articles_slug_unique").on(table.slug),
        index("idx_articles_slug").on(table.slug),
        index("idx_articles_authorId").on(table.authorId),
        index("idx_articles_category").on(table.category),
        index("idx_articles_applicationArea").on(table.applicationArea),
        index("idx_articles_publishedDate").on(table.publishedDate)
      ]
    );
    literature = mysqlTable(
      "literature",
      {
        id: int("id").autoincrement().notNull(),
        slug: varchar("slug", { length: 200 }).notNull(),
        title: varchar("title", { length: 500 }).notNull(),
        authors: varchar("authors", { length: 500 }).notNull(),
        journal: varchar("journal", { length: 255 }).notNull(),
        year: int("year").notNull(),
        doi: varchar("doi", { length: 255 }),
        url: varchar("url", { length: 1e3 }).notNull(),
        applicationArea: mysqlEnum("application_area", ["pharmaceutical", "environmental", "food-safety", "biopharmaceutical", "clinical", "chemical"]).notNull(),
        summary: text("summary").notNull(),
        keyFindings: text("key_findings"),
        relevance: text("relevance"),
        keywords: text("keywords"),
        addedDate: timestamp("added_date", { mode: "string" }).notNull(),
        viewCount: int("view_count").default(0).notNull(),
        createdAt: timestamp("created_at", { mode: "string" }).default("CURRENT_TIMESTAMP").notNull(),
        updatedAt: timestamp("updated_at", { mode: "string" }).default("CURRENT_TIMESTAMP").notNull(),
        // Enhanced content fields
        originalPaperUrl: varchar("original_paper_url", { length: 500 }),
        expandedAnalysis: text("expanded_analysis"),
        methodologyDetails: json("methodology_details"),
        practicalGuide: text("practical_guide"),
        contentEnhanced: int("content_enhanced").default(0).notNull(),
        enhancedAt: timestamp("enhanced_at", { mode: "string" })
      },
      (table) => [
        index("literature_slug_unique").on(table.slug),
        index("idx_literature_slug").on(table.slug),
        index("idx_literature_applicationArea").on(table.applicationArea),
        index("idx_literature_year").on(table.year),
        index("idx_literature_addedDate").on(table.addedDate)
      ]
    );
    articleProducts = mysqlTable(
      "article_products",
      {
        id: int().autoincrement().notNull(),
        articleId: int().notNull().references(() => articles.id, { onDelete: "cascade" }),
        productId: int().notNull().references(() => products.id, { onDelete: "cascade" }),
        createdAt: timestamp({ mode: "string" }).default("CURRENT_TIMESTAMP").notNull()
      },
      (table) => [
        index("idx_article_products_articleId").on(table.articleId),
        index("idx_article_products_productId").on(table.productId)
      ]
    );
    literatureProducts = mysqlTable(
      "literature_products",
      {
        id: int().autoincrement().notNull(),
        literatureId: int().notNull().references(() => literature.id, { onDelete: "cascade" }),
        productId: int().notNull().references(() => products.id, { onDelete: "cascade" }),
        createdAt: timestamp({ mode: "string" }).default("CURRENT_TIMESTAMP").notNull()
      },
      (table) => [
        index("idx_literature_products_literatureId").on(table.literatureId),
        index("idx_literature_products_productId").on(table.productId)
      ]
    );
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
    };
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  createInquiry: () => createInquiry,
  createInquiryItems: () => createInquiryItems,
  createUser: () => createUser,
  getAllProducts: () => getAllProducts,
  getDb: () => getDb,
  getInquiryByNumber: () => getInquiryByNumber,
  getInquiryItems: () => getInquiryItems,
  getPool: () => getPool,
  getProductById: () => getProductById,
  getProductsByIds: () => getProductsByIds,
  getUserByEmail: () => getUserByEmail,
  getUserByOpenId: () => getUserByOpenId,
  updateUserLastSignIn: () => updateUserLastSignIn,
  upsertUser: () => upsertUser
});
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
function toMysqlTimestamp(date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const dbUrl = new URL(process.env.DATABASE_URL);
      const sslParam = dbUrl.searchParams.get("ssl");
      dbUrl.searchParams.delete("ssl");
      const host = dbUrl.hostname;
      const port2 = dbUrl.port ? parseInt(dbUrl.port) : 3306;
      const user = dbUrl.username;
      const password = dbUrl.password;
      const database = dbUrl.pathname.slice(1);
      let sslConfig = null;
      if (sslParam) {
        if (sslParam === "true") {
          sslConfig = { rejectUnauthorized: true };
        } else {
          try {
            sslConfig = JSON.parse(sslParam);
          } catch (e) {
            console.warn("[Database] Failed to parse SSL config, using default:", e);
            sslConfig = { rejectUnauthorized: true };
          }
        }
      }
      console.log("[Database] Connecting with config:", {
        host,
        port: port2,
        user,
        database,
        hasPassword: !!password,
        sslEnabled: !!sslConfig
      });
      const poolConfig = {
        host,
        port: port2,
        user,
        password,
        database
      };
      if (sslConfig) {
        poolConfig.ssl = sslConfig;
      }
      const pool = mysql.createPool(poolConfig);
      _pool = pool;
      try {
        const connection = await pool.getConnection();
        console.log("[Database] Connection test successful");
        connection.release();
      } catch (testError) {
        console.error("[Database] Connection test failed:", testError);
        throw testError;
      }
      _db = createDatabase(pool);
      console.log("[Database] Drizzle instance created successfully");
    } catch (error) {
      console.error("[Database] Failed to initialize:", error);
      _db = null;
    }
  }
  return _db;
}
async function getPool() {
  await getDb();
  return _pool;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  if (!user.email) {
    throw new Error("User email is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId,
      email: user.email,
      lastSignedIn: toMysqlTimestamp(/* @__PURE__ */ new Date())
    };
    const updateSet = {};
    const textFields = ["name", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = toMysqlTimestamp(/* @__PURE__ */ new Date());
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = toMysqlTimestamp(/* @__PURE__ */ new Date());
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getProductById(productId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get product: database not available");
    return void 0;
  }
  const { products: products2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const result = await db.select().from(products2).where(eq(products2.id, productId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getProductsByIds(productIds) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get products: database not available");
    return [];
  }
  const { products: products2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { inArray: inArray2 } = await import("drizzle-orm");
  return await db.select().from(products2).where(inArray2(products2.id, productIds));
}
async function getAllProducts() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get products: database not available");
    return [];
  }
  const { products: products2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  return await db.select().from(products2);
}
async function createInquiry(data) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const { inquiries: inquiries2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const result = await db.insert(inquiries2).values({
    inquiryNumber: data.inquiryNumber,
    userId: data.userId,
    customerNotes: data.userMessage,
    status: "pending",
    urgency: "normal"
  });
  return Number(result[0].insertId);
}
async function createInquiryItems(inquiryId, items) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const { inquiryItems: inquiryItems2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const values = items.map((item) => ({
    inquiryId,
    productId: item.productId,
    partNumber: item.partNumber,
    productName: item.productName,
    brand: item.brand
  }));
  await db.insert(inquiryItems2).values(values);
}
async function getInquiryByNumber(inquiryNumber) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get inquiry: database not available");
    return void 0;
  }
  const { inquiries: inquiries2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const result = await db.select().from(inquiries2).where(eq(inquiries2.inquiryNumber, inquiryNumber)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getInquiryItems(inquiryId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get inquiry items: database not available");
    return [];
  }
  const { inquiryItems: inquiryItems2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  return await db.select().from(inquiryItems2).where(eq(inquiryItems2.inquiryId, inquiryId));
}
async function createUser(data) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const result = await db.insert(users).values({
    email: data.email,
    passwordHash: data.passwordHash,
    name: data.name,
    company: data.company,
    phone: data.phone,
    country: data.country,
    industry: data.industry,
    purchasingRole: data.purchasingRole,
    annualPurchaseVolume: data.annualPurchaseVolume,
    loginMethod: "password",
    role: "user",
    lastSignedIn: toMysqlTimestamp(/* @__PURE__ */ new Date())
  });
  return Number(result[0].insertId);
}
async function getUserByEmail(email) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateUserLastSignIn(userId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user: database not available");
    return;
  }
  await db.update(users).set({ lastSignedIn: toMysqlTimestamp(/* @__PURE__ */ new Date()) }).where(eq(users.id, userId));
}
var createDatabase, _db, _pool;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    createDatabase = (pool) => drizzle(pool);
    _db = null;
    _pool = null;
  }
});

// server/db-standards.ts
var db_standards_exports = {};
__export(db_standards_exports, {
  getAllStandardsCategories: () => getAllStandardsCategories,
  getRelatedStandardsProducts: () => getRelatedStandardsProducts,
  getStandardsByCategory: () => getStandardsByCategory,
  getStandardsCategoryBySlug: () => getStandardsCategoryBySlug,
  getStandardsProductBySlug: () => getStandardsProductBySlug,
  getStandardsStats: () => getStandardsStats,
  searchStandardsProducts: () => searchStandardsProducts
});
function mapProduct(row) {
  return {
    id: Number(row.id),
    part_number: row.part_number || "",
    name_en: row.name_en || "",
    name_cn: row.name_cn || null,
    specification: row.specification || null,
    cas_number: row.cas_number || null,
    category_slug: row.category_slug || null,
    brand: row.brand || "ANPEL",
    price_cny: row.price_cny != null ? String(row.price_cny) : null,
    price_usd: row.price_usd != null ? String(row.price_usd) : null,
    slug: row.slug || null,
    status: row.status || "active"
  };
}
async function q(sql6, params) {
  const pool = await getPool();
  if (!pool) return [];
  const [rows] = await pool.query(sql6, params);
  return rows;
}
async function getAllStandardsCategories() {
  const rows = await q(`
    SELECT sc.id, sc.slug, sc.name_en, sc.name_cn, sc.description, sc.icon, sc.sort_order,
           COUNT(sp.id) as product_count
    FROM standards_categories sc
    LEFT JOIN standards_products sp ON sp.category_slug = sc.slug AND sp.status = 'active'
    GROUP BY sc.id, sc.slug, sc.name_en, sc.name_cn, sc.description, sc.icon, sc.sort_order
    ORDER BY sc.sort_order ASC
  `);
  return rows.map((row) => ({
    id: Number(row.id),
    slug: row.slug,
    name_en: row.name_en,
    name_cn: row.name_cn || null,
    description: row.description || null,
    icon: row.icon || null,
    sort_order: Number(row.sort_order),
    product_count: Number(row.product_count)
  }));
}
async function getStandardsCategoryBySlug(slug) {
  const rows = await q(`
    SELECT sc.id, sc.slug, sc.name_en, sc.name_cn, sc.description, sc.icon, sc.sort_order,
           COUNT(sp.id) as product_count
    FROM standards_categories sc
    LEFT JOIN standards_products sp ON sp.category_slug = sc.slug AND sp.status = 'active'
    WHERE sc.slug = ?
    GROUP BY sc.id, sc.slug, sc.name_en, sc.name_cn, sc.description, sc.icon, sc.sort_order
    LIMIT 1
  `, [slug]);
  if (!rows || rows.length === 0) return null;
  const row = rows[0];
  return {
    id: Number(row.id),
    slug: row.slug,
    name_en: row.name_en,
    name_cn: row.name_cn || null,
    description: row.description || null,
    icon: row.icon || null,
    sort_order: Number(row.sort_order),
    product_count: Number(row.product_count)
  };
}
async function getStandardsByCategory(categorySlug, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;
  const [itemRows, countRows] = await Promise.all([
    q(`
      SELECT id, part_number, name_en, name_cn, specification, cas_number,
             category_slug, brand, price_cny, price_usd, slug, status
      FROM standards_products
      WHERE category_slug = ? AND status = 'active'
      ORDER BY name_en ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `, [categorySlug]),
    q(`
      SELECT COUNT(*) as total FROM standards_products
      WHERE category_slug = ? AND status = 'active'
    `, [categorySlug])
  ]);
  const total = Number(countRows[0]?.total || 0);
  return { items: itemRows.map(mapProduct), total, page, pageSize };
}
async function searchStandardsProducts(queryStr, page = 1, pageSize = 20, categorySlug) {
  const offset = (page - 1) * pageSize;
  const searchTerm = `%${queryStr}%`;
  const startTerm = `${queryStr}%`;
  let itemRows;
  let countRows;
  if (categorySlug) {
    [itemRows, countRows] = await Promise.all([
      q(`
        SELECT id, part_number, name_en, name_cn, specification, cas_number,
               category_slug, brand, price_cny, price_usd, slug, status
        FROM standards_products
        WHERE status = 'active' AND category_slug = ?
          AND (name_en LIKE ? OR name_cn LIKE ? OR cas_number LIKE ? OR part_number LIKE ?)
        ORDER BY
          CASE WHEN cas_number = ? THEN 0
               WHEN part_number = ? THEN 1
               WHEN name_en LIKE ? THEN 2
               ELSE 3
          END, name_en ASC
        LIMIT ${pageSize} OFFSET ${offset}
      `, [categorySlug, searchTerm, searchTerm, searchTerm, searchTerm, queryStr, queryStr, startTerm]),
      q(`
        SELECT COUNT(*) as total FROM standards_products
        WHERE status = 'active' AND category_slug = ?
          AND (name_en LIKE ? OR name_cn LIKE ? OR cas_number LIKE ? OR part_number LIKE ?)
      `, [categorySlug, searchTerm, searchTerm, searchTerm, searchTerm])
    ]);
  } else {
    [itemRows, countRows] = await Promise.all([
      q(`
        SELECT id, part_number, name_en, name_cn, specification, cas_number,
               category_slug, brand, price_cny, price_usd, slug, status
        FROM standards_products
        WHERE status = 'active'
          AND (name_en LIKE ? OR name_cn LIKE ? OR cas_number LIKE ? OR part_number LIKE ?)
        ORDER BY
          CASE WHEN cas_number = ? THEN 0
               WHEN part_number = ? THEN 1
               WHEN name_en LIKE ? THEN 2
               ELSE 3
          END, name_en ASC
        LIMIT ${pageSize} OFFSET ${offset}
      `, [searchTerm, searchTerm, searchTerm, searchTerm, queryStr, queryStr, startTerm]),
      q(`
        SELECT COUNT(*) as total FROM standards_products
        WHERE status = 'active'
          AND (name_en LIKE ? OR name_cn LIKE ? OR cas_number LIKE ? OR part_number LIKE ?)
      `, [searchTerm, searchTerm, searchTerm, searchTerm])
    ]);
  }
  const total = Number(countRows[0]?.total || 0);
  return { items: itemRows.map(mapProduct), total, page, pageSize };
}
async function getStandardsProductBySlug(slug) {
  const rows = await q(`
    SELECT id, part_number, name_en, name_cn, specification, cas_number,
           category_slug, brand, price_cny, price_usd, slug, status
    FROM standards_products
    WHERE slug = ? AND status = 'active'
    LIMIT 1
  `, [slug]);
  if (!rows || rows.length === 0) return null;
  return mapProduct(rows[0]);
}
async function getRelatedStandardsProducts(categorySlug, excludeId, limit = 6) {
  const rows = await q(`
    SELECT id, part_number, name_en, name_cn, specification, cas_number,
           category_slug, brand, price_cny, price_usd, slug, status
    FROM standards_products
    WHERE category_slug = ? AND status = 'active' AND id != ?
    ORDER BY RAND()
    LIMIT ${limit}
  `, [categorySlug, excludeId]);
  return rows.map(mapProduct);
}
async function getStandardsStats() {
  const [totalRows, catRows] = await Promise.all([
    q(`SELECT COUNT(*) as total FROM standards_products WHERE status = 'active'`),
    q(`SELECT COUNT(*) as total FROM standards_categories`)
  ]);
  return {
    total: Number(totalRows[0]?.total || 0),
    categories: Number(catRows[0]?.total || 0)
  };
}
var init_db_standards = __esm({
  "server/db-standards.ts"() {
    "use strict";
    init_db();
  }
});

// server/products_list_new.ts
var products_list_new_exports = {};
__export(products_list_new_exports, {
  productsListInput: () => productsListInput,
  productsListQuery: () => productsListQuery
});
import { z as z13 } from "zod";
import { eq as eq7, and as and2, inArray, sql as sql2 } from "drizzle-orm";
async function productsListQuery(input, db) {
  if (!db) return { products: [], total: 0, page: 1, pageSize: 24, totalPages: 0 };
  const { products: products2, productCategories: productCategories2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const page = input?.page || 1;
  const pageSize = input?.pageSize || 24;
  const offset = (page - 1) * pageSize;
  const conditions = [];
  conditions.push(eq7(products2.status, "active"));
  if (input?.search && input.search.trim().length > 0) {
    const searchTerm = input.search.trim().toLowerCase();
    conditions.push(
      sql2`(
        LOWER(${products2.productId}) LIKE ${`%${searchTerm}%`} OR
        LOWER(${products2.name}) LIKE ${`%${searchTerm}%`} OR
        LOWER(${products2.partNumber}) LIKE ${`%${searchTerm}%`} OR
        LOWER(${products2.brand}) LIKE ${`%${searchTerm}%`}
      )`
    );
  }
  if (input?.brand) {
    conditions.push(eq7(products2.brand, input.brand));
  }
  const hasSpecificationFilters = [
    input?.particleSizeMin,
    input?.particleSizeMax,
    input?.poreSizeMin,
    input?.poreSizeMax,
    input?.columnLengthMin,
    input?.columnLengthMax,
    input?.innerDiameterMin,
    input?.innerDiameterMax,
    input?.phMin,
    input?.phMax
  ].some((value) => value !== void 0);
  if (input?.phaseTypes && input.phaseTypes.length > 0) {
    conditions.push(inArray(products2.phaseType, input.phaseTypes));
  }
  if (input?.usp) {
    const { or: or2, like: like2 } = await import("drizzle-orm");
    conditions.push(
      or2(
        eq7(products2.usp, input.usp),
        // "L1"
        like2(products2.usp, `${input.usp},%`),
        // "L1,..."
        like2(products2.usp, `%,${input.usp}`),
        // "...,L1"
        like2(products2.usp, `%,${input.usp},%`)
        // "...,L1,..."
      )
    );
  }
  const whereClause = conditions.length > 0 ? and2(...conditions) : void 0;
  const categoryCondition = input?.categoryId ? sql2`${products2.id} IN (SELECT product_id FROM product_categories WHERE category_id = ${input.categoryId})` : void 0;
  const finalCondition = categoryCondition && whereClause ? and2(categoryCondition, whereClause) : categoryCondition || whereClause;
  const baseQuery = db.select().from(products2).where(finalCondition);
  console.log("[products_list_new] categoryId:", input?.categoryId);
  console.log("[products_list_new] specification filters active:", hasSpecificationFilters);
  console.log("[products_list_new] base query SQL:", baseQuery.toSQL ? baseQuery.toSQL() : "no toSQL method");
  const parseStrictUnit = (value, expression, multiplier = 1) => {
    if (typeof value !== "string") return null;
    const match = expression.exec(value.trim());
    if (!match) return null;
    const numeric = Number(match[1]);
    return Number.isFinite(numeric) ? numeric * multiplier : null;
  };
  const inRange = (value, min, max) => min === void 0 && max === void 0 || value !== null && (min === void 0 || value >= min) && (max === void 0 || value <= max);
  const parseRecordedNumber = (value) => {
    if (value === null || value === void 0 || value === "") return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };
  const matchesSpecificationFilters = (product) => {
    const particleSize = parseStrictUnit(product.particleSize, /^(\d+(?:\.\d+)?)\s*(?:µm|um)$/i);
    const poreSize = parseStrictUnit(product.poreSize, /^(\d+(?:\.\d+)?)\s*(?:Å|A)$/);
    const innerDiameter = parseStrictUnit(product.innerDiameter, /^(\d+(?:\.\d+)?)\s*mm$/i);
    const columnLengthMatch = typeof product.columnLength === "string" ? /^(\d+(?:\.\d+)?)\s*(mm|m)$/i.exec(product.columnLength.trim()) : null;
    const columnLength = columnLengthMatch ? Number(columnLengthMatch[1]) * (columnLengthMatch[2].toLowerCase() === "m" ? 1e3 : 1) : null;
    const recordedPhMin = parseRecordedNumber(product.phMin);
    const recordedPhMax = parseRecordedNumber(product.phMax);
    const matchesPh = input?.phMin === void 0 && input?.phMax === void 0 || recordedPhMin !== null && recordedPhMax !== null && (input?.phMin === void 0 || recordedPhMax >= input.phMin) && (input?.phMax === void 0 || recordedPhMin <= input.phMax);
    return inRange(particleSize, input?.particleSizeMin, input?.particleSizeMax) && inRange(poreSize, input?.poreSizeMin, input?.poreSizeMax) && inRange(columnLength, input?.columnLengthMin, input?.columnLengthMax) && inRange(innerDiameter, input?.innerDiameterMin, input?.innerDiameterMax) && matchesPh;
  };
  let productList;
  let total;
  if (hasSpecificationFilters) {
    const candidates = await baseQuery;
    const matchingProducts = candidates.filter(matchesSpecificationFilters);
    total = matchingProducts.length;
    productList = matchingProducts.slice(offset, offset + pageSize);
  } else {
    const pagedQuery = baseQuery.limit(pageSize).offset(offset);
    const countQuery = db.select({ count: sql2`count(*)` }).from(products2).where(finalCondition);
    const [productResults, countResults] = await Promise.all([pagedQuery, countQuery]);
    productList = productResults;
    total = Number(countResults[0]?.count || 0);
  }
  const totalPages = Math.ceil(total / pageSize);
  return {
    products: productList,
    total,
    page,
    pageSize,
    totalPages
  };
}
var productsListInput;
var init_products_list_new = __esm({
  "server/products_list_new.ts"() {
    "use strict";
    productsListInput = z13.object({
      categoryId: z13.number().optional(),
      brand: z13.string().optional(),
      search: z13.string().optional(),
      // Advanced filters
      particleSizeMin: z13.number().optional(),
      particleSizeMax: z13.number().optional(),
      poreSizeMin: z13.number().optional(),
      poreSizeMax: z13.number().optional(),
      columnLengthMin: z13.number().optional(),
      columnLengthMax: z13.number().optional(),
      innerDiameterMin: z13.number().optional(),
      innerDiameterMax: z13.number().optional(),
      phaseTypes: z13.array(z13.string()).optional(),
      phMin: z13.number().optional(),
      phMax: z13.number().optional(),
      usp: z13.string().optional(),
      page: z13.number().min(1).default(1),
      pageSize: z13.number().min(1).max(100).default(24)
    }).optional();
  }
});

// server/email_notification.ts
var email_notification_exports = {};
__export(email_notification_exports, {
  sendCustomerMessageNotification: () => sendCustomerMessageNotification
});
import nodemailer from "nodemailer";
async function sendCustomerMessageNotification(data) {
  const transporter = createTransporter();
  if (!transporter) {
    console.error("Email transporter not configured");
    return { success: false, error: "Email service not configured" };
  }
  const typeLabels = {
    inquiry: "\u4EA7\u54C1\u8BE2\u4EF7",
    message: "\u5BA2\u6237\u7559\u8A00",
    quote_request: "\u62A5\u4EF7\u8BF7\u6C42"
  };
  const typeLabel = typeLabels[data.type] || "\u5BA2\u6237\u6D88\u606F";
  const subject = `[ROWELL\u7F51\u7AD9] \u65B0${typeLabel} - ${data.name}`;
  let htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
        \u65B0${typeLabel}\u901A\u77E5
      </h2>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">\u5BA2\u6237\u4FE1\u606F</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; width: 100px;"><strong>\u59D3\u540D:</strong></td>
            <td style="padding: 8px 0;">${data.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;"><strong>\u90AE\u7BB1:</strong></td>
            <td style="padding: 8px 0;"><a href="mailto:${data.email}" style="color: #2563eb;">${data.email}</a></td>
          </tr>
          ${data.phone ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280;"><strong>\u7535\u8BDD:</strong></td>
            <td style="padding: 8px 0;">${data.phone}</td>
          </tr>
          ` : ""}
          ${data.company ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280;"><strong>\u516C\u53F8:</strong></td>
            <td style="padding: 8px 0;">${data.company}</td>
          </tr>
          ` : ""}
        </table>
      </div>
  `;
  if (data.productId) {
    htmlContent += `
      <div style="background-color: #eff6ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2563eb;">
        <h3 style="margin-top: 0; color: #1e40af;">\u4EA7\u54C1\u4FE1\u606F</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; width: 100px;"><strong>\u4EA7\u54C1ID:</strong></td>
            <td style="padding: 8px 0;">${data.productId}</td>
          </tr>
          ${data.productPartNumber ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280;"><strong>Part Number:</strong></td>
            <td style="padding: 8px 0;">${data.productPartNumber}</td>
          </tr>
          ` : ""}
          ${data.productName ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280;"><strong>\u4EA7\u54C1\u540D\u79F0:</strong></td>
            <td style="padding: 8px 0;">${data.productName}</td>
          </tr>
          ` : ""}
        </table>
      </div>
    `;
  }
  htmlContent += `
      <div style="background-color: #ffffff; padding: 15px; border: 1px solid #e5e7eb; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">${data.type === "inquiry" ? "\u5BA2\u6237\u9700\u6C42" : "\u7559\u8A00\u5185\u5BB9"}</h3>
        <p style="white-space: pre-wrap; line-height: 1.6; color: #4b5563;">${data.message}</p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
        <p>\u6B64\u90AE\u4EF6\u7531ROWELL\u7F51\u7AD9\u81EA\u52A8\u53D1\u9001\uFF0C\u8BF7\u52FF\u76F4\u63A5\u56DE\u590D\u3002</p>
        <p>\u5982\u9700\u56DE\u590D\u5BA2\u6237\uFF0C\u8BF7\u4F7F\u7528\u5BA2\u6237\u63D0\u4F9B\u7684\u90AE\u7BB1\u5730\u5740: <a href="mailto:${data.email}" style="color: #2563eb;">${data.email}</a></p>
      </div>
    </div>
  `;
  try {
    const info = await transporter.sendMail({
      from: `"ROWELL\u7F51\u7AD9" <${EMAIL_CONFIG.auth.user}>`,
      to: RECIPIENT_EMAIL,
      subject,
      html: htmlContent
    });
    console.log("Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
var port, EMAIL_CONFIG, RECIPIENT_EMAIL, createTransporter;
var init_email_notification = __esm({
  "server/email_notification.ts"() {
    "use strict";
    port = parseInt(process.env.SMTP_PORT || "587");
    EMAIL_CONFIG = {
      // 使用环境变量配置SMTP
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port,
      secure: port === 465,
      // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };
    RECIPIENT_EMAIL = "oscar@rowellhplc.com";
    createTransporter = () => {
      try {
        return nodemailer.createTransport(EMAIL_CONFIG);
      } catch (error) {
        console.error("Failed to create email transporter:", error);
        return null;
      }
    };
  }
});

// server/db-usp.ts
var db_usp_exports = {};
__export(db_usp_exports, {
  fillProductUSPData: () => fillProductUSPData,
  getAllUSPStandards: () => getAllUSPStandards,
  getAllUSPStandardsWithProductCount: () => getAllUSPStandardsWithProductCount,
  getProductsByUSPStandard: () => getProductsByUSPStandard,
  getUSPStandardByCode: () => getUSPStandardByCode,
  getUSPStandardWithProducts: () => getUSPStandardWithProducts
});
import { and as and3, eq as eq8, like, or, sql as sql3 } from "drizzle-orm";
async function getAllUSPStandards() {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return await db.select().from(uspStandards).orderBy(uspStandards.code);
  } catch (error) {
    console.error("Error fetching USP standards:", error);
    throw new Error("Failed to fetch USP standards");
  }
}
async function getUSPStandardByCode(code) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const standard = await db.select().from(uspStandards).where(eq8(uspStandards.code, code)).limit(1);
    return standard[0] || null;
  } catch (error) {
    console.error(`Error fetching USP standard ${code}:`, error);
    throw new Error(`Failed to fetch USP standard ${code}`);
  }
}
async function getProductsByUSPStandard(uspCode, limit = 50) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return await db.select().from(products).where(and3(
      or(
        eq8(products.usp, uspCode),
        like(products.usp, `${uspCode},%`),
        like(products.usp, `%,${uspCode}`),
        like(products.usp, `%,${uspCode},%`)
      ),
      eq8(products.status, "active")
    )).orderBy(products.brand, products.name).limit(limit);
  } catch (error) {
    console.error(`Error fetching products for USP ${uspCode}:`, error);
    throw new Error(`Failed to fetch products for USP ${uspCode}`);
  }
}
async function getUSPStandardWithProducts(uspCode, productLimit = 50) {
  const standard = await getUSPStandardByCode(uspCode);
  if (!standard) return null;
  const matchedProducts = await getProductsByUSPStandard(uspCode, productLimit);
  return { standard, products: matchedProducts, productCount: matchedProducts.length };
}
async function getAllUSPStandardsWithProductCount() {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const standards = await getAllUSPStandards();
    return await Promise.all(standards.map(async (standard) => {
      const countResult = await db.select({ count: sql3`COUNT(*)` }).from(products).where(and3(
        or(
          eq8(products.usp, standard.code),
          like(products.usp, `${standard.code},%`),
          like(products.usp, `%,${standard.code}`),
          like(products.usp, `%,${standard.code},%`)
        ),
        eq8(products.status, "active")
      ));
      return { ...standard, productCount: Number(countResult[0]?.count || 0) };
    }));
  } catch (error) {
    console.error("Error fetching USP standards with product count:", error);
    throw new Error("Failed to fetch USP standards with product count");
  }
}
async function fillProductUSPData() {
  throw new Error(
    "Automatic USP classification is disabled. Use an evidence-backed product-data update instead."
  );
}
var init_db_usp = __esm({
  "server/db-usp.ts"() {
    "use strict";
    init_db();
    init_schema();
  }
});

// server/migrate-db.ts
var migrate_db_exports = {};
__export(migrate_db_exports, {
  migrateDatabase: () => migrateDatabase
});
async function migrateDatabase() {
  const db = await getDb();
  if (!db) {
    console.warn("[Migration] Database not available, skipping migration");
    return;
  }
  try {
    console.log("[Migration] Starting database migration...");
    const checkColumnQuery = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'passwordHash'
    `;
    const result = await db.execute(checkColumnQuery);
    if (Array.isArray(result) && result.length > 0) {
      console.log("[Migration] passwordHash column already exists, skipping migration");
      return;
    }
    console.log("[Migration] Adding password authentication support...");
    await db.execute("ALTER TABLE users MODIFY COLUMN openId VARCHAR(64) NULL");
    console.log("[Migration] \u2713 Modified openId to be nullable");
    await db.execute("ALTER TABLE users ADD COLUMN passwordHash VARCHAR(255) NULL");
    console.log("[Migration] \u2713 Added passwordHash column");
    try {
      await db.execute("ALTER TABLE users MODIFY COLUMN email VARCHAR(320) NOT NULL");
      console.log("[Migration] \u2713 Modified email to be NOT NULL");
    } catch (error) {
      console.log("[Migration] Email column already NOT NULL");
    }
    try {
      await db.execute("CREATE UNIQUE INDEX idx_users_email ON users(email)");
      console.log("[Migration] \u2713 Added unique index on email");
    } catch (error) {
      console.log("[Migration] Email index already exists");
    }
    const newColumns = [
      { name: "company", type: "VARCHAR(255)" },
      { name: "phone", type: "VARCHAR(50)" },
      { name: "country", type: "VARCHAR(100)" },
      { name: "industry", type: "VARCHAR(100)" },
      { name: "purchasingRole", type: "VARCHAR(100)" },
      { name: "annualPurchaseVolume", type: "VARCHAR(100)" }
    ];
    for (const column of newColumns) {
      try {
        await db.execute(`ALTER TABLE users ADD COLUMN ${column.name} ${column.type} NULL`);
        console.log(`[Migration] \u2713 Added ${column.name} column`);
      } catch (error) {
        console.log(`[Migration] ${column.name} column already exists`);
      }
    }
    console.log("[Migration] \u2705 Database migration completed successfully!");
  } catch (error) {
    console.error("[Migration] \u274C Migration failed:", error);
  }
}
var init_migrate_db = __esm({
  "server/migrate-db.ts"() {
    "use strict";
    init_db();
  }
});

// server/config-validator.ts
var config_validator_exports = {};
__export(config_validator_exports, {
  validateAllConfigs: () => validateAllConfigs,
  validateDatabaseConfig: () => validateDatabaseConfig,
  validateProductData: () => validateProductData
});
import { sql as sql5 } from "drizzle-orm";
function validateDatabaseConfig() {
  const dbUrl = process.env.DATABASE_URL || "";
  console.log("\n========================================");
  console.log("\u{1F50D} \u5F00\u59CB\u9A8C\u8BC1\u751F\u4EA7\u73AF\u5883\u914D\u7F6E...");
  console.log("========================================\n");
  if (!dbUrl) {
    console.error("\u274C \u9519\u8BEF\uFF1ADATABASE_URL\u73AF\u5883\u53D8\u91CF\u672A\u8BBE\u7F6E\uFF01");
    return false;
  }
  const expectedDbName = "rowell_workflow";
  if (!dbUrl.includes(expectedDbName)) {
    console.error("\u274C \u9519\u8BEF\uFF1A\u6570\u636E\u5E93\u914D\u7F6E\u9519\u8BEF\uFF01");
    console.error(`   \u9884\u671F\u6570\u636E\u5E93\uFF1A${expectedDbName}`);
    console.error(`   \u5F53\u524D\u914D\u7F6E\uFF1A${dbUrl.replace(/:[^:@]+@/, ":****@")}`);
    console.error("\n\u26A0\uFE0F  \u8B66\u544A\uFF1A\u5F53\u524D\u914D\u7F6E\u53EF\u80FD\u5BFC\u81F4\u4EA7\u54C1\u6570\u636E\u4E22\u5931\uFF01");
    console.error("   \u8BF7\u68C0\u67E5 PRODUCTION_CONFIG.md \u6587\u4EF6\u83B7\u53D6\u6B63\u786E\u914D\u7F6E\u3002\n");
    return false;
  }
  const expectedRegion = "ap-northeast-1";
  if (!dbUrl.includes(expectedRegion)) {
    console.warn("\u26A0\uFE0F  \u8B66\u544A\uFF1A\u6570\u636E\u5E93\u533A\u57DF\u53EF\u80FD\u4E0D\u6B63\u786E\uFF01");
    console.warn(`   \u9884\u671F\u533A\u57DF\uFF1A${expectedRegion}`);
    console.warn(`   \u5F53\u524D\u914D\u7F6E\uFF1A${dbUrl.replace(/:[^:@]+@/, ":****@")}`);
  }
  console.log("\u2705 \u6570\u636E\u5E93\u914D\u7F6E\u9A8C\u8BC1\u901A\u8FC7");
  console.log(`   \u6570\u636E\u5E93\u540D\u79F0\uFF1A${expectedDbName}`);
  console.log(`   \u533A\u57DF\uFF1A${expectedRegion}
`);
  return true;
}
async function validateProductData(db) {
  try {
    console.log("\u{1F50D} \u68C0\u67E5\u4EA7\u54C1\u6570\u636E\u5B8C\u6574\u6027...");
    if (!db) {
      console.warn("\u26A0\uFE0F  \u6570\u636E\u5E93\u4E0D\u53EF\u7528,\u8DF3\u8FC7\u4EA7\u54C1\u6570\u636E\u9A8C\u8BC1");
      return true;
    }
    const { products: products2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const result = await db.select({ count: sql5`count(*)` }).from(products2);
    const productCount = Number(result[0]?.count || 0);
    const minExpectedCount = 1e3;
    if (productCount < minExpectedCount) {
      console.error("\u274C \u9519\u8BEF\uFF1A\u4EA7\u54C1\u6570\u636E\u5F02\u5E38\uFF01");
      console.error(`   \u5F53\u524D\u4EA7\u54C1\u6570\u91CF\uFF1A${productCount}`);
      console.error(`   \u9884\u671F\u4EA7\u54C1\u6570\u91CF\uFF1A>${minExpectedCount}`);
      console.error("\n\u26A0\uFE0F  \u8B66\u544A\uFF1A\u53EF\u80FD\u8FDE\u63A5\u5230\u4E86\u9519\u8BEF\u7684\u6570\u636E\u5E93\uFF01");
      console.error("   \u8BF7\u7ACB\u5373\u68C0\u67E5DATABASE_URL\u914D\u7F6E\u3002\n");
      return false;
    }
    console.log("\u2705 \u4EA7\u54C1\u6570\u636E\u9A8C\u8BC1\u901A\u8FC7");
    console.log(`   \u4EA7\u54C1\u6570\u91CF\uFF1A${productCount}
`);
    return true;
  } catch (error) {
    console.error("\u274C \u9519\u8BEF\uFF1A\u65E0\u6CD5\u9A8C\u8BC1\u4EA7\u54C1\u6570\u636E");
    console.error("   ", error);
    console.warn("\u26A0\uFE0F  \u5C06\u7EE7\u7EED\u542F\u52A8\u670D\u52A1\u5668,\u4F46\u6570\u636E\u5E93\u529F\u80FD\u53EF\u80FD\u4E0D\u53EF\u7528");
    return true;
  }
}
async function validateAllConfigs(db) {
  const dbConfigValid = validateDatabaseConfig();
  if (!dbConfigValid) {
    console.error("\n========================================");
    console.error("\u274C \u914D\u7F6E\u9A8C\u8BC1\u5931\u8D25\uFF01\u670D\u52A1\u5668\u5C06\u62D2\u7EDD\u542F\u52A8\u3002");
    console.error("========================================\n");
    return false;
  }
  const productDataValid = await validateProductData(db);
  if (!productDataValid) {
    console.error("\n========================================");
    console.error("\u274C \u6570\u636E\u9A8C\u8BC1\u5931\u8D25\uFF01\u670D\u52A1\u5668\u5C06\u62D2\u7EDD\u542F\u52A8\u3002");
    console.error("========================================\n");
    return false;
  }
  console.log("========================================");
  console.log("\u2705 \u6240\u6709\u914D\u7F6E\u9A8C\u8BC1\u901A\u8FC7\uFF01\u670D\u52A1\u5668\u6B63\u5E38\u542F\u52A8\u3002");
  console.log("========================================\n");
  return true;
}
var init_config_validator = __esm({
  "server/config-validator.ts"() {
    "use strict";
  }
});

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/oauth.ts
init_db();

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_env();
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ");
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        if (!userInfo.openId || !userInfo.email) {
          throw ForbiddenError("OAuth user info is missing a required identifier");
        }
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      email: user.email,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId || !userInfo.email) {
        res.status(400).json({ error: "openId and email are required from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ")
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/imageSync.ts
init_db();
import { eq as eq2 } from "drizzle-orm";
function registerImageSyncRoutes(app) {
  app.post("/api/admin/imageSync", async (req, res) => {
    try {
      const startTime = Date.now();
      let csvText = "";
      if (req.is("text/csv") || req.is("text/plain")) {
        csvText = req.body;
      } else if (typeof req.body === "string") {
        csvText = req.body;
      } else {
        return res.status(400).json({
          success: false,
          error: "Invalid content type. Please send CSV data with Content-Type: text/csv"
        });
      }
      const lines = csvText.trim().split("\n");
      if (lines.length < 2) {
        return res.status(400).json({
          success: false,
          error: "CSV file must contain header and at least one data row"
        });
      }
      const header = lines[0].trim().toLowerCase();
      if (!header.includes("partnumber") || !header.includes("imageurl")) {
        return res.status(400).json({
          success: false,
          error: 'CSV header must contain "partNumber" and "imageUrl" columns'
        });
      }
      const updates = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(",");
        if (parts.length >= 2) {
          updates.push({
            partNumber: parts[0].trim(),
            imageUrl: parts[1].trim()
          });
        }
      }
      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No valid data rows found in CSV"
        });
      }
      const { products: products2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const db = await getDb();
      if (!db) {
        return res.status(500).json({
          success: false,
          error: "Database not available"
        });
      }
      let successCount = 0;
      let failedCount = 0;
      const failedProducts = [];
      for (const item of updates) {
        try {
          const existingProduct = await db.select({ id: products2.id, productId: products2.productId }).from(products2).where(eq2(products2.partNumber, item.partNumber)).limit(1);
          if (existingProduct.length > 0) {
            await db.update(products2).set({
              imageUrl: item.imageUrl,
              updatedAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ")
            }).where(eq2(products2.partNumber, item.partNumber));
            successCount++;
          } else {
            failedCount++;
            failedProducts.push({
              partNumber: item.partNumber,
              reason: "Product not found"
            });
          }
        } catch (error) {
          failedCount++;
          failedProducts.push({
            partNumber: item.partNumber,
            reason: error.message
          });
        }
      }
      const duration = Date.now() - startTime;
      return res.json({
        success: true,
        summary: {
          totalRows: updates.length,
          successCount,
          failedCount,
          duration: `${(duration / 1e3).toFixed(2)}s`
        },
        failedProducts: failedProducts.length > 0 ? failedProducts : void 0
      });
    } catch (error) {
      console.error("ImageSync API error:", error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  app.get("/api/admin/imageSync/status", async (req, res) => {
    try {
      const { products: products2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const db = await getDb();
      if (!db) {
        return res.status(500).json({
          success: false,
          error: "Database not available"
        });
      }
      const productsWithImages = await db.select().from(products2).where(eq2(products2.imageUrl, ""));
      const totalProducts = await db.select().from(products2);
      const withImages = totalProducts.length - productsWithImages.length;
      return res.json({
        success: true,
        stats: {
          totalProducts: totalProducts.length,
          withImages,
          withoutImages: productsWithImages.length,
          coverageRate: (withImages / totalProducts.length * 100).toFixed(1) + "%"
        }
      });
    } catch (error) {
      console.error("ImageSync status API error:", error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
init_db();
import { z as z14 } from "zod";

// server/admin-api.ts
import { z as z2 } from "zod";
var adminRouter = router({
  // Add GlycoWorks products
  addGlycoWorksProducts: publicProcedure.input((raw) => {
    return z2.object({
      adminKey: z2.string()
    }).parse(raw);
  }).mutation(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { products: products2, categories: categories2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq13, or: or2 } = await import("drizzle-orm");
    const db = await getDb2();
    if (!db) throw new Error("Database unavailable");
    const speCategories = await db.select().from(categories2).where(eq13(categories2.slug, "spe-cartridges"));
    if (speCategories.length === 0) {
      throw new Error("SPE Cartridges category not found");
    }
    const speCategoryId = speCategories[0].id;
    const existingProducts = await db.select().from(products2).where(
      or2(
        eq13(products2.partNumber, "WATS-186007239"),
        eq13(products2.partNumber, "WATS-186007080")
      )
    );
    const newProducts = [
      {
        partNumber: "WATS-186007239",
        productId: "WATS-186007239",
        prefix: "WATS",
        name: "GlycoWorks HILIC 1 cc Flangeless Cartridge",
        brand: "Waters",
        categoryId: speCategoryId,
        status: "active",
        createdAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " "),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ")
      },
      {
        partNumber: "WATS-186007080",
        productId: "WATS-186007080",
        prefix: "WATS",
        name: "GlycoWorks HILIC 1 cc Cartridge, 20/pk",
        brand: "Waters",
        categoryId: speCategoryId,
        status: "active",
        createdAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " "),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ")
      }
    ];
    const results = [];
    for (const product of newProducts) {
      const existing = existingProducts.find((p) => p.partNumber === product.partNumber);
      if (existing) {
        await db.update(products2).set({
          name: product.name,
          categoryId: product.categoryId,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ")
        }).where(eq13(products2.partNumber, product.partNumber));
        results.push({ partNumber: product.partNumber, action: "updated" });
      } else {
        await db.insert(products2).values(product);
        results.push({ partNumber: product.partNumber, action: "added" });
      }
    }
    return {
      success: true,
      results,
      categoryId: speCategoryId
    };
  }),
  // Batch update metaTitles for high-impression zero-click products
  batchUpdateMetaTitles: publicProcedure.input((raw) => {
    return z2.object({
      adminKey: z2.string(),
      updates: z2.array(z2.object({
        partNumber: z2.string(),
        metaTitle: z2.string()
      }))
    }).parse(raw);
  }).mutation(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { products: products2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq13 } = await import("drizzle-orm");
    const db = await getDb2();
    if (!db) throw new Error("Database unavailable");
    const results = [];
    for (const update of input.updates) {
      try {
        const existing = await db.select({ partNumber: products2.partNumber, metaTitle: products2.metaTitle }).from(products2).where(eq13(products2.partNumber, update.partNumber)).limit(1);
        if (existing.length === 0) {
          results.push({ partNumber: update.partNumber, status: "not_found" });
          continue;
        }
        await db.update(products2).set({ metaTitle: update.metaTitle, updatedAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ") }).where(eq13(products2.partNumber, update.partNumber));
        results.push({
          partNumber: update.partNumber,
          status: "updated",
          oldMetaTitle: existing[0].metaTitle,
          newMetaTitle: update.metaTitle
        });
      } catch (err) {
        results.push({ partNumber: update.partNumber, status: "error", error: String(err) });
      }
    }
    return { success: true, results };
  }),
  // Batch update metaTitles by product ID (for products where partNumber-based update fails)
  batchUpdateMetaTitlesById: publicProcedure.input((raw) => {
    return z2.object({
      adminKey: z2.string(),
      updates: z2.array(z2.object({
        id: z2.number(),
        metaTitle: z2.string(),
        metaDescription: z2.string().optional(),
        detailedDescription: z2.string().optional()
      }))
    }).parse(raw);
  }).mutation(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { products: products2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq13 } = await import("drizzle-orm");
    const db = await getDb2();
    if (!db) throw new Error("Database unavailable");
    const results = [];
    for (const update of input.updates) {
      try {
        const existing = await db.select({ id: products2.id, partNumber: products2.partNumber, metaTitle: products2.metaTitle }).from(products2).where(eq13(products2.id, update.id)).limit(1);
        if (existing.length === 0) {
          results.push({ id: update.id, status: "not_found" });
          continue;
        }
        const setFields = { metaTitle: update.metaTitle };
        if (update.metaDescription !== void 0) {
          setFields.metaDescription = update.metaDescription;
        }
        if (update.detailedDescription !== void 0) {
          setFields.detailedDescription = update.detailedDescription;
        }
        await db.update(products2).set(setFields).where(eq13(products2.id, update.id));
        results.push({
          id: update.id,
          partNumber: existing[0].partNumber,
          status: "updated",
          oldMetaTitle: existing[0].metaTitle,
          newMetaTitle: update.metaTitle
        });
      } catch (err) {
        results.push({ id: update.id, status: "error", error: String(err) });
      }
    }
    return { success: true, results };
  }),
  // Clear public product descriptions only. This endpoint is intentionally
  // destructive-only: it cannot create or alter product facts, specifications,
  // status, pricing, or images.
  batchClearProductDescriptions: publicProcedure.input((raw) => {
    return z2.object({
      adminKey: z2.string(),
      ids: z2.array(z2.number().int().positive()).min(1).max(50)
    }).parse(raw);
  }).mutation(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { products: products2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq13 } = await import("drizzle-orm");
    const db = await getDb2();
    if (!db) throw new Error("Database unavailable");
    const results = [];
    for (const id of input.ids) {
      try {
        const existing = await db.select({ id: products2.id, partNumber: products2.partNumber }).from(products2).where(eq13(products2.id, id)).limit(1);
        if (existing.length === 0) {
          results.push({ id, status: "not_found" });
          continue;
        }
        await db.update(products2).set({ description: null, detailedDescription: null }).where(eq13(products2.id, id));
        results.push({ id, partNumber: existing[0].partNumber, status: "cleared" });
      } catch (err) {
        results.push({ id, status: "error", error: String(err) });
      }
    }
    return { success: true, results };
  }),
  // Bind approved product images by numeric product ID. Restrict image URLs to the
  // controlled Manus CDN to prevent arbitrary external image injection.
  batchUpdateProductImageUrls: publicProcedure.input((raw) => {
    return z2.object({
      adminKey: z2.string(),
      updates: z2.array(z2.object({
        id: z2.number().int().positive(),
        imageUrl: z2.string().url().max(500).refine(
          (url) => url.startsWith("https://files.manuscdn.com/"),
          "imageUrl must use the controlled files.manuscdn.com domain"
        )
      })).min(1).max(50)
    }).parse(raw);
  }).mutation(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { products: products2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq13 } = await import("drizzle-orm");
    const db = await getDb2();
    if (!db) throw new Error("Database unavailable");
    const results = [];
    for (const update of input.updates) {
      try {
        const existing = await db.select({ id: products2.id, partNumber: products2.partNumber, imageUrl: products2.imageUrl }).from(products2).where(eq13(products2.id, update.id)).limit(1);
        if (existing.length === 0) {
          results.push({ id: update.id, status: "not_found" });
          continue;
        }
        await db.update(products2).set({ imageUrl: update.imageUrl, updatedAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ") }).where(eq13(products2.id, update.id));
        results.push({
          id: update.id,
          partNumber: existing[0].partNumber,
          status: "updated",
          oldImageUrl: existing[0].imageUrl,
          newImageUrl: update.imageUrl
        });
      } catch (error) {
        results.push({ id: update.id, status: "error", error: String(error) });
      }
    }
    return {
      success: results.every((result) => result.status === "updated"),
      totalUpdated: results.filter((result) => result.status === "updated").length,
      results
    };
  }),
  // Remove public images that have been audited as incorrect, branded, or otherwise noncompliant.
  // This destructive-only endpoint cannot bind a replacement image or modify product facts.
  batchClearProductImages: publicProcedure.input((raw) => {
    return z2.object({
      adminKey: z2.string(),
      ids: z2.array(z2.number().int().positive()).min(1).max(50)
    }).parse(raw);
  }).mutation(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { products: products2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq13 } = await import("drizzle-orm");
    const db = await getDb2();
    if (!db) throw new Error("Database unavailable");
    const results = [];
    for (const id of input.ids) {
      try {
        const existing = await db.select({ id: products2.id, partNumber: products2.partNumber, imageUrl: products2.imageUrl }).from(products2).where(eq13(products2.id, id)).limit(1);
        if (existing.length === 0) {
          results.push({ id, status: "not_found" });
          continue;
        }
        await db.update(products2).set({ imageUrl: null, updatedAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ") }).where(eq13(products2.id, id));
        results.push({
          id,
          partNumber: existing[0].partNumber,
          status: "cleared",
          oldImageUrl: existing[0].imageUrl
        });
      } catch (error) {
        results.push({ id, status: "error", error: String(error) });
      }
    }
    return {
      success: results.every((result) => result.status === "cleared"),
      totalCleared: results.filter((result) => result.status === "cleared").length,
      results
    };
  }),
  // Correct verified product identity and raw specifications only. This endpoint intentionally excludes
  // prices, inventory, fulfillment promises, image URLs, and status to keep evidence-backed corrections narrow.
  batchCorrectVerifiedProductFacts: publicProcedure.input((raw) => {
    return z2.object({
      adminKey: z2.string(),
      updates: z2.array(z2.object({
        id: z2.number().int().positive(),
        name: z2.string().min(3).max(255),
        description: z2.string().max(3e3).nullable().optional(),
        detailedDescription: z2.string().max(12e3).nullable().optional(),
        productType: z2.string().max(100).optional(),
        category: z2.string().max(100).optional(),
        applications: z2.string().max(1e3).nullable().optional(),
        particleSize: z2.string().max(50).nullable().optional(),
        poreSize: z2.string().max(50).nullable().optional(),
        columnLength: z2.string().max(50).nullable().optional(),
        innerDiameter: z2.string().max(50).nullable().optional(),
        phRange: z2.string().max(50).nullable().optional(),
        maxPressure: z2.string().max(50).nullable().optional(),
        maxTemperature: z2.string().max(50).nullable().optional(),
        usp: z2.string().max(50).nullable().optional(),
        phaseType: z2.string().max(100).nullable().optional(),
        particleSizeNum: z2.number().int().positive().nullable().optional(),
        poreSizeNum: z2.number().int().positive().nullable().optional(),
        columnLengthNum: z2.number().int().positive().nullable().optional(),
        innerDiameterNum: z2.number().int().positive().nullable().optional(),
        phMin: z2.number().int().nullable().optional(),
        phMax: z2.number().int().nullable().optional(),
        catalogUrl: z2.string().url().max(500).optional(),
        metaTitle: z2.string().max(70).optional(),
        metaDescription: z2.string().max(155).optional()
      })).min(1).max(10)
    }).parse(raw);
  }).mutation(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { products: products2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq13 } = await import("drizzle-orm");
    const db = await getDb2();
    if (!db) throw new Error("Database unavailable");
    const results = [];
    for (const update of input.updates) {
      try {
        const existing = await db.select({ id: products2.id, partNumber: products2.partNumber }).from(products2).where(eq13(products2.id, update.id)).limit(1);
        if (existing.length === 0) {
          results.push({ id: update.id, status: "not_found" });
          continue;
        }
        const setFields = { name: update.name, updatedAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ") };
        const optionalFields = [
          "description",
          "detailedDescription",
          "productType",
          "category",
          "applications",
          "particleSize",
          "poreSize",
          "columnLength",
          "innerDiameter",
          "phRange",
          "maxPressure",
          "maxTemperature",
          "usp",
          "phaseType",
          "particleSizeNum",
          "poreSizeNum",
          "columnLengthNum",
          "innerDiameterNum",
          "phMin",
          "phMax",
          "catalogUrl",
          "metaTitle",
          "metaDescription"
        ];
        for (const field of optionalFields) {
          if (update[field] !== void 0) setFields[field] = update[field];
        }
        await db.update(products2).set(setFields).where(eq13(products2.id, update.id));
        results.push({
          id: update.id,
          partNumber: existing[0].partNumber,
          status: "updated",
          changedFields: Object.keys(setFields).filter((field) => field !== "updatedAt")
        });
      } catch (error) {
        results.push({ id: update.id, status: "error", error: String(error) });
      }
    }
    return {
      success: results.every((result) => result.status === "updated"),
      totalUpdated: results.filter((result) => result.status === "updated").length,
      results
    };
  }),
  // Correct verified product dimensions and display names only; intentionally narrow to prevent broad product edits.
  batchCorrectProductDimensions: publicProcedure.input((raw) => {
    return z2.object({
      adminKey: z2.string(),
      updates: z2.array(z2.object({
        id: z2.number(),
        name: z2.string().min(3).max(255).optional(),
        columnLength: z2.string().regex(/^\d+(?:\.\d+)?mm$/),
        columnLengthNum: z2.number().positive()
      })).min(1).max(50)
    }).parse(raw);
  }).mutation(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { products: products2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq13 } = await import("drizzle-orm");
    const db = await getDb2();
    if (!db) throw new Error("Database unavailable");
    const results = [];
    for (const update of input.updates) {
      const existing = await db.select({ id: products2.id, partNumber: products2.partNumber, name: products2.name, columnLength: products2.columnLength }).from(products2).where(eq13(products2.id, update.id)).limit(1);
      if (existing.length === 0) {
        results.push({ id: update.id, status: "not_found" });
        continue;
      }
      await db.update(products2).set({
        ...update.name ? { name: update.name } : {},
        columnLength: update.columnLength,
        columnLengthNum: update.columnLengthNum
      }).where(eq13(products2.id, update.id));
      results.push({
        id: update.id,
        partNumber: existing[0].partNumber,
        status: "updated",
        oldName: existing[0].name,
        newName: update.name ?? existing[0].name,
        oldColumnLength: existing[0].columnLength,
        newColumnLength: update.columnLength
      });
    }
    return { success: true, results };
  }),
  // Check data consistency
  checkDataConsistency: publicProcedure.input((raw) => {
    return z2.object({
      adminKey: z2.string()
    }).parse(raw);
  }).query(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { products: products2, categories: categories2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq13, sql: sql6 } = await import("drizzle-orm");
    const db = await getDb2();
    if (!db) throw new Error("Database unavailable");
    const totalProductsResult = await db.select({ count: sql6`count(*)` }).from(products2);
    const totalProducts = totalProductsResult[0].count;
    const activeProductsResult = await db.select({ count: sql6`count(*)` }).from(products2).where(eq13(products2.status, "active"));
    const activeProducts = activeProductsResult[0].count;
    const categoryStats = await db.select({
      categoryId: products2.categoryId,
      categoryName: categories2.nameEn,
      count: sql6`count(*)`
    }).from(products2).leftJoin(categories2, eq13(products2.categoryId, categories2.id)).groupBy(products2.categoryId, categories2.nameEn);
    const nullCategoryResult = await db.select({ count: sql6`count(*)` }).from(products2).where(sql6`${products2.categoryId} IS NULL`);
    const nullCategoryCount = nullCategoryResult[0].count;
    const duplicates = await db.execute(sql6`
        SELECT part_number, COUNT(*) as count 
        FROM products 
        GROUP BY part_number 
        HAVING count > 1
      `);
    const watersProductsResult = await db.select({ count: sql6`count(*)` }).from(products2).where(eq13(products2.brand, "Waters"));
    const watersProducts = watersProductsResult[0].count;
    return {
      totalProducts,
      activeProducts,
      categoryStats,
      nullCategoryCount,
      duplicatePartNumbers: duplicates,
      watersProducts
    };
  }),
  // Batch create resources/articles
  createResources: publicProcedure.input((raw) => {
    return z2.object({
      adminKey: z2.string(),
      resources: z2.array(z2.object({
        title: z2.string(),
        slug: z2.string(),
        content: z2.string(),
        excerpt: z2.string().optional(),
        category: z2.string().optional(),
        author: z2.string().optional(),
        tags: z2.array(z2.string()).optional(),
        publishedAt: z2.string().optional(),
        status: z2.string().optional()
      }))
    }).parse(raw);
  }).mutation(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { resources: resources2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const db = await getDb2();
    if (!db) throw new Error("Database unavailable");
    const results = [];
    for (const resource of input.resources) {
      try {
        const now = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ");
        await db.insert(resources2).values({
          title: resource.title,
          slug: resource.slug,
          content: resource.content,
          excerpt: resource.excerpt || null,
          category: resource.category || null,
          author: resource.author || null,
          tags: resource.tags ? JSON.stringify(resource.tags) : null,
          publishedAt: resource.publishedAt || now,
          status: resource.status || "published",
          views: 0,
          createdAt: now,
          updatedAt: now
        });
        results.push({ slug: resource.slug, status: "created" });
      } catch (err) {
        if (err?.message?.includes("Duplicate")) {
          results.push({ slug: resource.slug, status: "duplicate_skipped" });
        } else {
          results.push({ slug: resource.slug, status: "error", error: String(err) });
        }
      }
    }
    return { success: true, results };
  }),
  // List all draft resources (for date update)
  listDraftResources: publicProcedure.input((raw) => {
    return z2.object({
      adminKey: z2.string(),
      limit: z2.number().optional()
    }).parse(raw);
  }).query(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { resources: resources2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq13, desc: desc4 } = await import("drizzle-orm");
    const db = await getDb2();
    if (!db) throw new Error("Database unavailable");
    const items = await db.select({ id: resources2.id, title: resources2.title, slug: resources2.slug, publishedAt: resources2.publishedAt, status: resources2.status }).from(resources2).where(eq13(resources2.status, "draft")).orderBy(desc4(resources2.id)).limit(input.limit || 200);
    return { success: true, count: items.length, items };
  }),
  // Batch update publishedAt dates for resources
  updateResourcesDates: publicProcedure.input((raw) => {
    return z2.object({
      adminKey: z2.string(),
      updates: z2.array(z2.object({
        id: z2.number(),
        publishedAt: z2.string()
      }))
    }).parse(raw);
  }).mutation(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { resources: resources2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq13 } = await import("drizzle-orm");
    const db = await getDb2();
    if (!db) throw new Error("Database unavailable");
    let updated = 0;
    for (const update of input.updates) {
      await db.update(resources2).set({ publishedAt: update.publishedAt }).where(eq13(resources2.id, update.id));
      updated++;
    }
    return { success: true, updated };
  }),
  // Batch update resource/article content by numeric ID. This is used for
  // audited editorial updates such as adding topic-relevant internal links.
  batchUpdateResourceContents: publicProcedure.input((raw) => {
    return z2.object({
      adminKey: z2.string(),
      updates: z2.array(z2.object({
        id: z2.number(),
        content: z2.string().min(1)
      })).min(1).max(150)
    }).parse(raw);
  }).mutation(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { resources: resources2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq13 } = await import("drizzle-orm");
    const db = await getDb2();
    if (!db) throw new Error("Database unavailable");
    const results = [];
    const now = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ");
    for (const update of input.updates) {
      try {
        await db.update(resources2).set({ content: update.content, updatedAt: now }).where(eq13(resources2.id, update.id));
        results.push({ id: update.id, status: "updated" });
      } catch (error) {
        console.error("[Admin] Failed to update resource content:", update.id, error);
        results.push({ id: update.id, status: "error" });
      }
    }
    return {
      success: results.every((result) => result.status === "updated"),
      totalUpdated: results.filter((result) => result.status === "updated").length,
      results
    };
  }),
  // Batch update article content by numeric ID. This is intentionally restricted to
  // audited editorial syncs and does not expose article metadata, author, status, or product fields.
  batchUpdateArticleContents: publicProcedure.input((raw) => {
    return z2.object({
      adminKey: z2.string(),
      updates: z2.array(z2.object({
        id: z2.number().int().positive(),
        content: z2.string().min(1).max(6e4)
      })).min(1).max(25)
    }).parse(raw);
  }).mutation(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { articles: articles2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq13 } = await import("drizzle-orm");
    const db = await getDb2();
    if (!db) throw new Error("Database unavailable");
    const results = [];
    const now = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ");
    for (const update of input.updates) {
      try {
        const existing = await db.select({ id: articles2.id }).from(articles2).where(eq13(articles2.id, update.id)).limit(1);
        if (existing.length === 0) {
          results.push({ id: update.id, status: "not_found" });
          continue;
        }
        await db.update(articles2).set({ content: update.content, updatedAt: now }).where(eq13(articles2.id, update.id));
        results.push({ id: update.id, status: "updated" });
      } catch (error) {
        results.push({ id: update.id, status: "error", error: String(error) });
      }
    }
    return {
      success: results.every((result) => result.status === "updated"),
      totalUpdated: results.filter((result) => result.status === "updated").length,
      results
    };
  }),
  // Batch set product status (active/inactive) by product ID list.
  // Used for bulk product discontinuation/reactivation operations.
  batchSetProductStatus: publicProcedure.input((raw) => {
    return z2.object({
      adminKey: z2.string(),
      productIds: z2.array(z2.number()),
      status: z2.enum(["active", "inactive"])
    }).parse(raw);
  }).mutation(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { products: products2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { inArray: inArray2 } = await import("drizzle-orm");
    const db = await getDb2();
    if (!db) throw new Error("Database unavailable");
    const results = [];
    const batchSize = 50;
    let totalUpdated = 0;
    for (let i = 0; i < input.productIds.length; i += batchSize) {
      const batch = input.productIds.slice(i, i + batchSize);
      try {
        await db.update(products2).set({ status: input.status }).where(inArray2(products2.id, batch));
        batch.forEach((id) => results.push({ id, status: "updated" }));
        totalUpdated += batch.length;
      } catch (err) {
        batch.forEach((id) => results.push({ id, status: "error" }));
      }
    }
    return { success: true, totalUpdated, results };
  }),
  // Batch import new products from CSV data (SUBTASK-005)
  batchImportProducts: publicProcedure.input((raw) => {
    return z2.object({
      adminKey: z2.string(),
      products: z2.array(z2.object({
        brand: z2.string(),
        partNumber: z2.string(),
        name: z2.string(),
        productType: z2.string(),
        description: z2.string().optional(),
        detailedDescription: z2.string().optional(),
        particleSize: z2.string().optional(),
        poreSize: z2.string().optional(),
        columnLength: z2.string().optional(),
        innerDiameter: z2.string().optional(),
        phaseType: z2.string().optional(),
        applications: z2.string().optional()
      }))
    }).parse(raw);
  }).mutation(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const { getPool: getPool2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const pool = await getPool2();
    if (!pool) throw new Error("Database pool not available");
    const brandPrefixMap = {
      "Thermo Fisher": "THER",
      "Agilent": "AGIL",
      "Restek": "RES",
      "Phenomenex": "PHE"
    };
    const categoryIdMap = {
      "HPLC Column": 1,
      "GC Column": 30001
    };
    const extractNum = (s) => {
      if (!s) return null;
      const m = s.match(/[\d.]+/);
      return m ? Math.round(parseFloat(m[0])) : null;
    };
    const extractColumnLengthMm = (s) => {
      if (!s) return null;
      const m = s.match(/[\d.]+/);
      if (!m) return null;
      const val = parseFloat(m[0]);
      if (s.includes("m") && !s.toLowerCase().includes("mm")) {
        return Math.round(val * 1e3);
      }
      return Math.round(val);
    };
    const results = [];
    let inserted = 0, skipped = 0, errors = 0;
    const now = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ");
    for (const row of input.products) {
      try {
        const [existRows] = await pool.execute(
          "SELECT id FROM products WHERE partNumber = ? LIMIT 1",
          [row.partNumber]
        );
        if (existRows.length > 0) {
          skipped++;
          results.push({ partNumber: row.partNumber, action: "skipped", error: "already exists" });
          continue;
        }
        const prefix = brandPrefixMap[row.brand];
        if (!prefix) {
          errors++;
          results.push({ partNumber: row.partNumber, action: "error", error: `Unknown brand: ${row.brand}` });
          continue;
        }
        const productId = `${prefix}-${row.partNumber}`;
        const categoryId = categoryIdMap[row.productType] ?? null;
        await pool.execute(
          `INSERT INTO products
              (productId, partNumber, brand, prefix, name, productType, description, detailedDescription,
               particleSize, particleSizeNum, poreSize, poreSizeNum,
               columnLength, columnLengthNum, innerDiameter, innerDiameterNum,
               phaseType, applications, imageUrl, category_id, status, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 'active', ?, ?)`,
          [
            productId,
            row.partNumber,
            row.brand,
            prefix,
            row.name,
            row.productType,
            row.description || null,
            row.detailedDescription || null,
            row.particleSize || null,
            extractNum(row.particleSize),
            row.poreSize || null,
            extractNum(row.poreSize),
            row.columnLength || null,
            extractColumnLengthMm(row.columnLength),
            row.innerDiameter || null,
            extractNum(row.innerDiameter),
            row.phaseType || null,
            row.applications || null,
            categoryId,
            now,
            now
          ]
        );
        inserted++;
        results.push({ partNumber: row.partNumber, action: "inserted", productId });
      } catch (err) {
        errors++;
        const errDetail = `code=${err.code} errno=${err.errno} sqlMessage=${err.sqlMessage} msg=${err.message}`;
        results.push({ partNumber: row.partNumber, action: "error", error: errDetail });
      }
    }
    return {
      success: true,
      summary: { inserted, skipped, errors, total: input.products.length },
      results
    };
  }),
  // Publish all draft resources (for scheduled task on 2026-06-10)
  publishDraftResources: publicProcedure.input((raw) => {
    return z2.object({
      adminKey: z2.string()
    }).parse(raw);
  }).mutation(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { resources: resources2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq13 } = await import("drizzle-orm");
    const db = await getDb2();
    if (!db) throw new Error("Database unavailable");
    const now = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ");
    const result = await db.update(resources2).set({ status: "published", updatedAt: now }).where(eq13(resources2.status, "draft"));
    return { success: true, message: "All draft resources have been published." };
  })
});

// server/list-categories-api.ts
import { z as z3 } from "zod";
var listCategoriesRouter = router({
  // List all categories
  listAll: publicProcedure.input((raw) => {
    return z3.object({
      adminKey: z3.string()
    }).parse(raw);
  }).query(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { categories: categories2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const db = await getDb2();
    if (!db) throw new Error("Database not available");
    const allCategories = await db.select().from(categories2);
    return {
      success: true,
      categories: allCategories.map((c) => ({
        id: c.id,
        name: c.name,
        nameEn: c.nameEn,
        slug: c.slug,
        parentId: c.parentId,
        level: c.level
      }))
    };
  })
});

// server/update-product-category.ts
import { z as z4 } from "zod";
var updateProductCategoryRouter = router({
  // Update product category by part numbers
  updateByPartNumbers: publicProcedure.input((raw) => {
    return z4.object({
      adminKey: z4.string(),
      partNumbers: z4.array(z4.string()),
      categoryId: z4.number()
    }).parse(raw);
  }).mutation(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { products: products2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq13, inArray: inArray2, sql: sql6 } = await import("drizzle-orm");
    const db = await getDb2();
    if (!db) throw new Error("Database not available");
    const results = [];
    for (const partNumber of input.partNumbers) {
      await db.execute(sql6`UPDATE products SET category_id = ${input.categoryId}, updatedAt = NOW() WHERE partNumber = ${partNumber}`);
      results.push({ partNumber, action: "updated" });
    }
    return {
      success: true,
      results,
      categoryId: input.categoryId
    };
  })
});

// server/update-glycoworks-mysql2.ts
import { z as z5 } from "zod";
import mysql2 from "mysql2/promise";
var updateGlycoWorksMysql2Router = router({
  updateDirect: publicProcedure.input((raw) => {
    return z5.object({
      adminKey: z5.string()
    }).parse(raw);
  }).mutation(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const connection = await mysql2.createConnection({
      uri: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: true
      }
    });
    try {
      const [result1] = await connection.execute(
        "UPDATE products SET category_id = ? WHERE id = ?",
        [16, 31323]
      );
      const [result2] = await connection.execute(
        "UPDATE products SET category_id = ? WHERE id = ?",
        [16, 31324]
      );
      await connection.execute(
        "INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE category_id = ?, is_primary = 1",
        [31323, 16, 16]
      );
      await connection.execute(
        "INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE category_id = ?, is_primary = 1",
        [31324, 16, 16]
      );
      const [productsRows] = await connection.execute(
        "SELECT id, productId, category_id FROM products WHERE id IN (?, ?)",
        [31323, 31324]
      );
      const [categoriesRows] = await connection.execute(
        "SELECT * FROM product_categories WHERE product_id IN (?, ?)",
        [31323, 31324]
      );
      return {
        success: true,
        updated: [
          { id: 31323, affectedRows: result1.affectedRows },
          { id: 31324, affectedRows: result2.affectedRows }
        ],
        productsVerification: productsRows,
        productCategoriesVerification: categoriesRows
      };
    } finally {
      await connection.end();
    }
  })
});

// server/cleanup-product-categories.ts
import { z as z6 } from "zod";
import mysql3 from "mysql2/promise";
var cleanupProductCategoriesRouter = router({
  removeOldCategories: publicProcedure.input((raw) => {
    return z6.object({
      adminKey: z6.string()
    }).parse(raw);
  }).mutation(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const connection = await mysql3.createConnection({
      uri: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: true
      }
    });
    try {
      const [result] = await connection.execute(
        "DELETE FROM product_categories WHERE product_id IN (?, ?) AND category_id = ?",
        [31323, 31324, 8]
      );
      const [rows] = await connection.execute(
        "SELECT * FROM product_categories WHERE product_id IN (?, ?)",
        [31323, 31324]
      );
      return {
        success: true,
        deleted: result.affectedRows,
        remainingAssociations: rows
      };
    } finally {
      await connection.end();
    }
  })
});

// server/check-data-consistency.ts
import { z as z7 } from "zod";
import mysql4 from "mysql2/promise";
var checkDataConsistencyRouter = router({
  getStats: publicProcedure.input((raw) => {
    return z7.object({
      adminKey: z7.string()
    }).parse(raw);
  }).query(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const connection = await mysql4.createConnection({
      uri: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: true
      }
    });
    try {
      const [totalRows] = await connection.execute(
        "SELECT COUNT(*) as total FROM products"
      );
      const [activeRows] = await connection.execute(
        "SELECT COUNT(*) as total FROM products WHERE status = ?",
        ["active"]
      );
      const [withCategoryRows] = await connection.execute(
        "SELECT COUNT(DISTINCT product_id) as total FROM product_categories"
      );
      const [withoutCategoryRows] = await connection.execute(
        "SELECT COUNT(*) as total FROM products WHERE id NOT IN (SELECT DISTINCT product_id FROM product_categories)"
      );
      const [categoryDist] = await connection.execute(
        "SELECT c.id, c.name_en as name, COUNT(pc.product_id) as product_count FROM categories c LEFT JOIN product_categories pc ON c.id = pc.category_id GROUP BY c.id, c.name_en ORDER BY product_count DESC LIMIT 20"
      );
      return {
        success: true,
        stats: {
          totalProducts: totalRows[0].total,
          activeProducts: activeRows[0].total,
          productsWithCategory: withCategoryRows[0].total,
          productsWithoutCategory: withoutCategoryRows[0].total,
          topCategories: categoryDist
        }
      };
    } finally {
      await connection.end();
    }
  })
});

// server/describe-products-table.ts
import { z as z8 } from "zod";
import mysql5 from "mysql2/promise";
var describeProductsTableRouter = router({
  getSchema: publicProcedure.input((raw) => {
    return z8.object({
      adminKey: z8.string()
    }).parse(raw);
  }).query(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const connection = await mysql5.createConnection({
      uri: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: true
      }
    });
    try {
      const [columns] = await connection.execute("SHOW COLUMNS FROM products");
      return {
        success: true,
        columns
      };
    } finally {
      await connection.end();
    }
  })
});

// server/query-categories.ts
import { z as z9 } from "zod";
import mysql6 from "mysql2/promise";
var queryCategoriesRouter = router({
  // Query all categories
  listAll: publicProcedure.input((raw) => {
    return z9.object({
      adminKey: z9.string()
    }).parse(raw);
  }).query(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const connection = await mysql6.createConnection({
      uri: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: true
      }
    });
    try {
      const [rows] = await connection.execute(
        "SELECT id, name, name_en as nameEn, slug, parent_id as parentId, level FROM categories ORDER BY id"
      );
      return {
        success: true,
        categories: rows
      };
    } finally {
      await connection.end();
    }
  })
});

// server/full-consistency-check.ts
import mysql7 from "mysql2/promise";
var fullConsistencyCheckRouter = router({
  run: publicProcedure.query(async () => {
    const connection = await mysql7.createConnection({
      uri: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: true }
    });
    try {
      const results = {};
      const [totalRows] = await connection.execute(
        "SELECT COUNT(*) as total FROM products"
      );
      results.totalProducts = totalRows[0].total;
      const [activeRows] = await connection.execute(
        "SELECT COUNT(*) as total FROM products WHERE status = ?",
        ["active"]
      );
      results.activeProducts = activeRows[0].total;
      const [withCategoryRows] = await connection.execute(
        "SELECT COUNT(DISTINCT product_id) as total FROM product_categories"
      );
      results.productsWithCategory = withCategoryRows[0].total;
      const [withoutCategoryRows] = await connection.execute(
        'SELECT COUNT(*) as total FROM products WHERE status = "active" AND id NOT IN (SELECT DISTINCT product_id FROM product_categories)'
      );
      results.orphanProducts = withoutCategoryRows[0].total;
      const [inconsistentRows] = await connection.execute(`
          SELECT COUNT(*) as total FROM products p
          JOIN product_categories pc ON p.id = pc.product_id AND pc.is_primary = 1
          WHERE p.category_id != pc.category_id
        `);
      results.inconsistentCategoryId = inconsistentRows[0].total;
      const [categoryDist] = await connection.execute(`
          SELECT c.id, c.name_en as name, c.slug, COUNT(pc.product_id) as product_count
          FROM categories c
          LEFT JOIN product_categories pc ON c.id = pc.category_id
          GROUP BY c.id, c.name_en, c.slug
          ORDER BY product_count DESC
          LIMIT 30
        `);
      results.categoryDistribution = categoryDist;
      const [duplicateRows] = await connection.execute(`
          SELECT COUNT(*) as total FROM (
            SELECT product_id, category_id, COUNT(*) as count
            FROM product_categories
            GROUP BY product_id, category_id
            HAVING count > 1
          ) as duplicates
        `);
      results.duplicateAssociations = duplicateRows[0].total;
      const [multiplePrimaryRows] = await connection.execute(`
          SELECT COUNT(*) as total FROM (
            SELECT product_id, COUNT(*) as primary_count
            FROM product_categories
            WHERE is_primary = 1
            GROUP BY product_id
            HAVING primary_count > 1
          ) as multiples
        `);
      results.multiplePrimaryProducts = multiplePrimaryRows[0].total;
      if (results.orphanProducts > 0) {
        const [orphanSamples] = await connection.execute(`
            SELECT id, productId, partNumber, brand, productName, category_id, status
            FROM products
            WHERE status = "active" AND id NOT IN (SELECT DISTINCT product_id FROM product_categories)
            LIMIT 20
          `);
        results.orphanSamples = orphanSamples;
      }
      return {
        success: true,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        results
      };
    } finally {
      await connection.end();
    }
  })
});

// server/get-orphan-products.ts
import mysql8 from "mysql2/promise";
var getOrphanProductsRouter = router({
  getAll: publicProcedure.query(async () => {
    const connection = await mysql8.createConnection({
      uri: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: true }
    });
    try {
      const [rows] = await connection.execute(`
          SELECT id, productId, partNumber, brand, productName, category_id, status
          FROM products
          WHERE status = 'active' 
            AND id NOT IN (SELECT DISTINCT product_id FROM product_categories)
          ORDER BY brand, productName
        `);
      return {
        success: true,
        count: rows.length,
        products: rows
      };
    } finally {
      await connection.end();
    }
  })
});

// server/batch-fix-orphan-products.ts
import mysql9 from "mysql2/promise";
function classifyProduct(productName, brand) {
  const name = productName.toLowerCase();
  if (brand === "Restek") {
    if (name.includes("raptor")) {
      if (name.includes("polar x") || name.includes("inert polar x")) {
        return 8;
      }
      return 4;
    }
    if (name.includes("ultra") && name.includes("ibd")) {
      return 4;
    }
    if (name.includes("allure")) {
      return 4;
    }
    if (name.includes("pfas")) {
      return 4;
    }
  }
  if (brand === "Daicel") {
    if (name.includes("chiralpak") || name.includes("chiralcel")) {
      return 15;
    }
  }
  if (name.includes("c18")) return 4;
  if (name.includes("c8")) return 5;
  if (name.includes("silica")) return 6;
  if (name.includes("phenyl")) return 7;
  if (name.includes("hilic")) return 8;
  if (name.includes("cyano") || name.includes(" cn ")) return 9;
  if (name.includes("c4")) return 10;
  if (name.includes("pfp")) return 11;
  if (name.includes("amino") || name.includes("nh2")) return 12;
  if (name.includes("diol")) return 13;
  if (name.includes("c30")) return 14;
  if (name.includes("guard")) return 17;
  if (name.includes("spe") || name.includes("cartridge")) return 16;
  if (name.includes("filter")) return 18;
  if (name.includes("vial")) return 19;
  if (name.includes("cap") || name.includes("septa")) return 20;
  if (name.includes("syringe")) return 21;
  if (name.includes("fitting") || name.includes("tubing")) return 22;
  return 15;
}
var batchFixOrphanProductsRouter = router({
  execute: publicProcedure.query(async () => {
    const connection = await mysql9.createConnection({
      uri: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: true }
    });
    try {
      const [orphanProducts] = await connection.execute(`
          SELECT id, productId, partNumber, brand, productName, category_id, status
          FROM products
          WHERE status = 'active' 
            AND id NOT IN (SELECT DISTINCT product_id FROM product_categories)
          ORDER BY brand, productName
        `);
      const products2 = orphanProducts;
      const results = [];
      let successCount = 0;
      let errorCount = 0;
      for (const product of products2) {
        try {
          const categoryId = classifyProduct(product.productName, product.brand);
          await connection.execute(`
              INSERT INTO product_categories (product_id, category_id, is_primary)
              VALUES (?, ?, 1)
              ON DUPLICATE KEY UPDATE is_primary = 1
            `, [product.id, categoryId]);
          if (product.category_id === null) {
            await connection.execute(`
                UPDATE products SET category_id = ? WHERE id = ?
              `, [categoryId, product.id]);
          }
          successCount++;
          results.push({
            productId: product.productId,
            productName: product.productName,
            brand: product.brand,
            assignedCategoryId: categoryId,
            status: "success"
          });
        } catch (error) {
          errorCount++;
          results.push({
            productId: product.productId,
            productName: product.productName,
            brand: product.brand,
            status: "error",
            error: error.message
          });
        }
      }
      return {
        success: true,
        totalProcessed: products2.length,
        successCount,
        errorCount,
        results: results.slice(0, 50)
        // Return first 50 for review
      };
    } finally {
      await connection.end();
    }
  })
});

// server/batch-fix-orphan-paginated.ts
import { z as z10 } from "zod";
import mysql10 from "mysql2/promise";
function classifyProduct2(productName, brand) {
  const name = productName.toLowerCase();
  if (brand === "Restek") {
    if (name.includes("raptor")) {
      if (name.includes("polar x") || name.includes("inert polar x")) {
        return 8;
      }
      return 4;
    }
    if (name.includes("ultra") && name.includes("ibd")) return 4;
    if (name.includes("allure")) return 4;
    if (name.includes("pfas")) return 4;
  }
  if (brand === "Daicel") {
    if (name.includes("chiralpak") || name.includes("chiralcel")) {
      return 15;
    }
  }
  if (name.includes("c18")) return 4;
  if (name.includes("c8")) return 5;
  if (name.includes("silica")) return 6;
  if (name.includes("phenyl")) return 7;
  if (name.includes("hilic")) return 8;
  if (name.includes("cyano") || name.includes(" cn ")) return 9;
  if (name.includes("c4")) return 10;
  if (name.includes("pfp")) return 11;
  if (name.includes("amino") || name.includes("nh2")) return 12;
  if (name.includes("diol")) return 13;
  if (name.includes("c30")) return 14;
  if (name.includes("guard")) return 17;
  if (name.includes("spe") || name.includes("cartridge")) return 16;
  if (name.includes("filter")) return 18;
  if (name.includes("vial")) return 19;
  if (name.includes("cap") || name.includes("septa")) return 20;
  if (name.includes("syringe")) return 21;
  if (name.includes("fitting") || name.includes("tubing")) return 22;
  return 15;
}
var batchFixOrphanPaginatedRouter = router({
  execute: publicProcedure.input(z10.object({
    offset: z10.number().default(0),
    limit: z10.number().default(100)
  }).optional()).query(async ({ input }) => {
    const offset = input?.offset ?? 0;
    const limit = input?.limit ?? 100;
    const connection = await mysql10.createConnection({
      uri: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: true }
    });
    try {
      const [countResult] = await connection.execute(`
          SELECT COUNT(*) as total
          FROM products
          WHERE status = 'active' 
            AND id NOT IN (SELECT DISTINCT product_id FROM product_categories)
        `);
      const totalOrphans = countResult[0].total;
      const [orphanProducts] = await connection.execute(`
          SELECT id, productId, partNumber, brand, productName, category_id, status
          FROM products
          WHERE status = 'active' 
            AND id NOT IN (SELECT DISTINCT product_id FROM product_categories)
          ORDER BY brand, productName
          LIMIT ? OFFSET ?
        `, [limit, offset]);
      const products2 = orphanProducts;
      const results = [];
      let successCount = 0;
      let errorCount = 0;
      for (const product of products2) {
        try {
          const categoryId = classifyProduct2(product.productName, product.brand);
          await connection.execute(`
              INSERT INTO product_categories (product_id, category_id, is_primary)
              VALUES (?, ?, 1)
              ON DUPLICATE KEY UPDATE is_primary = 1
            `, [product.id, categoryId]);
          if (product.category_id === null) {
            await connection.execute(`
                UPDATE products SET category_id = ? WHERE id = ?
              `, [categoryId, product.id]);
          }
          successCount++;
          results.push({
            productId: product.productId,
            productName: product.productName,
            brand: product.brand,
            assignedCategoryId: categoryId,
            status: "success"
          });
        } catch (error) {
          errorCount++;
          results.push({
            productId: product.productId,
            productName: product.productName,
            brand: product.brand,
            status: "error",
            error: error.message
          });
        }
      }
      return {
        success: true,
        totalOrphans,
        currentBatch: {
          offset,
          limit,
          processed: products2.length
        },
        successCount,
        errorCount,
        hasMore: offset + limit < totalOrphans,
        nextOffset: offset + limit,
        results
      };
    } finally {
      await connection.end();
    }
  })
});

// server/export-all-products.ts
import mysql11 from "mysql2/promise";
var exportAllProductsRouter = router({
  getAllProducts: publicProcedure.query(async () => {
    try {
      const databaseUrl = process.env.DATABASE_URL || "";
      console.log("DATABASE_URL exists:", !!databaseUrl);
      const urlMatch = databaseUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      if (!urlMatch) {
        throw new Error("Invalid DATABASE_URL format");
      }
      const [, user, password, host, port2, database] = urlMatch;
      console.log("Connecting to database:", { host, port: port2, database, user: user.substring(0, 3) + "***" });
      const connection = await mysql11.createConnection({
        host,
        user,
        password,
        database,
        port: parseInt(port2),
        ssl: {
          rejectUnauthorized: true
        }
      });
      const [products2] = await connection.execute(`
        SELECT 
          p.id,
          p.product_id,
          p.part_number,
          p.name,
          p.brand,
          p.status,
          p.category_id as primary_category_id,
          GROUP_CONCAT(DISTINCT pc.category_id) as all_category_ids,
          GROUP_CONCAT(DISTINCT c.name_en) as all_category_names
        FROM products p
        LEFT JOIN product_categories pc ON p.id = pc.product_id
        LEFT JOIN categories c ON pc.category_id = c.id
        WHERE p.status = 'active'
        GROUP BY p.id
        ORDER BY p.brand, p.product_id
      `);
      await connection.end();
      return {
        success: true,
        totalProducts: products2.length,
        products: products2
      };
    } catch (error) {
      console.error("Error exporting products:", error);
      return {
        success: false,
        error: error.message,
        products: []
      };
    }
  })
});

// server/fix-known-misclassifications.ts
import mysql12 from "mysql2/promise";
var fixKnownMisclassificationsRouter = router({
  fixAll: publicProcedure.query(async () => {
    try {
      const connection = await mysql12.createConnection({
        uri: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: true
        }
      });
      const results = {
        spe_products: { updated: 0, errors: [] },
        well_plates: { updated: 0, errors: [] },
        syringe_filters: { updated: 0, errors: [] },
        total_updated: 0
      };
      try {
        const [speResult] = await connection.execute(`
          UPDATE product_categories pc
          INNER JOIN products p ON pc.product_id = p.id
          SET pc.category_id = 31
          WHERE p.name LIKE '%Bond Elut%'
            AND p.name NOT LIKE '%Column%'
            AND pc.category_id != 31
            AND p.status = 'active'
        `);
        results.spe_products.updated = speResult.affectedRows || 0;
        await connection.execute(`
          UPDATE products
          SET category_id = 31
          WHERE name LIKE '%Bond Elut%'
            AND name NOT LIKE '%Column%'
            AND category_id != 31
            AND status = 'active'
        `);
      } catch (error) {
        results.spe_products.errors.push(error.message);
      }
      const [wellPlatesCat] = await connection.execute(`
        SELECT id FROM categories WHERE name_en LIKE '%96%Well%Plate%' OR name_en LIKE '%Microplate%' LIMIT 1
      `);
      if (wellPlatesCat.length > 0) {
        const wellPlatesCategoryId = wellPlatesCat[0].id;
        try {
          const [wellPlatesResult] = await connection.execute(`
            UPDATE product_categories pc
            INNER JOIN products p ON pc.product_id = p.id
            SET pc.category_id = ?
            WHERE (p.name LIKE '%96%Well%Plate%' OR p.name LIKE '%Microplate%')
              AND pc.category_id != ?
              AND p.status = 'active'
          `, [wellPlatesCategoryId, wellPlatesCategoryId]);
          results.well_plates.updated = wellPlatesResult.affectedRows || 0;
          await connection.execute(`
            UPDATE products
            SET category_id = ?
            WHERE (name LIKE '%96%Well%Plate%' OR name LIKE '%Microplate%')
              AND category_id != ?
              AND status = 'active'
          `, [wellPlatesCategoryId, wellPlatesCategoryId]);
        } catch (error) {
          results.well_plates.errors.push(error.message);
        }
      } else {
        results.well_plates.errors.push("96-Well Plates category not found");
      }
      const [filtersCat] = await connection.execute(`
        SELECT id FROM categories WHERE name_en = 'Filters' OR slug = 'filters' LIMIT 1
      `);
      if (filtersCat.length > 0) {
        const filtersCategoryId = filtersCat[0].id;
        try {
          const [filtersResult] = await connection.execute(`
            UPDATE product_categories pc
            INNER JOIN products p ON pc.product_id = p.id
            SET pc.category_id = ?
            WHERE (p.name LIKE '%Syringe Filter%' OR p.product_id LIKE 'PHEN-AF%')
              AND pc.category_id != ?
              AND p.status = 'active'
          `, [filtersCategoryId, filtersCategoryId]);
          results.syringe_filters.updated = filtersResult.affectedRows || 0;
          await connection.execute(`
            UPDATE products
            SET category_id = ?
            WHERE (name LIKE '%Syringe Filter%' OR product_id LIKE 'PHEN-AF%')
              AND category_id != ?
              AND status = 'active'
          `, [filtersCategoryId, filtersCategoryId]);
        } catch (error) {
          results.syringe_filters.errors.push(error.message);
        }
      } else {
        results.syringe_filters.errors.push("Filters category not found");
      }
      await connection.end();
      results.total_updated = results.spe_products.updated + results.well_plates.updated + results.syringe_filters.updated;
      return {
        success: true,
        results
      };
    } catch (error) {
      console.error("Error fixing misclassifications:", error);
      return {
        success: false,
        error: error.message
      };
    }
  })
});

// server/diagnose-database.ts
import mysql13 from "mysql2/promise";
var diagnoseDatabaseRouter = router({
  check: publicProcedure.query(async () => {
    try {
      const connection = await mysql13.createConnection({
        uri: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: true
        }
      });
      const results = {
        categories: [],
        products_sample: [],
        product_categories_sample: [],
        products_columns: []
      };
      const [categories2] = await connection.execute(`
        SELECT id, name_en, slug 
        FROM categories 
        WHERE name_en LIKE '%SPE%' 
           OR name_en LIKE '%Well%' 
           OR name_en LIKE '%Plate%' 
           OR name_en LIKE '%Filter%'
        ORDER BY name_en
      `);
      results.categories = categories2;
      const [bondElutProducts] = await connection.execute(`
        SELECT id, productId, name, category_id, status
        FROM products 
        WHERE name LIKE '%Bond Elut%'
        LIMIT 5
      `);
      results.products_sample = bondElutProducts;
      const [columns] = await connection.execute(`
        DESCRIBE products
      `);
      results.products_columns = columns;
      const [productCategories2] = await connection.execute(`
        SELECT pc.*, p.name, p.productId
        FROM product_categories pc
        JOIN products p ON pc.product_id = p.id
        WHERE p.name LIKE '%Bond Elut%'
        LIMIT 5
      `);
      results.product_categories_sample = productCategories2;
      await connection.end();
      return {
        success: true,
        results
      };
    } catch (error) {
      console.error("Error diagnosing database:", error);
      return {
        success: false,
        error: error.message
      };
    }
  })
});

// server/find-plate-categories.ts
import mysql14 from "mysql2/promise";
var findPlateCategoriesRouter = router({
  find: publicProcedure.query(async () => {
    try {
      const connection = await mysql14.createConnection({
        uri: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: true
        }
      });
      const [categories2] = await connection.execute(`
        SELECT id, name_en, slug
        FROM categories 
        WHERE LOWER(name_en) LIKE '%plate%' 
           OR LOWER(name_en) LIKE '%well%'
           OR LOWER(slug) LIKE '%plate%'
           OR LOWER(slug) LIKE '%well%'
        ORDER BY name_en
      `);
      const [products2] = await connection.execute(`
        SELECT id, productId, name, category_id, status
        FROM products 
        WHERE name LIKE '%96%Well%' 
           OR name LIKE '%Microplate%'
           OR name LIKE '%96-Well%'
        LIMIT 10
      `);
      await connection.end();
      return {
        success: true,
        categories: categories2,
        products: products2
      };
    } catch (error) {
      console.error("Error finding plate categories:", error);
      return {
        success: false,
        error: error.message
      };
    }
  })
});

// server/get-all-categories.ts
import mysql15 from "mysql2/promise";
var getAllCategoriesRouter = router({
  list: publicProcedure.query(async () => {
    try {
      const connection = await mysql15.createConnection({
        uri: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: true
        }
      });
      const [categories2] = await connection.execute(`
        SELECT id, name_en, slug, parent_id
        FROM categories 
        ORDER BY name_en
      `);
      await connection.end();
      return {
        success: true,
        categories: categories2
      };
    } catch (error) {
      console.error("Error getting categories:", error);
      return {
        success: false,
        error: error.message
      };
    }
  })
});

// server/fix-product-categories-final.ts
import mysql16 from "mysql2/promise";
var fixProductCategoriesFinalRouter = router({
  fixAll: publicProcedure.query(async () => {
    try {
      const connection = await mysql16.createConnection({
        uri: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: true
        }
      });
      const results = {
        well_plates: { updated: 0, errors: [] },
        syringe_filters: { updated: 0, errors: [] },
        total_updated: 0
      };
      try {
        const [wellPlatesResult] = await connection.execute(`
          UPDATE product_categories pc
          INNER JOIN products p ON pc.product_id = p.id
          SET pc.category_id = 16
          WHERE (p.name LIKE '%96%Well%' 
             OR p.name LIKE '%Microplate%'
             OR p.name LIKE '%96-Well%')
            AND pc.category_id != 16
            AND p.status = 'active'
        `);
        results.well_plates.updated = wellPlatesResult.affectedRows || 0;
        await connection.execute(`
          UPDATE products
          SET category_id = 16
          WHERE (name LIKE '%96%Well%' 
             OR name LIKE '%Microplate%'
             OR name LIKE '%96-Well%')
            AND category_id != 16
            AND status = 'active'
        `);
      } catch (error) {
        results.well_plates.errors.push(error.message);
      }
      try {
        const [filtersResult] = await connection.execute(`
          UPDATE product_categories pc
          INNER JOIN products p ON pc.product_id = p.id
          SET pc.category_id = 18
          WHERE (p.name LIKE '%Syringe Filter%' 
             OR p.productId LIKE 'PHEN-AF%')
            AND pc.category_id != 18
            AND p.status = 'active'
        `);
        results.syringe_filters.updated = filtersResult.affectedRows || 0;
        await connection.execute(`
          UPDATE products
          SET category_id = 18
          WHERE (name LIKE '%Syringe Filter%' 
             OR productId LIKE 'PHEN-AF%')
            AND category_id != 18
            AND status = 'active'
        `);
      } catch (error) {
        results.syringe_filters.errors.push(error.message);
      }
      await connection.end();
      results.total_updated = results.well_plates.updated + results.syringe_filters.updated;
      return {
        success: true,
        results
      };
    } catch (error) {
      console.error("Error fixing product categories:", error);
      return {
        success: false,
        error: error.message
      };
    }
  })
});

// server/fix-null-categories.ts
import mysql17 from "mysql2/promise";
var fixNullCategoriesRouter = router({
  fixAll: publicProcedure.query(async () => {
    try {
      const connection = await mysql17.createConnection({
        uri: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: true
        }
      });
      const results = {
        well_plates_null: { updated: 0, errors: [] },
        syringe_filters: { updated: 0, errors: [] },
        total_updated: 0
      };
      try {
        const [wellPlatesResult] = await connection.execute(`
          UPDATE products
          SET category_id = 16
          WHERE (name LIKE '%96%Well%' 
             OR name LIKE '%Microplate%'
             OR name LIKE '%96-Well%'
             OR name LIKE '%well-plate%')
            AND (category_id IS NULL OR category_id = 0)
            AND status = 'active'
        `);
        results.well_plates_null.updated = wellPlatesResult.affectedRows || 0;
      } catch (error) {
        results.well_plates_null.errors.push(error.message);
      }
      try {
        const [filtersResult] = await connection.execute(`
          UPDATE products
          SET category_id = 18
          WHERE (name LIKE '%Syringe Filter%' 
             OR productId LIKE 'PHEN-AF%')
            AND category_id != 18
            AND status = 'active'
        `);
        results.syringe_filters.updated = filtersResult.affectedRows || 0;
      } catch (error) {
        results.syringe_filters.errors.push(error.message);
      }
      await connection.end();
      results.total_updated = results.well_plates_null.updated + results.syringe_filters.updated;
      return {
        success: true,
        results
      };
    } catch (error) {
      console.error("Error fixing NULL categories:", error);
      return {
        success: false,
        error: error.message
      };
    }
  })
});

// server/check-syringe-filters.ts
import mysql18 from "mysql2/promise";
var checkSyringeFiltersRouter = router({
  check: publicProcedure.query(async () => {
    try {
      const connection = await mysql18.createConnection({
        uri: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: true
        }
      });
      const [products2] = await connection.execute(`
        SELECT id, productId, name, category_id, status
        FROM products
        WHERE (name LIKE '%Syringe Filter%' 
           OR productId LIKE 'PHEN-AF%')
          AND status = 'active'
        ORDER BY category_id, name
        LIMIT 50
      `);
      await connection.end();
      return {
        success: true,
        products: products2
      };
    } catch (error) {
      console.error("Error checking syringe filters:", error);
      return {
        success: false,
        error: error.message
      };
    }
  })
});

// server/find-gc-columns.ts
import mysql19 from "mysql2/promise";
var findGcColumnsRouter = router({
  find: publicProcedure.query(async () => {
    try {
      const connection = await mysql19.createConnection({
        uri: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: true
        }
      });
      const [products2] = await connection.execute(`
        SELECT id, productId, name, category_id, status
        FROM products
        WHERE (name LIKE '%GC Column%' 
           OR name LIKE '%GC column%'
           OR name LIKE '%Gas Chromatography%'
           OR name LIKE '% GC %'
           OR productId LIKE '%GC%')
          AND status = 'active'
        ORDER BY category_id, name
        LIMIT 200
      `);
      const [categoryDist] = await connection.execute(`
        SELECT 
          p.category_id,
          c.name_en as category_name,
          COUNT(*) as product_count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE (p.name LIKE '%GC Column%' 
           OR p.name LIKE '%GC column%'
           OR p.name LIKE '%Gas Chromatography%'
           OR p.name LIKE '% GC %'
           OR p.productId LIKE '%GC%')
          AND p.status = 'active'
        GROUP BY p.category_id, c.name_en
        ORDER BY product_count DESC
      `);
      await connection.end();
      return {
        success: true,
        products: products2,
        categoryDistribution: categoryDist,
        totalProducts: products2.length
      };
    } catch (error) {
      console.error("Error finding GC columns:", error);
      return {
        success: false,
        error: error.message
      };
    }
  })
});

// server/create-gc-categories.ts
import mysql20 from "mysql2/promise";
var createGcCategoriesRouter = router({
  create: publicProcedure.query(async () => {
    try {
      const connection = await mysql20.createConnection({
        uri: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: true
        }
      });
      const results = {
        parent: null,
        subcategories: [],
        errors: []
      };
      try {
        const [parentResult] = await connection.execute(`
          INSERT INTO categories (name, name_en, slug, parent_id, created_at, updated_at)
          VALUES ('GC\u8272\u8C31\u67F1', 'GC Columns', 'gc-columns', NULL, NOW(), NOW())
        `);
        results.parent = {
          id: parentResult.insertId,
          name: "GC Columns",
          slug: "gc-columns"
        };
      } catch (error) {
        results.errors.push(`Parent category error: ${error.message}`);
        await connection.end();
        return { success: false, error: error.message, results };
      }
      const parentId = results.parent.id;
      const subcategories = [
        { name: "Capillary GC Columns", name_zh: "\u6BDB\u7EC6\u7BA1GC\u67F1", slug: "capillary-gc-columns" },
        { name: "Packed GC Columns", name_zh: "\u586B\u5145GC\u67F1", slug: "packed-gc-columns" },
        { name: "GC Guard Columns", name_zh: "GC\u4FDD\u62A4\u67F1", slug: "gc-guard-columns" },
        { name: "Other GC Columns", name_zh: "\u5176\u4ED6GC\u67F1", slug: "other-gc-columns" }
      ];
      for (const subcat of subcategories) {
        try {
          const [subResult] = await connection.execute(`
            INSERT INTO categories (name, name_en, slug, parent_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, NOW(), NOW())
          `, [subcat.name_zh, subcat.name, subcat.slug, parentId]);
          results.subcategories.push({
            id: subResult.insertId,
            name: subcat.name,
            slug: subcat.slug,
            parent_id: parentId
          });
        } catch (error) {
          results.errors.push(`Subcategory ${subcat.name} error: ${error.message}`);
        }
      }
      await connection.end();
      return {
        success: true,
        results
      };
    } catch (error) {
      console.error("Error creating GC categories:", error);
      return {
        success: false,
        error: error.message
      };
    }
  })
});

// server/reclassify-gc-products.ts
import mysql21 from "mysql2/promise";
var reclassifyGcProductsRouter = router({
  reclassify: publicProcedure.query(async () => {
    try {
      const connection = await mysql21.createConnection({
        uri: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: true
        }
      });
      const results = {
        capillary: 0,
        packed: 0,
        guard: 0,
        other: 0,
        total: 0,
        errors: []
      };
      const GC_CATS = {
        CAPILLARY: 30002,
        PACKED: 30003,
        GUARD: 30004,
        OTHER: 30005
      };
      try {
        const [capillaryResult] = await connection.execute(`
          UPDATE products 
          SET category_id = ?
          WHERE (name LIKE '%Capillary GC Column%' 
             OR name LIKE '%GC Cap.%' 
             OR name LIKE '%GC Capillary%'
             OR name LIKE '%GC Metal Capillary%')
          AND name LIKE '%GC%'
        `, [GC_CATS.CAPILLARY]);
        results.capillary = capillaryResult.affectedRows;
      } catch (error) {
        results.errors.push(`Capillary error: ${error.message}`);
      }
      try {
        const [packedResult] = await connection.execute(`
          UPDATE products 
          SET category_id = ?
          WHERE name LIKE '%Packed GC Column%'
          AND name LIKE '%GC%'
        `, [GC_CATS.PACKED]);
        results.packed = packedResult.affectedRows;
      } catch (error) {
        results.errors.push(`Packed error: ${error.message}`);
      }
      try {
        const [guardResult] = await connection.execute(`
          UPDATE products 
          SET category_id = ?
          WHERE name LIKE '%GUARDIAN%'
          AND name LIKE '%GC%'
        `, [GC_CATS.GUARD]);
        results.guard = guardResult.affectedRows;
      } catch (error) {
        results.errors.push(`Guard error: ${error.message}`);
      }
      try {
        const [otherResult] = await connection.execute(`
          UPDATE products 
          SET category_id = ?
          WHERE name LIKE '%GC Column%'
          AND category_id NOT IN (?, ?, ?)
        `, [GC_CATS.OTHER, GC_CATS.CAPILLARY, GC_CATS.PACKED, GC_CATS.GUARD]);
        results.other = otherResult.affectedRows;
      } catch (error) {
        results.errors.push(`Other error: ${error.message}`);
      }
      results.total = results.capillary + results.packed + results.guard + results.other;
      await connection.end();
      return {
        success: true,
        results
      };
    } catch (error) {
      console.error("Error reclassifying GC products:", error);
      return {
        success: false,
        error: error.message
      };
    }
  })
});

// server/fix-remaining-gc.ts
import mysql22 from "mysql2/promise";
var fixRemainingGcRouter = router({
  fix: publicProcedure.query(async () => {
    try {
      const connection = await mysql22.createConnection({
        uri: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: true
        }
      });
      const productIds = [
        30749,
        30774,
        30778,
        30792,
        30762,
        30763,
        30758,
        30759,
        30748,
        30764
      ];
      const CAPILLARY_GC_CAT_ID = 30002;
      const [result] = await connection.execute(`
        UPDATE products 
        SET category_id = ?
        WHERE id IN (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [CAPILLARY_GC_CAT_ID, ...productIds]);
      await connection.end();
      return {
        success: true,
        updated: result.affectedRows,
        productIds
      };
    } catch (error) {
      console.error("Error fixing remaining GC products:", error);
      return {
        success: false,
        error: error.message
      };
    }
  })
});

// server/check-gc-slug.ts
import mysql23 from "mysql2/promise";
var checkGcSlugRouter = router({
  check: publicProcedure.query(async () => {
    try {
      const connection = await mysql23.createConnection({
        uri: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: true
        }
      });
      const [categories2] = await connection.execute(`
        SELECT id, name, name_en, slug, parent_id
        FROM categories
        WHERE id BETWEEN 30001 AND 30005
        ORDER BY id
      `);
      const [productCounts] = await connection.execute(`
        SELECT category_id, COUNT(*) as product_count
        FROM products
        WHERE category_id BETWEEN 30001 AND 30005
        GROUP BY category_id
      `);
      await connection.end();
      return {
        success: true,
        categories: categories2,
        productCounts
      };
    } catch (error) {
      console.error("Error checking GC slug:", error);
      return {
        success: false,
        error: error.message
      };
    }
  })
});

// server/update-ymc-tosoh-router.ts
import axios2 from "axios";
var updateExecuted = false;
function parseCSV(csvContent) {
  const lines = csvContent.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row = {};
    headers.forEach((header, index2) => {
      row[header] = values[index2] || "";
    });
    return row;
  });
}
var updateYmcTosohRouter = router({
  execute: publicProcedure.mutation(async () => {
    try {
      if (updateExecuted) {
        throw new Error("This endpoint has already been executed and is now disabled. Data update can only be performed once.");
      }
      console.log("[UPDATE] Starting one-time YMC and Tosoh product data update...");
      const YMC_CDN_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/tjohcbqXsySOlnhe.csv";
      const TOSOH_CDN_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/XSAyYRUdzBdDdNIA.csv";
      console.log("[UPDATE] Fetching YMC data from CDN...");
      const ymcResponse = await axios2.get(YMC_CDN_URL);
      const ymcData = parseCSV(ymcResponse.data);
      console.log(`[UPDATE] Found ${ymcData.length} YMC products`);
      console.log("[UPDATE] Fetching Tosoh data from CDN...");
      const tosohResponse = await axios2.get(TOSOH_CDN_URL);
      const tosohData = parseCSV(tosohResponse.data);
      console.log(`[UPDATE] Found ${tosohData.length} Tosoh products`);
      const allData = [...ymcData, ...tosohData];
      let updatedCount = 0;
      let notFoundCount = 0;
      const notFoundProducts = [];
      console.log("[UPDATE] Starting database update...");
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { products: products2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq13 } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) {
        throw new Error("Database not available for YMC/Tosoh update");
      }
      for (const row of allData) {
        try {
          const existingProducts = await db.select().from(products2).where(eq13(products2.partNumber, row.productCode)).limit(1);
          if (existingProducts.length === 0) {
            console.log(`[UPDATE] Product not found: ${row.productCode}`);
            notFoundCount++;
            notFoundProducts.push(row.productCode);
            continue;
          }
          await db.update(products2).set({
            particleSize: row.particleSize || null,
            poreSize: row.poreSize || null,
            columnLength: row.columnLength || null,
            innerDiameter: row.innerDiameter || null,
            phRange: row.phRange || null,
            usp: row.usp || null,
            description: row.description || null,
            applications: row.applications || null
          }).where(eq13(products2.partNumber, row.productCode));
          updatedCount++;
          if (updatedCount % 20 === 0) {
            console.log(`[UPDATE] Progress: ${updatedCount}/${allData.length} products updated`);
          }
        } catch (error) {
          console.error(`[UPDATE] Error updating product ${row.productCode}:`, error);
        }
      }
      updateExecuted = true;
      console.log("[UPDATE] ========================================");
      console.log("[UPDATE] UPDATE SUMMARY");
      console.log("[UPDATE] ========================================");
      console.log(`[UPDATE] Total products processed:    ${allData.length}`);
      console.log(`[UPDATE] Successfully updated:        ${updatedCount}`);
      console.log(`[UPDATE] Not found in database:       ${notFoundCount}`);
      console.log("[UPDATE] ========================================");
      console.log("[UPDATE] Endpoint is now DISABLED");
      return {
        success: true,
        summary: {
          totalProcessed: allData.length,
          successfullyUpdated: updatedCount,
          notFound: notFoundCount,
          notFoundProducts: notFoundProducts.length > 0 ? notFoundProducts : void 0
        },
        message: "Update completed successfully. This endpoint is now disabled and cannot be used again.",
        endpointStatus: "DISABLED"
      };
    } catch (error) {
      console.error("[UPDATE] Update failed:", error);
      throw error;
    }
  })
});

// server/update-dimensions-router.ts
init_db();
init_schema();
import { eq as eq3 } from "drizzle-orm";
import axios3 from "axios";
var dimensionsUpdateExecuted = false;
function parseCSV2(csvContent) {
  const lines = csvContent.trim().split("\n");
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((header, index2) => {
      row[header.trim()] = values[index2] ? values[index2].trim() : "";
    });
    return row;
  });
}
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
var updateDimensionsRouter = router({
  execute: publicProcedure.mutation(async () => {
    try {
      if (dimensionsUpdateExecuted) {
        throw new Error("This endpoint has already been executed and is now disabled. Dimensions update can only be performed once.");
      }
      console.log("[DIMENSIONS] Starting one-time dimensions field update for YMC and Tosoh products...");
      const YMC_CDN_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/tjohcbqXsySOlnhe.csv";
      const TOSOH_CDN_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/XSAyYRUdzBdDdNIA.csv";
      console.log("[DIMENSIONS] Fetching YMC data from CDN...");
      const ymcResponse = await axios3.get(YMC_CDN_URL);
      const ymcData = parseCSV2(ymcResponse.data);
      console.log(`[DIMENSIONS] Found ${ymcData.length} YMC products`);
      console.log("[DIMENSIONS] Fetching Tosoh data from CDN...");
      const tosohResponse = await axios3.get(TOSOH_CDN_URL);
      const tosohData = parseCSV2(tosohResponse.data);
      console.log(`[DIMENSIONS] Found ${tosohData.length} Tosoh products`);
      const allData = [...ymcData, ...tosohData];
      console.log(`[DIMENSIONS] Total products to process: ${allData.length}`);
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available for dimensions update");
      }
      let updatedCount = 0;
      let notFoundCount = 0;
      let skippedCount = 0;
      const notFoundProducts = [];
      for (const row of allData) {
        try {
          const existingProducts = await db.select().from(products).where(eq3(products.partNumber, row.productCode)).limit(1);
          if (existingProducts.length === 0) {
            console.log(`[DIMENSIONS] Product not found: ${row.productCode}`);
            notFoundCount++;
            notFoundProducts.push(row.productCode);
            continue;
          }
          const columnLength = row.columnLength?.trim();
          const innerDiameter = row.innerDiameter?.trim();
          if (!columnLength || !innerDiameter) {
            console.log(`[DIMENSIONS] Skipping ${row.productCode}: missing dimension data (columnLength: "${columnLength}", innerDiameter: "${innerDiameter}")`);
            skippedCount++;
            continue;
          }
          await db.update(products).set({
            columnLength,
            innerDiameter
          }).where(eq3(products.partNumber, row.productCode));
          updatedCount++;
          if (updatedCount % 20 === 0) {
            console.log(`[DIMENSIONS] Progress: ${updatedCount}/${allData.length} products updated`);
          }
        } catch (error) {
          console.error(`[DIMENSIONS] Error updating product ${row.productCode}:`, error);
        }
      }
      console.log("[DIMENSIONS] Update completed!");
      console.log(`[DIMENSIONS] Successfully updated: ${updatedCount}`);
      console.log(`[DIMENSIONS] Not found: ${notFoundCount}`);
      console.log(`[DIMENSIONS] Skipped (missing data): ${skippedCount}`);
      dimensionsUpdateExecuted = true;
      return {
        success: true,
        summary: {
          totalProcessed: allData.length,
          successfullyUpdated: updatedCount,
          notFound: notFoundCount,
          skipped: skippedCount,
          notFoundProducts: notFoundCount > 0 ? notFoundProducts : null
        },
        message: "Dimensions update completed successfully. This endpoint is now disabled and cannot be used again.",
        endpointStatus: "DISABLED"
      };
    } catch (error) {
      console.error("[DIMENSIONS] Fatal error:", error);
      throw new Error(`Dimensions update failed: ${error.message}`);
    }
  })
});

// server/learning-center-api.ts
init_db();
init_schema();
import { z as z11 } from "zod";
import { eq as eq4, desc, and, sql } from "drizzle-orm";
var learningCenterRouter = router({
  articles: router({
    list: publicProcedure.input(
      z11.object({
        page: z11.number().optional().default(1),
        pageSize: z11.number().optional().default(12),
        category: z11.string().optional(),
        area: z11.string().optional()
      })
    ).query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const offset = (input.page - 1) * input.pageSize;
      let conditions = [];
      if (input.category) {
        conditions.push(eq4(articles.category, input.category));
      }
      if (input.area) {
        conditions.push(eq4(articles.applicationArea, input.area));
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
      const result = await db.select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        metaDescription: articles.metaDescription,
        publishedDate: articles.publishedDate,
        viewCount: articles.viewCount,
        category: articles.category,
        applicationArea: articles.applicationArea,
        authorId: articles.authorId,
        authorName: authors.fullName,
        authorSlug: authors.slug
      }).from(articles).leftJoin(authors, eq4(articles.authorId, authors.id)).where(whereClause).orderBy(desc(articles.publishedDate)).limit(input.pageSize).offset(offset);
      const totalResult = await db.select({ count: sql`count(*)` }).from(articles).where(whereClause);
      const total = Number(totalResult[0].count);
      return {
        articles: result,
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total,
          totalPages: Math.ceil(total / input.pageSize)
        }
      };
    }),
    bySlug: publicProcedure.input(z11.object({ slug: z11.string() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const result = await db.select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        content: articles.content,
        metaDescription: articles.metaDescription,
        keywords: articles.keywords,
        publishedDate: articles.publishedDate,
        updatedAt: articles.updatedAt,
        viewCount: articles.viewCount,
        category: articles.category,
        applicationArea: articles.applicationArea,
        authorId: articles.authorId,
        authorName: authors.fullName,
        authorSlug: authors.slug,
        authorTitle: authors.title,
        authorBio: authors.biography,
        authorPhoto: authors.photoUrl
      }).from(articles).leftJoin(authors, eq4(articles.authorId, authors.id)).where(eq4(articles.slug, input.slug)).limit(1);
      if (result.length === 0) {
        throw new Error("Article not found");
      }
      const article = result[0];
      await db.update(articles).set({ viewCount: sql`${articles.viewCount} + 1` }).where(eq4(articles.id, article.id));
      return article;
    }),
    getBySlug: publicProcedure.input(z11.string()).query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const result = await db.select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        content: articles.content,
        metaDescription: articles.metaDescription,
        keywords: articles.keywords,
        publishedDate: articles.publishedDate,
        updatedAt: articles.updatedAt,
        viewCount: articles.viewCount,
        category: articles.category,
        applicationArea: articles.applicationArea,
        authorId: articles.authorId,
        authorName: authors.fullName,
        authorSlug: authors.slug,
        authorTitle: authors.title,
        authorBio: authors.biography,
        authorPhoto: authors.photoUrl
      }).from(articles).leftJoin(authors, eq4(articles.authorId, authors.id)).where(eq4(articles.slug, input)).limit(1);
      if (result.length === 0) {
        throw new Error("Article not found");
      }
      const article = result[0];
      await db.update(articles).set({ viewCount: sql`${articles.viewCount} + 1` }).where(eq4(articles.id, article.id));
      return article;
    })
  }),
  authors: router({
    list: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const result = await db.select({
        id: authors.id,
        name: authors.fullName,
        slug: authors.slug,
        title: authors.title,
        bio: authors.biography,
        photo: authors.photoUrl,
        articleCount: sql`(SELECT COUNT(*) FROM ${articles} WHERE ${articles.authorId} = ${authors.id})`
      }).from(authors).orderBy(authors.fullName);
      return result;
    }),
    getBySlug: publicProcedure.input(z11.string()).query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const result = await db.select().from(authors).where(eq4(authors.slug, input)).limit(1);
      if (result.length === 0) {
        throw new Error("Author not found");
      }
      const author = result[0];
      const authorArticles = await db.select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        metaDescription: articles.metaDescription,
        publishedDate: articles.publishedDate,
        viewCount: articles.viewCount,
        category: articles.category,
        applicationArea: articles.applicationArea
      }).from(articles).where(eq4(articles.authorId, author.id)).orderBy(desc(articles.publishedDate));
      return {
        ...author,
        articles: authorArticles
      };
    })
  }),
  literature: router({
    list: publicProcedure.input(
      z11.object({
        page: z11.number().optional().default(1),
        pageSize: z11.number().optional().default(12),
        area: z11.string().optional()
      })
    ).query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const offset = (input.page - 1) * input.pageSize;
      let conditions = [];
      if (input.area) {
        conditions.push(eq4(literature.applicationArea, input.area));
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
      const result = await db.select({
        id: literature.id,
        title: literature.title,
        slug: literature.slug,
        authors: literature.authors,
        journal: literature.journal,
        year: literature.year,
        summary: literature.summary,
        applicationArea: literature.applicationArea,
        addedDate: literature.addedDate,
        viewCount: literature.viewCount
      }).from(literature).where(whereClause).orderBy(desc(literature.addedDate)).limit(input.pageSize).offset(offset);
      const totalResult = await db.select({ count: sql`count(*)` }).from(literature).where(whereClause);
      const total = Number(totalResult[0].count);
      return {
        literature: result,
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total,
          totalPages: Math.ceil(total / input.pageSize)
        }
      };
    }),
    bySlug: publicProcedure.input(z11.string()).query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const result = await db.select().from(literature).where(eq4(literature.slug, input)).limit(1);
      if (result.length === 0) {
        throw new Error("Literature not found");
      }
      const lit = result[0];
      await db.update(literature).set({ viewCount: sql`${literature.viewCount} + 1` }).where(eq4(literature.id, lit.id));
      return lit;
    })
  }),
  stats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const totalArticles = await db.select({ count: sql`count(*)` }).from(articles);
    const totalLiterature = await db.select({ count: sql`count(*)` }).from(literature);
    const totalAuthors = await db.select({ count: sql`count(*)` }).from(authors);
    const totalArticleViews = await db.select({ total: sql`SUM(${articles.viewCount})` }).from(articles);
    const totalLiteratureViews = await db.select({ total: sql`SUM(${literature.viewCount})` }).from(literature);
    return {
      totalArticles: Number(totalArticles[0].count) + Number(totalLiterature[0].count),
      totalAuthors: Number(totalAuthors[0].count),
      totalViews: Number(totalArticleViews[0].total || 0) + Number(totalLiteratureViews[0].total || 0)
    };
  })
});

// server/article-importer.ts
init_db();
init_schema();
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { eq as eq5 } from "drizzle-orm";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var ARTICLES_DIR = path.join(__dirname, "..", "content", "articles");
var REQUIRED_FIELDS = [
  "title",
  "author_slug",
  "category",
  "application_area",
  "slug",
  "published_date"
];
var VALID_CATEGORIES = ["application-notes", "technical-guides", "industry-trends", "literature-reviews"];
var VALID_AREAS = ["pharmaceutical", "environmental", "food-safety", "biopharmaceutical", "clinical", "chemical"];
function validateLanguage(text2) {
  if (!text2) return true;
  const chineseRegex = /[\u4e00-\u9fa5]/;
  return !chineseRegex.test(text2);
}
function validateFormat(frontmatter) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    if (!frontmatter[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  if (frontmatter.category && !VALID_CATEGORIES.includes(frontmatter.category)) {
    errors.push(`Invalid category: ${frontmatter.category}. Must be one of: ${VALID_CATEGORIES.join(", ")}`);
  }
  if (frontmatter.application_area && !VALID_AREAS.includes(frontmatter.application_area)) {
    errors.push(`Invalid application_area: ${frontmatter.application_area}. Must be one of: ${VALID_AREAS.join(", ")}`);
  }
  if (frontmatter.published_date) {
    const rawDate = frontmatter.published_date;
    const dateStr = rawDate instanceof Date ? rawDate.toISOString().slice(0, 10) : String(rawDate);
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      errors.push(`Invalid date format: ${rawDate}. Must be YYYY-MM-DD`);
    } else {
      frontmatter.published_date = dateStr;
    }
  }
  return {
    valid: errors.length === 0,
    errors
  };
}
async function processArticle(filePath, db) {
  try {
    const fileName = path.basename(filePath);
    console.log(`\u{1F4C4} Processing: ${fileName}`);
    const fileContent = await fs.readFile(filePath, "utf-8");
    const { data: frontmatter, content } = matter(fileContent);
    const formatValidation = validateFormat(frontmatter);
    if (!formatValidation.valid) {
      const error = `Format validation failed:
${formatValidation.errors.join("\n")}`;
      console.error(`\u274C ${error}`);
      return { success: false, error };
    }
    if (!validateLanguage(frontmatter.title)) {
      const error = "\u{1F6A8} LANGUAGE_VIOLATION: Chinese characters detected in title";
      console.error(`\u274C ${error}`);
      return { success: false, error };
    }
    if (!validateLanguage(content)) {
      const error = "\u{1F6A8} LANGUAGE_VIOLATION: Chinese characters detected in content";
      console.error(`\u274C ${error}`);
      return { success: false, error };
    }
    if (!validateLanguage(frontmatter.meta_description)) {
      const error = "\u{1F6A8} LANGUAGE_VIOLATION: Chinese characters detected in meta_description";
      console.error(`\u274C ${error}`);
      return { success: false, error };
    }
    if (!validateLanguage(frontmatter.keywords)) {
      const error = "\u{1F6A8} LANGUAGE_VIOLATION: Chinese characters detected in keywords";
      console.error(`\u274C ${error}`);
      return { success: false, error };
    }
    console.log("\u2713 Language validation passed (English content confirmed)");
    let authorId;
    const existingAuthor = await db.select().from(authors).where(eq5(authors.slug, frontmatter.author_slug)).limit(1);
    if (existingAuthor.length > 0) {
      authorId = existingAuthor[0].id;
      console.log(`\u2713 Found existing author: ${frontmatter.author_slug} (ID: ${authorId})`);
    } else {
      const [newAuthor] = await db.insert(authors).values({
        name: frontmatter.author_slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        slug: frontmatter.author_slug,
        bio: "Chromatography expert at ROWELL HPLC",
        expertise: frontmatter.application_area,
        avatar: "/images/authors/default.jpg"
      });
      authorId = newAuthor.insertId;
      console.log(`\u2713 Created new author: ${frontmatter.author_slug} (ID: ${authorId})`);
    }
    const existingArticle = await db.select().from(articles).where(eq5(articles.slug, frontmatter.slug)).limit(1);
    if (existingArticle.length > 0) {
      await db.update(articles).set({
        title: frontmatter.title,
        content,
        category: frontmatter.category,
        applicationArea: frontmatter.application_area,
        publishedDate: new Date(frontmatter.published_date),
        metaDescription: frontmatter.meta_description || null,
        keywords: frontmatter.keywords || null,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq5(articles.id, existingArticle[0].id));
      console.log(`\u2705 Updated article: ${frontmatter.title}`);
    } else {
      await db.insert(articles).values({
        title: frontmatter.title,
        slug: frontmatter.slug,
        content,
        authorId,
        category: frontmatter.category,
        applicationArea: frontmatter.application_area,
        publishedDate: new Date(frontmatter.published_date),
        metaDescription: frontmatter.meta_description || null,
        keywords: frontmatter.keywords || null,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      });
      console.log(`\u2705 Created article: ${frontmatter.title}`);
    }
    return { success: true };
  } catch (error) {
    console.error(`\u274C Error processing ${filePath}:`, error.message);
    return { success: false, error: error.message };
  }
}
async function importArticles() {
  console.log("\n\u{1F680} Starting article import...");
  console.log(`\u{1F4C1} Articles directory: ${ARTICLES_DIR}`);
  try {
    try {
      await fs.access(ARTICLES_DIR);
    } catch {
      console.log(`\u26A0\uFE0F  Articles directory not found: ${ARTICLES_DIR}`);
      console.log("Creating directory...");
      await fs.mkdir(ARTICLES_DIR, { recursive: true });
      console.log("\u2713 Directory created");
      return;
    }
    const files = await fs.readdir(ARTICLES_DIR);
    const mdFiles = files.filter((file) => file.endsWith(".md") && file.toLowerCase() !== "readme.md");
    if (mdFiles.length === 0) {
      console.log("\u2139\uFE0F  No articles found to import");
      return;
    }
    console.log(`\u{1F4DA} Found ${mdFiles.length} article(s) to process`);
    const db = await getDb();
    let successCount = 0;
    let errorCount = 0;
    for (const file of mdFiles) {
      const filePath = path.join(ARTICLES_DIR, file);
      const result = await processArticle(filePath, db);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    }
    console.log("\n\u{1F4CA} Import Summary:");
    console.log(`\u2705 Success: ${successCount}`);
    console.log(`\u274C Errors: ${errorCount}`);
    console.log("\u{1F3C1} Article import completed\n");
  } catch (error) {
    console.error("\u274C Fatal error during article import:", error.message);
  }
}

// server/seed-articles.ts
async function seedArticles() {
  try {
    await importArticles();
    return {
      success: true,
      message: "Validated article import completed"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown article import failure";
    console.error("[seedArticles] Validated import failed:", error);
    return {
      success: false,
      message: "Validated article import failed",
      error: message
    };
  }
}

// server/seed-articles-router.ts
var seedArticlesRouter = router({
  execute: publicProcedure.mutation(async () => {
    try {
      console.log("Executing article seeding...");
      const result = await seedArticles();
      return result;
    } catch (error) {
      console.error("Seeding failed:", error);
      throw new Error(`Seeding failed: ${String(error)}`);
    }
  })
});

// server/manual-import-api.ts
init_db();
init_schema();
import * as fs2 from "fs";
import * as path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import matter2 from "gray-matter";
import { eq as eq6 } from "drizzle-orm";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
var ARTICLES_DIR2 = path2.join(__dirname2, "..", "content", "articles");
var REQUIRED_FIELDS2 = [
  "title",
  "author_slug",
  "category",
  "application_area",
  "slug",
  "published_date"
];
var VALID_CATEGORIES2 = ["application-notes", "technical-guides", "industry-trends", "literature-reviews"];
var VALID_AREAS2 = ["pharmaceutical", "environmental", "food-safety", "biopharmaceutical", "clinical", "chemical"];
function validateLanguage2(text2) {
  if (!text2) return true;
  const chineseRegex = /[\u4e00-\u9fa5]/;
  return !chineseRegex.test(text2);
}
function validateFormat2(frontmatter) {
  const errors = [];
  for (const field of REQUIRED_FIELDS2) {
    if (!frontmatter[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  if (frontmatter.category && !VALID_CATEGORIES2.includes(frontmatter.category)) {
    errors.push(`Invalid category: ${frontmatter.category}. Must be one of: ${VALID_CATEGORIES2.join(", ")}`);
  }
  if (frontmatter.application_area && !VALID_AREAS2.includes(frontmatter.application_area)) {
    errors.push(`Invalid application_area: ${frontmatter.application_area}. Must be one of: ${VALID_AREAS2.join(", ")}`);
  }
  return { valid: errors.length === 0, errors };
}
var manualImportRouter = router({
  importArticles: publicProcedure.query(async () => {
    const results = [];
    const logs = [];
    try {
      logs.push(`[INFO] Articles directory: ${ARTICLES_DIR2}`);
      logs.push(`[INFO] Directory exists: ${fs2.existsSync(ARTICLES_DIR2)}`);
      if (!fs2.existsSync(ARTICLES_DIR2)) {
        return {
          success: false,
          error: `Articles directory not found: ${ARTICLES_DIR2}`,
          logs
        };
      }
      const files = fs2.readdirSync(ARTICLES_DIR2).filter((f) => f.endsWith(".md") && f !== "README.md");
      logs.push(`[INFO] Found ${files.length} markdown files`);
      const db = await getDb();
      if (!db) {
        return {
          success: false,
          error: "Database connection failed",
          logs
        };
      }
      for (const filename of files) {
        const filePath = path2.join(ARTICLES_DIR2, filename);
        logs.push(`
[INFO] Processing: ${filename}`);
        try {
          const fileContent = fs2.readFileSync(filePath, "utf-8");
          const { data: frontmatter, content } = matter2(fileContent);
          const formatValidation = validateFormat2(frontmatter);
          if (!formatValidation.valid) {
            logs.push(`[ERROR] Format validation failed: ${formatValidation.errors.join(", ")}`);
            results.push({ filename, status: "error", error: formatValidation.errors.join(", ") });
            continue;
          }
          const textsToCheck = [
            frontmatter.title,
            content,
            frontmatter.meta_description,
            frontmatter.keywords
          ];
          for (const text2 of textsToCheck) {
            if (text2 && !validateLanguage2(text2)) {
              logs.push(`[ERROR] Chinese content detected - REJECTED`);
              results.push({ filename, status: "error", error: "Chinese content detected" });
              continue;
            }
          }
          const authorResult = await db.select().from(authors).where(eq6(authors.slug, frontmatter.author_slug)).limit(1);
          if (authorResult.length === 0) {
            logs.push(`[ERROR] Author not found: ${frontmatter.author_slug}`);
            results.push({ filename, status: "error", error: `Author not found: ${frontmatter.author_slug}` });
            continue;
          }
          const authorId = authorResult[0].id;
          logs.push(`[INFO] Found author ID: ${authorId}`);
          const existingArticle = await db.select().from(articles).where(eq6(articles.slug, frontmatter.slug)).limit(1);
          const parsedPublishedDate = new Date(frontmatter.published_date);
          if (Number.isNaN(parsedPublishedDate.getTime())) {
            logs.push(`[ERROR] Invalid published_date: ${frontmatter.published_date}`);
            results.push({ filename, status: "error", error: "Invalid published_date" });
            continue;
          }
          const articleData = {
            title: String(frontmatter.title),
            slug: String(frontmatter.slug),
            content,
            category: frontmatter.category,
            applicationArea: frontmatter.application_area,
            metaDescription: frontmatter.meta_description ? String(frontmatter.meta_description) : "",
            keywords: frontmatter.keywords ? String(frontmatter.keywords) : "",
            publishedDate: parsedPublishedDate.toISOString().slice(0, 19).replace("T", " "),
            authorId,
            viewCount: 0
          };
          if (existingArticle.length > 0) {
            await db.update(articles).set(articleData).where(eq6(articles.slug, frontmatter.slug));
            logs.push(`[SUCCESS] Updated article: ${frontmatter.slug}`);
            results.push({ filename, status: "updated", slug: frontmatter.slug });
          } else {
            await db.insert(articles).values(articleData);
            logs.push(`[SUCCESS] Created article: ${frontmatter.slug}`);
            results.push({ filename, status: "created", slug: frontmatter.slug });
          }
        } catch (error) {
          logs.push(`[ERROR] Failed to process ${filename}: ${error.message}`);
          results.push({ filename, status: "error", error: error.message });
        }
      }
      return {
        success: true,
        results,
        logs
      };
    } catch (error) {
      logs.push(`[FATAL] ${error.message}`);
      return {
        success: false,
        error: error.message,
        logs
      };
    }
  })
});

// server/standards-api.ts
import { z as z12 } from "zod";
var standardsRouter = router({
  // 获取所有分类
  listCategories: publicProcedure.query(async () => {
    const { getAllStandardsCategories: getAllStandardsCategories2 } = await Promise.resolve().then(() => (init_db_standards(), db_standards_exports));
    return await getAllStandardsCategories2();
  }),
  // 获取单个分类详情
  getCategoryBySlug: publicProcedure.input((raw) => z12.string().parse(raw)).query(async ({ input }) => {
    const { getStandardsCategoryBySlug: getStandardsCategoryBySlug2 } = await Promise.resolve().then(() => (init_db_standards(), db_standards_exports));
    return await getStandardsCategoryBySlug2(input);
  }),
  // 获取分类下的产品列表
  listByCategory: publicProcedure.input((raw) => z12.object({
    categorySlug: z12.string(),
    page: z12.number().min(1).optional().default(1),
    pageSize: z12.number().min(1).max(100).optional().default(20)
  }).parse(raw)).query(async ({ input }) => {
    const { getStandardsByCategory: getStandardsByCategory2 } = await Promise.resolve().then(() => (init_db_standards(), db_standards_exports));
    return await getStandardsByCategory2(input.categorySlug, input.page, input.pageSize);
  }),
  // 搜索产品
  search: publicProcedure.input((raw) => z12.object({
    query: z12.string().min(1),
    page: z12.number().min(1).optional().default(1),
    pageSize: z12.number().min(1).max(100).optional().default(20),
    categorySlug: z12.string().optional()
  }).parse(raw)).query(async ({ input }) => {
    const { searchStandardsProducts: searchStandardsProducts2 } = await Promise.resolve().then(() => (init_db_standards(), db_standards_exports));
    return await searchStandardsProducts2(input.query, input.page, input.pageSize, input.categorySlug);
  }),
  // 获取产品详情（by slug）
  getBySlug: publicProcedure.input((raw) => z12.string().parse(raw)).query(async ({ input }) => {
    const { getStandardsProductBySlug: getStandardsProductBySlug2 } = await Promise.resolve().then(() => (init_db_standards(), db_standards_exports));
    return await getStandardsProductBySlug2(input);
  }),
  // 获取相关产品
  getRelated: publicProcedure.input((raw) => z12.object({
    categorySlug: z12.string(),
    excludeId: z12.number(),
    limit: z12.number().optional().default(6)
  }).parse(raw)).query(async ({ input }) => {
    const { getRelatedStandardsProducts: getRelatedStandardsProducts2 } = await Promise.resolve().then(() => (init_db_standards(), db_standards_exports));
    return await getRelatedStandardsProducts2(input.categorySlug, input.excludeId, input.limit);
  }),
  // 获取统计数据
  getStats: publicProcedure.query(async () => {
    const { getStandardsStats: getStandardsStats2 } = await Promise.resolve().then(() => (init_db_standards(), db_standards_exports));
    return await getStandardsStats2();
  })
});

// server/routers.ts
var appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  // Product routes
  products: router({
    list: publicProcedure.input((raw) => {
      const { productsListInput: productsListInput2 } = (init_products_list_new(), __toCommonJS(products_list_new_exports));
      return productsListInput2.parse(raw);
    }).query(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { productsListQuery: productsListQuery2 } = await Promise.resolve().then(() => (init_products_list_new(), products_list_new_exports));
      const db = await getDb2();
      if (!db) throw new Error("Database not available");
      return await productsListQuery2(input, db);
    }),
    getBrandStats: publicProcedure.input((raw) => z14.object({ categoryId: z14.number().optional() }).parse(raw)).query(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { products: products2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { and: and5, eq: eq13, sql: sql6 } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) return {};
      const conditions = [eq13(products2.status, "active")];
      if (input.categoryId) {
        conditions.push(sql6`${products2.id} IN (SELECT product_id FROM product_categories WHERE category_id = ${input.categoryId})`);
      }
      const rows = await db.select({ brand: products2.brand, count: sql6`COUNT(*)` }).from(products2).where(and5(...conditions)).groupBy(products2.brand);
      return Object.fromEntries(
        rows.filter((row) => Boolean(row.brand)).map((row) => [row.brand, Number(row.count)])
      );
    }),
    getByIds: publicProcedure.input((raw) => {
      return z14.object({
        productIds: z14.array(z14.number())
      }).parse(raw);
    }).query(async ({ input }) => {
      return await getProductsByIds(input.productIds);
    }),
    getBySlug: publicProcedure.input((raw) => {
      return z14.string().parse(raw);
    }).query(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { products: products2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq13 } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) throw new Error("Database not available");
      const result = await db.select().from(products2).where(eq13(products2.slug, input)).limit(1);
      return result[0] || null;
    }),
    getRelated: publicProcedure.input((raw) => {
      return z14.object({
        productId: z14.string(),
        limit: z14.number().optional().default(6)
      }).parse(raw);
    }).query(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { products: products2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq13, and: and5, or: or2, ne, sql: sql6 } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) throw new Error("Database not available");
      const currentProduct = await db.select().from(products2).where(eq13(products2.productId, input.productId)).limit(1);
      if (!currentProduct || currentProduct.length === 0) {
        return [];
      }
      const product = currentProduct[0];
      const relatedProducts = await db.select().from(products2).where(
        and5(
          ne(products2.id, product.id),
          // Exclude current product
          eq13(products2.status, "active"),
          // Only active products
          or2(
            eq13(products2.brand, product.brand),
            // Same brand
            product.phaseType ? eq13(products2.phaseType, product.phaseType) : void 0,
            // Same phase type
            product.usp ? eq13(products2.usp, product.usp) : void 0,
            // Same USP
            // Similar particle size (within 1 µm)
            product.particleSize ? sql6`ABS(${products2.particleSize} - ${product.particleSize}) <= 1` : void 0
          )
        )
      ).limit(input.limit);
      return relatedProducts;
    })
  }),
  // Customer messages routes
  messages: router({
    list: publicProcedure.input((raw) => {
      return z14.object({
        status: z14.enum(["new", "read", "replied", "closed", "all"]).optional().default("all"),
        page: z14.number().optional().default(1),
        pageSize: z14.number().optional().default(20),
        search: z14.string().optional()
      }).parse(raw);
    }).query(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { customerMessages: customerMessages2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq13, desc: desc4, or: or2, sql: sql6, and: and5 } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) throw new Error("Database not available");
      const conditions = [];
      if (input.status !== "all") {
        conditions.push(eq13(customerMessages2.status, input.status));
      }
      if (input.search) {
        const searchTerm = `%${input.search}%`;
        conditions.push(
          or2(
            sql6`LOWER(${customerMessages2.name}) LIKE ${searchTerm.toLowerCase()}`,
            sql6`LOWER(${customerMessages2.email}) LIKE ${searchTerm.toLowerCase()}`,
            sql6`LOWER(${customerMessages2.productId}) LIKE ${searchTerm.toLowerCase()}`,
            sql6`LOWER(${customerMessages2.message}) LIKE ${searchTerm.toLowerCase()}`
          )
        );
      }
      const whereClause = conditions.length > 0 ? and5(...conditions) : void 0;
      const countResult = await db.select({ count: sql6`count(*)` }).from(customerMessages2).where(whereClause);
      const total = countResult[0]?.count || 0;
      const messages = await db.select().from(customerMessages2).where(whereClause).orderBy(desc4(customerMessages2.createdAt)).limit(input.pageSize).offset((input.page - 1) * input.pageSize);
      return {
        messages,
        total,
        totalPages: Math.ceil(total / input.pageSize)
      };
    }),
    updateStatus: publicProcedure.input((raw) => {
      return z14.object({
        id: z14.number(),
        status: z14.enum(["new", "read", "replied", "closed"])
      }).parse(raw);
    }).mutation(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { customerMessages: customerMessages2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq13 } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) throw new Error("Database not available");
      await db.update(customerMessages2).set({ status: input.status }).where(eq13(customerMessages2.id, input.id));
      return { success: true };
    }),
    getStats: publicProcedure.query(async () => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { customerMessages: customerMessages2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq13, sql: sql6 } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) throw new Error("Database not available");
      const stats = await db.select({
        status: customerMessages2.status,
        count: sql6`count(*)`
      }).from(customerMessages2).groupBy(customerMessages2.status);
      const statsMap = {
        new: 0,
        read: 0,
        replied: 0,
        closed: 0,
        total: 0
      };
      stats.forEach((stat) => {
        statsMap[stat.status] = stat.count;
        statsMap.total += stat.count;
      });
      return statsMap;
    }),
    create: publicProcedure.input((raw) => {
      return z14.object({
        type: z14.enum(["inquiry", "message", "quote_request"]).default("message"),
        name: z14.string().min(2, "\u59D3\u540D\u81F3\u5C11 2 \u4E2A\u5B57\u7B26").max(100, "\u59D3\u540D\u6700\u591A 100 \u4E2A\u5B57\u7B26"),
        email: z14.string().email("\u8BF7\u8F93\u5165\u6709\u6548\u7684\u90AE\u7BB1\u5730\u5740"),
        company: z14.string().optional(),
        phone: z14.string().optional(),
        productId: z14.string().optional(),
        productName: z14.string().optional(),
        message: z14.string().min(10, "\u7559\u8A00\u81F3\u5C11 10 \u4E2A\u5B57\u7B26").max(1e3, "\u7559\u8A00\u6700\u591A 1000 \u4E2A\u5B57\u7B26")
      }).parse(raw);
    }).mutation(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { customerMessages: customerMessages2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const db = await getDb2();
      if (!db) throw new Error("Database not available");
      const result = await db.insert(customerMessages2).values({
        type: input.type || "message",
        name: input.name,
        email: input.email,
        company: input.company,
        phone: input.phone,
        productId: input.productId,
        productName: input.productName,
        message: input.message,
        status: "new"
      });
      try {
        const { sendCustomerMessageNotification: sendCustomerMessageNotification2 } = await Promise.resolve().then(() => (init_email_notification(), email_notification_exports));
        await sendCustomerMessageNotification2({
          type: input.type || "message",
          name: input.name,
          email: input.email,
          phone: input.phone,
          company: input.company,
          message: input.message,
          productId: input.productId,
          productName: input.productName
        });
      } catch (emailError) {
        console.error("Failed to send notification email:", emailError);
      }
      return {
        success: true,
        messageId: result[0].insertId
      };
    })
  }),
  // Inquiry routes
  inquiries: router({
    create: publicProcedure.input((raw) => {
      return z14.object({
        productIds: z14.array(z14.number()).min(1, "\u8BF7\u9009\u62E9\u81F3\u5C11\u4E00\u4E2A\u4EA7\u54C1"),
        userInfo: z14.object({
          name: z14.string().min(2, "\u59D3\u540D\u81F3\u5C11 2 \u4E2A\u5B57\u7B26").max(50, "\u59D3\u540D\u6700\u591A 50 \u4E2A\u5B57\u7B26"),
          email: z14.string().email("\u8BF7\u8F93\u5165\u6709\u6548\u7684\u90AE\u7BB1\u5730\u5740"),
          company: z14.string().optional(),
          phone: z14.string().optional(),
          message: z14.string().max(500, "\u7559\u8A00\u6700\u591A 500 \u4E2A\u5B57\u7B26").optional()
        })
      }).parse(raw);
    }).mutation(async () => {
      throw new Error("Direct inquiry creation requires an authenticated account. Use the product inquiry form instead.");
    })
  }),
  // USP Standards routes
  usp: router({
    listWithProductCount: publicProcedure.query(async () => {
      const { getAllUSPStandardsWithProductCount: getAllUSPStandardsWithProductCount2 } = await Promise.resolve().then(() => (init_db_usp(), db_usp_exports));
      return await getAllUSPStandardsWithProductCount2();
    }),
    getByCode: publicProcedure.input((raw) => {
      return z14.object({
        code: z14.string(),
        productLimit: z14.number().optional().default(50)
      }).parse(raw);
    }).query(async ({ input }) => {
      const { getUSPStandardWithProducts: getUSPStandardWithProducts2 } = await Promise.resolve().then(() => (init_db_usp(), db_usp_exports));
      return await getUSPStandardWithProducts2(input.code, input.productLimit);
    }),
    fillProductData: publicProcedure.mutation(async () => {
      const { fillProductUSPData: fillProductUSPData2 } = await Promise.resolve().then(() => (init_db_usp(), db_usp_exports));
      return await fillProductUSPData2();
    })
  }),
  // Resources routes
  resources: router({
    list: publicProcedure.input((raw) => {
      return z14.object({
        page: z14.number().min(1).optional(),
        pageSize: z14.number().min(1).max(100).optional(),
        search: z14.string().optional(),
        category: z14.string().optional()
      }).optional().parse(raw);
    }).query(async ({ input }) => {
      const page = input?.page || 1;
      const pageSize = input?.pageSize || 12;
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const db = await getDb2();
      if (!db) {
        return { items: [], total: 0, page, pageSize };
      }
      const { resources: resources2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq13, like: like2, and: and5, desc: desc4 } = await import("drizzle-orm");
      const conditions = [];
      if (input?.search) {
        conditions.push(
          like2(resources2.title, `%${input.search}%`)
        );
      }
      if (input?.category) {
        conditions.push(eq13(resources2.category, input.category));
      }
      const whereClause = conditions.length > 0 ? and5(...conditions) : void 0;
      const allResources = await db.select().from(resources2).where(whereClause);
      const total = allResources.length;
      const offset = (page - 1) * pageSize;
      const results = await db.select().from(resources2).where(whereClause).orderBy(desc4(resources2.publishedAt)).limit(pageSize).offset(offset);
      return {
        items: results,
        total,
        page,
        pageSize
      };
    }),
    getBySlug: publicProcedure.input((raw) => {
      return z14.object({
        slug: z14.string()
      }).parse(raw);
    }).query(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const db = await getDb2();
      if (!db) {
        return null;
      }
      const { resources: resources2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq13 } = await import("drizzle-orm");
      const results = await db.select().from(resources2).where(eq13(resources2.slug, input.slug)).limit(1);
      return results.length > 0 ? results[0] : null;
    }),
    listCategories: publicProcedure.query(async () => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const db = await getDb2();
      if (!db) {
        return [];
      }
      const { resources: resources2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { sql: sql6 } = await import("drizzle-orm");
      const results = await db.select({ category: resources2.category }).from(resources2).groupBy(resources2.category);
      return results.map((r) => r.category).filter(Boolean);
    })
  }),
  // Category routes
  category: router({
    getAll: publicProcedure.query(async () => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { categories: categories2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { asc } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) throw new Error("Database not available");
      const result = await db.select().from(categories2).orderBy(asc(categories2.parentId), asc(categories2.displayOrder));
      return result;
    }),
    getWithProductCount: publicProcedure.query(async () => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const db = await getDb2();
      if (!db) throw new Error("Database not available");
      const result = await db.execute(`
          SELECT 
            c.id,
            c.name,
            c.name_en as nameEn,
            c.slug,
            c.parent_id as parentId,
            c.level,
            c.display_order as displayOrder,
            c.is_visible as isVisible,
            c.description,
            c.icon,
            c.created_at as createdAt,
            c.updated_at as updatedAt,
            COUNT(DISTINCT pc.product_id) as productCount
          FROM categories c
          LEFT JOIN product_categories pc ON c.id = pc.category_id
          GROUP BY c.id, c.name, c.name_en, c.slug, c.parent_id, c.level, c.display_order, c.is_visible, c.description, c.icon, c.created_at, c.updated_at
          ORDER BY c.parent_id, c.display_order
        `);
      return Array.isArray(result[0]) ? result[0] : [];
    })
  }),
  // Brand routes
  brand: router({
    getWithProductCount: publicProcedure.query(async () => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const db = await getDb2();
      if (!db) throw new Error("Database not available");
      const result = await db.execute(`
          SELECT 
            brand,
            COUNT(*) as productCount
          FROM products
          WHERE brand IS NOT NULL AND brand != '' AND status = 'active'
          GROUP BY brand
          ORDER BY productCount DESC, brand ASC        `);
      return Array.isArray(result[0]) ? result[0] : [];
    })
  }),
  // Seed APII for importing resources
  // Admin API for data management
  admin: adminRouter,
  // List categories API
  listCategories: listCategoriesRouter,
  // Update product category
  updateProductCategory: updateProductCategoryRouter,
  // Update GlycoWorks using mysql2
  updateGlycoWorksMysql2: updateGlycoWorksMysql2Router,
  cleanupProductCategories: cleanupProductCategoriesRouter,
  checkDataConsistency: checkDataConsistencyRouter,
  describeProductsTable: describeProductsTableRouter,
  // Query categories
  queryCategories: queryCategoriesRouter,
  // Full consistency check
  fullConsistencyCheck: fullConsistencyCheckRouter,
  // Get orphan products
  getOrphanProducts: getOrphanProductsRouter,
  // Batch fix orphan products
  batchFixOrphanProducts: batchFixOrphanProductsRouter,
  // Batch fix orphan products (paginated)
  batchFixOrphanPaginated: batchFixOrphanPaginatedRouter,
  // Export all products
  exportAllProducts: exportAllProductsRouter,
  // Fix known misclassifications
  fixKnownMisclassifications: fixKnownMisclassificationsRouter,
  // Diagnose database structure and categories
  diagnoseDatabase: diagnoseDatabaseRouter,
  // Find plate-related categories
  findPlateCategories: findPlateCategoriesRouter,
  // Get all categories
  getAllCategories: getAllCategoriesRouter,
  // Fix product categories (final version)
  fixProductCategoriesFinal: fixProductCategoriesFinalRouter,
  // Fix products with NULL category_id
  fixNullCategories: fixNullCategoriesRouter,
  // Check syringe filter products
  checkSyringeFilters: checkSyringeFiltersRouter,
  // Find GC column products
  findGcColumns: findGcColumnsRouter,
  // Create GC Column categories
  createGcCategories: createGcCategoriesRouter,
  // Reclassify GC column products
  reclassifyGcProducts: reclassifyGcProductsRouter,
  // Fix remaining GC products
  fixRemainingGc: fixRemainingGcRouter,
  // Check GC categories slug
  checkGcSlug: checkGcSlugRouter,
  // One-time update for YMC and Tosoh product data
  updateYmcTosoh: updateYmcTosohRouter,
  updateDimensions: updateDimensionsRouter,
  // Learning Center routes
  learningCenter: learningCenterRouter,
  // Seed articles (one-time operation)
  seedArticles: seedArticlesRouter,
  // Manual import articles for testing
  manualImport: manualImportRouter,
  // ANPEL Reference Standards
  standards: standardsRouter
  // Removed unused routers: uploadProductImagesBatch, fixCapsSepta
});

// server/_core/context.ts
async function createContext(opts) {
  if (opts.req.url?.includes("literature")) {
    console.log("[tRPC Debug] Request URL:", opts.req.url);
    console.log("[tRPC Debug] Query params:", opts.req.query);
    console.log("[tRPC Debug] Body:", opts.req.body);
  }
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs3 from "fs";
import { nanoid } from "nanoid";
import path4 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path3 from "path";
import { defineConfig } from "vite";
var plugins = [react(), tailwindcss()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path3.resolve(import.meta.dirname, "client", "src"),
      "@shared": path3.resolve(import.meta.dirname, "shared"),
      "@assets": path3.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path3.resolve(import.meta.dirname),
  root: path3.resolve(import.meta.dirname, "client"),
  publicDir: path3.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path3.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // 为每个chunk生成唯一的文件名,确保CDN缓存更新
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`
      }
    }
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
init_db();
init_schema();
import { desc as desc2, eq as eq9 } from "drizzle-orm";

// shared/categoryLandingContent.ts
var CATEGORY_LANDING_PROFILES = {
  "c18-columns": {
    name: "C18 HPLC Columns",
    catalogSlug: "c18-columns",
    eyebrow: "Reversed-Phase HPLC Column Selection",
    heading: "C18 HPLC Columns for Reliable Reversed-Phase Separations",
    summary: "Browse ROWELL's C18 HPLC column range and use practical selection factors to match stationary phase, dimensions, particle size, and method requirements.",
    overview: "C18 columns are widely used in reversed-phase HPLC because their octadecyl-bonded stationary phase provides hydrophobic retention for many small-molecule and moderately non-polar analytes. A productive starting point is to align the column chemistry with the analyte and mobile-phase conditions, then refine dimensions and particle size for the required resolution, analysis time, and system pressure.",
    selectionPoints: [
      "Start with the analytical goal: screening, method development, routine QC, or a validated transfer.",
      "Match internal diameter and column length to sample throughput, sensitivity, and instrument configuration.",
      "Confirm particle size, pore size, and pH operating range against the method conditions before purchase."
    ],
    faq: [
      { question: "When is a C18 column a practical starting point?", answer: "A C18 phase is commonly evaluated first for reversed-phase separations where analytes show useful hydrophobic retention. Final selection should be confirmed during method development with the intended mobile phase and sample matrix." },
      { question: "Which dimensions should I compare first?", answer: "Compare column length, internal diameter, particle size, and pore size with the existing method and instrument limits. These parameters affect retention, efficiency, solvent consumption, and backpressure." },
      { question: "How should I protect a C18 analytical column?", answer: "Use appropriate sample preparation and, where compatible with the analytical column, a guard column or guard cartridge. Replace protective components according to method performance rather than a fixed unsupported interval." }
    ]
  },
  "guard-columns": {
    name: "HPLC Guard Columns",
    catalogSlug: "guard-columns",
    eyebrow: "Analytical Column Protection",
    heading: "HPLC Guard Columns and Guard Cartridges for Method Protection",
    summary: "Select compatible HPLC guard columns and cartridges to help protect analytical columns from particulates and strongly retained sample components.",
    overview: "A guard column is placed before an analytical HPLC column to provide a replaceable protection stage. It can help reduce the impact of particulates and matrix components that may otherwise accumulate at the analytical-column inlet. Compatibility matters: the guard format, internal diameter, and stationary-phase chemistry should be considered together with the analytical method.",
    selectionPoints: [
      "Use a guard phase that is compatible with the analytical column chemistry and method objective.",
      "Check the hardware format, connection type, internal diameter, and pressure rating before installation.",
      "Combine guard-column use with appropriate sample filtration or cleanup for the matrix being analyzed."
    ],
    faq: [
      { question: "Does every HPLC method require a guard column?", answer: "Not every method requires one. A guard column is most useful when the sample matrix or injection history creates a credible risk of contamination at the analytical-column inlet." },
      { question: "Should the guard chemistry match the analytical column?", answer: "Matching or method-compatible chemistry is generally the safest starting point because it reduces the chance that the guard changes selectivity before the analytical separation." },
      { question: "When should a guard cartridge be changed?", answer: "Use observed method indicators such as pressure change, peak-shape deterioration, retention shifts, or recovery of performance after replacement. The appropriate interval depends on the sample matrix and workflow." }
    ]
  },
  "gc-columns": {
    name: "GC Columns",
    catalogSlug: "gc-columns",
    eyebrow: "Capillary GC Column Selection",
    heading: "GC Capillary Columns for Method Development and Routine Analysis",
    summary: "Explore ROWELL's GC column range and compare stationary-phase polarity, column dimensions, film thickness, and temperature requirements for your analytical method.",
    overview: "GC column selection begins with the analyte volatility, polarity, matrix, detector, and separation objective. Stationary-phase polarity influences selectivity, while internal diameter, length, and film thickness influence retention, efficiency, sample capacity, and flow requirements. Selecting a column should therefore be a method-level decision rather than a brand-name substitution alone.",
    selectionPoints: [
      "Compare stationary-phase polarity with the analytes and the selectivity required by the method.",
      "Review column length, internal diameter, and film thickness together rather than in isolation.",
      "Confirm the planned oven program and inlet conditions are compatible with the column temperature limits."
    ],
    faq: [
      { question: "What drives GC column selectivity?", answer: "Stationary-phase chemistry is a central driver of selectivity. Analyte properties, temperature programming, carrier-gas conditions, and sample introduction also affect the observed separation." },
      { question: "How does film thickness affect a GC method?", answer: "Film thickness can affect retention and sample capacity, especially for volatile analytes. The appropriate choice depends on the method objective and operating conditions." },
      { question: "Can I transfer a GC method to a different column?", answer: "Method transfer should be evaluated experimentally. Match the phase type and dimensions as closely as possible, then verify retention, resolution, and suitability criteria under the intended conditions." }
    ]
  },
  "kinetex-pfp-columns": {
    name: "Phenomenex Kinetex F5 / PFP (USP L43) Columns",
    catalogSlug: "kinetex-pfp-columns",
    catalogHref: "/products?search=PFP",
    eyebrow: "Kinetex F5 / PFP (USP L43) Column Selection",
    heading: "Phenomenex Kinetex F5 / PFP (USP L43) Columns for HPLC Method Evaluation",
    summary: "Explore ROWELL's currently listed Kinetex F5 / PFP HPLC columns and compare listed dimensions, particle size, pore size, and pentafluorophenyl-propyl (USP L43) chemistry for method review.",
    overview: "Phenomenex identifies Kinetex F5 as a pentafluorophenyl-propyl, USP L43 core-shell HPLC column family. It can be considered when a method team is reviewing stationary-phase selectivity alongside conventional reversed-phase chemistries. Product selection should begin with the analytical objective, sample matrix, and method conditions, then compare the listed particle size, internal diameter, and column length with instrument and method requirements.",
    selectionPoints: [
      "Confirm that a Kinetex F5 / PFP (USP L43) selectivity evaluation is appropriate for the analytes and intended method objective before making a substitution.",
      "Compare particle size, pore size, internal diameter, and column length with the current method and instrument pressure limits.",
      "Use the exact part number when reviewing manufacturer documentation, preparing a method evaluation, or requesting a quote."
    ],
    faq: [
      { question: "What is a PFP HPLC stationary phase?", answer: "PFP refers to pentafluorophenyl stationary-phase chemistry. It is used in reversed-phase LC and can be evaluated when method development requires a different selectivity option from a conventional alkyl phase." },
      { question: "What should be compared when selecting a Kinetex F5 / PFP column?", answer: "Compare the intended stationary-phase chemistry, particle size, pore size, internal diameter, and column length with the method objective, sample matrix, and instrument operating limits." },
      { question: "Can a PFP column replace a C18 column without method work?", answer: "A change of stationary-phase chemistry can change selectivity. Any replacement should be evaluated using the actual method conditions and the method\u2019s suitability criteria." }
    ]
  },
  "chiral-hplc-columns": {
    name: "Chiral HPLC Columns",
    catalogSlug: "chiral-hplc-columns",
    catalogHref: "/products?search=chiral",
    eyebrow: "Chiral Separation Column Selection",
    heading: "Chiral HPLC Columns for Enantioselective Method Development",
    summary: "Browse ROWELL's current chiral chromatography column listings and compare manufacturer-stated dimensions, particle size, stationary-phase format, and method compatibility.",
    overview: "Chiral column selection should begin with the exact analyte, the intended separation mode, and the manufacturer documentation for the selected part number. The active catalog includes chiral column families from multiple brands; use the catalog to compare current listings before requesting a quote or planning a method evaluation.",
    selectionPoints: [
      "Use the exact product part number and manufacturer documentation when reviewing a chiral stationary phase.",
      "Check whether the intended HPLC, normal-phase, reversed-phase, or SFC conditions are supported for the selected column.",
      "Confirm dimensions, particle size, solvent compatibility, and method suitability with the actual analytical workflow."
    ],
    faq: [
      { question: "How should I start selecting a chiral HPLC column?", answer: "Start with the analyte, the separation objective, and manufacturer guidance for the intended method. Chiral selectivity should be verified experimentally under the planned conditions." },
      { question: "Can a chiral column be substituted without method work?", answer: "A change of chiral stationary phase, dimensions, or operating conditions can affect selectivity. Any substitution should be evaluated against the method\u2019s suitability criteria." },
      { question: "Which product details should be confirmed before requesting a quote?", answer: "Confirm the exact part number, dimensions, particle size, technique compatibility, and the manufacturer documentation relevant to the planned method." }
    ]
  },
  "hilic-hplc-columns": {
    name: "HILIC HPLC Columns",
    catalogSlug: "hilic-hplc-columns",
    catalogHref: "/products?search=HILIC",
    eyebrow: "Polar Analyte Retention Selection",
    heading: "HILIC HPLC Columns for Polar Compound Method Evaluation",
    summary: "Browse ROWELL's current HILIC column listings and compare manufacturer-stated stationary phase, dimensions, particle size, and method compatibility for polar-analyte workflows.",
    overview: "HILIC methods are commonly evaluated when a method requires a different retention mechanism for polar analytes. Product selection should be based on the exact stationary phase, sample chemistry, mobile-phase conditions, and manufacturer documentation for the selected part number.",
    selectionPoints: [
      "Review the listed stationary phase and manufacturer method guidance before transferring or developing a HILIC method.",
      "Compare column dimensions and particle size with instrument pressure limits and the intended method scale.",
      "Confirm equilibration, sample-solvent, and mobile-phase requirements using the selected manufacturer\u2019s documentation."
    ],
    faq: [
      { question: "When can a HILIC column be evaluated?", answer: "HILIC can be evaluated when a method needs a polar-analyte retention mechanism that differs from conventional reversed-phase conditions. Suitability depends on the analyte and method conditions." },
      { question: "Can all HILIC columns use the same method conditions?", answer: "No. Stationary-phase chemistry and manufacturer guidance differ by product. Check the exact part number before selecting solvents, additives, or operating conditions." },
      { question: "What should I compare in the active catalog?", answer: "Compare the listed phase, dimensions, particle size, brand documentation, and method compatibility for the current product listing." }
    ]
  },
  "c8-hplc-columns": {
    name: "C8 HPLC Columns",
    catalogSlug: "c8-hplc-columns",
    catalogHref: "/products?search=C8",
    eyebrow: "Reversed-Phase Selectivity Selection",
    heading: "C8 HPLC Columns for Reversed-Phase Method Development",
    summary: "Explore ROWELL's current C8 HPLC column listings and compare manufacturer-stated dimensions, particle size, pore size, and method compatibility.",
    overview: "C8 is a reversed-phase stationary-phase family that can be evaluated alongside other alkyl phases during method development. The correct choice depends on the analyte, mobile phase, separation objective, and the documented limits for the exact column part number.",
    selectionPoints: [
      "Compare the selected C8 phase with the actual method objective rather than assuming equivalence with another phase.",
      "Check column length, internal diameter, particle size, and pore size against the current method and instrument limits.",
      "Use manufacturer documentation to confirm applicable solvent, pH, and pressure guidance for the exact part number."
    ],
    faq: [
      { question: "When might a C8 phase be evaluated?", answer: "A C8 phase can be evaluated as a reversed-phase option when method development requires a different retention profile from the current column. The outcome should be confirmed experimentally." },
      { question: "Is every C8 column interchangeable?", answer: "No. Bonding chemistry, hardware, dimensions, particle size, and manufacturer limits can differ. Compare the exact products before making a substitution." },
      { question: "What information is needed for a C8 quote?", answer: "Provide the desired part number where possible, or the required phase, dimensions, particle size, and intended method conditions." }
    ]
  },
  "phenyl-hplc-columns": {
    name: "Phenyl HPLC Columns",
    catalogSlug: "phenyl-hplc-columns",
    catalogHref: "/products?search=phenyl",
    eyebrow: "Alternative Reversed-Phase Selectivity",
    heading: "Phenyl HPLC Columns for Alternative Selectivity Evaluation",
    summary: "Browse ROWELL's current phenyl and phenyl-hexyl HPLC column listings and compare manufacturer-stated chemistry, dimensions, particle size, and method compatibility.",
    overview: "Phenyl-type stationary phases can be evaluated when a method team is considering an alternative selectivity option. Selection should be based on the exact product chemistry, the analyte and matrix, and manufacturer documentation rather than a general assumption about performance.",
    selectionPoints: [
      "Identify the exact phenyl or phenyl-hexyl chemistry listed for the candidate product.",
      "Compare dimensions and particle size with the method objective and instrument operating limits.",
      "Verify the selected product\u2019s documented operating conditions before changing a validated method."
    ],
    faq: [
      { question: "Why consider a phenyl HPLC column?", answer: "A phenyl-type phase can be evaluated when method development calls for an alternative selectivity option. The appropriate choice depends on the analyte and actual method data." },
      { question: "Are phenyl and phenyl-hexyl phases identical?", answer: "No. Product chemistry and manufacturer specifications can differ. Review the exact product documentation before treating any phases as interchangeable." },
      { question: "How should a phenyl-column change be assessed?", answer: "Evaluate retention, selectivity, resolution, and method suitability using the actual operating conditions and predefined acceptance criteria." }
    ]
  },
  "kinetex-hplc-columns": {
    name: "Phenomenex Kinetex HPLC Columns",
    catalogSlug: "kinetex-hplc-columns",
    catalogHref: "/products?search=Kinetex",
    eyebrow: "Kinetex Core-Shell LC Column Selection",
    heading: "Phenomenex Kinetex HPLC Columns for Method Evaluation",
    summary: "Browse ROWELL's current Phenomenex Kinetex column listings and compare the listed phase, dimensions, particle size, and manufacturer documentation for your method.",
    overview: "Phenomenex describes the Kinetex family as core-shell LC columns with multiple stationary-phase options. ROWELL's active catalog includes currently listed Kinetex products; review each exact part number and the associated manufacturer documentation before selecting a phase or planning method work.",
    selectionPoints: [
      "Use the active catalog to identify the exact Kinetex product and compare its listed phase, dimensions, and particle size.",
      "Confirm compatibility with the instrument, mobile phase, and validated method before changing columns.",
      "Treat each stationary phase as a distinct method-development option rather than assuming all Kinetex variants are interchangeable."
    ],
    faq: [
      { question: "What is the Kinetex column family?", answer: "Phenomenex describes Kinetex as a core-shell LC column family with multiple stationary-phase options. Review the exact product documentation for the selected part number." },
      { question: "Does this page list every Kinetex phase?", answer: "The catalog link shows ROWELL's current active listings. Availability and documented specifications should be checked for each exact part number." },
      { question: "Can a Kinetex phase be substituted directly for another phase?", answer: "A phase change can alter chromatographic behavior. Evaluate substitutions under the actual method conditions and method-suitability requirements." }
    ]
  },
  "agilent-poroshell-columns": {
    name: "Agilent InfinityLab Poroshell HPLC Columns",
    catalogSlug: "agilent-poroshell-columns",
    catalogHref: "/products?search=Poroshell",
    eyebrow: "Poroshell Core-Shell Column Selection",
    heading: "Agilent InfinityLab Poroshell HPLC Columns",
    summary: "Explore ROWELL's current Agilent InfinityLab Poroshell column listings and compare manufacturer-stated chemistry, dimensions, particle size, and method compatibility.",
    overview: "Agilent describes the InfinityLab Poroshell 120 family as superficially porous LC columns with multiple chemistries and particle sizes. Use the active catalog to identify current listings, then confirm the exact product documentation before selecting a column for a method.",
    selectionPoints: [
      "Compare the exact listed Poroshell chemistry and dimensions with the method objective and existing instrument configuration.",
      "Review the manufacturer documentation for the selected part number before choosing operating conditions.",
      "Verify a method transfer or substitution using the method\u2019s own suitability criteria."
    ],
    faq: [
      { question: "What is the InfinityLab Poroshell 120 family?", answer: "Agilent describes Poroshell 120 as a superficially porous LC column family with multiple chemistries and particle sizes. Specifications depend on the exact part number." },
      { question: "Can Poroshell products support different LC methods?", answer: "The family includes multiple chemistries, but suitability depends on the selected product, analyte, mobile phase, and method requirements." },
      { question: "How should I compare current Poroshell listings?", answer: "Compare the exact phase, dimensions, particle size, and manufacturer documentation with the existing method and instrument limits." }
    ]
  },
  "spe-cartridges": {
    name: "SPE Cartridges",
    catalogSlug: "spe-cartridges",
    eyebrow: "Solid-Phase Extraction Selection",
    heading: "SPE Cartridges for Targeted Sample Cleanup and Concentration",
    summary: "Choose SPE cartridges by considering analyte chemistry, sample matrix, cleanup objective, sorbent selectivity, and elution strategy.",
    overview: "Solid-phase extraction can be used to reduce matrix interference, concentrate analytes, and prepare samples before chromatographic analysis. A reliable selection process starts by defining the analyte properties and sample matrix, then selecting a sorbent mechanism and workflow that supports the intended retention, wash, and elution steps. Method suitability should be demonstrated with representative samples and recovery checks.",
    selectionPoints: [
      "Define the analytes, sample matrix, target concentration range, and required cleanup before choosing sorbent chemistry.",
      "Compare sorbent mass and cartridge format with expected sample load and the planned loading volume.",
      "Validate conditioning, loading, wash, and elution steps using recovery and matrix-effect data for the actual method."
    ],
    faq: [
      { question: "How do I choose an SPE sorbent?", answer: "Start with analyte polarity, ionization behavior, and matrix composition. Reversed-phase, normal-phase, ion-exchange, and mixed-mode options should be compared against the intended retention and cleanup mechanism." },
      { question: "Can one SPE cartridge serve every sample type?", answer: "No. Cartridge selection and workflow conditions should be evaluated for the actual matrix and analyte set, because matrix composition can materially affect retention and recovery." },
      { question: "What should be checked after selecting an SPE cartridge?", answer: "Confirm recovery, precision, matrix effects, and blank performance under the planned conditioning, loading, wash, and elution steps before routine use." }
    ]
  }
};
var CATEGORY_LANDING_SLUGS = Object.keys(CATEGORY_LANDING_PROFILES);

// server/_core/vite.ts
var SITE_URL = "https://www.rowellhplc.com";
function extractSlugFromPath(urlPath) {
  const match = urlPath.match(/^\/resources\/([^\/\?]+)/);
  return match ? match[1] : null;
}
function extractProductSlugFromPath(urlPath) {
  const match = urlPath.match(/^\/products\/([^\/\?]+)/);
  return match ? match[1] : null;
}
function extractCategoryLandingSlug(urlPath) {
  const match = urlPath.match(/^\/categories\/([^\/\?]+)/);
  return match ? match[1] : null;
}
function escapeHtml(text2) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return text2.replace(/[&<>"']/g, (m) => map[m]);
}
function serializeJsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
function toAbsoluteUrl(value) {
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_URL}${value.startsWith("/") ? "" : "/"}${value}`;
}
async function injectArticleSeoMetaTags(template, req, overridePath) {
  const slug = extractSlugFromPath(overridePath || req.path);
  if (!slug) {
    return template;
  }
  try {
    const db = await getDb();
    if (!db) {
      return template;
    }
    const articles2 = await db.select().from(resources).where(eq9(resources.slug, slug)).limit(1);
    if (articles2.length === 0 || articles2[0].status !== "published") {
      return template;
    }
    const article = articles2[0];
    const canonicalPath = (overridePath || req.originalUrl).split("?")[0];
    const fullUrl = `${SITE_URL}${canonicalPath}`;
    const SITE_TITLE = "ROWELL";
    const SITE_LOGO = "https://www.rowellhplc.com/logo.png";
    const title = article.title || SITE_TITLE;
    const description = article.excerpt || "";
    const image = SITE_LOGO;
    const articleText = (article.content || description).replace(/```[\s\S]*?```/g, " ").replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/<[^>]*>/g, " ").replace(/[#>*_`]/g, " ").replace(/\s+/g, " ").trim().slice(0, 1800);
    const internalLinkMatch = (article.content || "").match(
      /\[([^\]]{1,120})\]\((\/products(?:\?[A-Za-z0-9%=&._-]+)?)\)/
    );
    const internalCatalogLink = internalLinkMatch ? { label: internalLinkMatch[1], href: internalLinkMatch[2] } : null;
    const publishedAt = article.publishedAt ? new Date(article.publishedAt).toISOString() : (/* @__PURE__ */ new Date()).toISOString();
    const modifiedAt = article.updatedAt ? new Date(article.updatedAt).toISOString() : publishedAt;
    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "mainEntityOfPage": { "@type": "WebPage", "@id": fullUrl },
          "headline": title,
          "description": description,
          "image": [image],
          "datePublished": publishedAt,
          "dateModified": modifiedAt,
          "author": {
            "@type": "Organization",
            "name": article.author || "ROWELL Expert",
            "url": "https://www.rowellhplc.com/about"
          },
          "publisher": {
            "@type": "Organization",
            "name": "ROWELL",
            "logo": { "@type": "ImageObject", "url": SITE_LOGO }
          }
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.rowellhplc.com/" },
            { "@type": "ListItem", "position": 2, "name": "Resources", "item": "https://www.rowellhplc.com/resources" },
            { "@type": "ListItem", "position": 3, "name": title, "item": fullUrl }
          ]
        }
      ]
    };
    const metaTags = `
    <title>${escapeHtml(title)} | ${SITE_TITLE}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${fullUrl}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${fullUrl}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${image}" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${fullUrl}" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${image}" />
    
    <!-- Article metadata -->
    <meta property="article:published_time" content="${article.publishedAt || ""}" />
    <meta property="article:author" content="${article.author || "ROWELL Team"}" />
    <script type="application/ld+json">${serializeJsonLd(structuredData)}</script>`;
    template = template.replace(/<title>.*?<\/title>/i, "");
    template = template.replace(
      /(<head[^>]*>)/i,
      `$1${metaTags}`
    );
    template = template.replace(
      /<div id="root"><\/div>/,
      `<div id="root"><article><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p>${articleText ? `<p>${escapeHtml(articleText)}</p>` : ""}${internalCatalogLink ? `<p><a href="${internalCatalogLink.href}">${escapeHtml(internalCatalogLink.label)}</a></p>` : ""}</article></div>`
    );
    console.log(`[SEO] Injected article meta tags and content fallback for: ${article.title}`);
    return template;
  } catch (error) {
    console.error("[SEO] Error injecting article meta tags:", error);
    return template;
  }
}
async function injectProductSeoMetaTags(template, req, overridePath) {
  const slug = extractProductSlugFromPath(overridePath || req.path);
  if (!slug) {
    return template;
  }
  try {
    const db = await getDb();
    if (!db) {
      return template;
    }
    let result = await db.select().from(products).where(eq9(products.slug, slug)).limit(1);
    if (result.length === 0) {
      result = await db.select().from(products).where(eq9(products.partNumber, slug)).limit(1);
      if (result.length > 0) {
        console.log(`[SEO] Slug '${slug}' not found, matched by partNumber fallback`);
      }
    }
    if (result.length === 0) {
      return template;
    }
    const product = result[0];
    const canonicalPath = (overridePath || req.originalUrl).split("?")[0];
    const fullUrl = `${SITE_URL}${canonicalPath}`;
    const rawName = product.name || "";
    const brandPrefix = product.brand || "";
    const cleanName = brandPrefix && rawName.toLowerCase().startsWith(brandPrefix.toLowerCase()) ? rawName.slice(brandPrefix.length).replace(/^[\s|,\-]+/, "") : rawName;
    const title = product.metaTitle || `${brandPrefix} ${cleanName} ${product.partNumber || ""} | ROWELL`.trim();
    const description = product.metaDescription || `${brandPrefix} ${cleanName} (${product.partNumber || ""}). Review catalog specifications and submit an inquiry to confirm product details for your application.`.trim();
    const brandFolder = (product.brand || "").replace(/\s+/g, "");
    const rawImageUrl = product.imageUrl || `/product-images/${brandFolder}/${product.partNumber}.jpg`;
    const imageUrl = toAbsoluteUrl(rawImageUrl);
    const hasCatalogValue = (value) => {
      if (typeof value !== "string") return false;
      const normalized = value.trim();
      return normalized.length > 0 && !/^(?:n\/?a|n\/|not available|none|null|-)$/i.test(normalized);
    };
    const isCartridgeVolume = hasCatalogValue(product.columnLength) && /\b(?:spe|cartridge)\b/i.test(`${product.productType || ""} ${product.category || ""} ${product.name || ""}`) && /^\d+(?:\.\d+)?\s*mL$/i.test(product.columnLength.trim());
    const isGcCapillary = hasCatalogValue(product.columnLength) && /^G\d+$/i.test(String(product.usp || "").trim()) && /^\d+(?:\.\d+)?\s*m$/i.test(product.columnLength.trim());
    const isGcLiner = hasCatalogValue(product.columnLength) && /\b(?:gc\s*)?liner\b/i.test(`${product.productType || ""} ${product.category || ""} ${product.name || ""}`) && /^\d+(?:\.\d+)?\s*mm$/i.test(product.columnLength.trim());
    const specsRows = [
      hasCatalogValue(product.particleSize) ? `<tr><td>Particle Size</td><td>${escapeHtml(product.particleSize)}</td></tr>` : "",
      hasCatalogValue(product.poreSize) ? `<tr><td>Pore Size</td><td>${escapeHtml(product.poreSize)}</td></tr>` : "",
      hasCatalogValue(product.columnLength) ? `<tr><td>${isCartridgeVolume ? "Cartridge Volume" : isGcCapillary ? "GC Capillary Length" : isGcLiner ? "Liner Length" : "Column Length"}</td><td>${escapeHtml(product.columnLength)}</td></tr>` : "",
      hasCatalogValue(product.innerDiameter) ? `<tr><td>Inner Diameter</td><td>${escapeHtml(product.innerDiameter)}</td></tr>` : "",
      hasCatalogValue(product.usp) ? `<tr><td>USP Designation</td><td>${escapeHtml(product.usp)}</td></tr>` : "",
      hasCatalogValue(product.phaseType) ? `<tr><td>Phase Type</td><td>${escapeHtml(product.phaseType)}</td></tr>` : ""
    ].filter(Boolean).join("");
    const contentSkeleton = `
    <div id="seo-content" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      ${product.brand ? `<p>Brand: ${escapeHtml(product.brand)}</p>` : ""}
      <p>Part Number: ${escapeHtml(product.partNumber || "")}</p>
      ${product.name ? `<p>Product Name: ${escapeHtml(product.name)}</p>` : ""}
      ${product.description ? `<p>${escapeHtml((product.description || "").substring(0, 500))}</p>` : ""}
      ${specsRows ? `<table><tbody>${specsRows}</tbody></table>` : ""}
      <p>Use the inquiry form to confirm current product details and suitability for your application.</p>
    </div>`;
    const structuredData = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name || product.partNumber,
      "description": product.description || description,
      "sku": product.partNumber,
      "mpn": product.partNumber,
      "brand": {
        "@type": "Brand",
        "name": product.brand || "ROWELL"
      },
      "image": imageUrl,
      "url": fullUrl
      // ROWELL is a request-for-quote B2B catalog. No Offer is emitted because
      // current availability, price, shipping, and return terms are confirmed
      // only in the context of each inquiry.
    };
    const productBreadcrumbData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
        { "@type": "ListItem", "position": 2, "name": "Products", "item": `${SITE_URL}/products` },
        { "@type": "ListItem", "position": 3, "name": product.name || product.partNumber, "item": fullUrl }
      ]
    };
    const metaTags = `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${fullUrl}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="product" />
    <meta property="og:url" content="${fullUrl}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:site_name" content="ROWELL" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${fullUrl}" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${imageUrl}" />
    
    <!-- Product specific -->
    <meta property="product:brand" content="${escapeHtml(product.brand || "")}" />
    <meta property="product:condition" content="new" />
    
    <!-- JSON-LD Structured Data for product discovery -->
    <script type="application/ld+json">${serializeJsonLd(structuredData)}</script>
    <script type="application/ld+json">${serializeJsonLd(productBreadcrumbData)}</script>`;
    template = template.replace(/<title>.*?<\/title>/i, "");
    template = template.replace(
      /(<head[^>]*>)/i,
      `$1${metaTags}`
    );
    template = template.replace(
      /<div id="root"><\/div>/,
      `<div id="root"></div>${contentSkeleton}`
    );
    console.log(`[SEO] Injected product meta tags + content skeleton for: ${product.partNumber}`);
    return template;
  } catch (error) {
    console.error("[SEO] Error injecting product meta tags:", error);
    return template;
  }
}
var STATIC_PAGE_SEO = {
  "/": {
    title: "ROWELL | Chromatography Consumables Catalog",
    description: "Browse HPLC columns, GC columns, and chromatography consumables and submit product inquiries for analytical laboratory applications.",
    heading: "Chromatography Consumables for Analytical Laboratories",
    type: "WebSite"
  },
  "/products": {
    title: "HPLC & GC Columns and Chromatography Consumables | ROWELL",
    description: "Explore ROWELL's catalog of HPLC columns, GC columns, and chromatography consumables from leading laboratory brands.",
    heading: "Chromatography Columns and Laboratory Consumables",
    type: "WebPage"
  },
  "/resources": {
    title: "Chromatography Technical Guides & Application Notes | ROWELL",
    description: "Browse practical chromatography technical guides, application notes, column selection advice, and troubleshooting resources from ROWELL.",
    heading: "Chromatography Technical Resources",
    type: "WebPage"
  },
  "/learning": {
    title: "Chromatography Learning Center | ROWELL",
    description: "Access practical chromatography learning resources, application notes, technical guides, and laboratory troubleshooting advice.",
    heading: "Chromatography Learning Center",
    type: "WebPage"
  },
  "/applications": {
    title: "Chromatography Applications by Industry | ROWELL",
    description: "Explore chromatography applications for pharmaceutical, environmental, food safety, chemical, and analytical laboratory workflows.",
    heading: "Chromatography Applications by Industry",
    type: "WebPage"
  },
  "/about": {
    title: "About ROWELL | Global Chromatography Consumables Supplier",
    description: "Learn about ROWELL's commitment to reliable chromatography consumables, technical expertise, and global laboratory support.",
    heading: "About ROWELL",
    type: "WebPage"
  },
  "/contact": {
    title: "Contact ROWELL | Chromatography Consumables Support",
    description: "Contact ROWELL for product sourcing, chromatography column selection, technical support, and quotation requests.",
    heading: "Contact ROWELL",
    type: "WebPage"
  },
  "/usp-standards": {
    title: "USP Chromatography Reference Standards | ROWELL",
    description: "Explore USP chromatography reference standards and related analytical support for laboratory method development and quality control.",
    heading: "USP Chromatography Reference Standards",
    type: "WebPage"
  }
};
function injectCategoryLandingSeoMetaTags(template, requestPath) {
  const slug = extractCategoryLandingSlug(requestPath);
  const profile = slug ? CATEGORY_LANDING_PROFILES[slug] : null;
  if (!slug || !profile) return template;
  const fullUrl = `${SITE_URL}/categories/${encodeURIComponent(slug)}`;
  const catalogPath = profile.catalogHref ?? `/products?category=${encodeURIComponent(profile.catalogSlug)}`;
  const catalogUrl = `${SITE_URL}${catalogPath}`;
  const faqEntities = profile.faq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer }
  }));
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: profile.heading,
      description: profile.summary,
      url: fullUrl,
      inLanguage: "en",
      isPartOf: { "@type": "WebSite", name: "ROWELL", url: SITE_URL }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Products", item: `${SITE_URL}/products` },
        { "@type": "ListItem", position: 3, name: profile.name, item: fullUrl }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqEntities
    }
  ];
  const selectionHtml = profile.selectionPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join("");
  const faqHtml = profile.faq.map((item) => `<section><h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p></section>`).join("");
  const metaTags = `
    <title>${escapeHtml(profile.heading)} | ROWELL</title>
    <meta name="description" content="${escapeHtml(profile.summary)}" />
    <link rel="canonical" href="${fullUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${fullUrl}" />
    <meta property="og:title" content="${escapeHtml(profile.heading)} | ROWELL" />
    <meta property="og:description" content="${escapeHtml(profile.summary)}" />
    <meta property="og:site_name" content="ROWELL" />
    <meta name="twitter:card" content="summary" />
    <script type="application/ld+json">${serializeJsonLd(structuredData)}</script>`;
  template = template.replace(/<title>.*?<\/title>/i, "");
  template = template.replace(/(<head[^>]*>)/i, `$1${metaTags}`);
  template = template.replace(
    /<div id="root"><\/div>/,
    `<div id="root"><main><nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/products">Products</a> / ${escapeHtml(profile.name)}</nav><h1>${escapeHtml(profile.heading)}</h1><p>${escapeHtml(profile.summary)}</p><h2>Selection Considerations</h2><p>${escapeHtml(profile.overview)}</p><ul>${selectionHtml}</ul><p><a href="${catalogUrl}">Browse ${escapeHtml(profile.name)}</a></p><h2>Frequently Asked Questions</h2>${faqHtml}</main></div>`
  );
  return template;
}
function isKnownPublicSpaRoute(requestPath) {
  if (Object.prototype.hasOwnProperty.call(STATIC_PAGE_SEO, requestPath)) return true;
  if (requestPath.startsWith("/categories/")) {
    const slug = extractCategoryLandingSlug(requestPath);
    return !!slug && CATEGORY_LANDING_SLUGS.includes(slug);
  }
  return [
    /^\/products\/[^/]+$/,
    /^\/resources\/[^/]+$/,
    /^\/learning(?:-center)?$/,
    /^\/learning\/authors\/[^/]+$/,
    /^\/learning\/literature\/[^/]+$/,
    /^\/learning\/[^/]+$/,
    /^\/applications\/[^/]+$/,
    /^\/standards(?:\/search|\/category\/[^/]+|\/product\/[^/]+)?$/,
    /^\/admin\/(?:messages|seed)$/,
    /^\/test-filters$/,
    /^\/404$/
  ].some((pattern) => pattern.test(requestPath));
}
async function getDynamicRouteStatus(requestPath) {
  const productSlug = extractProductSlugFromPath(requestPath);
  const resourceSlug = extractSlugFromPath(requestPath) || (requestPath.match(/^\/learning\/literature\/([^/?]+)/)?.[1] ?? null);
  if (!productSlug && !resourceSlug) return "active";
  try {
    const db = await getDb();
    if (!db) return "unavailable";
    if (productSlug) {
      let records2 = await db.select({ id: products.id, status: products.status }).from(products).where(eq9(products.slug, productSlug)).limit(1);
      if (records2.length === 0) {
        records2 = await db.select({ id: products.id, status: products.status }).from(products).where(eq9(products.partNumber, productSlug)).limit(1);
      }
      if (records2.length === 0) return "missing";
      return records2[0].status === "active" ? "active" : "gone";
    }
    const records = await db.select({ id: resources.id, status: resources.status }).from(resources).where(eq9(resources.slug, resourceSlug)).limit(1);
    if (records.length === 0) return "missing";
    return records[0].status === "published" ? "active" : "gone";
  } catch (error) {
    console.error("[SEO] Dynamic route existence check failed:", error);
    return "unavailable";
  }
}
async function redirectLegacyLearningArticle(req, res, next) {
  if (req.method !== "GET") return next();
  const match = req.originalUrl.match(/^\/learning\/([^/?]+)(?:\?[^]*)?$/);
  if (!match) return next();
  try {
    const db = await getDb();
    if (!db) return next();
    const resourceRecord = await db.select({ id: resources.id }).from(resources).where(eq9(resources.slug, match[1])).limit(1);
    if (resourceRecord.length === 0) return next();
    return res.redirect(301, `/resources/${match[1]}`);
  } catch (error) {
    console.error("[SEO] Legacy learning URL check failed:", error);
    return next();
  }
}
function renderNotFoundTemplate(template, requestPath, statusCode) {
  const title = statusCode === 410 ? "Content No Longer Available | ROWELL" : "Page Not Found | ROWELL";
  const heading = statusCode === 410 ? "This content is no longer available" : "Page not found";
  const description = statusCode === 410 ? "This product or resource is no longer available. Browse current chromatography consumables and technical resources at ROWELL." : "The requested page could not be found. Browse ROWELL's current chromatography consumables and technical resources.";
  const metaTags = `<title>${title}</title><meta name="description" content="${description}" /><meta name="robots" content="noindex, follow" />`;
  template = template.replace(/<title>.*?<\/title>/i, "");
  template = template.replace(/(<head[^>]*>)/i, `$1${metaTags}`);
  return template.replace(
    /<div id="root"><\/div>/,
    `<div id="root"><main><h1>${heading}</h1><p>${description}</p><p><a href="/products">Browse products</a> or <a href="/resources">explore technical resources</a>.</p></main></div>`
  );
}
async function injectResourcesIndexSeoMetaTags(template) {
  const page = STATIC_PAGE_SEO["/resources"];
  const fullUrl = `${SITE_URL}/resources`;
  try {
    const db = await getDb();
    if (!db) return injectStaticPageSeoMetaTags(template, "/resources");
    const latestResources = await db.select({
      title: resources.title,
      slug: resources.slug,
      excerpt: resources.excerpt,
      category: resources.category,
      publishedAt: resources.publishedAt
    }).from(resources).where(eq9(resources.status, "published")).orderBy(desc2(resources.publishedAt)).limit(12);
    const itemList = latestResources.map((article, index2) => ({
      "@type": "ListItem",
      position: index2 + 1,
      name: article.title,
      url: `${SITE_URL}/resources/${encodeURIComponent(article.slug)}`
    }));
    const structuredData = [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: page.heading,
        description: page.description,
        url: fullUrl,
        inLanguage: "en"
      },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Latest Chromatography Resources",
        itemListElement: itemList
      }
    ];
    const articleLinks = latestResources.map((article) => {
      const articleUrl = `/resources/${encodeURIComponent(article.slug)}`;
      const excerpt = article.excerpt ? `<p>${escapeHtml(article.excerpt)}</p>` : "";
      const category = article.category ? `<p>${escapeHtml(article.category)}</p>` : "";
      return `<article><h2><a href="${articleUrl}">${escapeHtml(article.title)}</a></h2>${category}${excerpt}</article>`;
    }).join("");
    const metaTags = `
      <title>${escapeHtml(page.title)}</title>
      <meta name="description" content="${escapeHtml(page.description)}" />
      <link rel="canonical" href="${fullUrl}" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="${fullUrl}" />
      <meta property="og:title" content="${escapeHtml(page.title)}" />
      <meta property="og:description" content="${escapeHtml(page.description)}" />
      <meta property="og:site_name" content="ROWELL" />
      <script type="application/ld+json">${serializeJsonLd(structuredData)}</script>`;
    template = template.replace(/<title>.*?<\/title>/i, "");
    template = template.replace(/(<head[^>]*>)/i, `$1${metaTags}`);
    return template.replace(
      /<div id="root"><\/div>/,
      `<div id="root"><main><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.description)}</p><section><h2>Latest Technical Resources</h2>${articleLinks}</section></main></div>`
    );
  } catch (error) {
    console.error("[SEO] Failed to render resources index:", error);
    return injectStaticPageSeoMetaTags(template, "/resources");
  }
}
function injectStaticPageSeoMetaTags(template, requestPath) {
  const canonicalPath = requestPath.split("?")[0].replace(/\/$/, "") || "/";
  const page = STATIC_PAGE_SEO[canonicalPath];
  if (!page) return template;
  const fullUrl = `${SITE_URL}${canonicalPath === "/" ? "/" : canonicalPath}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": page.type,
    "name": page.title,
    "description": page.description,
    "url": fullUrl,
    "inLanguage": "en",
    "publisher": {
      "@type": "Organization",
      "name": "ROWELL",
      "url": SITE_URL,
      "logo": { "@type": "ImageObject", "url": `${SITE_URL}/logo.png` }
    }
  };
  const metaTags = `
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}" />
    <link rel="canonical" href="${fullUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${fullUrl}" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:site_name" content="ROWELL" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <script type="application/ld+json">${serializeJsonLd(structuredData)}</script>`;
  template = template.replace(/<title>.*?<\/title>/i, "");
  template = template.replace(/(<head[^>]*>)/i, `$1${metaTags}`);
  const categoryHubLinks = canonicalPath === "/products" ? `<nav aria-label="Featured product category guides"><ul>${CATEGORY_LANDING_SLUGS.map((slug) => {
    const profile = CATEGORY_LANDING_PROFILES[slug];
    return `<li><a href="/categories/${encodeURIComponent(slug)}">${escapeHtml(profile.name)} selection guide</a></li>`;
  }).join("")}</ul></nav>` : "";
  template = template.replace(
    /<div id="root"><\/div>/,
    `<div id="root"><main><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.description)}</p>${categoryHubLinks}</main></div>`
  );
  return template;
}
async function injectSeoMetaTags(template, req, overridePath) {
  const effectivePath = overridePath || req.path;
  const categorySlug = extractCategoryLandingSlug(effectivePath);
  if (categorySlug && CATEGORY_LANDING_SLUGS.includes(categorySlug)) {
    return injectCategoryLandingSeoMetaTags(template, effectivePath);
  }
  if (effectivePath === "/resources") {
    return injectResourcesIndexSeoMetaTags(template);
  }
  if (effectivePath.startsWith("/products/")) {
    return injectProductSeoMetaTags(template, req, effectivePath);
  }
  if (effectivePath.startsWith("/resources/")) {
    return injectArticleSeoMetaTags(template, req, effectivePath);
  }
  if (effectivePath.startsWith("/learning/literature/")) {
    const literatureSlug = effectivePath.replace("/learning/literature/", "/resources/");
    return injectArticleSeoMetaTags(template, req, literatureSlug);
  }
  return injectStaticPageSeoMetaTags(template, effectivePath);
}
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(redirectLegacyLearningArticle);
  app.use((req, res, next) => {
    if (req.path === "/sitemap.xml" || req.path === "/robots.txt") {
      return next();
    }
    return vite.middlewares(req, res, next);
  });
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    if (url.startsWith("/api/") || url === "/sitemap.xml" || url === "/robots.txt") {
      return next();
    }
    try {
      const clientTemplate = path4.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      template = await injectSeoMetaTags(template, req);
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path4.resolve(import.meta.dirname, "../..", "dist", "public") : path4.resolve(import.meta.dirname, "public");
  if (!fs3.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(redirectLegacyLearningArticle);
  app.use(async (req, res, next) => {
    if (req.method !== "GET") return next();
    const requestPath = req.originalUrl.split("?")[0];
    if (!Object.prototype.hasOwnProperty.call(STATIC_PAGE_SEO, requestPath)) {
      return next();
    }
    try {
      const indexPath = path4.resolve(distPath, "index.html");
      let template = await fs3.promises.readFile(indexPath, "utf-8");
      template = await injectSeoMetaTags(template, req, requestPath);
      return res.status(200).set({ "Content-Type": "text/html" }).send(template);
    } catch (error) {
      console.error("[SSR] Error injecting static-page SEO metadata:", error);
      return next();
    }
  });
  app.use(express.static(distPath, { index: false }));
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    if (url.startsWith("/api/") || url === "/sitemap.xml" || url === "/robots.txt") {
      return next();
    }
    try {
      const indexPath = path4.resolve(distPath, "index.html");
      const requestPath = req.originalUrl.split("?")[0].replace(/\/+$/, "") || "/";
      const dynamicRouteStatus = await getDynamicRouteStatus(requestPath);
      if (dynamicRouteStatus === "missing" || dynamicRouteStatus === "gone") {
        let template = await fs3.promises.readFile(indexPath, "utf-8");
        const statusCode = dynamicRouteStatus === "gone" ? 410 : 404;
        template = renderNotFoundTemplate(template, requestPath, statusCode);
        return res.status(statusCode).set({ "Content-Type": "text/html" }).send(template);
      }
      if (!isKnownPublicSpaRoute(requestPath)) {
        let template = await fs3.promises.readFile(indexPath, "utf-8");
        template = renderNotFoundTemplate(template, requestPath, 404);
        return res.status(404).set({ "Content-Type": "text/html" }).send(template);
      }
      const needsMetaInjection = requestPath.startsWith("/products/") || requestPath.startsWith("/resources/") || requestPath.startsWith("/learning/literature/") || requestPath.startsWith("/categories/") || Object.prototype.hasOwnProperty.call(STATIC_PAGE_SEO, requestPath);
      if (needsMetaInjection) {
        let template = await fs3.promises.readFile(indexPath, "utf-8");
        template = await injectSeoMetaTags(template, req, requestPath);
        res.status(200).set({ "Content-Type": "text/html" }).send(template);
      } else {
        res.sendFile(indexPath);
      }
    } catch (error) {
      console.error("[SSR] Error serving index.html:", error);
      res.sendFile(path4.resolve(distPath, "index.html"));
    }
  });
}

// server/sitemap.ts
init_db();
init_schema();
import { eq as eq10 } from "drizzle-orm";
var BASE_URL = "https://www.rowellhplc.com";
var STATIC_PAGES = [
  { path: "/", priority: 1, changefreq: "daily" },
  { path: "/products", priority: 0.9, changefreq: "weekly" },
  { path: "/categories/c18-columns", priority: 0.9, changefreq: "weekly" },
  { path: "/categories/guard-columns", priority: 0.9, changefreq: "weekly" },
  { path: "/categories/gc-columns", priority: 0.9, changefreq: "weekly" },
  { path: "/categories/kinetex-pfp-columns", priority: 0.8, changefreq: "weekly" },
  { path: "/categories/chiral-hplc-columns", priority: 0.8, changefreq: "weekly" },
  { path: "/categories/hilic-hplc-columns", priority: 0.8, changefreq: "weekly" },
  { path: "/categories/c8-hplc-columns", priority: 0.8, changefreq: "weekly" },
  { path: "/categories/phenyl-hplc-columns", priority: 0.8, changefreq: "weekly" },
  { path: "/categories/kinetex-hplc-columns", priority: 0.8, changefreq: "weekly" },
  { path: "/categories/agilent-poroshell-columns", priority: 0.8, changefreq: "weekly" },
  { path: "/categories/spe-cartridges", priority: 0.9, changefreq: "weekly" },
  { path: "/about", priority: 0.8, changefreq: "monthly" },
  { path: "/resources", priority: 0.9, changefreq: "daily" },
  { path: "/usp-standards", priority: 0.7, changefreq: "monthly" },
  { path: "/applications", priority: 0.7, changefreq: "monthly" },
  { path: "/contact", priority: 0.6, changefreq: "monthly" }
];
function formatDate(date) {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toISOString().split("T")[0];
}
function escapeXml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
}
async function generateSitemap(req, res) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Sitemap] Database not available");
      return res.status(500).send("Database not available");
    }
    const resourceArticles = await db.select({
      slug: resources.slug,
      updatedAt: resources.updatedAt
    }).from(resources).where(eq10(resources.status, "published"));
    const allProducts = await db.select({
      slug: products.slug,
      updatedAt: products.updatedAt,
      imageUrl: products.imageUrl
    }).from(products).where(eq10(products.status, "active"));
    const literatureArticles = await db.select({
      slug: articles.slug,
      publishedDate: articles.publishedDate
    }).from(articles).where(eq10(articles.category, "literature-reviews"));
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
    for (const page of STATIC_PAGES) {
      xml += "  <url>\n";
      xml += `    <loc>${BASE_URL}${page.path}</loc>
`;
      xml += `    <lastmod>${formatDate(/* @__PURE__ */ new Date())}</lastmod>
`;
      xml += `    <changefreq>${page.changefreq}</changefreq>
`;
      xml += `    <priority>${page.priority}</priority>
`;
      xml += "  </url>\n";
    }
    for (const article of resourceArticles) {
      xml += "  <url>\n";
      xml += `    <loc>${escapeXml(`${BASE_URL}/resources/${encodeURIComponent(article.slug)}`)}</loc>
`;
      if (article.updatedAt) {
        xml += `    <lastmod>${formatDate(article.updatedAt)}</lastmod>
`;
      }
      xml += "    <changefreq>monthly</changefreq>\n";
      xml += "    <priority>0.8</priority>\n";
      xml += "  </url>\n";
    }
    for (const product of allProducts) {
      if (!product.slug) continue;
      const productUrl = `${BASE_URL}/products/${encodeURIComponent(product.slug)}`;
      xml += "  <url>\n";
      xml += `    <loc>${escapeXml(productUrl)}</loc>
`;
      if (product.updatedAt) {
        xml += `    <lastmod>${formatDate(product.updatedAt)}</lastmod>
`;
      }
      if (product.imageUrl) {
        const imageUrl = product.imageUrl.startsWith("http") ? product.imageUrl : `${BASE_URL}${product.imageUrl.startsWith("/") ? "" : "/"}${product.imageUrl}`;
        xml += "    <image:image>\n";
        xml += `      <image:loc>${escapeXml(imageUrl)}</image:loc>
`;
        xml += "    </image:image>\n";
      }
      xml += "    <changefreq>weekly</changefreq>\n";
      xml += "    <priority>0.8</priority>\n";
      xml += "  </url>\n";
    }
    for (const article of literatureArticles) {
      xml += "  <url>\n";
      xml += `    <loc>${BASE_URL}/learning/literature/${article.slug}</loc>
`;
      if (article.publishedDate) {
        xml += `    <lastmod>${formatDate(article.publishedDate)}</lastmod>
`;
      }
      xml += `    <changefreq>monthly</changefreq>
`;
      xml += `    <priority>0.7</priority>
`;
      xml += "  </url>\n";
    }
    xml += "</urlset>";
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(xml);
    console.log(`[Sitemap] Generated sitemap with ${STATIC_PAGES.length} static pages, ${resourceArticles.length} resources, ${allProducts.length} products, and ${literatureArticles.length} literature articles`);
  } catch (error) {
    console.error("[Sitemap] Error generating sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
}

// server/learning-center-rest-api.ts
init_db();
init_schema();
import { Router } from "express";
import { and as and4, desc as desc3, eq as eq11, isNull, sql as sql4 } from "drizzle-orm";
var learningCenterRouter2 = Router();
async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}
var articleCategories = ["application-notes", "technical-guides", "industry-trends", "literature-reviews"];
var applicationAreas = ["pharmaceutical", "environmental", "food-safety", "biopharmaceutical", "clinical", "chemical"];
function isArticleCategory(value) {
  return value !== void 0 && articleCategories.includes(value);
}
function isApplicationArea(value) {
  return value !== void 0 && applicationAreas.includes(value);
}
function articleFilters(category, applicationArea) {
  const conditions = [];
  if (isArticleCategory(category)) conditions.push(eq11(articles.category, category));
  if (isApplicationArea(applicationArea)) conditions.push(eq11(articles.applicationArea, applicationArea));
  return conditions;
}
learningCenterRouter2.get("/articles", async (req, res) => {
  try {
    const db = await requireDb();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const category = typeof req.query.category === "string" ? req.query.category : void 0;
    const applicationArea = typeof req.query.applicationArea === "string" ? req.query.applicationArea : void 0;
    const conditions = articleFilters(category, applicationArea);
    const whereClause = conditions.length ? and4(...conditions) : void 0;
    const result = await db.select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      metaDescription: articles.metaDescription,
      publishedDate: articles.publishedDate,
      viewCount: articles.viewCount,
      category: articles.category,
      applicationArea: articles.applicationArea,
      authorId: articles.authorId,
      authorName: authors.fullName
    }).from(articles).leftJoin(authors, eq11(articles.authorId, authors.id)).where(whereClause).orderBy(desc3(articles.publishedDate)).limit(limit).offset((page - 1) * limit);
    const totalResult = await db.select({ count: sql4`count(*)` }).from(articles).where(whereClause);
    const total = Number(totalResult[0]?.count || 0);
    res.json({ articles: result, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ error: "Failed to fetch articles" });
  }
});
learningCenterRouter2.get("/articles/:slug", async (req, res) => {
  try {
    const db = await requireDb();
    const result = await db.select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      content: articles.content,
      metaDescription: articles.metaDescription,
      keywords: articles.keywords,
      publishedDate: articles.publishedDate,
      updatedAt: articles.updatedAt,
      viewCount: articles.viewCount,
      category: articles.category,
      applicationArea: articles.applicationArea,
      authorId: articles.authorId,
      authorName: authors.fullName,
      authorTitle: authors.title,
      authorBio: authors.biography,
      authorPhoto: authors.photoUrl
    }).from(articles).leftJoin(authors, eq11(articles.authorId, authors.id)).where(eq11(articles.slug, req.params.slug)).limit(1);
    const article = result[0];
    if (!article) return res.status(404).json({ error: "Article not found" });
    await db.update(articles).set({ viewCount: sql4`${articles.viewCount} + 1` }).where(eq11(articles.id, article.id));
    res.json(article);
  } catch (error) {
    console.error("Error fetching article:", error);
    res.status(500).json({ error: "Failed to fetch article" });
  }
});
learningCenterRouter2.get("/categories", async (_req, res) => {
  try {
    const db = await requireDb();
    res.json(await db.select({ category: articles.category, count: sql4`count(*)` }).from(articles).groupBy(articles.category));
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});
learningCenterRouter2.get("/application-areas", async (_req, res) => {
  try {
    const db = await requireDb();
    res.json(await db.select({ applicationArea: articles.applicationArea, count: sql4`count(*)` }).from(articles).groupBy(articles.applicationArea));
  } catch (error) {
    console.error("Error fetching application areas:", error);
    res.status(500).json({ error: "Failed to fetch application areas" });
  }
});
learningCenterRouter2.get("/authors", async (_req, res) => {
  try {
    const db = await requireDb();
    const result = await db.select({
      id: authors.id,
      name: authors.fullName,
      slug: authors.slug,
      title: authors.title,
      bio: authors.biography,
      photo: authors.photoUrl,
      articleCount: sql4`(SELECT COUNT(*) FROM ${articles} WHERE ${articles.authorId} = ${authors.id})`
    }).from(authors).orderBy(authors.fullName);
    res.json(result);
  } catch (error) {
    console.error("Error fetching authors:", error);
    res.status(500).json({ error: "Failed to fetch authors" });
  }
});
learningCenterRouter2.get("/authors/:slug", async (req, res) => {
  try {
    const db = await requireDb();
    const result = await db.select().from(authors).where(eq11(authors.slug, req.params.slug)).limit(1);
    const author = result[0];
    if (!author) return res.status(404).json({ error: "Author not found" });
    const authorArticles = await db.select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      metaDescription: articles.metaDescription,
      publishedDate: articles.publishedDate,
      viewCount: articles.viewCount,
      category: articles.category,
      applicationArea: articles.applicationArea
    }).from(articles).where(eq11(articles.authorId, author.id)).orderBy(desc3(articles.publishedDate));
    res.json({ ...author, articles: authorArticles });
  } catch (error) {
    console.error("Error fetching author:", error);
    res.status(500).json({ error: "Failed to fetch author" });
  }
});
learningCenterRouter2.get("/featured", async (_req, res) => {
  try {
    const db = await requireDb();
    const result = await db.select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      metaDescription: articles.metaDescription,
      publishedDate: articles.publishedDate,
      viewCount: articles.viewCount,
      category: articles.category,
      applicationArea: articles.applicationArea,
      authorName: authors.fullName
    }).from(articles).leftJoin(authors, eq11(articles.authorId, authors.id)).orderBy(desc3(articles.viewCount)).limit(3);
    res.json(result);
  } catch (error) {
    console.error("Error fetching featured articles:", error);
    res.status(500).json({ error: "Failed to fetch featured articles" });
  }
});
learningCenterRouter2.get("/articles/:slug/related", async (req, res) => {
  try {
    const db = await requireDb();
    const currentArticle = await db.select({ id: articles.id, category: articles.category }).from(articles).where(eq11(articles.slug, req.params.slug)).limit(1);
    const current = currentArticle[0];
    if (!current) return res.status(404).json({ error: "Article not found" });
    const categoryCondition = current.category ? eq11(articles.category, current.category) : isNull(articles.category);
    const result = await db.select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      metaDescription: articles.metaDescription,
      publishedDate: articles.publishedDate,
      viewCount: articles.viewCount,
      category: articles.category
    }).from(articles).where(and4(categoryCondition, sql4`${articles.id} != ${current.id}`)).orderBy(desc3(articles.publishedDate)).limit(3);
    res.json(result);
  } catch (error) {
    console.error("Error fetching related articles:", error);
    res.status(500).json({ error: "Failed to fetch related articles" });
  }
});

// server/test-literature-api.ts
init_db();
init_schema();
import { Router as Router2 } from "express";
import { eq as eq12 } from "drizzle-orm";
var testLiteratureRouter = Router2();
testLiteratureRouter.get("/test-literature/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    console.log("[Test API] Querying literature with slug:", slug);
    const db = await getDb();
    if (!db) {
      return res.status(503).json({ error: "Database not available" });
    }
    const result = await db.select().from(literature).where(eq12(literature.slug, slug)).limit(1);
    if (result.length === 0) {
      return res.status(404).json({ error: "Literature not found" });
    }
    const lit = result[0];
    res.json({
      success: true,
      data: {
        id: lit.id,
        title: lit.title,
        slug: lit.slug,
        contentEnhanced: lit.contentEnhanced,
        hasOriginalPaperUrl: !!lit.originalPaperUrl,
        hasExpandedAnalysis: !!lit.expandedAnalysis,
        hasMethodologyDetails: !!lit.methodologyDetails,
        hasPracticalGuide: !!lit.practicalGuide,
        expandedAnalysisLength: lit.expandedAnalysis?.length || 0,
        practicalGuideLength: lit.practicalGuide?.length || 0,
        // Include first 200 chars of each for verification
        expandedAnalysisPreview: lit.expandedAnalysis?.substring(0, 200),
        practicalGuidePreview: lit.practicalGuide?.substring(0, 200),
        originalPaperUrl: lit.originalPaperUrl
      }
    });
  } catch (error) {
    console.error("[Test API] Error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// server/_core/index.ts
function isPortAvailable(port2) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port2, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port2 = startPort; port2 < startPort + 20; port2++) {
    if (await isPortAvailable(port2)) {
      return port2;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  try {
    const { migrateDatabase: migrateDatabase2 } = await Promise.resolve().then(() => (init_migrate_db(), migrate_db_exports));
    await migrateDatabase2();
  } catch (error) {
    console.error("[Server] Failed to run database migration:", error);
  }
  try {
    const { validateAllConfigs: validateAllConfigs2 } = await Promise.resolve().then(() => (init_config_validator(), config_validator_exports));
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const db = await getDb2();
    const configValid = await validateAllConfigs2(db);
    if (!configValid) {
      console.error("\n\u26D4 \u670D\u52A1\u5668\u542F\u52A8\u5931\u8D25\uFF1A\u914D\u7F6E\u9A8C\u8BC1\u672A\u901A\u8FC7\uFF01");
      console.error("\u8BF7\u68C0\u67E5 PRODUCTION_CONFIG.md \u6587\u4EF6\u83B7\u53D6\u6B63\u786E\u914D\u7F6E\u3002\n");
      process.exit(1);
    }
  } catch (error) {
    console.error("[Server] Failed to validate configuration:", error);
  }
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  app.use(express2.text({ type: "text/csv", limit: "50mb" }));
  app.use(express2.text({ type: "text/plain", limit: "50mb" }));
  registerOAuthRoutes(app);
  registerImageSyncRoutes(app);
  app.use("/api/learning-center", learningCenterRouter2);
  app.use("/api", testLiteratureRouter);
  app.get("/sitemap.xml", generateSitemap);
  app.get("/robots.txt", (req, res) => {
    res.setHeader("Content-Type", "text/plain");
    res.send("User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /test-filters\nSitemap: https://www.rowellhplc.com/sitemap.xml");
  });
  app.get("/api/debug/article-meta", async (req, res) => {
    try {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { resources: resourcesTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq13 } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) {
        return res.json({ error: "DB not available" });
      }
      const slug = req.query.slug || "food-analysis-artificial-sweeteners-beverages";
      const articles2 = await db.select().from(resourcesTable).where(eq13(resourcesTable.slug, slug)).limit(1);
      if (articles2.length === 0) {
        return res.json({ error: "Article not found", slug });
      }
      const article = articles2[0];
      res.json({
        found: true,
        slug: article.slug,
        status: article.status,
        title: article.title,
        hasExcerpt: !!article.excerpt,
        reqGet: typeof req.get,
        host: req.get("host"),
        protocol: req.protocol
      });
    } catch (e) {
      res.json({ error: String(e), stack: e.stack?.slice(0, 500) });
    }
  });
  app.get("/api/debug/version", async (req, res) => {
    try {
      const { createHash } = await import("crypto");
      const { readFileSync: readFileSync2 } = await import("fs");
      const { resolve } = await import("path");
      const indexPath = resolve(import.meta.dirname, "index.js");
      const content = readFileSync2(indexPath, "utf-8");
      const hash = createHash("md5").update(content).digest("hex");
      const hasSendFileInterception = content.includes("originalSendFile");
      const hasResourcesCheck = content.includes('startsWith("/resources/")');
      const hasOriginalUrl = content.includes("req.originalUrl.split");
      const hasFixedSiteTitle = content.includes('SITE_TITLE2 = "ROWELL"') || content.includes('SITE_TITLE = "ROWELL"');
      const hasNoEnvAppTitle = !content.includes("ENV.appTitle");
      res.json({
        hash,
        hasSendFileInterception,
        hasResourcesCheck,
        hasOriginalUrl,
        hasFixedSiteTitle,
        hasNoEnvAppTitle,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (e) {
      res.json({ error: String(e) });
    }
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port2 = await findAvailablePort(preferredPort);
  if (port2 !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port2} instead`);
  }
  server.listen(port2, () => {
    console.log(`Server running on http://localhost:${port2}/`);
  });
  try {
    await importArticles();
  } catch (error) {
    console.error("[Server] Failed to import articles:", error);
  }
}
startServer().catch(console.error);
