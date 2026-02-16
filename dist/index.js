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
var __copyProps = (to, from, except, desc3) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc3 = __getOwnPropDesc(from, key)) || desc3.enumerable });
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
        categoryId: int("category_id").references(() => categories.id, { onDelete: "set null" })
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
        id: int().autoincrement().notNull(),
        slug: varchar({ length: 200 }).notNull(),
        title: varchar({ length: 500 }).notNull(),
        authors: varchar({ length: 500 }).notNull(),
        journal: varchar({ length: 255 }).notNull(),
        year: int().notNull(),
        doi: varchar({ length: 255 }),
        url: varchar({ length: 1e3 }).notNull(),
        applicationArea: mysqlEnum("application_area", ["pharmaceutical", "environmental", "food-safety", "biopharmaceutical", "clinical", "chemical"]).notNull(),
        summary: text().notNull(),
        keyFindings: text("key_findings"),
        relevance: text(),
        keywords: text(),
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
      try {
        const connection = await pool.getConnection();
        console.log("[Database] Connection test successful");
        connection.release();
      } catch (testError) {
        console.error("[Database] Connection test failed:", testError);
        throw testError;
      }
      _db = drizzle(pool);
      console.log("[Database] Drizzle instance created successfully");
    } catch (error) {
      console.error("[Database] Failed to initialize:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
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
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
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
  const result = await db.insert(inquiries2).values(data);
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
    lastSignedIn: /* @__PURE__ */ new Date()
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
  await db.update(users).set({ lastSignedIn: /* @__PURE__ */ new Date() }).where(eq(users.id, userId));
}
var _db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    _db = null;
  }
});

// server/products_list_new.ts
var products_list_new_exports = {};
__export(products_list_new_exports, {
  productsListInput: () => productsListInput,
  productsListQuery: () => productsListQuery
});
import { z as z14 } from "zod";
import { eq as eq6, and as and2, gte, lte, inArray, sql as sql2 } from "drizzle-orm";
async function productsListQuery(input, db) {
  if (!db) return { products: [], total: 0, page: 1, pageSize: 24, totalPages: 0 };
  const { products: products2, productCategories: productCategories2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const page = input?.page || 1;
  const pageSize = input?.pageSize || 24;
  const offset = (page - 1) * pageSize;
  const conditions = [];
  conditions.push(eq6(products2.status, "active"));
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
    conditions.push(eq6(products2.brand, input.brand));
  }
  if (input?.particleSizeMin !== void 0) {
    conditions.push(gte(products2.particleSizeNum, input.particleSizeMin));
  }
  if (input?.particleSizeMax !== void 0) {
    conditions.push(lte(products2.particleSizeNum, input.particleSizeMax));
  }
  if (input?.poreSizeMin !== void 0) {
    conditions.push(gte(products2.poreSizeNum, input.poreSizeMin));
  }
  if (input?.poreSizeMax !== void 0) {
    conditions.push(lte(products2.poreSizeNum, input.poreSizeMax));
  }
  if (input?.columnLengthMin !== void 0) {
    conditions.push(gte(products2.columnLengthNum, input.columnLengthMin));
  }
  if (input?.columnLengthMax !== void 0) {
    conditions.push(lte(products2.columnLengthNum, input.columnLengthMax));
  }
  if (input?.innerDiameterMin !== void 0) {
    conditions.push(gte(products2.innerDiameterNum, input.innerDiameterMin));
  }
  if (input?.innerDiameterMax !== void 0) {
    conditions.push(lte(products2.innerDiameterNum, input.innerDiameterMax));
  }
  if (input?.phaseTypes && input.phaseTypes.length > 0) {
    conditions.push(inArray(products2.phaseType, input.phaseTypes));
  }
  if (input?.phMin !== void 0) {
    conditions.push(gte(products2.phMax, input.phMin));
  }
  if (input?.phMax !== void 0) {
    conditions.push(lte(products2.phMin, input.phMax));
  }
  if (input?.usp) {
    const { or: or2, like: like2 } = await import("drizzle-orm");
    conditions.push(
      or2(
        eq6(products2.usp, input.usp),
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
  let query;
  let countQuery;
  const whereClause = conditions.length > 0 ? and2(...conditions) : void 0;
  if (input?.categoryId) {
    const categoryProductIds = sql2`(SELECT product_id FROM product_categories WHERE category_id = ${input.categoryId})`;
    const categoryCondition = sql2`${products2.id} IN ${categoryProductIds}`;
    const finalCondition = whereClause ? and2(categoryCondition, whereClause) : categoryCondition;
    query = db.select().from(products2).where(finalCondition).limit(pageSize).offset(offset);
    countQuery = db.select({ count: sql2`count(*)` }).from(products2).where(finalCondition);
  } else {
    query = db.select().from(products2).where(whereClause).limit(pageSize).offset(offset);
    countQuery = db.select({ count: sql2`count(*)` }).from(products2).where(whereClause);
  }
  console.log("[products_list_new] categoryId:", input?.categoryId);
  console.log("[products_list_new] query SQL:", query.toSQL ? query.toSQL() : "no toSQL method");
  const [productResults, countResults] = await Promise.all([
    query,
    countQuery
  ]);
  const productList = productResults;
  const total = countResults[0]?.count || 0;
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
    productsListInput = z14.object({
      categoryId: z14.number().optional(),
      brand: z14.string().optional(),
      search: z14.string().optional(),
      // Advanced filters
      particleSizeMin: z14.number().optional(),
      particleSizeMax: z14.number().optional(),
      poreSizeMin: z14.number().optional(),
      poreSizeMax: z14.number().optional(),
      columnLengthMin: z14.number().optional(),
      columnLengthMax: z14.number().optional(),
      innerDiameterMin: z14.number().optional(),
      innerDiameterMax: z14.number().optional(),
      phaseTypes: z14.array(z14.string()).optional(),
      phMin: z14.number().optional(),
      phMax: z14.number().optional(),
      usp: z14.string().optional(),
      page: z14.number().min(1).default(1),
      pageSize: z14.number().min(1).max(100).default(24)
    }).optional();
  }
});

// server/email_notification.ts
var email_notification_exports = {};
__export(email_notification_exports, {
  sendCustomerMessageNotification: () => sendCustomerMessageNotification
});
import nodemailer2 from "nodemailer";
async function sendCustomerMessageNotification(data) {
  const transporter2 = createTransporter();
  if (!transporter2) {
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
    const info = await transporter2.sendMail({
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
        return nodemailer2.createTransport(EMAIL_CONFIG);
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
import { eq as eq7, like, and as and3, or, sql as sql3 } from "drizzle-orm";
async function getAllUSPStandards() {
  try {
    const db = await getDb();
    const standards = await db.select().from(uspStandards).orderBy(uspStandards.code);
    return standards;
  } catch (error) {
    console.error("Error fetching USP standards:", error);
    throw new Error("Failed to fetch USP standards");
  }
}
async function getUSPStandardByCode(code) {
  try {
    const db = await getDb();
    const standard = await db.select().from(uspStandards).where(eq7(uspStandards.code, code)).limit(1);
    if (standard.length === 0) {
      return null;
    }
    return standard[0];
  } catch (error) {
    console.error(`Error fetching USP standard ${code}:`, error);
    throw new Error(`Failed to fetch USP standard ${code}`);
  }
}
async function getProductsByUSPStandard(uspCode, limit = 50) {
  try {
    const db = await getDb();
    const matchedProducts = await db.select().from(products).where(
      and3(
        or(
          eq7(products.usp, uspCode),
          // "L1"
          like(products.usp, `${uspCode},%`),
          // "L1,..."
          like(products.usp, `%,${uspCode}`),
          // "...,L1"
          like(products.usp, `%,${uspCode},%`)
          // "...,L1,..."
        ),
        // 只返回active状态的产品
        eq7(products.status, "active")
      )
    ).orderBy(products.brand, products.name).limit(limit);
    return matchedProducts;
  } catch (error) {
    console.error(`Error fetching products for USP ${uspCode}:`, error);
    throw new Error(`Failed to fetch products for USP ${uspCode}`);
  }
}
async function getUSPStandardWithProducts(uspCode, productLimit = 50) {
  try {
    const standard = await getUSPStandardByCode(uspCode);
    if (!standard) {
      return null;
    }
    const matchedProducts = await getProductsByUSPStandard(uspCode, productLimit);
    return {
      standard,
      products: matchedProducts,
      productCount: matchedProducts.length
    };
  } catch (error) {
    console.error(`Error fetching USP standard with products for ${uspCode}:`, error);
    throw new Error(`Failed to fetch USP standard with products for ${uspCode}`);
  }
}
async function getAllUSPStandardsWithProductCount() {
  try {
    const db = await getDb();
    const standards = await getAllUSPStandards();
    const standardsWithCount = await Promise.all(
      standards.map(async (standard) => {
        const countResult = await db.select({
          count: sql3`COUNT(*)`
        }).from(products).where(
          and3(
            or(
              eq7(products.usp, standard.code),
              like(products.usp, `${standard.code},%`),
              like(products.usp, `%,${standard.code}`),
              like(products.usp, `%,${standard.code},%`)
            ),
            eq7(products.status, "active")
          )
        );
        return {
          ...standard,
          productCount: Number(countResult[0]?.count || 0)
        };
      })
    );
    return standardsWithCount;
  } catch (error) {
    console.error("Error fetching USP standards with product count:", error);
    throw new Error("Failed to fetch USP standards with product count");
  }
}
async function fillProductUSPData() {
  try {
    const db = await getDb();
    const updates = [];
    updates.push(
      db.update(products).set({ usp: "L1" }).where(
        and3(
          or(
            like(products.name, "%C18%"),
            like(products.name, "%Octadecyl%"),
            like(products.name, "%ODS%")
          ),
          or(
            eq7(products.usp, null),
            eq7(products.usp, "")
          )
        )
      )
    );
    updates.push(
      db.update(products).set({ usp: "L7" }).where(
        and3(
          or(
            like(products.name, "%C8%"),
            like(products.name, "%Octyl%")
          ),
          or(
            eq7(products.usp, null),
            eq7(products.usp, "")
          )
        )
      )
    );
    updates.push(
      db.update(products).set({ usp: "L11" }).where(
        and3(
          like(products.name, "%Phenyl%"),
          or(
            eq7(products.usp, null),
            eq7(products.usp, "")
          )
        )
      )
    );
    updates.push(
      db.update(products).set({ usp: "L60" }).where(
        and3(
          like(products.name, "%HILIC%"),
          or(
            eq7(products.usp, null),
            eq7(products.usp, "")
          )
        )
      )
    );
    updates.push(
      db.update(products).set({ usp: "L10" }).where(
        and3(
          or(
            like(products.name, "%Nitrile%"),
            like(products.name, "%Cyano%"),
            like(products.name, "%CN%")
          ),
          or(
            eq7(products.usp, null),
            eq7(products.usp, "")
          )
        )
      )
    );
    updates.push(
      db.update(products).set({ usp: "L3" }).where(
        and3(
          or(
            like(products.name, "%Silica%"),
            like(products.name, "%SiO2%")
          ),
          or(
            eq7(products.usp, null),
            eq7(products.usp, "")
          )
        )
      )
    );
    const results = await Promise.all(updates);
    const totalUpdated = results.reduce((sum, result) => sum + (result.rowsAffected || 0), 0);
    return {
      success: true,
      totalUpdated,
      message: `Successfully filled USP data for ${totalUpdated} products`
    };
  } catch (error) {
    console.error("Error filling product USP data:", error);
    throw new Error("Failed to fill product USP data");
  }
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
import bodyParser from "body-parser";
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
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
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
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
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
              updatedAt: /* @__PURE__ */ new Date()
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

// server/inquiryUtils.ts
function generateInquiryNumber() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 900) + 100;
  return `INQ-${year}${month}${day}-${random}`;
}

// server/emailService.ts
import nodemailer from "nodemailer";
function getSMTPConfig() {
  const host = process.env.SMTP_HOST;
  const port2 = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  if (!host || !port2 || !user || !pass || !from) {
    console.warn("[Email Service] SMTP not configured. Email sending is disabled.");
    console.warn("[Email Service] Required environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM");
    return null;
  }
  return {
    host,
    port: parseInt(port2, 10),
    secure: parseInt(port2, 10) === 465,
    // true for 465, false for other ports
    auth: {
      user,
      pass
    },
    from
  };
}
var transporter = null;
function getTransporter() {
  if (transporter) {
    return transporter;
  }
  const config = getSMTPConfig();
  if (!config) {
    return null;
  }
  try {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth
    });
    console.log("[Email Service] SMTP transporter created successfully");
    return transporter;
  } catch (error) {
    console.error("[Email Service] Failed to create SMTP transporter:", error);
    return null;
  }
}
function generateInquiryEmailHTML(data) {
  const productRows = data.products.map((p, index2) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${index2 + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${p.name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${p.partNumber}</td>
      </tr>
    `).join("");
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\u8BE2\u4EF7\u786E\u8BA4</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">Rowell HPLC \u4EA7\u54C1\u4E2D\u5FC3</h1>
    <p style="margin: 10px 0 0 0; font-size: 14px;">\u4E13\u4E1A\u7684 HPLC \u8272\u8C31\u67F1\u4F9B\u5E94\u5546</p>
  </div>
  
  <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #2563eb; margin-top: 0;">\u8BE2\u4EF7\u786E\u8BA4</h2>
    
    <p>\u5C0A\u656C\u7684 <strong>${data.userName}</strong>\uFF0C</p>
    
    <p>\u611F\u8C22\u60A8\u5BF9 Rowell HPLC \u7684\u5173\u6CE8\uFF01\u60A8\u7684\u8BE2\u4EF7\u5DF2\u6210\u529F\u63D0\u4EA4\uFF0C\u6211\u4EEC\u5C06\u5C3D\u5FEB\u4E0E\u60A8\u8054\u7CFB\u3002</p>
    
    <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb;">
      <p style="margin: 5px 0;"><strong>\u8BE2\u4EF7\u5355\u53F7:</strong> ${data.inquiryNumber}</p>
      <p style="margin: 5px 0;"><strong>\u63D0\u4EA4\u65F6\u95F4:</strong> ${data.createdAt.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</p>
      ${data.userCompany ? `<p style="margin: 5px 0;"><strong>\u516C\u53F8:</strong> ${data.userCompany}</p>` : ""}
      ${data.userPhone ? `<p style="margin: 5px 0;"><strong>\u7535\u8BDD:</strong> ${data.userPhone}</p>` : ""}
    </div>
    
    <h3 style="color: #2563eb; margin-top: 20px;">\u8BE2\u4EF7\u4EA7\u54C1</h3>
    <table style="width: 100%; border-collapse: collapse; margin: 10px 0; background-color: white;">
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 10px; border: 1px solid #ddd; text-align: left; width: 50px;">#</th>
          <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">\u4EA7\u54C1\u540D\u79F0</th>
          <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">\u8D27\u53F7</th>
        </tr>
      </thead>
      <tbody>
        ${productRows}
      </tbody>
    </table>
    
    ${data.userMessage ? `
    <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <h3 style="color: #2563eb; margin-top: 0;">\u60A8\u7684\u7559\u8A00</h3>
      <p style="margin: 0; white-space: pre-wrap;">${data.userMessage}</p>
    </div>
    ` : ""}
    
    <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <p style="margin: 0;"><strong>\u23F0 \u54CD\u5E94\u65F6\u95F4:</strong> \u6211\u4EEC\u7684\u9500\u552E\u56E2\u961F\u5C06\u5728 1-2 \u4E2A\u5DE5\u4F5C\u65E5\u5185\u4E0E\u60A8\u8054\u7CFB\u3002</p>
    </div>
    
    <h3 style="color: #2563eb; margin-top: 20px;">\u8054\u7CFB\u6211\u4EEC</h3>
    <p style="margin: 5px 0;">\u{1F4E7} \u90AE\u7BB1: <a href="mailto:sales@rowellhplc.com" style="color: #2563eb;">sales@rowellhplc.com</a></p>
    <p style="margin: 5px 0;">\u{1F4DE} \u7535\u8BDD: +86 XXX-XXXX-XXXX</p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    
    <p style="color: #6b7280; font-size: 12px; margin: 0;">
      \u6B64\u90AE\u4EF6\u7531\u7CFB\u7EDF\u81EA\u52A8\u53D1\u9001\uFF0C\u8BF7\u52FF\u76F4\u63A5\u56DE\u590D\u3002\u5982\u6709\u95EE\u9898\uFF0C\u8BF7\u901A\u8FC7\u4E0A\u8FF0\u8054\u7CFB\u65B9\u5F0F\u4E0E\u6211\u4EEC\u8054\u7CFB\u3002
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
    <p style="margin: 5px 0;">\xA9 2026 Rowell HPLC \u4EA7\u54C1\u4E2D\u5FC3. All rights reserved.</p>
    <p style="margin: 5px 0;">\u4E13\u4E1A\u7684 HPLC \u8272\u8C31\u67F1\u4F9B\u5E94\u5546\uFF0C\u63D0\u4F9B\u9AD8\u8D28\u91CF\u7684\u5206\u6790\u89E3\u51B3\u65B9\u6848</p>
  </div>
</body>
</html>
  `.trim();
}
function generateInquiryEmailText(data) {
  const productList = data.products.map((p, index2) => `${index2 + 1}. ${p.name} (\u8D27\u53F7: ${p.partNumber})`).join("\n");
  return `
\u5C0A\u656C\u7684 ${data.userName}\uFF0C

\u611F\u8C22\u60A8\u5BF9 Rowell HPLC \u7684\u5173\u6CE8\uFF01

\u60A8\u7684\u8BE2\u4EF7\u5DF2\u6210\u529F\u63D0\u4EA4\uFF0C\u6211\u4EEC\u5C06\u5C3D\u5FEB\u4E0E\u60A8\u8054\u7CFB\u3002

\u8BE2\u4EF7\u5355\u53F7: ${data.inquiryNumber}
\u63D0\u4EA4\u65F6\u95F4: ${data.createdAt.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
${data.userCompany ? `\u516C\u53F8: ${data.userCompany}
` : ""}${data.userPhone ? `\u7535\u8BDD: ${data.userPhone}
` : ""}
\u8BE2\u4EF7\u4EA7\u54C1:
${productList}

${data.userMessage ? `\u60A8\u7684\u7559\u8A00:
${data.userMessage}

` : ""}\u6211\u4EEC\u7684\u9500\u552E\u56E2\u961F\u5C06\u5728 1-2 \u4E2A\u5DE5\u4F5C\u65E5\u5185\u4E0E\u60A8\u8054\u7CFB\u3002

\u5982\u6709\u4EFB\u4F55\u95EE\u9898\uFF0C\u8BF7\u968F\u65F6\u8054\u7CFB\u6211\u4EEC\uFF1A
\u90AE\u7BB1: sales@rowellhplc.com
\u7535\u8BDD: +86 XXX-XXXX-XXXX

\u795D\u597D\uFF01
Rowell HPLC \u56E2\u961F

---
\u6B64\u90AE\u4EF6\u7531\u7CFB\u7EDF\u81EA\u52A8\u53D1\u9001\uFF0C\u8BF7\u52FF\u76F4\u63A5\u56DE\u590D\u3002
\xA9 2026 Rowell HPLC \u4EA7\u54C1\u4E2D\u5FC3. All rights reserved.
  `.trim();
}
async function sendInquiryEmail(data) {
  try {
    const transporter2 = getTransporter();
    if (!transporter2) {
      console.log("[Email Service] SMTP not configured. Email content logged below:");
      console.log("To:", data.userEmail);
      console.log("Subject:", `\u60A8\u7684\u8BE2\u4EF7\u5DF2\u63D0\u4EA4 - \u8BE2\u4EF7\u5355\u53F7: ${data.inquiryNumber}`);
      console.log("Content (Text):", generateInquiryEmailText(data));
      console.log("[Email Service] To enable real email sending, configure SMTP environment variables.");
      return true;
    }
    const config = getSMTPConfig();
    if (!config) {
      return false;
    }
    const info = await transporter2.sendMail({
      from: `"Rowell HPLC \u4EA7\u54C1\u4E2D\u5FC3" <${config.from}>`,
      to: data.userEmail,
      subject: `\u60A8\u7684\u8BE2\u4EF7\u5DF2\u63D0\u4EA4 - \u8BE2\u4EF7\u5355\u53F7: ${data.inquiryNumber}`,
      text: generateInquiryEmailText(data),
      html: generateInquiryEmailHTML(data)
    });
    console.log("[Email Service] Email sent successfully:", info.messageId);
    console.log("[Email Service] Preview URL:", nodemailer.getTestMessageUrl(info));
    return true;
  } catch (error) {
    console.error("[Email Service] Failed to send inquiry email:", error);
    return false;
  }
}

// server/routers.ts
import { z as z15 } from "zod";

// server/seed-api.ts
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { z as z2 } from "zod";
var seedRouter = router({
  importResources: publicProcedure.input(z2.object({ secret: z2.string().optional() }).optional()).mutation(async ({ input }) => {
    const SECRET_KEY = process.env.SEED_SECRET || "rowell-seed-2025";
    if (input?.secret && input.secret !== SECRET_KEY) {
      throw new Error("Invalid secret key");
    }
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { resources: resources2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const db = await getDb2();
    const articlesDir = join(process.cwd(), "resource_center_articles");
    const categories2 = ["technical_guides", "application_notes", "industry_insights"];
    let importedCount = 0;
    const results = [];
    for (const category of categories2) {
      const categoryDir = join(articlesDir, category);
      try {
        const files = readdirSync(categoryDir).filter((f) => f.endsWith(".md"));
        for (const file of files) {
          const filePath = join(categoryDir, file);
          const content = readFileSync(filePath, "utf-8");
          const titleMatch = content.match(/^#\s+(.+)$/m);
          const title = titleMatch ? titleMatch[1] : file.replace(".md", "");
          const excerptMatch = content.match(/\n\n(.+?)\n\n/);
          const excerpt = excerptMatch ? excerptMatch[1].substring(0, 200) : "";
          let categoryLabel = "Technical Guide";
          if (category === "application_notes") categoryLabel = "Application Note";
          if (category === "industry_insights") categoryLabel = "Industry Insight";
          const slug = file.replace(".md", "").toLowerCase();
          const daysAgo = Math.floor(Math.random() * 365);
          const publishedAt = /* @__PURE__ */ new Date();
          publishedAt.setDate(publishedAt.getDate() - daysAgo);
          await db.insert(resources2).values({
            title,
            slug,
            excerpt,
            content,
            category: categoryLabel,
            author: "Rowell HPLC Team",
            publishedAt,
            featured: Math.random() > 0.7
            // 30% chance of being featured
          });
          importedCount++;
          results.push({ title, category: categoryLabel, status: "success" });
        }
      } catch (error) {
        results.push({
          category,
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    return {
      success: true,
      imported: importedCount,
      results,
      message: `Successfully imported ${importedCount} articles!`
    };
  })
});

// server/admin-api.ts
import { z as z3 } from "zod";
var adminRouter = router({
  // Add GlycoWorks products
  addGlycoWorksProducts: publicProcedure.input((raw) => {
    return z3.object({
      adminKey: z3.string()
    }).parse(raw);
  }).mutation(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { products: products2, categories: categories2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq13, or: or2 } = await import("drizzle-orm");
    const db = await getDb2();
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
        name: "GlycoWorks HILIC 1 cc Flangeless Cartridge",
        brand: "Waters",
        categoryId: speCategoryId,
        status: "active",
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        partNumber: "WATS-186007080",
        productId: "WATS-186007080",
        name: "GlycoWorks HILIC 1 cc Cartridge, 20/pk",
        brand: "Waters",
        categoryId: speCategoryId,
        status: "active",
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }
    ];
    const results = [];
    for (const product of newProducts) {
      const existing = existingProducts.find((p) => p.partNumber === product.partNumber);
      if (existing) {
        await db.update(products2).set({
          name: product.name,
          categoryId: product.categoryId,
          updatedAt: /* @__PURE__ */ new Date()
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
  // Check data consistency
  checkDataConsistency: publicProcedure.input((raw) => {
    return z3.object({
      adminKey: z3.string()
    }).parse(raw);
  }).query(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { products: products2, categories: categories2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq13, sql: sql6 } = await import("drizzle-orm");
    const db = await getDb2();
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
      duplicatePartNumbers: duplicates.rows,
      watersProducts
    };
  })
});

// server/list-categories-api.ts
import { z as z4 } from "zod";
var listCategoriesRouter = router({
  // List all categories
  listAll: publicProcedure.input((raw) => {
    return z4.object({
      adminKey: z4.string()
    }).parse(raw);
  }).query(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { categories: categories2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const db = await getDb2();
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

// server/add-glycoworks-simple.ts
import { z as z5 } from "zod";
var addGlycoWorksSimpleRouter = router({
  // Add products with hardcoded category ID
  addWithCategoryId: publicProcedure.input((raw) => {
    return z5.object({
      adminKey: z5.string(),
      categoryId: z5.number()
    }).parse(raw);
  }).mutation(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { products: products2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq13, or: or2 } = await import("drizzle-orm");
    const db = await getDb2();
    const existingProducts = await db.select().from(products2).where(
      or2(
        eq13(products2.partNumber, "186007239"),
        eq13(products2.partNumber, "186007080")
      )
    );
    const newProducts = [
      {
        partNumber: "186007239",
        productId: "WATS-186007239",
        name: "GlycoWorks HILIC 1 cc Flangeless Cartridge",
        brand: "Waters",
        categoryId: input.categoryId,
        status: "active",
        productType: "SPE Cartridge",
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        partNumber: "186007080",
        productId: "WATS-186007080",
        name: "GlycoWorks HILIC 1 cc Cartridge, 20/pk",
        brand: "Waters",
        categoryId: input.categoryId,
        status: "active",
        productType: "SPE Cartridge",
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }
    ];
    const results = [];
    if (existingProducts.length > 0) {
      return {
        success: false,
        message: "Products already exist",
        existing: existingProducts.map((p) => ({
          id: p.id,
          partNumber: p.partNumber,
          name: p.name,
          categoryId: p.categoryId
        }))
      };
    }
    for (const product of newProducts) {
      const result = await db.insert(products2).values(product);
      results.push({
        partNumber: product.partNumber,
        action: "added",
        id: result[0].insertId
      });
    }
    return {
      success: true,
      results,
      categoryId: input.categoryId
    };
  })
});

// server/update-product-category.ts
import { z as z6 } from "zod";
var updateProductCategoryRouter = router({
  // Update product category by part numbers
  updateByPartNumbers: publicProcedure.input((raw) => {
    return z6.object({
      adminKey: z6.string(),
      partNumbers: z6.array(z6.string()),
      categoryId: z6.number()
    }).parse(raw);
  }).mutation(async ({ input }) => {
    if (input.adminKey !== "temp-admin-2024") {
      throw new Error("Unauthorized");
    }
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { products: products2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq13, inArray: inArray2, sql: sql6 } = await import("drizzle-orm");
    const db = await getDb2();
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
import { z as z7 } from "zod";
import mysql2 from "mysql2/promise";
var updateGlycoWorksMysql2Router = router({
  updateDirect: publicProcedure.input((raw) => {
    return z7.object({
      adminKey: z7.string()
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
import { z as z8 } from "zod";
import mysql3 from "mysql2/promise";
var cleanupProductCategoriesRouter = router({
  removeOldCategories: publicProcedure.input((raw) => {
    return z8.object({
      adminKey: z8.string()
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
import { z as z9 } from "zod";
import mysql4 from "mysql2/promise";
var checkDataConsistencyRouter = router({
  getStats: publicProcedure.input((raw) => {
    return z9.object({
      adminKey: z9.string()
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
import { z as z10 } from "zod";
import mysql5 from "mysql2/promise";
var describeProductsTableRouter = router({
  getSchema: publicProcedure.input((raw) => {
    return z10.object({
      adminKey: z10.string()
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
import { z as z11 } from "zod";
import mysql6 from "mysql2/promise";
var queryCategoriesRouter = router({
  // Query all categories
  listAll: publicProcedure.input((raw) => {
    return z11.object({
      adminKey: z11.string()
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
import { z as z12 } from "zod";
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
  execute: publicProcedure.input(z12.object({
    offset: z12.number().default(0),
    limit: z12.number().default(100)
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
            dimensions: `${row.columnLength} \xD7 ${row.innerDiameter}`,
            status: "active",
            // Set status to active
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
          const dimensionsValue = `${columnLength} \xD7 ${innerDiameter}`;
          await db.update(products).set({
            dimensions: dimensionsValue
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
import { z as z13 } from "zod";
import { eq as eq4, desc, and, sql } from "drizzle-orm";
var learningCenterRouter = router({
  articles: router({
    list: publicProcedure.input(
      z13.object({
        page: z13.number().optional().default(1),
        pageSize: z13.number().optional().default(12),
        category: z13.string().optional(),
        area: z13.string().optional()
      })
    ).query(async ({ input }) => {
      const db = await getDb();
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
    bySlug: publicProcedure.input(z13.object({ slug: z13.string() })).query(async ({ input }) => {
      const db = await getDb();
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
    getBySlug: publicProcedure.input(z13.string()).query(async ({ input }) => {
      const db = await getDb();
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
    getBySlug: publicProcedure.input(z13.string()).query(async ({ input }) => {
      const db = await getDb();
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
      z13.object({
        page: z13.number().optional().default(1),
        pageSize: z13.number().optional().default(12),
        area: z13.string().optional()
      })
    ).query(async ({ input }) => {
      const db = await getDb();
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
    bySlug: publicProcedure.input(z13.string()).query(async ({ input }) => {
      const db = await getDb();
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

// server/seed-articles.ts
init_db();
init_schema();
import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { eq as eq5 } from "drizzle-orm";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var authorProfiles = [
  {
    fullName: "Dr. Michael Zhang",
    slug: "dr-michael-zhang",
    title: "Technical Director",
    yearsOfExperience: 15,
    education: "Ph.D. in Analytical Chemistry",
    biography: "Dr. Michael Zhang is a seasoned chromatography expert with over 15 years of experience in analytical chemistry. He specializes in HPLC method development and instrumentation, providing practical guidance for laboratories worldwide.",
    expertise: JSON.stringify(["HPLC", "Method Development", "Instrumentation", "Troubleshooting"]),
    photoUrl: null
  },
  {
    fullName: "Dr. Evelyn Reed",
    slug: "dr-evelyn-reed",
    title: "Pharmaceutical Analysis Expert",
    yearsOfExperience: 12,
    education: "Ph.D. in Pharmaceutical Sciences",
    biography: "Dr. Evelyn Reed brings extensive pharmaceutical industry experience, specializing in drug development and quality control. Her expertise spans API characterization, impurity profiling, and regulatory compliance.",
    expertise: JSON.stringify(["Pharmaceutical Analysis", "Drug Development", "Quality Control", "Regulatory Compliance"]),
    photoUrl: null
  },
  {
    fullName: "Dr. James Chen",
    slug: "dr-james-chen",
    title: "Environmental & Food Safety Specialist",
    yearsOfExperience: 10,
    education: "Ph.D. in Environmental Chemistry",
    biography: "Dr. James Chen focuses on environmental monitoring and food safety testing using chromatographic techniques. He has published numerous papers on pesticide analysis and contaminant detection.",
    expertise: JSON.stringify(["Environmental Testing", "Food Safety", "Pesticide Analysis", "Contaminant Detection"]),
    photoUrl: null
  },
  {
    fullName: "Dr. Sarah Martinez",
    slug: "dr-sarah-martinez",
    title: "Clinical & Biopharmaceutical Specialist",
    yearsOfExperience: 8,
    education: "Ph.D. in Clinical Chemistry",
    biography: "Dr. Sarah Martinez specializes in clinical diagnostics and biopharmaceutical analysis. Her work includes therapeutic drug monitoring, biomarker discovery, and monoclonal antibody characterization.",
    expertise: JSON.stringify(["Clinical Diagnostics", "Therapeutic Drug Monitoring", "Biopharmaceuticals", "Biomarker Analysis"]),
    photoUrl: null
  }
];
async function seedArticles() {
  console.log("Starting article seeding...");
  const db = await getDb();
  if (!db) {
    console.error("Database connection failed");
    return { success: false, error: "Database connection failed" };
  }
  console.log("\n=== Seeding Authors ===");
  let authorsCreated = 0;
  let authorsExisted = 0;
  const authorIdMap = /* @__PURE__ */ new Map();
  for (const profile of authorProfiles) {
    try {
      const result = await db.insert(authors).values({
        ...profile,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      const authorId = Number(result.insertId);
      authorIdMap.set(profile.slug, authorId);
      console.log(`\u2713 Created author: ${profile.fullName} (ID: ${authorId})`);
      authorsCreated++;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY" || error.message?.includes("Duplicate")) {
        console.log(`- Author already exists: ${profile.fullName}`);
        const existingAuthor = await db.select().from(authors).where(eq5(authors.slug, profile.slug)).limit(1);
        if (existingAuthor.length > 0) {
          authorIdMap.set(profile.slug, existingAuthor[0].id);
          console.log(`  Found existing ID: ${existingAuthor[0].id}`);
        }
        authorsExisted++;
      } else {
        console.error(`\u2717 Error creating author ${profile.fullName}:`, error.message);
      }
    }
  }
  console.log("\n=== Seeding Articles ===");
  console.log("DEBUG: __dirname =", __dirname);
  console.log("DEBUG: __filename =", __filename);
  const articlesDir = path.join(__dirname, "../data/articles");
  console.log("DEBUG: articlesDir =", articlesDir);
  if (!fs.existsSync(articlesDir)) {
    console.error(`Articles directory not found: ${articlesDir}`);
    return {
      success: false,
      error: "Articles directory not found",
      authorsCreated,
      authorsExisted
    };
  }
  const articleFiles = fs.readdirSync(articlesDir).filter((file) => file.startsWith("ARTICLE_") && file.endsWith(".md"));
  console.log("DEBUG: Found", articleFiles.length, "article files");
  console.log("DEBUG: First 3 files:", articleFiles.slice(0, 3));
  let articlesCreated = 0;
  let articlesExisted = 0;
  let articlesError = 0;
  for (const filename of articleFiles) {
    try {
      const filePath = path.join(articlesDir, filename);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { data: frontmatter, content } = matter(fileContent);
      const {
        title,
        author_slug,
        category,
        area,
        slug,
        published_date,
        description,
        keywords
      } = frontmatter;
      const authorId = authorIdMap.get(author_slug);
      if (!authorId) {
        console.error(`\u2717 Author not found for slug: ${author_slug} in ${filename}`);
        articlesError++;
        continue;
      }
      await db.insert(articles).values({
        title,
        slug,
        content,
        excerpt: description,
        category,
        applicationArea: area,
        authorId,
        featuredImage: null,
        tags: keywords ? JSON.stringify(keywords.split(", ")) : null,
        metaDescription: description,
        metaKeywords: keywords,
        publishedAt: new Date(published_date).toISOString(),
        viewCount: 0,
        featured: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      console.log(`\u2713 Created: ${title}`);
      articlesCreated++;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY" || error.message?.includes("Duplicate")) {
        console.log(`- Article already exists: ${filename}`);
        articlesExisted++;
      } else {
        console.error(`\u2717 Error creating ${filename}:`, error.message);
        articlesError++;
      }
    }
  }
  const summary = {
    success: true,
    authorsCreated,
    authorsExisted,
    articlesCreated,
    articlesExisted,
    articlesError,
    totalArticles: articleFiles.length
  };
  console.log(`
=== Seeding Summary ===`);
  console.log(JSON.stringify(summary, null, 2));
  return summary;
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
      return await productsListQuery2(input, db);
    }),
    getByIds: publicProcedure.input((raw) => {
      return z15.object({
        productIds: z15.array(z15.number())
      }).parse(raw);
    }).query(async ({ input }) => {
      return await getProductsByIds(input.productIds);
    }),
    getBySlug: publicProcedure.input((raw) => {
      return z15.string().parse(raw);
    }).query(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { products: products2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq13 } = await import("drizzle-orm");
      const db = await getDb2();
      const result = await db.select().from(products2).where(eq13(products2.productId, input)).limit(1);
      return result[0] || null;
    }),
    getRelated: publicProcedure.input((raw) => {
      return z15.object({
        productId: z15.string(),
        limit: z15.number().optional().default(6)
      }).parse(raw);
    }).query(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { products: products2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq13, and: and5, or: or2, ne, sql: sql6 } = await import("drizzle-orm");
      const db = await getDb2();
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
            eq13(products2.phaseType, product.phaseType),
            // Same phase type
            eq13(products2.usp, product.usp),
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
      return z15.object({
        status: z15.enum(["new", "read", "replied", "closed", "all"]).optional().default("all"),
        page: z15.number().optional().default(1),
        pageSize: z15.number().optional().default(20),
        search: z15.string().optional()
      }).parse(raw);
    }).query(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { customerMessages: customerMessages2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq13, desc: desc3, or: or2, sql: sql6, and: and5 } = await import("drizzle-orm");
      const db = await getDb2();
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
      const messages = await db.select().from(customerMessages2).where(whereClause).orderBy(desc3(customerMessages2.createdAt)).limit(input.pageSize).offset((input.page - 1) * input.pageSize);
      return {
        messages,
        total,
        totalPages: Math.ceil(total / input.pageSize)
      };
    }),
    updateStatus: publicProcedure.input((raw) => {
      return z15.object({
        id: z15.number(),
        status: z15.enum(["new", "read", "replied", "closed"])
      }).parse(raw);
    }).mutation(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { customerMessages: customerMessages2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq13 } = await import("drizzle-orm");
      const db = await getDb2();
      await db.update(customerMessages2).set({ status: input.status }).where(eq13(customerMessages2.id, input.id));
      return { success: true };
    }),
    getStats: publicProcedure.query(async () => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { customerMessages: customerMessages2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq13, sql: sql6 } = await import("drizzle-orm");
      const db = await getDb2();
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
      return z15.object({
        type: z15.enum(["inquiry", "message", "quote_request"]).default("message"),
        name: z15.string().min(2, "\u59D3\u540D\u81F3\u5C11 2 \u4E2A\u5B57\u7B26").max(100, "\u59D3\u540D\u6700\u591A 100 \u4E2A\u5B57\u7B26"),
        email: z15.string().email("\u8BF7\u8F93\u5165\u6709\u6548\u7684\u90AE\u7BB1\u5730\u5740"),
        company: z15.string().optional(),
        phone: z15.string().optional(),
        productId: z15.string().optional(),
        productName: z15.string().optional(),
        message: z15.string().min(10, "\u7559\u8A00\u81F3\u5C11 10 \u4E2A\u5B57\u7B26").max(1e3, "\u7559\u8A00\u6700\u591A 1000 \u4E2A\u5B57\u7B26")
      }).parse(raw);
    }).mutation(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { customerMessages: customerMessages2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const db = await getDb2();
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
      return z15.object({
        productIds: z15.array(z15.number()).min(1, "\u8BF7\u9009\u62E9\u81F3\u5C11\u4E00\u4E2A\u4EA7\u54C1"),
        userInfo: z15.object({
          name: z15.string().min(2, "\u59D3\u540D\u81F3\u5C11 2 \u4E2A\u5B57\u7B26").max(50, "\u59D3\u540D\u6700\u591A 50 \u4E2A\u5B57\u7B26"),
          email: z15.string().email("\u8BF7\u8F93\u5165\u6709\u6548\u7684\u90AE\u7BB1\u5730\u5740"),
          company: z15.string().optional(),
          phone: z15.string().optional(),
          message: z15.string().max(500, "\u7559\u8A00\u6700\u591A 500 \u4E2A\u5B57\u7B26").optional()
        })
      }).parse(raw);
    }).mutation(async ({ input }) => {
      const inquiryNumber = generateInquiryNumber();
      const products2 = await getProductsByIds(input.productIds);
      if (products2.length === 0) {
        throw new Error("\u672A\u627E\u5230\u4EA7\u54C1\u4FE1\u606F");
      }
      const inquiryId = await createInquiry({
        inquiryNumber,
        userName: input.userInfo.name,
        userEmail: input.userInfo.email,
        userCompany: input.userInfo.company,
        userPhone: input.userInfo.phone,
        userMessage: input.userInfo.message
      });
      const items = products2.map((p) => ({
        productId: p.id,
        partNumber: p.partNumber,
        productName: p.name,
        brand: p.brand
      }));
      await createInquiryItems(inquiryId, items);
      const emailSent = await sendInquiryEmail({
        inquiryNumber,
        userName: input.userInfo.name,
        userEmail: input.userInfo.email,
        userMessage: input.userInfo.message,
        products: products2.map((p) => ({
          name: p.name,
          partNumber: p.partNumber
        })),
        createdAt: /* @__PURE__ */ new Date()
      });
      return {
        success: true,
        inquiryNumber,
        message: emailSent ? "\u8BE2\u4EF7\u5DF2\u63D0\u4EA4\uFF0C\u786E\u8BA4\u90AE\u4EF6\u5DF2\u53D1\u9001\u81F3\u60A8\u7684\u90AE\u7BB1" : "\u8BE2\u4EF7\u5DF2\u63D0\u4EA4\uFF0C\u4F46\u90AE\u4EF6\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u8BB0\u5F55\u60A8\u7684\u8BE2\u4EF7\u5355\u53F7"
      };
    })
  }),
  // USP Standards routes
  usp: router({
    listWithProductCount: publicProcedure.query(async () => {
      const { getAllUSPStandardsWithProductCount: getAllUSPStandardsWithProductCount2 } = await Promise.resolve().then(() => (init_db_usp(), db_usp_exports));
      return await getAllUSPStandardsWithProductCount2();
    }),
    getByCode: publicProcedure.input((raw) => {
      return z15.object({
        code: z15.string(),
        productLimit: z15.number().optional().default(50)
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
      return z15.object({
        page: z15.number().min(1).optional(),
        pageSize: z15.number().min(1).max(100).optional(),
        search: z15.string().optional(),
        category: z15.string().optional()
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
      const { eq: eq13, like: like2, and: and5, desc: desc3 } = await import("drizzle-orm");
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
      const results = await db.select().from(resources2).where(whereClause).orderBy(desc3(resources2.publishedAt)).limit(pageSize).offset(offset);
      return {
        items: results,
        total,
        page,
        pageSize
      };
    }),
    getBySlug: publicProcedure.input((raw) => {
      return z15.object({
        slug: z15.string()
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
      const result = await db.select().from(categories2).orderBy(asc(categories2.parentId), asc(categories2.displayOrder));
      return result;
    }),
    getWithProductCount: publicProcedure.query(async () => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const db = await getDb2();
      const [rows] = await db.execute(`
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
      return rows;
    })
  }),
  // Brand routes
  brand: router({
    getWithProductCount: publicProcedure.query(async () => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const db = await getDb2();
      const [rows] = await db.execute(`
          SELECT 
            brand,
            COUNT(*) as productCount
          FROM products
          WHERE brand IS NOT NULL AND brand != '' AND status = 'active'
          GROUP BY brand
          ORDER BY productCount DESC, brand ASC
        `);
      return rows;
    })
  }),
  // Seed API for importing resources
  seed: seedRouter,
  // Admin API for data management
  admin: adminRouter,
  // List categories API
  listCategories: listCategoriesRouter,
  // Add GlycoWorks products (simple version)
  addGlycoWorksSimple: addGlycoWorksSimpleRouter,
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
  seedArticles: seedArticlesRouter
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
import fs2 from "fs";
import { nanoid } from "nanoid";
import path3 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path2 from "path";
import { defineConfig } from "vite";
var plugins = [react(), tailwindcss()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path2.resolve(import.meta.dirname),
  root: path2.resolve(import.meta.dirname, "client"),
  publicDir: path2.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
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
init_env();
import { eq as eq8 } from "drizzle-orm";
function extractSlugFromPath(path4) {
  const match = path4.match(/^\/resources\/([^\/\?]+)/);
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
async function injectSeoMetaTags(template, req) {
  console.log(`[SEO] Processing request: ${req.path}`);
  const slug = extractSlugFromPath(req.path);
  console.log(`[SEO] Extracted slug: ${slug}`);
  if (!slug) {
    console.log(`[SEO] No slug found, skipping injection`);
    return template;
  }
  try {
    const db = await getDb();
    if (!db) {
      return template;
    }
    const articles2 = await db.select().from(resources).where(eq8(resources.slug, slug)).limit(1);
    if (articles2.length === 0 || articles2[0].status !== "published") {
      return template;
    }
    const article = articles2[0];
    const protocol = req.protocol || "https";
    const host = req.get("host") || "rowellhplc.com";
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;
    const title = article.title || ENV.appTitle;
    const description = article.metaDescription || article.excerpt || "";
    const image = article.coverImage || ENV.appLogo;
    const metaTags = `
    <title>${escapeHtml(title)} | ${ENV.appTitle}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    
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
    <meta property="article:published_time" content="${article.publishedAt?.toISOString() || ""}" />
    <meta property="article:author" content="${article.authorName || "ROWELL Team"}" />`;
    template = template.replace(/<title>.*?<\/title>/i, "");
    template = template.replace(
      /(<head[^>]*>)/i,
      `$1${metaTags}`
    );
    console.log(`[SEO] Injected meta tags for: ${article.title}`);
    return template;
  } catch (error) {
    console.error("[SEO] Error injecting meta tags:", error);
    return template;
  }
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
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
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
  const distPath = process.env.NODE_ENV === "development" ? path3.resolve(import.meta.dirname, "../..", "dist", "public") : path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (req, res, next) => {
    const url = req.originalUrl;
    if (url.startsWith("/api/") || url === "/sitemap.xml" || url === "/robots.txt") {
      return next();
    }
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/sitemap.ts
init_db();
init_schema();
init_env();
import { eq as eq9 } from "drizzle-orm";
var BASE_URL = ENV.viteAppTitle?.includes("ROWELL") ? "https://www.rowellhplc.com" : "https://rowell-website-test.manus.space";
var STATIC_PAGES = [
  { path: "/", priority: 1, changefreq: "daily" },
  { path: "/products", priority: 0.9, changefreq: "weekly" },
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
async function generateSitemap(req, res) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Sitemap] Database not available");
      return res.status(500).send("Database not available");
    }
    const articles2 = await db.select({
      slug: resources.slug,
      updatedAt: resources.updatedAt
    }).from(resources).where(eq9(resources.status, "published"));
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
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
    for (const article of articles2) {
      xml += "  <url>\n";
      xml += `    <loc>${BASE_URL}/resources/${article.slug}</loc>
`;
      xml += `    <lastmod>${formatDate(article.updatedAt)}</lastmod>
`;
      xml += `    <changefreq>monthly</changefreq>
`;
      xml += `    <priority>0.8</priority>
`;
      xml += "  </url>\n";
    }
    xml += "</urlset>";
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(xml);
    console.log(`[Sitemap] Generated sitemap with ${STATIC_PAGES.length} static pages and ${articles2.length} articles`);
  } catch (error) {
    console.error("[Sitemap] Error generating sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
}

// server/seo-meta-injection.ts
init_db();
init_schema();
init_env();
import { eq as eq10 } from "drizzle-orm";
function extractSlugFromPath2(path4) {
  const match = path4.match(/^\/resources\/([^\/\?]+)/);
  return match ? match[1] : null;
}
function generateMetaTags(article, fullUrl) {
  const title = article.title || ENV.appTitle;
  const description = article.metaDescription || article.excerpt || "";
  const image = article.coverImage || ENV.appLogo;
  return `
    <title>${title} | ${ENV.appTitle}</title>
    <meta name="description" content="${escapeHtml2(description)}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${fullUrl}" />
    <meta property="og:title" content="${escapeHtml2(title)}" />
    <meta property="og:description" content="${escapeHtml2(description)}" />
    <meta property="og:image" content="${image}" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${fullUrl}" />
    <meta name="twitter:title" content="${escapeHtml2(title)}" />
    <meta name="twitter:description" content="${escapeHtml2(description)}" />
    <meta name="twitter:image" content="${image}" />
    
    <!-- Article metadata -->
    <meta property="article:published_time" content="${article.publishedAt?.toISOString() || ""}" />
    <meta property="article:author" content="${article.authorName || "ROWELL Team"}" />
  `.trim();
}
function escapeHtml2(text2) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return text2.replace(/[&<>"']/g, (m) => map[m]);
}
async function seoMetaInjectionMiddleware(req, res, next) {
  if (req.method !== "GET") {
    return next();
  }
  const slug = extractSlugFromPath2(req.path);
  if (!slug) {
    return next();
  }
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[SEO] Database not available, skipping meta injection");
      return next();
    }
    const articles2 = await db.select().from(resources).where(eq10(resources.slug, slug)).limit(1);
    if (articles2.length === 0) {
      return next();
    }
    const article = articles2[0];
    if (article.status !== "published") {
      return next();
    }
    const originalSend = res.send.bind(res);
    res.send = function(data) {
      const contentType = res.getHeader("Content-Type");
      if (typeof contentType === "string" && contentType.includes("text/html") && typeof data === "string") {
        const protocol = req.protocol;
        const host = req.get("host");
        const fullUrl = `${protocol}://${host}${req.originalUrl}`;
        const metaTags = generateMetaTags(article, fullUrl);
        data = data.replace(
          /<title>.*?<\/title>/,
          ""
        );
        data = data.replace(
          /(<meta charset="UTF-8" \/>)/,
          `$1
    ${metaTags}`
        );
        console.log(`[SEO] Injected meta tags for article: ${article.title}`);
      }
      return originalSend(data);
    };
    next();
  } catch (error) {
    console.error("[SEO] Error in meta injection middleware:", error);
    next();
  }
}

// server/learning-center-rest-api.ts
init_db();
init_schema();
import { Router } from "express";
import { eq as eq11, desc as desc2, and as and4, sql as sql4 } from "drizzle-orm";
var learningCenterRouter2 = Router();
learningCenterRouter2.get("/articles", async (req, res) => {
  try {
    const db = await getDb();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    const category = req.query.category;
    const applicationArea = req.query.applicationArea;
    let query = db.select({
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
    }).from(articles).leftJoin(authors, eq11(articles.authorId, authors.id)).orderBy(desc2(articles.publishedDate)).limit(limit).offset(offset);
    if (category) {
      query = query.where(eq11(articles.category, category));
    }
    if (applicationArea) {
      query = query.where(eq11(articles.applicationArea, applicationArea));
    }
    const result = await query;
    const totalResult = await db.select({ count: sql4`count(*)` }).from(articles);
    const total = Number(totalResult[0].count);
    res.json({
      articles: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ error: "Failed to fetch articles" });
  }
});
learningCenterRouter2.get("/articles/:slug", async (req, res) => {
  try {
    const db = await getDb();
    const { slug } = req.params;
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
    }).from(articles).leftJoin(authors, eq11(articles.authorId, authors.id)).where(eq11(articles.slug, slug)).limit(1);
    if (result.length === 0) {
      return res.status(404).json({ error: "Article not found" });
    }
    const article = result[0];
    await db.update(articles).set({ viewCount: sql4`${articles.viewCount} + 1` }).where(eq11(articles.id, article.id));
    res.json(article);
  } catch (error) {
    console.error("Error fetching article:", error);
    res.status(500).json({ error: "Failed to fetch article" });
  }
});
learningCenterRouter2.get("/categories", async (req, res) => {
  try {
    const db = await getDb();
    const result = await db.select({
      category: articles.category,
      count: sql4`count(*)`
    }).from(articles).groupBy(articles.category);
    res.json(result);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});
learningCenterRouter2.get("/application-areas", async (req, res) => {
  try {
    const db = await getDb();
    const result = await db.select({
      applicationArea: articles.applicationArea,
      count: sql4`count(*)`
    }).from(articles).groupBy(articles.applicationArea);
    res.json(result);
  } catch (error) {
    console.error("Error fetching application areas:", error);
    res.status(500).json({ error: "Failed to fetch application areas" });
  }
});
learningCenterRouter2.get("/authors", async (req, res) => {
  try {
    const db = await getDb();
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
    const db = await getDb();
    const { slug } = req.params;
    const result = await db.select().from(authors).where(eq11(authors.slug, slug)).limit(1);
    if (result.length === 0) {
      return res.status(404).json({ error: "Author not found" });
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
    }).from(articles).where(eq11(articles.authorId, author.id)).orderBy(desc2(articles.publishedDate));
    res.json({
      ...author,
      articles: authorArticles
    });
  } catch (error) {
    console.error("Error fetching author:", error);
    res.status(500).json({ error: "Failed to fetch author" });
  }
});
learningCenterRouter2.get("/featured", async (req, res) => {
  try {
    const db = await getDb();
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
    }).from(articles).leftJoin(authors, eq11(articles.authorId, authors.id)).orderBy(desc2(articles.viewCount)).limit(3);
    res.json(result);
  } catch (error) {
    console.error("Error fetching featured articles:", error);
    res.status(500).json({ error: "Failed to fetch featured articles" });
  }
});
learningCenterRouter2.get("/articles/:slug/related", async (req, res) => {
  try {
    const db = await getDb();
    const { slug } = req.params;
    const currentArticle = await db.select({ id: articles.id, category: articles.category }).from(articles).where(eq11(articles.slug, slug)).limit(1);
    if (currentArticle.length === 0) {
      return res.status(404).json({ error: "Article not found" });
    }
    const result = await db.select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      metaDescription: articles.metaDescription,
      publishedDate: articles.publishedDate,
      viewCount: articles.viewCount,
      category: articles.category
    }).from(articles).where(
      and4(
        eq11(articles.category, currentArticle[0].category),
        sql4`${articles.id} != ${currentArticle[0].id}`
      )
    ).orderBy(desc2(articles.publishedDate)).limit(3);
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
    const { db } = await Promise.resolve().then(() => (init_db(), db_exports));
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
  app.use(bodyParser.text({ type: "text/csv", limit: "50mb" }));
  app.use(bodyParser.text({ type: "text/plain", limit: "50mb" }));
  app.use(seoMetaInjectionMiddleware);
  registerOAuthRoutes(app);
  registerImageSyncRoutes(app);
  app.use("/api/learning-center", learningCenterRouter2);
  app.use("/api", testLiteratureRouter);
  app.get("/sitemap.xml", generateSitemap);
  app.get("/robots.txt", (req, res) => {
    res.setHeader("Content-Type", "text/plain");
    res.send(`User-agent: *
Allow: /
Sitemap: ${req.protocol}://${req.get("host")}/sitemap.xml`);
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
}
startServer().catch(console.error);
