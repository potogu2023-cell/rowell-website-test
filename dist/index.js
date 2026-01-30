var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  aiCache: () => aiCache,
  aiConversationStats: () => aiConversationStats,
  aiConversations: () => aiConversations,
  aiMessages: () => aiMessages,
  aiQuestionAnalysis: () => aiQuestionAnalysis,
  apiKeys: () => apiKeys,
  cart: () => cart,
  categories: () => categories,
  conversionFunnel: () => conversionFunnel,
  inquiries: () => inquiries,
  inquiryItems: () => inquiryItems,
  llmCostTracking: () => llmCostTracking,
  productCategories: () => productCategories,
  products: () => products,
  resourceCategories: () => resourceCategories,
  resourcePostTags: () => resourcePostTags,
  resourceTags: () => resourceTags,
  resources: () => resources,
  users: () => users
});
import { mysqlTable, index, int, varchar, text, decimal, timestamp, mysqlEnum, json } from "drizzle-orm/mysql-core";
var aiCache, aiConversationStats, aiConversations, aiMessages, aiQuestionAnalysis, apiKeys, cart, categories, conversionFunnel, inquiries, inquiryItems, llmCostTracking, productCategories, products, resourceCategories, resourcePostTags, resourceTags, resources, users;
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
        productId: int().notNull().references(() => products.id, { onDelete: "cascade" }),
        categoryId: int().notNull().references(() => categories.id, { onDelete: "cascade" }),
        isPrimary: int().default(0).notNull(),
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
        category: varchar({ length: 100 })
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
        slug: varchar({ length: 255 }).notNull(),
        title: varchar({ length: 255 }).notNull(),
        content: text().notNull(),
        excerpt: varchar({ length: 500 }),
        metaDescription: varchar({ length: 200 }),
        coverImage: varchar({ length: 500 }),
        authorName: varchar({ length: 100 }).default("ROWELL Team"),
        status: mysqlEnum(["draft", "published", "archived"]).default("draft").notNull(),
        language: varchar({ length: 10 }).default("en").notNull(),
        categoryId: int(),
        viewCount: int().default(0).notNull(),
        featured: int().default(0).notNull(),
        publishedAt: timestamp({ mode: "string" }),
        createdAt: timestamp({ mode: "string" }).default("CURRENT_TIMESTAMP").notNull(),
        updatedAt: timestamp({ mode: "string" }).defaultNow().onUpdateNow().notNull()
      },
      (table) => [
        index("resources_slug_unique").on(table.slug),
        index("idx_resources_status_published").on(table.status, table.publishedAt),
        index("idx_resources_category").on(table.categoryId),
        index("idx_resources_featured").on(table.featured),
        index("idx_resources_language").on(table.language)
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
      const poolConfig = {
        uri: dbUrl.toString(),
        ssl: sslParam === "true" ? {
          rejectUnauthorized: true
        } : false
      };
      const pool = mysql.createPool(poolConfig);
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
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
  const { inArray } = await import("drizzle-orm");
  return await db.select().from(products2).where(inArray(products2.id, productIds));
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
import { sql } from "drizzle-orm";
function validateDatabaseConfig() {
  const dbUrl = process.env.DATABASE_URL || "";
  console.log("\n========================================");
  console.log("\u{1F50D} \u5F00\u59CB\u9A8C\u8BC1\u751F\u4EA7\u73AF\u5883\u914D\u7F6E...");
  console.log("========================================\n");
  if (!dbUrl) {
    console.error("\u274C \u9519\u8BEF\uFF1ADATABASE_URL\u73AF\u5883\u53D8\u91CF\u672A\u8BBE\u7F6E\uFF01");
    return false;
  }
  const expectedDbName = "rowell_hplc";
  if (!dbUrl.includes(expectedDbName)) {
    console.error("\u274C \u9519\u8BEF\uFF1A\u6570\u636E\u5E93\u914D\u7F6E\u9519\u8BEF\uFF01");
    console.error(`   \u9884\u671F\u6570\u636E\u5E93\uFF1A${expectedDbName}`);
    console.error(`   \u5F53\u524D\u914D\u7F6E\uFF1A${dbUrl.replace(/:[^:@]+@/, ":****@")}`);
    console.error("\n\u26A0\uFE0F  \u8B66\u544A\uFF1A\u5F53\u524D\u914D\u7F6E\u53EF\u80FD\u5BFC\u81F4\u4EA7\u54C1\u6570\u636E\u4E22\u5931\uFF01");
    console.error("   \u8BF7\u68C0\u67E5 PRODUCTION_CONFIG.md \u6587\u4EF6\u83B7\u53D6\u6B63\u786E\u914D\u7F6E\u3002\n");
    return false;
  }
  const expectedRegion = "us-west-2";
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
    const result = await db.select({ count: sql`count(*)` }).from(products2);
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
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}
function setSessionCookie(req, res, session) {
  const cookieOptions = getSessionCookieOptions(req);
  const sessionData = JSON.stringify(session);
  res.cookie(COOKIE_NAME, sessionData, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1e3
    // 30 days
  });
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

// server/password-utils.ts
import bcrypt from "bcryptjs";
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

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
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  if (!host || !port || !user || !pass || !from) {
    console.warn("[Email Service] SMTP not configured. Email sending is disabled.");
    console.warn("[Email Service] Required environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM");
    return null;
  }
  return {
    host,
    port: parseInt(port, 10),
    secure: parseInt(port, 10) === 465,
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
var appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  debug: router({
    checkImports: publicProcedure.query(() => {
      return {
        getUserByEmail: typeof getUserByEmail,
        createUser: typeof createUser,
        updateUserLastSignIn: typeof updateUserLastSignIn,
        hashPassword: typeof hashPassword,
        verifyPassword: typeof verifyPassword
      };
    })
  }),
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    }),
    register: publicProcedure.input((raw) => {
      const { z: z2 } = __require("zod");
      return z2.object({
        email: z2.string().email("\u8BF7\u8F93\u5165\u6709\u6548\u7684\u90AE\u7BB1\u5730\u5740"),
        password: z2.string().min(6, "\u5BC6\u7801\u81F3\u5C116\u4E2A\u5B57\u7B26"),
        name: z2.string().min(2, "\u59D3\u540D\u81F3\u5C112\u4E2A\u5B57\u7B26"),
        company: z2.string().optional(),
        phone: z2.string().optional(),
        country: z2.string().optional(),
        industry: z2.string().optional(),
        purchasingRole: z2.string().optional(),
        annualPurchaseVolume: z2.string().optional()
      }).parse(raw);
    }).mutation(async ({ input }) => {
      console.log("[Auth] Register mutation called for email:", input.email);
      console.log("[Auth] DB functions:", { getUserByEmail: typeof getUserByEmail, createUser: typeof createUser });
      const existingUser = await getUserByEmail(input.email);
      if (existingUser) {
        throw new Error("\u8BE5\u90AE\u7BB1\u5DF2\u88AB\u6CE8\u518C");
      }
      const passwordHash = await hashPassword(input.password);
      const userId = await createUser({
        email: input.email,
        passwordHash,
        name: input.name,
        company: input.company,
        phone: input.phone,
        country: input.country,
        industry: input.industry,
        purchasingRole: input.purchasingRole,
        annualPurchaseVolume: input.annualPurchaseVolume
      });
      return {
        success: true,
        message: "\u6CE8\u518C\u6210\u529F\uFF01\u8BF7\u767B\u5F55"
      };
    }),
    login: publicProcedure.input((raw) => {
      const { z: z2 } = __require("zod");
      return z2.object({
        email: z2.string().email("\u8BF7\u8F93\u5165\u6709\u6548\u7684\u90AE\u7BB1\u5730\u5740"),
        password: z2.string().min(1, "\u8BF7\u8F93\u5165\u5BC6\u7801")
      }).parse(raw);
    }).mutation(async ({ input, ctx }) => {
      const user = await getUserByEmail(input.email);
      if (!user || !user.passwordHash) {
        throw new Error("\u90AE\u7BB1\u6216\u5BC6\u7801\u9519\u8BEF");
      }
      const isValid = await verifyPassword(input.password, user.passwordHash);
      if (!isValid) {
        throw new Error("\u90AE\u7BB1\u6216\u5BC6\u7801\u9519\u8BEF");
      }
      await updateUserLastSignIn(user.id);
      setSessionCookie(ctx.req, ctx.res, {
        userId: user.id,
        openId: user.openId || void 0,
        email: user.email || void 0,
        name: user.name || void 0
      });
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      };
    })
  }),
  // Product routes
  products: router({
    list: publicProcedure.query(async () => {
      return await getAllProducts();
    }),
    getByIds: publicProcedure.input((raw) => {
      const { z: z2 } = __require("zod");
      return z2.object({
        productIds: z2.array(z2.number())
      }).parse(raw);
    }).query(async ({ input }) => {
      return await getProductsByIds(input.productIds);
    })
  }),
  // Inquiry routes
  inquiries: router({
    create: publicProcedure.input((raw) => {
      const { z: z2 } = __require("zod");
      return z2.object({
        productIds: z2.array(z2.number()).min(1, "\u8BF7\u9009\u62E9\u81F3\u5C11\u4E00\u4E2A\u4EA7\u54C1"),
        userInfo: z2.object({
          name: z2.string().min(2, "\u59D3\u540D\u81F3\u5C11 2 \u4E2A\u5B57\u7B26").max(50, "\u59D3\u540D\u6700\u591A 50 \u4E2A\u5B57\u7B26"),
          email: z2.string().email("\u8BF7\u8F93\u5165\u6709\u6548\u7684\u90AE\u7BB1\u5730\u5740"),
          company: z2.string().optional(),
          phone: z2.string().optional(),
          message: z2.string().max(500, "\u7559\u8A00\u6700\u591A 500 \u4E2A\u5B57\u7B26").optional()
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
  })
});

// server/_core/context.ts
async function createContext(opts) {
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
import fs from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
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
import { eq as eq3 } from "drizzle-orm";
function extractSlugFromPath(path3) {
  const match = path3.match(/^\/resources\/([^\/\?]+)/);
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
    const articles = await db.select().from(resources).where(eq3(resources.slug, slug)).limit(1);
    if (articles.length === 0 || articles[0].status !== "published") {
      return template;
    }
    const article = articles[0];
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
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
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
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
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
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/sitemap.ts
init_db();
init_schema();
init_env();
import { eq as eq4 } from "drizzle-orm";
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
    const articles = await db.select({
      slug: resources.slug,
      updatedAt: resources.updatedAt
    }).from(resources).where(eq4(resources.status, "published"));
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
    for (const article of articles) {
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
    console.log(`[Sitemap] Generated sitemap with ${STATIC_PAGES.length} static pages and ${articles.length} articles`);
  } catch (error) {
    console.error("[Sitemap] Error generating sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
}

// server/seo-meta-injection.ts
init_db();
init_schema();
init_env();
import { eq as eq5 } from "drizzle-orm";
function extractSlugFromPath2(path3) {
  const match = path3.match(/^\/resources\/([^\/\?]+)/);
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
    const articles = await db.select().from(resources).where(eq5(resources.slug, slug)).limit(1);
    if (articles.length === 0) {
      return next();
    }
    const article = articles[0];
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

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
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
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
