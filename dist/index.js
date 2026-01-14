var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/const.ts
var COOKIE_NAME, ONE_YEAR_MS, AXIOS_TIMEOUT_MS, UNAUTHED_ERR_MSG, NOT_ADMIN_ERR_MSG;
var init_const = __esm({
  "shared/const.ts"() {
    "use strict";
    COOKIE_NAME = "app_session_id";
    ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
    AXIOS_TIMEOUT_MS = 3e4;
    UNAUTHED_ERR_MSG = "Please login (10001)";
    NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
  }
});

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
        openId: varchar({ length: 64 }).notNull(),
        name: text(),
        email: varchar({ length: 320 }),
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
        password: varchar({ length: 255 }),
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

// server/db.ts
var db_exports = {};
__export(db_exports, {
  getAllUsers: () => getAllUsers,
  getDb: () => getDb,
  getUser: () => getUser,
  upsertUser: () => upsertUser
});
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
async function getDb() {
  console.log("[Database] getDb() called. _db exists:", !!_db, "DATABASE_URL exists:", !!process.env.DATABASE_URL);
  if (!_db && process.env.DATABASE_URL) {
    try {
      let connectionString = process.env.DATABASE_URL;
      console.log("[Database] Original DATABASE_URL:", connectionString);
      const hasSSL = connectionString.includes("?ssl=");
      connectionString = connectionString.replace(/\?ssl=true/, "").replace(/\?ssl=false/, "");
      console.log("[Database] After removing SSL param:", connectionString);
      console.log("[Database] Has SSL:", hasSSL);
      const urlMatch = connectionString.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      console.log("[Database] URL match result:", urlMatch ? "SUCCESS" : "FAILED");
      if (!urlMatch) {
        console.error("[Database] Failed to parse DATABASE_URL. Expected format: mysql://username:password@host:port/database");
        throw new Error("Invalid DATABASE_URL format");
      }
      const [, user, password, host, port, database] = urlMatch;
      const decodedUser = decodeURIComponent(user);
      const decodedPassword = decodeURIComponent(password);
      console.log("[Database] Parsed connection info:");
      console.log("[Database]   Host:", host);
      console.log("[Database]   Port:", port);
      console.log("[Database]   User:", decodedUser);
      console.log("[Database]   Database:", database);
      console.log("[Database]   SSL:", hasSSL);
      const connection = mysql.createPool({
        host,
        port: parseInt(port),
        user: decodedUser,
        password: decodedPassword,
        database,
        ssl: hasSSL ? {
          rejectUnauthorized: true
        } : void 0,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      console.log("[Database] Connection pool created");
      try {
        const testConnection = await connection.getConnection();
        console.log("[Database] Test connection successful");
        testConnection.release();
      } catch (testError) {
        console.error("[Database] Test connection failed:", testError.message);
        throw testError;
      }
      _db = drizzle(connection);
      console.log("[Database] Drizzle instance created successfully");
    } catch (error) {
      console.error("[Database] Failed to initialize database:", error.message);
      console.error("[Database] Error stack:", error.stack);
      throw error;
    }
  }
  return _db;
}
async function upsertUser(user) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      handle: user.handle,
      username: user.username,
      avatarUrl: user.avatarUrl,
      email: user.email
    };
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: {
        username: user.username,
        avatarUrl: user.avatarUrl,
        email: user.email
      }
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUser(handle) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return null;
  }
  try {
    const result = await db.select().from(users).where(eq(users.handle, handle));
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get user:", error);
    return null;
  }
}
async function getAllUsers() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get all users: database not available");
    return [];
  }
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error("[Database] Failed to get all users:", error);
    return [];
  }
}
var _db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    _db = null;
  }
});

// shared/_core/errors.ts
var HttpError, ForbiddenError;
var init_errors = __esm({
  "shared/_core/errors.ts"() {
    "use strict";
    HttpError = class extends Error {
      constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "HttpError";
      }
    };
    ForbiddenError = (msg) => new HttpError(403, msg);
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

// server/_core/sdk.ts
var sdk_exports = {};
__export(sdk_exports, {
  sdk: () => sdk
});
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString, EXCHANGE_TOKEN_PATH, GET_USER_INFO_PATH, GET_USER_INFO_WITH_JWT_PATH, OAuthService, createOAuthHttpClient, SDKServer, sdk;
var init_sdk = __esm({
  "server/_core/sdk.ts"() {
    "use strict";
    init_const();
    init_errors();
    init_db();
    init_env();
    isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
    EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
    GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
    GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
    OAuthService = class {
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
    createOAuthHttpClient = () => axios.create({
      baseURL: ENV.oAuthServerUrl,
      timeout: AXIOS_TIMEOUT_MS
    });
    SDKServer = class {
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
        let user = await (void 0)(sessionUserId);
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
            user = await (void 0)(userInfo.openId);
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
    sdk = new SDKServer();
  }
});

// server/inquiry-utils.ts
var inquiry_utils_exports = {};
__export(inquiry_utils_exports, {
  generateInquiryExcel: () => generateInquiryExcel,
  sendCustomerConfirmationEmail: () => sendCustomerConfirmationEmail,
  sendInquiryEmail: () => sendInquiryEmail
});
import ExcelJS from "exceljs";
async function generateInquiryExcel(inquiry, items, user) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Inquiry");
  worksheet.columns = [
    { width: 5 },
    // No.
    { width: 25 },
    // Product ID
    { width: 20 },
    // Brand
    { width: 20 },
    // Part Number
    { width: 35 },
    // Product Name
    { width: 10 },
    // Quantity
    { width: 30 }
    // Notes
  ];
  worksheet.mergeCells("A1:G1");
  const titleRow = worksheet.getCell("A1");
  titleRow.value = "ROWELL HPLC - Product Inquiry";
  titleRow.font = { size: 16, bold: true };
  titleRow.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(1).height = 30;
  worksheet.addRow([]);
  worksheet.addRow(["Inquiry Number:", inquiry.inquiryNumber]);
  worksheet.addRow(["Date:", new Date(inquiry.createdAt).toLocaleString()]);
  worksheet.addRow(["Status:", inquiry.status.toUpperCase()]);
  worksheet.addRow(["Urgency:", inquiry.urgency.replace("_", " ").toUpperCase()]);
  worksheet.addRow([]);
  worksheet.addRow(["CUSTOMER INFORMATION"]);
  worksheet.getCell("A8").font = { bold: true, size: 12 };
  worksheet.addRow(["Name:", user.name || "N/A"]);
  worksheet.addRow(["Email:", user.email || "N/A"]);
  worksheet.addRow(["Company:", user.company || "N/A"]);
  worksheet.addRow(["Phone:", user.phone || "N/A"]);
  worksheet.addRow(["Country:", user.country || "N/A"]);
  if (inquiry.budgetRange || inquiry.applicationNotes || inquiry.deliveryAddress || inquiry.customerNotes) {
    worksheet.addRow([]);
    worksheet.addRow(["INQUIRY DETAILS"]);
    worksheet.getCell(`A${worksheet.lastRow.number}`).font = { bold: true, size: 12 };
    if (inquiry.budgetRange) {
      worksheet.addRow(["Budget Range:", inquiry.budgetRange]);
    }
    if (inquiry.applicationNotes) {
      worksheet.addRow(["Application Notes:", inquiry.applicationNotes]);
    }
    if (inquiry.deliveryAddress) {
      worksheet.addRow(["Delivery Address:", inquiry.deliveryAddress]);
    }
    if (inquiry.customerNotes) {
      worksheet.addRow(["Additional Notes:", inquiry.customerNotes]);
    }
  }
  worksheet.addRow([]);
  const productsHeaderRow = worksheet.addRow(["PRODUCTS"]);
  productsHeaderRow.getCell(1).font = { bold: true, size: 12 };
  const tableHeaderRow = worksheet.addRow([
    "No.",
    "Product ID",
    "Brand",
    "Part Number",
    "Product Name",
    "Quantity",
    "Notes"
  ]);
  tableHeaderRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" }
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    };
  });
  items.forEach((item, index2) => {
    const row = worksheet.addRow([
      index2 + 1,
      item.product?.productId || "N/A",
      item.product?.brand || "N/A",
      item.product?.partNumber || "N/A",
      item.product?.name || "N/A",
      item.quantity,
      item.notes || ""
    ]);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
    });
  });
  worksheet.addRow([]);
  worksheet.addRow(["Total Items:", items.length]);
  worksheet.getCell(`A${worksheet.lastRow.number}`).font = { bold: true };
  worksheet.addRow([]);
  worksheet.addRow([]);
  const footerRow = worksheet.addRow(["Generated by ROWELL HPLC Inquiry System"]);
  footerRow.getCell(1).font = { italic: true, size: 10 };
  footerRow.getCell(1).alignment = { horizontal: "center" };
  worksheet.mergeCells(`A${footerRow.number}:G${footerRow.number}`);
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
async function sendInquiryEmail(inquiry, user, excelBuffer) {
  try {
    const sgMail = (await import("@sendgrid/mail")).default;
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@rowellhplc.com";
    const toEmail = "info@rowellhplc.com";
    if (!apiKey) {
      console.warn("[Email] SENDGRID_API_KEY not configured, skipping email");
      return false;
    }
    sgMail.setApiKey(apiKey);
    const msg = {
      to: toEmail,
      from: fromEmail,
      subject: `New Inquiry: ${inquiry.inquiryNumber} from ${user.name || user.email}`,
      text: `
New inquiry received from ROWELL HPLC website.

Inquiry Number: ${inquiry.inquiryNumber}
Customer: ${user.name || "N/A"}
Email: ${user.email}
Company: ${user.company || "N/A"}
Phone: ${user.phone || "N/A"}
Country: ${user.country || "N/A"}
Urgency: ${inquiry.urgency.replace("_", " ").toUpperCase()}
Budget Range: ${inquiry.budgetRange || "N/A"}

Please check the attached Excel file for detailed product list.
      `,
      html: `
<h2>New Inquiry Received</h2>
<p>A new inquiry has been submitted from the ROWELL HPLC website.</p>

<h3>Inquiry Information</h3>
<ul>
  <li><strong>Inquiry Number:</strong> ${inquiry.inquiryNumber}</li>
  <li><strong>Date:</strong> ${new Date(inquiry.createdAt).toLocaleString()}</li>
  <li><strong>Status:</strong> ${inquiry.status.toUpperCase()}</li>
  <li><strong>Urgency:</strong> ${inquiry.urgency.replace("_", " ").toUpperCase()}</li>
  <li><strong>Budget Range:</strong> ${inquiry.budgetRange || "N/A"}</li>
</ul>

<h3>Customer Information</h3>
<ul>
  <li><strong>Name:</strong> ${user.name || "N/A"}</li>
  <li><strong>Email:</strong> ${user.email}</li>
  <li><strong>Company:</strong> ${user.company || "N/A"}</li>
  <li><strong>Phone:</strong> ${user.phone || "N/A"}</li>
  <li><strong>Country:</strong> ${user.country || "N/A"}</li>
</ul>

<p>Please check the attached Excel file for the detailed product list.</p>
      `,
      attachments: [
        {
          content: excelBuffer.toString("base64"),
          filename: `inquiry-${inquiry.inquiryNumber}.xlsx`,
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          disposition: "attachment"
        }
      ]
    };
    await sgMail.send(msg);
    console.log(`[Email] Inquiry notification sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send inquiry email:", error);
    return false;
  }
}
async function sendCustomerConfirmationEmail(inquiry, user) {
  try {
    const sgMail = (await import("@sendgrid/mail")).default;
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@rowellhplc.com";
    if (!apiKey) {
      console.warn("[Email] SENDGRID_API_KEY not configured, skipping email");
      return false;
    }
    if (!user.email) {
      console.warn("[Email] Customer email not available, skipping confirmation");
      return false;
    }
    sgMail.setApiKey(apiKey);
    const msg = {
      to: user.email,
      from: fromEmail,
      subject: `Inquiry ${inquiry.inquiryNumber} Received - ROWELL HPLC`,
      text: `
Dear ${user.name || "Customer"},

Thank you for your inquiry! We have received your product inquiry and our team will review it shortly.

Inquiry Number: ${inquiry.inquiryNumber}
Date: ${new Date(inquiry.createdAt).toLocaleString()}
Urgency: ${inquiry.urgency.replace("_", " ").toUpperCase()}

Our sales team will contact you within 24-48 hours with a detailed quotation.

If you have any questions, please don't hesitate to contact us at info@rowellhplc.com.

Best regards,
ROWELL HPLC Team
      `,
      html: `
<h2>Thank You for Your Inquiry!</h2>
<p>Dear ${user.name || "Customer"},</p>

<p>We have received your product inquiry and our team will review it shortly.</p>

<h3>Inquiry Details</h3>
<ul>
  <li><strong>Inquiry Number:</strong> ${inquiry.inquiryNumber}</li>
  <li><strong>Date:</strong> ${new Date(inquiry.createdAt).toLocaleString()}</li>
  <li><strong>Urgency:</strong> ${inquiry.urgency.replace("_", " ").toUpperCase()}</li>
</ul>

<p>Our sales team will contact you within <strong>24-48 hours</strong> with a detailed quotation.</p>

<p>If you have any questions, please don't hesitate to contact us at <a href="mailto:info@rowellhplc.com">info@rowellhplc.com</a>.</p>

<p>Best regards,<br>
<strong>ROWELL HPLC Team</strong></p>
      `
    };
    await sgMail.send(msg);
    console.log(`[Email] Confirmation email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send confirmation email:", error);
    return false;
  }
}
var init_inquiry_utils = __esm({
  "server/inquiry-utils.ts"() {
    "use strict";
  }
});

// server/pdf-utils.ts
var pdf_utils_exports = {};
__export(pdf_utils_exports, {
  generateInquiryPDF: () => generateInquiryPDF
});
import PDFDocument from "pdfkit";
async function generateInquiryPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
      doc.fontSize(24).fillColor("#2563eb").text("ROWELL", 50, 50);
      doc.fontSize(10).fillColor("#666").text("HPLC Solutions", 50, 80);
      doc.moveDown();
      doc.fontSize(18).fillColor("#000").text("QUOTATION", 50, 120);
      doc.fontSize(10).fillColor("#666").text(`Inquiry #${data.inquiry.id}`, 50, 145);
      doc.text(`Date: ${new Date(data.inquiry.createdAt).toLocaleDateString()}`, 50, 160);
      doc.moveDown(2);
      doc.fontSize(14).fillColor("#000").text("Customer Information", 50, doc.y);
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("#333");
      doc.text(`Name: ${data.customer.name}`, 50, doc.y);
      doc.text(`Company: ${data.customer.company}`, 50, doc.y);
      doc.text(`Email: ${data.customer.email}`, 50, doc.y);
      if (data.customer.phone) {
        doc.text(`Phone: ${data.customer.phone}`, 50, doc.y);
      }
      if (data.customer.country) {
        doc.text(`Country: ${data.customer.country}`, 50, doc.y);
      }
      doc.moveDown(2);
      doc.fontSize(14).fillColor("#000").text("Inquiry Details", 50, doc.y);
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("#333");
      doc.text(`Status: ${data.inquiry.status.toUpperCase()}`, 50, doc.y);
      doc.text(`Urgency: ${data.inquiry.urgency.toUpperCase()}`, 50, doc.y);
      if (data.inquiry.budgetRange) {
        doc.text(`Budget Range: ${data.inquiry.budgetRange}`, 50, doc.y);
      }
      if (data.inquiry.deliveryAddress) {
        doc.text(`Delivery Address: ${data.inquiry.deliveryAddress}`, 50, doc.y);
      }
      doc.moveDown(2);
      doc.fontSize(14).fillColor("#000").text("Products", 50, doc.y);
      doc.moveDown(0.5);
      const tableTop = doc.y;
      doc.fontSize(10).fillColor("#fff");
      doc.rect(50, tableTop, 495, 25).fill("#2563eb");
      doc.fillColor("#fff").text("Product", 60, tableTop + 8);
      doc.text("Qty", 300, tableTop + 8);
      doc.text("Quoted Price", 350, tableTop + 8);
      doc.text("Subtotal", 450, tableTop + 8);
      let yPosition = tableTop + 30;
      let totalAmount = 0;
      data.items.forEach((item, index2) => {
        const bgColor = index2 % 2 === 0 ? "#f9fafb" : "#ffffff";
        doc.rect(50, yPosition - 5, 495, 25).fill(bgColor);
        doc.fillColor("#333").fontSize(9);
        doc.text(item.product.name || "", 60, yPosition, { width: 230 });
        doc.text(item.quantity.toString(), 300, yPosition);
        if (item.quotedPrice) {
          const price = typeof item.quotedPrice === "string" ? parseFloat(item.quotedPrice) : item.quotedPrice;
          const subtotal = price * item.quantity;
          totalAmount += subtotal;
          doc.text(`USD ${price.toFixed(2)}`, 350, yPosition);
          doc.text(`USD ${subtotal.toFixed(2)}`, 450, yPosition);
        } else {
          doc.text("TBD", 350, yPosition);
          doc.text("TBD", 450, yPosition);
        }
        yPosition += 25;
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
      });
      if (totalAmount > 0) {
        doc.moveDown();
        doc.fontSize(12).fillColor("#000");
        doc.text(`Total: USD ${totalAmount.toFixed(2)}`, 400, yPosition + 10, {
          align: "right"
        });
      }
      if (data.inquiry.customerNotes) {
        doc.moveDown(2);
        doc.fontSize(12).fillColor("#000").text("Additional Notes:", 50, doc.y);
        doc.fontSize(10).fillColor("#333").text(data.inquiry.customerNotes, 50, doc.y, {
          width: 495
        });
      }
      if (data.inquiry.adminNotes) {
        doc.moveDown(2);
        doc.fontSize(12).fillColor("#000").text("Admin Notes:", 50, doc.y);
        doc.fontSize(10).fillColor("#333").text(data.inquiry.adminNotes, 50, doc.y, {
          width: 495
        });
      }
      doc.moveDown(3);
      doc.fontSize(8).fillColor("#666");
      doc.text("ROWELL HPLC Solutions", 50, doc.y, { align: "center" });
      doc.text("Email: info@rowellhplc.com | WhatsApp: +86 189 3053 9593", 50, doc.y, {
        align: "center"
      });
      doc.text("Shanghai, China", 50, doc.y, { align: "center" });
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
var init_pdf_utils = __esm({
  "server/pdf-utils.ts"() {
    "use strict";
  }
});

// server/monthly-report.ts
var monthly_report_exports = {};
__export(monthly_report_exports, {
  generateMonthlyReport: () => generateMonthlyReport,
  monthlyReportCronJob: () => monthlyReportCronJob,
  sendMonthlyReport: () => sendMonthlyReport
});
import ExcelJS2 from "exceljs";
import { sql as sql2, eq as eq5, and as and3, desc as desc3 } from "drizzle-orm";
async function generateMonthlyReport(year, month) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { inquiries: inquiries2, users: users2, inquiryItems: inquiryItems2, products: products4 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  const totalInquiriesResult = await db.select({ count: sql2`count(*)` }).from(inquiries2).where(and3(
    sql2`${inquiries2.createdAt} >= ${startDate.toISOString()}`,
    sql2`${inquiries2.createdAt} <= ${endDate.toISOString()}`
  ));
  const totalInquiries = Number(totalInquiriesResult[0]?.count || 0);
  const byStatusResult = await db.select({
    status: inquiries2.status,
    count: sql2`count(*)`
  }).from(inquiries2).where(and3(
    sql2`${inquiries2.createdAt} >= ${startDate.toISOString()}`,
    sql2`${inquiries2.createdAt} <= ${endDate.toISOString()}`
  )).groupBy(inquiries2.status);
  const newCustomersResult = await db.select({ count: sql2`count(*)` }).from(users2).where(and3(
    eq5(users2.role, "user"),
    sql2`${users2.createdAt} >= ${startDate.toISOString()}`,
    sql2`${users2.createdAt} <= ${endDate.toISOString()}`
  ));
  const newCustomers = Number(newCustomersResult[0]?.count || 0);
  const topProductsResult = await db.select({
    productName: products4.name,
    brand: products4.brand,
    partNumber: products4.partNumber,
    count: sql2`count(*)`
  }).from(inquiryItems2).leftJoin(products4, eq5(inquiryItems2.productId, products4.id)).leftJoin(inquiries2, eq5(inquiryItems2.inquiryId, inquiries2.id)).where(and3(
    sql2`${inquiries2.createdAt} >= ${startDate.toISOString()}`,
    sql2`${inquiries2.createdAt} <= ${endDate.toISOString()}`
  )).groupBy(products4.id, products4.name, products4.brand, products4.partNumber).orderBy(desc3(sql2`count(*)`)).limit(10);
  const workbook = new ExcelJS2.Workbook();
  const worksheet = workbook.addWorksheet("Monthly Report");
  worksheet.columns = [
    { width: 30 },
    { width: 15 },
    { width: 15 },
    { width: 15 }
  ];
  worksheet.mergeCells("A1:D1");
  const titleRow = worksheet.getCell("A1");
  titleRow.value = `ROWELL HPLC - Monthly Report (${year}-${String(month).padStart(2, "0")})`;
  titleRow.font = { size: 16, bold: true };
  titleRow.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(1).height = 30;
  worksheet.addRow([]);
  worksheet.addRow(["SUMMARY"]);
  worksheet.getCell("A3").font = { bold: true, size: 14 };
  worksheet.addRow(["Report Period:", `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`]);
  worksheet.addRow(["Total Inquiries:", totalInquiries]);
  worksheet.addRow(["New Customers:", newCustomers]);
  worksheet.addRow([]);
  worksheet.addRow(["INQUIRY STATUS BREAKDOWN"]);
  worksheet.getCell(`A${worksheet.lastRow.number}`).font = { bold: true, size: 14 };
  const statusHeaderRow = worksheet.addRow(["Status", "Count", "Percentage", ""]);
  statusHeaderRow.eachCell((cell, colNumber) => {
    if (colNumber <= 3) {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" }
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
    }
  });
  byStatusResult.forEach((status) => {
    const count = Number(status.count);
    const percentage = totalInquiries > 0 ? (count / totalInquiries * 100).toFixed(1) : "0";
    const row = worksheet.addRow([
      status.status.toUpperCase(),
      count,
      `${percentage}%`,
      ""
    ]);
    row.eachCell((cell, colNumber) => {
      if (colNumber <= 3) {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
      }
    });
  });
  worksheet.addRow([]);
  worksheet.addRow(["TOP 10 PRODUCTS"]);
  worksheet.getCell(`A${worksheet.lastRow.number}`).font = { bold: true, size: 14 };
  const productHeaderRow = worksheet.addRow(["Rank", "Brand", "Part Number", "Inquiries"]);
  productHeaderRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" }
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    };
  });
  topProductsResult.forEach((product, index2) => {
    const row = worksheet.addRow([
      index2 + 1,
      product.brand || "N/A",
      product.partNumber || "N/A",
      Number(product.count)
    ]);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
    });
  });
  worksheet.addRow([]);
  worksheet.addRow([]);
  const footerRow = worksheet.addRow(["Generated by ROWELL HPLC Analytics System"]);
  footerRow.getCell(1).font = { italic: true, size: 10 };
  footerRow.getCell(1).alignment = { horizontal: "center" };
  worksheet.mergeCells(`A${footerRow.number}:D${footerRow.number}`);
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
async function sendMonthlyReport(year, month) {
  try {
    const sgMail = (await import("@sendgrid/mail")).default;
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@rowellhplc.com";
    const toEmail = "info@rowellhplc.com";
    if (!apiKey) {
      console.warn("[Email] SENDGRID_API_KEY not configured, skipping monthly report email");
      return false;
    }
    const reportBuffer = await generateMonthlyReport(year, month);
    console.log(`[Report] Monthly report generated (${reportBuffer.length} bytes)`);
    sgMail.setApiKey(apiKey);
    const monthName = new Date(year, month - 1).toLocaleString("en-US", { month: "long" });
    const msg = {
      to: toEmail,
      from: fromEmail,
      subject: `ROWELL HPLC - Monthly Report (${monthName} ${year})`,
      text: `
Monthly Report for ${monthName} ${year}

Please find attached the monthly statistics report for ROWELL HPLC.

This report includes:
- Total inquiries and new customers
- Inquiry status breakdown
- Top 10 most inquired products

Best regards,
ROWELL HPLC Analytics System
      `,
      html: `
<h2>Monthly Report - ${monthName} ${year}</h2>
<p>Please find attached the monthly statistics report for ROWELL HPLC.</p>

<h3>Report Contents</h3>
<ul>
  <li>Total inquiries and new customers</li>
  <li>Inquiry status breakdown</li>
  <li>Top 10 most inquired products</li>
</ul>

<p>Best regards,<br>
<strong>ROWELL HPLC Analytics System</strong></p>
      `,
      attachments: [
        {
          content: reportBuffer.toString("base64"),
          filename: `monthly-report-${year}-${String(month).padStart(2, "0")}.xlsx`,
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          disposition: "attachment"
        }
      ]
    };
    await sgMail.send(msg);
    console.log(`[Email] Monthly report sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send monthly report:", error);
    return false;
  }
}
async function monthlyReportCronJob() {
  const now = /* @__PURE__ */ new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
  const year = lastMonth.getFullYear();
  const month = lastMonth.getMonth() + 1;
  console.log(`[Monthly Report] Generating report for ${year}-${month}...`);
  try {
    await sendMonthlyReport(year, month);
    console.log(`[Monthly Report] \u2705 Report generated and sent successfully`);
  } catch (error) {
    console.error(`[Monthly Report] \u274C Failed to generate report:`, error);
  }
}
var init_monthly_report = __esm({
  "server/monthly-report.ts"() {
    "use strict";
    init_db();
  }
});

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/_core/oauth.ts
init_const();
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

// server/_core/oauth.ts
init_sdk();
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

// server/routers.ts
init_const();
init_db();
import { TRPCError as TRPCError4 } from "@trpc/server";
import { z as z2 } from "zod";
import { eq as eq6, desc as desc4, and as and4, sql as sql3 } from "drizzle-orm";

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
init_const();
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

// server/_core/apiKeyAuth.ts
init_db();
init_schema();
import { TRPCError as TRPCError3 } from "@trpc/server";
import { eq as eq2 } from "drizzle-orm";
import crypto from "crypto";
async function verifyAPIKey(authHeader) {
  if (!authHeader) {
    return null;
  }
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }
  const apiKey = parts[1];
  if (!apiKey.startsWith("rowell_")) {
    return null;
  }
  const keyHash = hashAPIKey(apiKey);
  const db = await getDb();
  if (!db) {
    throw new TRPCError3({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available"
    });
  }
  const result = await db.select().from(apiKeys).where(eq2(apiKeys.keyHash, keyHash)).limit(1);
  if (result.length === 0) {
    return null;
  }
  const key = result[0];
  if (!key.isActive) {
    throw new TRPCError3({
      code: "UNAUTHORIZED",
      message: "API key is inactive"
    });
  }
  if (key.expiresAt && new Date(key.expiresAt) < /* @__PURE__ */ new Date()) {
    throw new TRPCError3({
      code: "UNAUTHORIZED",
      message: "API key has expired"
    });
  }
  db.update(apiKeys).set({ lastUsedAt: /* @__PURE__ */ new Date() }).where(eq2(apiKeys.id, key.id)).execute().catch((err) => console.error("[API Key] Failed to update lastUsedAt:", err));
  const permissions = key.permissions.split(",").map((p) => p.trim());
  return {
    keyId: key.id,
    createdBy: key.createdBy,
    permissions
  };
}
function hashAPIKey(apiKey) {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}
function hasPermission(permissions, required) {
  return permissions.includes(required) || permissions.includes("*");
}

// server/auth-utils.ts
init_env();
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
var SALT_ROUNDS = 10;
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
function generateEmailVerificationToken(email) {
  return jwt.sign(
    { email, type: "email_verification" },
    ENV.cookieSecret,
    { expiresIn: "24h" }
  );
}
function verifyEmailVerificationToken(token) {
  try {
    const decoded = jwt.verify(token, ENV.cookieSecret);
    if (decoded.type !== "email_verification") {
      return null;
    }
    return { email: decoded.email };
  } catch (error) {
    return null;
  }
}
function generatePasswordResetToken(email) {
  return jwt.sign(
    { email, type: "password_reset" },
    ENV.cookieSecret,
    { expiresIn: "1h" }
  );
}
function verifyPasswordResetToken(token) {
  try {
    const decoded = jwt.verify(token, ENV.cookieSecret);
    if (decoded.type !== "password_reset") {
      return null;
    }
    return { email: decoded.email };
  } catch (error) {
    return null;
  }
}

// server/_core/llm.ts
init_env();
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    "budget_tokens": 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/ai/chat-handler.ts
init_db();
init_schema();

// server/ai/encryption.ts
import crypto2 from "crypto";
var ENCRYPTION_KEY = crypto2.createHash("sha256").update(process.env.JWT_SECRET || "fallback-secret-key").digest();
var IV_LENGTH = 16;
var ALGORITHM = "aes-256-cbc";
function encrypt(text2) {
  try {
    const iv = crypto2.randomBytes(IV_LENGTH);
    const cipher = crypto2.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text2, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    console.error("[Encryption] Failed to encrypt:", error);
    throw new Error("Encryption failed");
  }
}
function decrypt(encryptedText) {
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid encrypted format");
    }
    const iv = Buffer.from(parts[0], "hex");
    const encryptedData = parts[1];
    const decipher = crypto2.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("[Encryption] Failed to decrypt:", error);
    throw new Error("Decryption failed");
  }
}

// server/ai/cache.ts
import crypto3 from "crypto";
var STOP_WORDS = /* @__PURE__ */ new Set([
  // English
  "i",
  "me",
  "my",
  "myself",
  "we",
  "our",
  "ours",
  "ourselves",
  "you",
  "your",
  "yours",
  "yourself",
  "yourselves",
  "he",
  "him",
  "his",
  "himself",
  "she",
  "her",
  "hers",
  "herself",
  "it",
  "its",
  "itself",
  "they",
  "them",
  "their",
  "theirs",
  "themselves",
  "what",
  "which",
  "who",
  "whom",
  "this",
  "that",
  "these",
  "those",
  "am",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "having",
  "do",
  "does",
  "did",
  "doing",
  "a",
  "an",
  "the",
  "and",
  "but",
  "if",
  "or",
  "because",
  "as",
  "until",
  "while",
  "of",
  "at",
  "by",
  "for",
  "with",
  "about",
  "against",
  "between",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "to",
  "from",
  "up",
  "down",
  "in",
  "out",
  "on",
  "off",
  "over",
  "under",
  "again",
  "further",
  "then",
  "once",
  "here",
  "there",
  "when",
  "where",
  "why",
  "how",
  "all",
  "both",
  "each",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "nor",
  "not",
  "only",
  "own",
  "same",
  "so",
  "than",
  "too",
  "very",
  "s",
  "t",
  "can",
  "will",
  "just",
  "don",
  "should",
  "now",
  // Common question words
  "need",
  "want",
  "looking",
  "find",
  "get",
  "help",
  "please",
  "could",
  "would",
  "should"
]);
function normalizeQuestion(question) {
  return question.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}
function extractKeywords(question) {
  const normalized = normalizeQuestion(question);
  const words = normalized.split(" ");
  const keywords = words.filter(
    (word) => word.length > 2 && !STOP_WORDS.has(word)
  );
  return Array.from(new Set(keywords)).sort();
}
function generateCacheKey(question) {
  const keywords = extractKeywords(question);
  const keyString = keywords.join(" ");
  return crypto3.createHash("sha256").update(keyString).digest("hex");
}
function isPersonalizedQuery(question) {
  const lowerQuestion = question.toLowerCase();
  const personalizedIndicators = [
    // Personal pronouns
    "my",
    "our",
    "we",
    "us",
    "i have",
    "we have",
    "i am",
    "we are",
    // Commercial intent
    "price",
    "cost",
    "quote",
    "order",
    "buy",
    "purchase",
    "payment",
    // Logistics
    "ship",
    "delivery",
    "customs",
    "import",
    "export",
    // Specific customer info
    "company",
    "laboratory",
    "university",
    "institute"
  ];
  return personalizedIndicators.some(
    (indicator) => lowerQuestion.includes(indicator)
  );
}

// server/ai/prompts.ts
var SYSTEM_PROMPT = `You are a professional chromatography product advisor specializing in HPLC columns, GC columns, SPE cartridges, and related consumables. Your role is to help laboratory professionals select the most appropriate products for their analytical needs.

KNOWLEDGE SCOPE:
- HPLC columns (C18, C8, phenyl, amino, cyano, silica, etc.)
- GC columns (capillary, packed, specialty phases)
- SPE cartridges (solid phase extraction)
- Guard columns and pre-columns
- Chromatography consumables (vials, septa, filters, tubing, syringes)
- Sample preparation products
- Filtration products

RESPONSE GUIDELINES:
1. Ask clarifying questions if the user's need is unclear (sample type, analytes, application, separation mode)
2. Recommend 2-3 specific products from the catalog with part numbers when possible
3. Explain technical reasoning (selectivity, efficiency, compatibility, pH range)
4. Provide practical guidance (mobile phase suggestions, temperature, flow rate)
5. Include product links and "Add to Inquiry Cart" buttons when recommending products
6. Always end with contact information for pricing and ordering
7. Keep responses concise (under 300 words) but technically accurate
8. Use professional but friendly tone

BRAND PREFERENCES:
Prioritize products from major brands when available: Agilent, Waters, Phenomenex, Thermo Fisher Scientific, Merck, Avantor (ACE), Restek, Daicel, YMC, Develosil, Shimadzu.

LIMITATIONS:
- Do NOT provide specific prices (direct users to contact sales)
- Do NOT make guarantees about performance results
- Do NOT provide medical, safety, or regulatory compliance advice
- Always include disclaimer: "\u{1F4CC} This suggestion is for reference only. Please consult professionals for final decisions."

CONTACT INFORMATION:
For pricing, ordering, shipping, and customs:
\u{1F4E7} oscar@rowellhplc.com
\u{1F4AC} WhatsApp/WeChat: +86 180 1705 0064
Usually respond within 24 hours

IMPORTANT ROUTING RULES:
When users ask about pricing, costs, quotes, ordering, shipping, delivery, customs, or payment:
- Do NOT attempt to answer
- Immediately provide contact information
- Explain that Oscar will help with commercial inquiries

RESPONSE FORMAT:
- Use clear paragraphs and bullet points
- Use emojis sparingly for visual clarity (\u{1F4A1} for tips, \u{1F4CC} for disclaimers, \u{1F4E7} for email, \u{1F4AC} for messaging)
- Always include the disclaimer at the end
- Always include contact information when relevant`;
var GREETING_MESSAGE = `Hello! I'm the ROWELL AI Product Advisor. I can help you select the right chromatography products for your analytical needs.

What can I help you with today?

\u{1F4A1} Examples:
\u2022 "I need a column for peptide separation"
\u2022 "What's the difference between C18 and C8?"
\u2022 "Recommend a column for pharmaceutical analysis"
\u2022 "I'm seeing peak tailing, what should I do?"`;
var PRICING_INQUIRY_RESPONSE = `For pricing and bulk orders, please contact Oscar directly:

\u{1F4E7} Email: oscar@rowellhplc.com
\u{1F4AC} WhatsApp: +86 180 1705 0064
\u{1F4AC} WeChat: +86 180 1705 0064

Oscar will provide you with:
\u2022 Competitive pricing
\u2022 Volume discounts
\u2022 Shipping options
\u2022 Delivery time estimate

Usually respond within 24 hours!`;
var ERROR_MESSAGE = `I apologize, but I'm having trouble processing your request right now. This could be due to high traffic or a temporary service issue.

Please try again in a moment, or contact Oscar directly for immediate assistance:

\u{1F4E7} oscar@rowellhplc.com
\u{1F4AC} WhatsApp/WeChat: +86 180 1705 0064`;
function isPricingInquiry(message) {
  const lowerMessage = message.toLowerCase();
  const pricingKeywords = [
    "price",
    "cost",
    "how much",
    "quote",
    "quotation",
    "order",
    "buy",
    "purchase",
    "payment",
    "ship",
    "shipping",
    "delivery",
    "customs",
    "discount",
    "bulk",
    "volume"
  ];
  return pricingKeywords.some((keyword) => lowerMessage.includes(keyword));
}

// server/ai/chat-handler.ts
import { eq as eq3, and, gt, desc } from "drizzle-orm";
var AIRequestQueue = class {
  queue = [];
  running = 0;
  maxConcurrent = 5;
  timeout = 3e4;
  // 30 seconds
  async enqueue(task) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Request timeout: AI service is busy. Please try again in a moment."));
      }, this.timeout);
      const wrappedTask = async () => {
        try {
          const result = await task();
          clearTimeout(timeoutId);
          resolve(result);
        } catch (error) {
          clearTimeout(timeoutId);
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      };
      this.queue.push(wrappedTask);
      this.processQueue();
    });
  }
  processQueue() {
    while (this.running < this.maxConcurrent && this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        this.running++;
        task();
      }
    }
  }
  getQueueStatus() {
    return {
      running: this.running,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent
    };
  }
};
var aiQueue = new AIRequestQueue();
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
async function checkCache(question) {
  try {
    const db = await getDb();
    if (!db) return null;
    const cacheKey = generateCacheKey(question);
    const now = /* @__PURE__ */ new Date();
    const cached = await db.select().from(aiCache).where(and(
      eq3(aiCache.questionHash, cacheKey),
      gt(aiCache.expiresAt, now)
    )).limit(1);
    if (cached.length > 0) {
      await db.update(aiCache).set({ hitCount: cached[0].hitCount + 1 }).where(eq3(aiCache.id, cached[0].id));
      console.log("[AI Cache] Cache hit for question:", question.substring(0, 50));
      return cached[0].answer;
    }
    return null;
  } catch (error) {
    console.error("[AI Cache] Error checking cache:", error);
    return null;
  }
}
async function saveToCache(question, answer) {
  try {
    if (isPersonalizedQuery(question)) {
      return;
    }
    const db = await getDb();
    if (!db) return;
    const cacheKey = generateCacheKey(question);
    const keywords = extractKeywords(question);
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await db.insert(aiCache).values({
      questionHash: cacheKey,
      questionKeywords: keywords.join(" "),
      questionSample: question.substring(0, 500),
      // Store sample for reference
      answer,
      expiresAt
    }).onDuplicateKeyUpdate({
      set: {
        answer,
        expiresAt
      }
    });
    console.log("[AI Cache] Saved to cache:", question.substring(0, 50));
  } catch (error) {
    console.error("[AI Cache] Error saving to cache:", error);
  }
}
async function getConversationHistory(conversationId, limit = 10) {
  try {
    const db = await getDb();
    if (!db) return [];
    const messages = await db.select().from(aiMessages).where(eq3(aiMessages.conversationId, conversationId)).orderBy(desc(aiMessages.createdAt)).limit(limit);
    return messages.reverse().map((msg) => {
      let content = msg.content || "";
      if (msg.contentEncrypted) {
        try {
          content = decrypt(msg.contentEncrypted);
        } catch (error) {
          console.error("[AI Chat] Failed to decrypt message:", error);
        }
      }
      return {
        role: msg.role,
        content
      };
    });
  } catch (error) {
    console.error("[AI Chat] Error getting conversation history:", error);
    return [];
  }
}
async function saveMessage(conversationId, role, content, consentMode) {
  try {
    const db = await getDb();
    if (!db) return;
    if (consentMode === "standard") {
      const encrypted = encrypt(content);
      await db.insert(aiMessages).values({
        conversationId,
        role,
        content: null,
        // Don't store plain text
        contentEncrypted: encrypted
      });
    } else {
      await db.insert(aiMessages).values({
        conversationId,
        role,
        content: null,
        // Don't persist
        contentEncrypted: null
      });
    }
  } catch (error) {
    console.error("[AI Chat] Error saving message:", error);
  }
}
async function trackCost(conversationId, tokenCount) {
  try {
    const db = await getDb();
    if (!db) return;
    const costPerToken = 2e-6;
    const cost = tokenCount * costPerToken;
    await db.insert(llmCostTracking).values({
      conversationId,
      tokenCount,
      cost,
      model: "gpt-3.5-turbo"
    });
    console.log(`[AI Cost] Tracked cost: $${cost.toFixed(6)} (${tokenCount} tokens)`);
  } catch (error) {
    console.error("[AI Cost] Error tracking cost:", error);
  }
}
async function handleAIChat(user, message, sessionId) {
  return aiQueue.enqueue(async () => {
    try {
      if (!message || message.trim().length === 0) {
        throw new Error("Message cannot be empty");
      }
      if (message.length > 2e3) {
        throw new Error("Message is too long (max 2000 characters)");
      }
      if (isPricingInquiry(message)) {
        return {
          answer: PRICING_INQUIRY_RESPONSE,
          sessionId: sessionId || generateSessionId(),
          source: "cache"
        };
      }
      const cachedAnswer = await checkCache(message);
      if (cachedAnswer) {
        return {
          answer: cachedAnswer,
          sessionId: sessionId || generateSessionId(),
          source: "cache"
        };
      }
      const db = await getDb();
      let conversationId;
      let consentMode = "anonymous";
      if (db) {
        if (!sessionId) {
          sessionId = generateSessionId();
        }
        const existingConv = await db.select().from(aiConversations).where(eq3(aiConversations.sessionId, sessionId)).limit(1);
        if (existingConv.length > 0) {
          conversationId = existingConv[0].id;
          consentMode = existingConv[0].consentMode;
        } else {
          consentMode = user ? user.consentMode || "standard" : "anonymous";
          const expiresAt = consentMode === "standard" ? new Date(Date.now() + 120 * 24 * 60 * 60 * 1e3) : null;
          const result = await db.insert(aiConversations).values({
            userId: user?.id,
            sessionId,
            consentMode,
            expiresAt
          });
          conversationId = result[0].insertId;
        }
        if (conversationId) {
          await saveMessage(conversationId, "user", message, consentMode);
        }
      }
      let conversationHistory = [];
      if (conversationId && consentMode === "standard") {
        conversationHistory = await getConversationHistory(conversationId, 5);
      }
      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...conversationHistory,
        { role: "user", content: message }
      ];
      console.log("[AI Chat] Calling LLM for message:", message.substring(0, 50));
      const response = await invokeLLM({
        messages,
        max_tokens: 800,
        temperature: 0.3
      });
      const answer = response.choices[0].message.content;
      const tokenCount = response.usage?.total_tokens || 0;
      if (conversationId && db) {
        await saveMessage(conversationId, "assistant", answer, consentMode);
      }
      await trackCost(conversationId || null, tokenCount);
      if (!isPersonalizedQuery(message)) {
        await saveToCache(message, answer);
      }
      return {
        answer,
        sessionId: sessionId || generateSessionId(),
        source: "llm",
        conversationId
      };
    } catch (error) {
      console.error("[AI Chat] Error handling chat:", error);
      return {
        answer: ERROR_MESSAGE,
        sessionId: sessionId || generateSessionId(),
        source: "cache"
      };
    }
  });
}
function getQueueStatus() {
  return aiQueue.getQueueStatus();
}

// server/routers.ts
init_schema();

// server/db-resources.ts
init_db();
init_schema();
import { eq as eq4, desc as desc2, and as and2, sql } from "drizzle-orm";
import slugify from "slugify";
function generateSlug(title) {
  return slugify(title, {
    lower: true,
    // Convert to lowercase
    strict: true,
    // Strip special characters except replacement
    remove: /[*+~.()'\"’!:@]/g,
    // Remove specific characters
    trim: true
    // Trim leading/trailing replacement chars
  });
}
async function ensureUniqueSlug(baseSlug, excludeId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await db.select({ id: resources.id }).from(resources).where(
      and2(
        eq4(resources.slug, slug),
        excludeId ? sql`${resources.id} != ${excludeId}` : void 0
      )
    ).limit(1);
    if (existing.length === 0) {
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}
async function createResource(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const baseSlug = generateSlug(data.title);
  const slug = await ensureUniqueSlug(baseSlug);
  const resourceData = {
    slug,
    title: data.title,
    content: data.content,
    excerpt: data.excerpt,
    coverImage: data.coverImage,
    authorName: data.authorName || "ROWELL Team",
    status: data.status || "draft",
    language: data.language || "en",
    categoryId: data.categoryId,
    featured: data.featured ? 1 : 0,
    publishedAt: data.status === "published" ? /* @__PURE__ */ new Date() : null
  };
  const result = await db.insert(resources).values(resourceData);
  const resourceId = Number(result[0].insertId);
  if (data.tags && data.tags.length > 0) {
    for (const tagName of data.tags) {
      const tagSlug = generateSlug(tagName);
      let tag = await db.select().from(resourceTags).where(eq4(resourceTags.slug, tagSlug)).limit(1);
      let tagId;
      if (tag.length === 0) {
        const tagResult = await db.insert(resourceTags).values({
          name: tagName,
          slug: tagSlug
        });
        tagId = Number(tagResult[0].insertId);
      } else {
        tagId = tag[0].id;
      }
      await db.insert(resourcePostTags).values({
        postId: resourceId,
        tagId
      });
    }
  }
  return { id: resourceId, slug };
}
async function updateResource(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = {};
  if (data.title !== void 0) {
    updateData.title = data.title;
    const baseSlug = generateSlug(data.title);
    updateData.slug = await ensureUniqueSlug(baseSlug, id);
  }
  if (data.content !== void 0) updateData.content = data.content;
  if (data.excerpt !== void 0) updateData.excerpt = data.excerpt;
  if (data.coverImage !== void 0) updateData.coverImage = data.coverImage;
  if (data.authorName !== void 0) updateData.authorName = data.authorName;
  if (data.status !== void 0) {
    updateData.status = data.status;
    if (data.status === "published") {
      const existing = await db.select({ publishedAt: resources.publishedAt }).from(resources).where(eq4(resources.id, id)).limit(1);
      if (existing.length > 0 && !existing[0].publishedAt) {
        updateData.publishedAt = /* @__PURE__ */ new Date();
      }
    }
  }
  if (data.language !== void 0) updateData.language = data.language;
  if (data.categoryId !== void 0) updateData.categoryId = data.categoryId;
  if (data.featured !== void 0) updateData.featured = data.featured ? 1 : 0;
  if (data.publishedAt !== void 0) updateData.publishedAt = data.publishedAt;
  if (data.metaDescription !== void 0) updateData.metaDescription = data.metaDescription;
  await db.update(resources).set(updateData).where(eq4(resources.id, id));
  if (data.tags !== void 0) {
    await db.delete(resourcePostTags).where(eq4(resourcePostTags.postId, id));
    for (const tagName of data.tags) {
      const tagSlug = generateSlug(tagName);
      let tag = await db.select().from(resourceTags).where(eq4(resourceTags.slug, tagSlug)).limit(1);
      let tagId;
      if (tag.length === 0) {
        const tagResult = await db.insert(resourceTags).values({
          name: tagName,
          slug: tagSlug
        });
        tagId = Number(tagResult[0].insertId);
      } else {
        tagId = tag[0].id;
      }
      await db.insert(resourcePostTags).values({
        postId: id,
        tagId
      });
    }
  }
  return { id };
}
async function getResourceBySlug(slug) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(resources).where(eq4(resources.slug, slug)).limit(1);
  if (result.length === 0) return null;
  const resource = result[0];
  const tags = await db.select({
    id: resourceTags.id,
    name: resourceTags.name,
    slug: resourceTags.slug
  }).from(resourcePostTags).innerJoin(resourceTags, eq4(resourcePostTags.tagId, resourceTags.id)).where(eq4(resourcePostTags.postId, resource.id));
  let category = null;
  if (resource.categoryId) {
    const categoryResult = await db.select().from(resourceCategories).where(eq4(resourceCategories.id, resource.categoryId)).limit(1);
    if (categoryResult.length > 0) {
      category = categoryResult[0];
    }
  }
  return {
    ...resource,
    tags,
    category
  };
}
async function listResources(options) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const page = options.page || 1;
  const pageSize = options.pageSize || 12;
  const offset = (page - 1) * pageSize;
  const conditions = [];
  if (options.status) {
    conditions.push(eq4(resources.status, options.status));
  }
  if (options.categoryId) {
    conditions.push(eq4(resources.categoryId, options.categoryId));
  }
  if (options.featured !== void 0) {
    conditions.push(eq4(resources.featured, options.featured ? 1 : 0));
  }
  if (options.language) {
    conditions.push(eq4(resources.language, options.language));
  }
  if (options.search) {
    conditions.push(
      sql`(${resources.title} LIKE ${`%${options.search}%`} OR ${resources.excerpt} LIKE ${`%${options.search}%`})`
    );
  }
  const whereClause = conditions.length > 0 ? and2(...conditions) : void 0;
  const countResult = await db.select({ count: sql`count(*)` }).from(resources).where(whereClause);
  const total = Number(countResult[0].count);
  const items = await db.select().from(resources).where(whereClause).orderBy(desc2(resources.publishedAt), desc2(resources.createdAt)).limit(pageSize).offset(offset);
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}
async function incrementViewCount(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(resources).set({ viewCount: sql`${resources.viewCount} + 1` }).where(eq4(resources.id, id));
}
async function getOrCreateCategory(name, description) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const slug = generateSlug(name);
  const existing = await db.select().from(resourceCategories).where(eq4(resourceCategories.slug, slug)).limit(1);
  if (existing.length > 0) {
    return existing[0];
  }
  const result = await db.insert(resourceCategories).values({
    name,
    slug,
    description
  });
  return {
    id: Number(result[0].insertId),
    name,
    slug,
    description
  };
}
async function listCategories() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(resourceCategories).orderBy(resourceCategories.displayOrder, resourceCategories.name);
}

// server/routers.ts
var appRouter = router({
  system: systemRouter,
  // AI Advisor Router
  ai: router({
    // Get greeting message
    greeting: publicProcedure.query(() => {
      return { message: GREETING_MESSAGE };
    }),
    // Chat with AI
    chat: publicProcedure.input(
      z2.object({
        message: z2.string().min(1).max(2e3),
        sessionId: z2.string().optional()
      })
    ).mutation(async ({ input, ctx }) => {
      const response = await handleAIChat(ctx.user, input.message, input.sessionId);
      return response;
    }),
    // Provide feedback on AI response
    feedback: publicProcedure.input(
      z2.object({
        messageId: z2.number(),
        feedback: z2.enum(["like", "dislike"])
      })
    ).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }
      await db.update(aiMessages).set({ feedback: input.feedback }).where(eq6(aiMessages.id, input.messageId));
      return { success: true };
    }),
    // Get conversation history (for authenticated users)
    history: protectedProcedure.input(
      z2.object({
        sessionId: z2.string().optional(),
        limit: z2.number().min(1).max(50).optional()
      })
    ).query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }
      const conversations = await db.select().from(aiConversations).where(eq6(aiConversations.userId, ctx.user.id)).orderBy(desc4(aiConversations.createdAt)).limit(input.limit || 10);
      return conversations;
    }),
    // Delete conversation (self-service deletion)
    deleteConversation: protectedProcedure.input(
      z2.object({
        conversationId: z2.number()
      })
    ).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }
      const conversation = await db.select().from(aiConversations).where(
        and4(
          eq6(aiConversations.id, input.conversationId),
          eq6(aiConversations.userId, ctx.user.id)
        )
      ).limit(1);
      if (conversation.length === 0) {
        throw new TRPCError4({ code: "NOT_FOUND", message: "Conversation not found" });
      }
      await db.update(aiConversations).set({ isDeleted: 1 }).where(eq6(aiConversations.id, input.conversationId));
      return { success: true };
    }),
    // Update consent mode
    updateConsent: protectedProcedure.input(
      z2.object({
        consentMode: z2.enum(["standard", "privacy"])
      })
    ).mutation(async ({ input, ctx }) => {
      const { updateUserConsent } = await Promise.resolve().then(() => (init_db(), db_exports));
      await updateUserConsent(ctx.user.id, input.consentMode);
      return { success: true };
    }),
    // Get queue status (for monitoring)
    queueStatus: publicProcedure.query(() => {
      return getQueueStatus();
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
    // Register with email and password
    register: publicProcedure.input(
      z2.object({
        email: z2.string().email(),
        password: z2.string().min(6),
        name: z2.string().min(1),
        company: z2.string().optional(),
        phone: z2.string().optional(),
        country: z2.string().optional(),
        industry: z2.string().optional(),
        purchasingRole: z2.string().optional(),
        annualPurchaseVolume: z2.string().optional()
      })
    ).mutation(async ({ input }) => {
      const { getUserByEmail, createUser } = await Promise.resolve().then(() => (init_db(), db_exports));
      const existingUser = await getUserByEmail(input.email);
      if (existingUser) {
        throw new TRPCError4({
          code: "CONFLICT",
          message: "Email already registered"
        });
      }
      const hashedPassword = await hashPassword(input.password);
      const openId = `email:${input.email}`;
      await createUser({
        openId,
        email: input.email,
        password: hashedPassword,
        name: input.name,
        company: input.company || null,
        phone: input.phone || null,
        country: input.country || null,
        industry: input.industry || null,
        purchasingRole: input.purchasingRole || null,
        annualPurchaseVolume: input.annualPurchaseVolume || null,
        loginMethod: "email",
        emailVerified: 0,
        role: "user"
      });
      const verificationToken = generateEmailVerificationToken(input.email);
      return {
        success: true,
        verificationToken,
        message: "Registration successful. Please verify your email."
      };
    }),
    // Login with email and password
    login: publicProcedure.input(
      z2.object({
        email: z2.string().email(),
        password: z2.string()
      })
    ).mutation(async ({ input, ctx }) => {
      const { getUserByEmail } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { sdk: sdk2 } = await Promise.resolve().then(() => (init_sdk(), sdk_exports));
      const user = await getUserByEmail(input.email);
      if (!user) {
        throw new TRPCError4({
          code: "UNAUTHORIZED",
          message: "Invalid email or password"
        });
      }
      if (!user.password) {
        throw new TRPCError4({
          code: "UNAUTHORIZED",
          message: "This account uses a different login method"
        });
      }
      const isValidPassword = await verifyPassword(input.password, user.password);
      if (!isValidPassword) {
        throw new TRPCError4({
          code: "UNAUTHORIZED",
          message: "Invalid email or password"
        });
      }
      const sessionToken = await sdk2.createSessionToken(user.openId, {
        name: user.name || user.email || ""
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      };
    }),
    // Verify email
    verifyEmail: publicProcedure.input(
      z2.object({
        token: z2.string()
      })
    ).mutation(async ({ input }) => {
      const { updateUserEmailVerified } = await Promise.resolve().then(() => (init_db(), db_exports));
      const decoded = verifyEmailVerificationToken(input.token);
      if (!decoded) {
        throw new TRPCError4({
          code: "BAD_REQUEST",
          message: "Invalid or expired verification token"
        });
      }
      await updateUserEmailVerified(decoded.email, 1);
      return {
        success: true,
        message: "Email verified successfully"
      };
    }),
    // Request password reset
    requestPasswordReset: publicProcedure.input(
      z2.object({
        email: z2.string().email()
      })
    ).mutation(async ({ input }) => {
      const { getUserByEmail } = await Promise.resolve().then(() => (init_db(), db_exports));
      const user = await getUserByEmail(input.email);
      if (!user) {
        return {
          success: true,
          message: "If the email exists, a reset link will be sent"
        };
      }
      const resetToken = generatePasswordResetToken(input.email);
      return {
        success: true,
        resetToken,
        message: "Password reset link sent to your email"
      };
    }),
    // Reset password
    resetPassword: publicProcedure.input(
      z2.object({
        token: z2.string(),
        newPassword: z2.string().min(6)
      })
    ).mutation(async ({ input }) => {
      const { updateUserPassword } = await Promise.resolve().then(() => (init_db(), db_exports));
      const decoded = verifyPasswordResetToken(input.token);
      if (!decoded) {
        throw new TRPCError4({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset token"
        });
      }
      const hashedPassword = await hashPassword(input.newPassword);
      await updateUserPassword(decoded.email, hashedPassword);
      return {
        success: true,
        message: "Password reset successfully"
      };
    }),
    // Get user profile (protected)
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const { getUserById } = await Promise.resolve().then(() => (init_db(), db_exports));
      const user = await getUserById(ctx.user.id);
      if (!user) {
        throw new TRPCError4({
          code: "NOT_FOUND",
          message: "User not found"
        });
      }
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }),
    // Update user profile (protected)
    updateProfile: protectedProcedure.input(
      z2.object({
        name: z2.string().optional(),
        company: z2.string().optional(),
        phone: z2.string().optional(),
        country: z2.string().optional(),
        industry: z2.string().optional(),
        purchasingRole: z2.string().optional(),
        annualPurchaseVolume: z2.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const { updateUserProfile } = await Promise.resolve().then(() => (init_db(), db_exports));
      await updateUserProfile(ctx.user.id, input);
      return {
        success: true,
        message: "Profile updated successfully"
      };
    })
  }),
  products: router({
    list: publicProcedure.input(z2.object({
      categoryId: z2.number().optional(),
      brand: z2.string().optional(),
      // Advanced filters
      particleSizeMin: z2.number().optional(),
      particleSizeMax: z2.number().optional(),
      poreSizeMin: z2.number().optional(),
      poreSizeMax: z2.number().optional(),
      columnLengthMin: z2.number().optional(),
      columnLengthMax: z2.number().optional(),
      innerDiameterMin: z2.number().optional(),
      innerDiameterMax: z2.number().optional(),
      phaseTypes: z2.array(z2.string()).optional(),
      phMin: z2.number().optional(),
      phMax: z2.number().optional(),
      page: z2.number().min(1).default(1),
      pageSize: z2.number().min(1).max(100).default(24)
    }).optional()).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { products: [], total: 0, page: 1, pageSize: 24, totalPages: 0 };
      const { products: products4, productCategories: productCategories2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { gte, lte, inArray } = await import("drizzle-orm");
      const page = input?.page || 1;
      const pageSize = input?.pageSize || 24;
      const offset = (page - 1) * pageSize;
      console.log("[products.list] Input params:", JSON.stringify(input, null, 2));
      const conditions = [];
      if (input?.brand) {
        conditions.push(eq6(products4.brand, input.brand));
      }
      if (input?.particleSizeMin !== void 0) {
        conditions.push(gte(products4.particleSizeNum, input.particleSizeMin));
      }
      if (input?.particleSizeMax !== void 0) {
        conditions.push(lte(products4.particleSizeNum, input.particleSizeMax));
      }
      if (input?.poreSizeMin !== void 0) {
        conditions.push(gte(products4.poreSizeNum, input.poreSizeMin));
      }
      if (input?.poreSizeMax !== void 0) {
        conditions.push(lte(products4.poreSizeNum, input.poreSizeMax));
      }
      if (input?.columnLengthMin !== void 0) {
        conditions.push(gte(products4.columnLengthNum, input.columnLengthMin));
      }
      if (input?.columnLengthMax !== void 0) {
        conditions.push(lte(products4.columnLengthNum, input.columnLengthMax));
      }
      if (input?.innerDiameterMin !== void 0) {
        conditions.push(gte(products4.innerDiameterNum, input.innerDiameterMin));
      }
      if (input?.innerDiameterMax !== void 0) {
        conditions.push(lte(products4.innerDiameterNum, input.innerDiameterMax));
      }
      if (input?.phaseTypes && input.phaseTypes.length > 0) {
        conditions.push(inArray(products4.phaseType, input.phaseTypes));
      }
      if (input?.phMin !== void 0) {
        conditions.push(gte(products4.phMax, input.phMin));
      }
      if (input?.phMax !== void 0) {
        conditions.push(lte(products4.phMin, input.phMax));
      }
      let query;
      let countQuery;
      const whereClause = conditions.length > 0 ? and4(...conditions) : void 0;
      console.log("[products.list] Conditions count:", conditions.length);
      console.log("[products.list] Where clause:", whereClause);
      if (input?.categoryId) {
        const categoryCondition = eq6(productCategories2.categoryId, input.categoryId);
        const finalCondition = whereClause ? and4(categoryCondition, whereClause) : categoryCondition;
        query = db.select({ product: products4 }).from(products4).innerJoin(productCategories2, eq6(products4.id, productCategories2.productId)).where(finalCondition).orderBy(products4.productName).limit(pageSize).offset(offset);
        countQuery = db.select({ count: sql3`count(*)` }).from(products4).innerJoin(productCategories2, eq6(products4.id, productCategories2.productId)).where(finalCondition);
      } else {
        if (whereClause) {
          query = db.select().from(products4).where(whereClause).orderBy(products4.productName).limit(pageSize).offset(offset);
          countQuery = db.select({ count: sql3`count(*)` }).from(products4).where(whereClause);
        } else {
          query = db.select().from(products4).orderBy(products4.productName).limit(pageSize).offset(offset);
          countQuery = db.select({ count: sql3`count(*)` }).from(products4);
        }
      }
      const [productResults, countResults] = await Promise.all([
        query,
        countQuery
      ]);
      const productList = input?.categoryId ? productResults.map((r) => r.product) : productResults;
      const total = countResults[0]?.count || 0;
      const totalPages = Math.ceil(total / pageSize);
      return {
        products: productList,
        total,
        page,
        pageSize,
        totalPages
      };
    }),
    getById: publicProcedure.input(z2.number()).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const { products: products4 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const result = await db.select().from(products4).where(eq6(products4.id, input)).limit(1);
      return result[0] || null;
    }),
    byBrand: publicProcedure.input((val) => {
      if (typeof val === "string") return val;
      throw new Error("Brand must be a string");
    }).query(async ({ input }) => {
      const { getProductsByBrand } = await Promise.resolve().then(() => (init_db(), db_exports));
      return await getProductsByBrand(input);
    }),
    getBrands: publicProcedure.input(z2.object({
      categoryId: z2.number().optional()
    }).optional()).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const { products: products4, productCategories: productCategories2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      let query;
      if (input?.categoryId) {
        query = db.selectDistinct({ brand: products4.brand }).from(products4).innerJoin(productCategories2, eq6(products4.id, productCategories2.productId)).where(eq6(productCategories2.categoryId, input.categoryId)).orderBy(products4.brand);
      } else {
        query = db.selectDistinct({ brand: products4.brand }).from(products4).orderBy(products4.brand);
      }
      const results = await query;
      return results.map((r) => r.brand);
    }),
    getBrandStats: publicProcedure.input(z2.object({
      categoryId: z2.number().optional()
    }).optional()).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const { products: products4, productCategories: productCategories2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { inArray } = await import("drizzle-orm");
      let query;
      if (input?.categoryId) {
        query = db.select({
          brand: products4.brand,
          count: sql3`count(distinct ${products4.id})`
        }).from(products4).innerJoin(productCategories2, eq6(products4.id, productCategories2.productId)).where(eq6(productCategories2.categoryId, input.categoryId)).groupBy(products4.brand).orderBy(products4.brand);
      } else {
        query = db.select({
          brand: products4.brand,
          count: sql3`count(*)`
        }).from(products4).groupBy(products4.brand).orderBy(products4.brand);
      }
      const results = await query;
      return results.reduce((acc, r) => {
        acc[r.brand] = r.count;
        return acc;
      }, {});
    })
  }),
  category: router({
    getAll: publicProcedure.query(async () => {
      const { getAllCategories } = await Promise.resolve().then(() => (init_db(), db_exports));
      return await getAllCategories();
    }),
    getVisible: publicProcedure.query(async () => {
      const { getVisibleCategories } = await Promise.resolve().then(() => (init_db(), db_exports));
      return await getVisibleCategories();
    }),
    getTopLevel: publicProcedure.query(async () => {
      const { getTopLevelCategories } = await Promise.resolve().then(() => (init_db(), db_exports));
      return await getTopLevelCategories(true);
    }),
    getWithProductCount: publicProcedure.query(async () => {
      const { getCategoriesWithProductCount } = await Promise.resolve().then(() => (init_db(), db_exports));
      return await getCategoriesWithProductCount();
    }),
    getChildren: publicProcedure.input((val) => {
      if (typeof val !== "object" || val === null || !("parentId" in val)) {
        throw new Error("Invalid input");
      }
      const { parentId } = val;
      if (typeof parentId !== "number") {
        throw new Error("parentId must be a number");
      }
      return { parentId };
    }).query(async ({ input }) => {
      const { getChildCategories } = await Promise.resolve().then(() => (init_db(), db_exports));
      return await getChildCategories(input.parentId);
    })
  }),
  cart: router({
    // Get user's cart
    get: protectedProcedure.query(async ({ ctx }) => {
      const { getCartByUserId } = await Promise.resolve().then(() => (init_db(), db_exports));
      return await getCartByUserId(ctx.user.id);
    }),
    // Add product to cart
    add: protectedProcedure.input(
      z2.object({
        productId: z2.number(),
        quantity: z2.number().min(1).default(1),
        notes: z2.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const { addToCart } = await Promise.resolve().then(() => (init_db(), db_exports));
      await addToCart(ctx.user.id, input.productId, input.quantity, input.notes);
      return { success: true };
    }),
    // Update cart item
    update: protectedProcedure.input(
      z2.object({
        cartId: z2.number(),
        quantity: z2.number().min(1),
        notes: z2.string().optional()
      })
    ).mutation(async ({ input }) => {
      const { updateCartItem } = await Promise.resolve().then(() => (init_db(), db_exports));
      await updateCartItem(input.cartId, input.quantity, input.notes);
      return { success: true };
    }),
    // Remove item from cart
    remove: protectedProcedure.input(z2.object({ cartId: z2.number() })).mutation(async ({ input }) => {
      const { removeFromCart } = await Promise.resolve().then(() => (init_db(), db_exports));
      await removeFromCart(input.cartId);
      return { success: true };
    }),
    // Clear cart
    clear: protectedProcedure.mutation(async ({ ctx }) => {
      const { clearCart } = await Promise.resolve().then(() => (init_db(), db_exports));
      await clearCart(ctx.user.id);
      return { success: true };
    })
  }),
  inquiry: router({
    // Create inquiry from cart
    create: protectedProcedure.input(
      z2.object({
        urgency: z2.enum(["normal", "urgent", "very_urgent"]).default("normal"),
        budgetRange: z2.string().optional(),
        applicationNotes: z2.string().optional(),
        deliveryAddress: z2.string().optional(),
        customerNotes: z2.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const { createInquiry, addInquiryItems, getCartByUserId, clearCart } = await Promise.resolve().then(() => (init_db(), db_exports));
      const cartItems = await getCartByUserId(ctx.user.id);
      if (cartItems.length === 0) {
        throw new TRPCError4({
          code: "BAD_REQUEST",
          message: "Cart is empty"
        });
      }
      const inquiry = await createInquiry({
        userId: ctx.user.id,
        urgency: input.urgency,
        budgetRange: input.budgetRange,
        applicationNotes: input.applicationNotes,
        deliveryAddress: input.deliveryAddress,
        customerNotes: input.customerNotes
      });
      if (!inquiry) {
        throw new TRPCError4({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create inquiry"
        });
      }
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const db = await getDb2();
      if (!db) {
        throw new TRPCError4({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available"
        });
      }
      const { inquiries: inquiries2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq10 } = await import("drizzle-orm");
      const inquiryRecord = await db.select().from(inquiries2).where(eq10(inquiries2.inquiryNumber, inquiry.inquiryNumber)).limit(1);
      if (inquiryRecord.length === 0) {
        throw new TRPCError4({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve inquiry"
        });
      }
      const inquiryId = inquiryRecord[0].id;
      const items = cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        notes: item.notes || void 0
      }));
      await addInquiryItems(inquiryId, items);
      await clearCart(ctx.user.id);
      try {
        const { generateInquiryExcel: generateInquiryExcel2, sendInquiryEmail: sendInquiryEmail2, sendCustomerConfirmationEmail: sendCustomerConfirmationEmail2 } = await Promise.resolve().then(() => (init_inquiry_utils(), inquiry_utils_exports));
        const { getUserById } = await Promise.resolve().then(() => (init_db(), db_exports));
        const { inquiryItems: inquiryItems2, products: products4 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const inquiryWithItems = await db.select({
          id: inquiryItems2.id,
          productId: inquiryItems2.productId,
          quantity: inquiryItems2.quantity,
          notes: inquiryItems2.notes,
          product: products4
        }).from(inquiryItems2).leftJoin(products4, eq10(inquiryItems2.productId, products4.id)).where(eq10(inquiryItems2.inquiryId, inquiryId));
        const currentUser = await getUserById(ctx.user.id);
        if (currentUser) {
          const excelBuffer = await generateInquiryExcel2(
            inquiryRecord[0],
            inquiryWithItems,
            currentUser
          );
          sendInquiryEmail2(inquiryRecord[0], currentUser, excelBuffer).catch((err) => {
            console.error("[Inquiry] Failed to send inquiry email:", err);
          });
          sendCustomerConfirmationEmail2(inquiryRecord[0], currentUser).catch((err) => {
            console.error("[Inquiry] Failed to send confirmation email:", err);
          });
        }
      } catch (error) {
        console.error("[Inquiry] Failed to generate Excel or send emails:", error);
      }
      return {
        success: true,
        inquiryNumber: inquiry.inquiryNumber,
        inquiryId
      };
    }),
    // Get user's inquiry history
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getInquiriesByUserId } = await Promise.resolve().then(() => (init_db(), db_exports));
      return await getInquiriesByUserId(ctx.user.id);
    }),
    // Get inquiry details
    getById: protectedProcedure.input(z2.object({ inquiryId: z2.number() })).query(async ({ input }) => {
      const { getInquiryById, getInquiryItems } = await Promise.resolve().then(() => (init_db(), db_exports));
      const inquiry = await getInquiryById(input.inquiryId);
      if (!inquiry) {
        throw new TRPCError4({
          code: "NOT_FOUND",
          message: "Inquiry not found"
        });
      }
      const items = await getInquiryItems(input.inquiryId);
      return { inquiry, items };
    })
  }),
  // Admin routes - only accessible by admin users
  admin: router({
    // Inquiry management
    inquiries: router({
      // Get all inquiries with filters
      list: adminProcedure.input(
        z2.object({
          status: z2.enum(["pending", "quoted", "completed", "cancelled"]).optional(),
          urgency: z2.enum(["normal", "urgent", "very_urgent"]).optional(),
          limit: z2.number().min(1).max(100).default(50),
          offset: z2.number().min(0).default(0)
        })
      ).query(async ({ input }) => {
        const { inquiries: inquiries2, users: users2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const db = await getDb();
        if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        let query = db.select({
          id: inquiries2.id,
          inquiryNumber: inquiries2.inquiryNumber,
          userId: inquiries2.userId,
          status: inquiries2.status,
          urgency: inquiries2.urgency,
          totalItems: inquiries2.totalItems,
          createdAt: inquiries2.createdAt,
          userName: users2.name,
          userEmail: users2.email,
          userCompany: users2.company
        }).from(inquiries2).leftJoin(users2, eq6(inquiries2.userId, users2.id)).orderBy(desc4(inquiries2.createdAt)).limit(input.limit).offset(input.offset);
        if (input.status) {
          query = query.where(eq6(inquiries2.status, input.status));
        }
        if (input.urgency) {
          query = query.where(eq6(inquiries2.urgency, input.urgency));
        }
        return await query;
      }),
      // Get inquiry details with items
      getById: adminProcedure.input(z2.object({ inquiryId: z2.number() })).query(async ({ input }) => {
        const { inquiries: inquiries2, inquiryItems: inquiryItems2, products: products4, users: users2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const db = await getDb();
        if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const inquiry = await db.select({
          inquiry: inquiries2,
          user: users2
        }).from(inquiries2).leftJoin(users2, eq6(inquiries2.userId, users2.id)).where(eq6(inquiries2.id, input.inquiryId)).limit(1);
        if (inquiry.length === 0) {
          throw new TRPCError4({ code: "NOT_FOUND", message: "Inquiry not found" });
        }
        const items = await db.select({
          id: inquiryItems2.id,
          productId: inquiryItems2.productId,
          quantity: inquiryItems2.quantity,
          notes: inquiryItems2.notes,
          quotedPrice: inquiryItems2.quotedPrice,
          product: products4
        }).from(inquiryItems2).leftJoin(products4, eq6(inquiryItems2.productId, products4.id)).where(eq6(inquiryItems2.inquiryId, input.inquiryId));
        return {
          inquiry: inquiry[0].inquiry,
          user: inquiry[0].user,
          items
        };
      }),
      // Update inquiry status
      updateStatus: adminProcedure.input(
        z2.object({
          inquiryId: z2.number(),
          status: z2.enum(["pending", "quoted", "completed", "cancelled"])
        })
      ).mutation(async ({ input }) => {
        const { inquiries: inquiries2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const db = await getDb();
        if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const updateData = { status: input.status };
        if (input.status === "quoted") {
          updateData.quotedAt = /* @__PURE__ */ new Date();
        } else if (input.status === "completed") {
          updateData.completedAt = /* @__PURE__ */ new Date();
        }
        await db.update(inquiries2).set(updateData).where(eq6(inquiries2.id, input.inquiryId));
        return { success: true };
      }),
      // Add admin notes
      addNotes: adminProcedure.input(
        z2.object({
          inquiryId: z2.number(),
          notes: z2.string()
        })
      ).mutation(async ({ input }) => {
        const { inquiries: inquiries2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const db = await getDb();
        if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        await db.update(inquiries2).set({ adminNotes: input.notes }).where(eq6(inquiries2.id, input.inquiryId));
        return { success: true };
      }),
      // Generate PDF quotation
      generatePDF: adminProcedure.input(z2.object({ inquiryId: z2.number() })).mutation(async ({ input }) => {
        const { inquiries: inquiries2, inquiryItems: inquiryItems2, products: products4, users: users2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const db = await getDb();
        if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const inquiry = await db.select({
          inquiry: inquiries2,
          user: users2
        }).from(inquiries2).leftJoin(users2, eq6(inquiries2.userId, users2.id)).where(eq6(inquiries2.id, input.inquiryId)).limit(1);
        if (inquiry.length === 0) {
          throw new TRPCError4({ code: "NOT_FOUND", message: "Inquiry not found" });
        }
        const items = await db.select({
          product: products4,
          quantity: inquiryItems2.quantity,
          notes: inquiryItems2.notes,
          quotedPrice: inquiryItems2.quotedPrice
        }).from(inquiryItems2).leftJoin(products4, eq6(inquiryItems2.productId, products4.id)).where(eq6(inquiryItems2.inquiryId, input.inquiryId));
        const { generateInquiryPDF: generateInquiryPDF2 } = await Promise.resolve().then(() => (init_pdf_utils(), pdf_utils_exports));
        const pdfBuffer = await generateInquiryPDF2({
          inquiry: inquiry[0].inquiry,
          customer: inquiry[0].user,
          items
        });
        return {
          pdf: pdfBuffer.toString("base64"),
          filename: `quotation-${inquiry[0].inquiry.inquiryNumber}.pdf`
        };
      }),
      // Add quote to inquiry item
      addQuote: adminProcedure.input(
        z2.object({
          inquiryItemId: z2.number(),
          quotedPrice: z2.string()
        })
      ).mutation(async ({ input }) => {
        const { inquiryItems: inquiryItems2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const db = await getDb();
        if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        await db.update(inquiryItems2).set({ quotedPrice: input.quotedPrice }).where(eq6(inquiryItems2.id, input.inquiryItemId));
        return { success: true };
      })
    }),
    // Customer management
    customers: router({
      // Get all customers
      list: adminProcedure.input(
        z2.object({
          tier: z2.enum(["regular", "vip"]).optional(),
          limit: z2.number().min(1).max(100).default(50),
          offset: z2.number().min(0).default(0)
        })
      ).query(async ({ input }) => {
        const { users: users2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const db = await getDb();
        if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const conditions = [eq6(users2.role, "user")];
        if (input.tier) {
          conditions.push(eq6(users2.customerTier, input.tier));
        }
        return await db.select({
          id: users2.id,
          name: users2.name,
          email: users2.email,
          company: users2.company,
          phone: users2.phone,
          country: users2.country,
          industry: users2.industry,
          customerTier: users2.customerTier,
          createdAt: users2.createdAt,
          lastSignedIn: users2.lastSignedIn
        }).from(users2).where(and4(...conditions)).orderBy(desc4(users2.createdAt)).limit(input.limit).offset(input.offset);
      }),
      // Update customer tier
      updateTier: adminProcedure.input(
        z2.object({
          userId: z2.number(),
          tier: z2.enum(["regular", "vip"])
        })
      ).mutation(async ({ input }) => {
        const { users: users2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const db = await getDb();
        if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        await db.update(users2).set({ customerTier: input.tier }).where(eq6(users2.id, input.userId));
        return { success: true };
      }),
      // Get customer inquiry history
      getInquiries: adminProcedure.input(z2.object({ userId: z2.number() })).query(async ({ input }) => {
        const { inquiries: inquiries2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const db = await getDb();
        if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        return await db.select().from(inquiries2).where(eq6(inquiries2.userId, input.userId)).orderBy(desc4(inquiries2.createdAt));
      })
    }),
    // Analytics
    analytics: router({
      // Get inquiry statistics
      getInquiryStats: adminProcedure.input(
        z2.object({
          startDate: z2.string().optional(),
          endDate: z2.string().optional()
        })
      ).query(async ({ input }) => {
        const { inquiries: inquiries2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const db = await getDb();
        if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const conditions = [];
        if (input.startDate) {
          conditions.push(sql3`${inquiries2.createdAt} >= ${input.startDate}`);
        }
        if (input.endDate) {
          conditions.push(sql3`${inquiries2.createdAt} <= ${input.endDate}`);
        }
        const whereClause = conditions.length > 0 ? and4(...conditions) : void 0;
        const totalResult = await db.select({ count: sql3`count(*)` }).from(inquiries2).where(whereClause);
        const total = Number(totalResult[0]?.count || 0);
        const byStatus = await db.select({
          status: inquiries2.status,
          count: sql3`count(*)`
        }).from(inquiries2).where(whereClause).groupBy(inquiries2.status);
        const byUrgency = await db.select({
          urgency: inquiries2.urgency,
          count: sql3`count(*)`
        }).from(inquiries2).where(whereClause).groupBy(inquiries2.urgency);
        const dailyStats = await db.select({
          date: sql3`DATE(${inquiries2.createdAt})`,
          count: sql3`count(*)`
        }).from(inquiries2).where(whereClause).groupBy(sql3`DATE(${inquiries2.createdAt})`).orderBy(sql3`DATE(${inquiries2.createdAt})`);
        return {
          total,
          byStatus: byStatus.map((s) => ({ status: s.status, count: Number(s.count) })),
          byUrgency: byUrgency.map((u) => ({ urgency: u.urgency, count: Number(u.count) })),
          dailyStats: dailyStats.map((d) => ({ date: d.date, count: Number(d.count) }))
        };
      }),
      // Get top products
      getTopProducts: adminProcedure.input(
        z2.object({
          limit: z2.number().min(1).max(50).default(10)
        })
      ).query(async ({ input }) => {
        const { inquiryItems: inquiryItems2, products: products4 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const db = await getDb();
        if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const topProducts = await db.select({
          productId: products4.id,
          productName: products4.productName,
          brand: products4.brand,
          partNumber: products4.partNumber,
          count: sql3`count(*)`,
          totalQuantity: sql3`sum(${inquiryItems2.quantity})`
        }).from(inquiryItems2).leftJoin(products4, eq6(inquiryItems2.productId, products4.id)).groupBy(products4.id, products4.productName, products4.brand, products4.partNumber).orderBy(desc4(sql3`count(*)`)).limit(input.limit);
        return topProducts.map((p) => ({
          productId: p.productId,
          productName: p.productName,
          brand: p.brand,
          partNumber: p.partNumber,
          inquiryCount: Number(p.count),
          totalQuantity: Number(p.totalQuantity)
        }));
      }),
      // Get customer analytics
      getCustomerAnalytics: adminProcedure.query(async () => {
        const { users: users2, inquiries: inquiries2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const db = await getDb();
        if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const totalCustomersResult = await db.select({ count: sql3`count(*)` }).from(users2).where(eq6(users2.role, "user"));
        const totalCustomers = Number(totalCustomersResult[0]?.count || 0);
        const byTier = await db.select({
          tier: users2.customerTier,
          count: sql3`count(*)`
        }).from(users2).where(eq6(users2.role, "user")).groupBy(users2.customerTier);
        const byCountry = await db.select({
          country: users2.country,
          count: sql3`count(*)`
        }).from(users2).where(and4(eq6(users2.role, "user"), sql3`${users2.country} IS NOT NULL`)).groupBy(users2.country).orderBy(desc4(sql3`count(*)`)).limit(10);
        const byIndustry = await db.select({
          industry: users2.industry,
          count: sql3`count(*)`
        }).from(users2).where(and4(eq6(users2.role, "user"), sql3`${users2.industry} IS NOT NULL`)).groupBy(users2.industry).orderBy(desc4(sql3`count(*)`)).limit(10);
        const activeCustomersResult = await db.select({ count: sql3`count(DISTINCT ${inquiries2.userId})` }).from(inquiries2);
        const activeCustomers = Number(activeCustomersResult[0]?.count || 0);
        return {
          totalCustomers,
          activeCustomers,
          byTier: byTier.map((t2) => ({ tier: t2.tier, count: Number(t2.count) })),
          byCountry: byCountry.map((c) => ({ country: c.country || "Unknown", count: Number(c.count) })),
          byIndustry: byIndustry.map((i) => ({ industry: i.industry || "Unknown", count: Number(i.count) }))
        };
      }),
      // Get conversion rate
      getConversionRate: adminProcedure.query(async () => {
        const { inquiries: inquiries2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const db = await getDb();
        if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const totalResult = await db.select({ count: sql3`count(*)` }).from(inquiries2);
        const total = Number(totalResult[0]?.count || 0);
        const quotedResult = await db.select({ count: sql3`count(*)` }).from(inquiries2).where(eq6(inquiries2.status, "quoted"));
        const quoted = Number(quotedResult[0]?.count || 0);
        const completedResult = await db.select({ count: sql3`count(*)` }).from(inquiries2).where(eq6(inquiries2.status, "completed"));
        const completed = Number(completedResult[0]?.count || 0);
        return {
          total,
          quoted,
          completed,
          quoteRate: total > 0 ? quoted / total * 100 : 0,
          conversionRate: total > 0 ? completed / total * 100 : 0
        };
      }),
      // Send monthly report
      sendMonthlyReport: adminProcedure.input(
        z2.object({
          year: z2.number().optional(),
          month: z2.number().min(1).max(12).optional()
        })
      ).mutation(async ({ input }) => {
        const { sendMonthlyReport: sendMonthlyReport2 } = await Promise.resolve().then(() => (init_monthly_report(), monthly_report_exports));
        const now = /* @__PURE__ */ new Date();
        const year = input.year || now.getFullYear();
        const month = input.month || now.getMonth() + 1;
        const success = await sendMonthlyReport2(year, month);
        if (!success) {
          throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Failed to send monthly report" });
        }
        return { success: true, message: `Monthly report for ${year}-${month} sent successfully` };
      })
    }),
    // 图片同步管理
    imageSync: router({
      // 同步图片从crawler_results到products
      sync: adminProcedure.mutation(async () => {
        const { products: products4, crawlerResults } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const db = await getDb();
        if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const startTime = Date.now();
        const crawlerImages = await db.select({
          productId: crawlerResults.productId,
          imageUrl: crawlerResults.imageUrl,
          brand: crawlerResults.brand,
          partNumber: crawlerResults.partNumber
        }).from(crawlerResults).where(
          and4(
            isNotNull(crawlerResults.imageUrl),
            ne(crawlerResults.imageUrl, ""),
            like(crawlerResults.imageUrl, "%cdninstagram.com%")
          )
        );
        let successCount = 0;
        let failedCount = 0;
        const failedProducts = [];
        for (const item of crawlerImages) {
          try {
            const existingProduct = await db.select({ id: products4.id, imageUrl: products4.imageUrl }).from(products4).where(eq6(products4.productId, item.productId)).limit(1);
            if (existingProduct.length > 0) {
              await db.update(products4).set({
                imageUrl: item.imageUrl,
                updatedAt: /* @__PURE__ */ new Date()
              }).where(eq6(products4.productId, item.productId));
              successCount++;
            } else {
              failedCount++;
              failedProducts.push({
                productId: item.productId,
                reason: "Product not found in products table"
              });
            }
          } catch (error) {
            failedCount++;
            failedProducts.push({
              productId: item.productId,
              reason: error.message
            });
          }
        }
        const duration = Date.now() - startTime;
        return {
          success: true,
          summary: {
            totalFound: crawlerImages.length,
            successCount,
            failedCount,
            duration: `${(duration / 1e3).toFixed(2)}s`
          },
          failedProducts: failedProducts.length > 0 ? failedProducts : void 0
        };
      }),
      // 获取图片同步状态统计
      status: adminProcedure.query(async () => {
        const { products: products4, crawlerResults } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const db = await getDb();
        if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const crawlerCount = await db.select({ count: sql3`count(*)` }).from(crawlerResults).where(
          and4(
            isNotNull(crawlerResults.imageUrl),
            ne(crawlerResults.imageUrl, ""),
            like(crawlerResults.imageUrl, "%cdninstagram.com%")
          )
        );
        const productsCount = await db.select({ count: sql3`count(*)` }).from(products4).where(
          and4(
            isNotNull(products4.imageUrl),
            like(products4.imageUrl, "%cdninstagram.com%")
          )
        );
        const productsWithAnyImage = await db.select({ count: sql3`count(*)` }).from(products4).where(
          and4(
            isNotNull(products4.imageUrl),
            ne(products4.imageUrl, "")
          )
        );
        const totalProducts = await db.select({ count: sql3`count(*)` }).from(products4);
        return {
          crawler: {
            totalImages: Number(crawlerCount[0].count),
            description: "\u5236\u56FE\u56E2\u961F\u5DF2\u4E0A\u4F20\u7684\u56FE\u7247\u6570\u91CF"
          },
          products: {
            cdnInstagramImages: Number(productsCount[0].count),
            totalWithImages: Number(productsWithAnyImage[0].count),
            totalProducts: Number(totalProducts[0].count),
            coverageRate: (Number(productsWithAnyImage[0].count) / Number(totalProducts[0].count) * 100).toFixed(1) + "%"
          },
          needSync: Number(crawlerCount[0].count) - Number(productsCount[0].count)
        };
      })
    })
  }),
  // Resources Center Router
  resources: router({
    // Create a new resource article (for automated publishing)
    // Supports both session auth (admin users) and API Key auth
    create: publicProcedure.input(
      z2.object({
        title: z2.string().min(1).max(255),
        content: z2.string().min(1),
        excerpt: z2.string().max(500).optional(),
        coverImage: z2.string().max(500).optional(),
        authorName: z2.string().max(100).optional(),
        status: z2.enum(["draft", "published", "archived"]).default("draft"),
        language: z2.string().max(10).default("en"),
        categoryName: z2.string().optional(),
        tags: z2.array(z2.string()).optional(),
        featured: z2.boolean().optional()
      })
    ).mutation(async ({ input, ctx }) => {
      let authorUserId;
      const authHeader = ctx.req.headers.authorization;
      const apiKeyAuth = await verifyAPIKey(authHeader);
      if (apiKeyAuth) {
        if (!hasPermission(apiKeyAuth.permissions, "resources:create")) {
          throw new TRPCError4({ code: "FORBIDDEN", message: "API key does not have resources:create permission" });
        }
        authorUserId = apiKeyAuth.createdBy;
      } else if (ctx.user) {
        if (ctx.user.role !== "admin") {
          throw new TRPCError4({ code: "FORBIDDEN", message: "Only admins can create resources" });
        }
        authorUserId = ctx.user.id;
      } else {
        throw new TRPCError4({ code: "UNAUTHORIZED", message: "Authentication required" });
      }
      let categoryId;
      if (input.categoryName) {
        const category = await getOrCreateCategory(input.categoryName);
        categoryId = category.id;
      }
      const result = await createResource({
        title: input.title,
        content: input.content,
        excerpt: input.excerpt,
        coverImage: input.coverImage,
        authorName: input.authorName,
        status: input.status,
        language: input.language,
        categoryId,
        tags: input.tags,
        featured: input.featured
      });
      return {
        success: true,
        id: result.id,
        slug: result.slug,
        url: `/resources/${result.slug}`
      };
    }),
    // Update an existing resource article
    // Supports both session auth (admin users) and API Key auth
    update: publicProcedure.input(
      z2.object({
        id: z2.number(),
        title: z2.string().min(1).max(255).optional(),
        content: z2.string().min(1).optional(),
        excerpt: z2.string().max(500).optional(),
        coverImage: z2.string().max(500).optional(),
        authorName: z2.string().max(100).optional(),
        status: z2.enum(["draft", "published", "archived"]).optional(),
        language: z2.string().max(10).optional(),
        categoryName: z2.string().optional(),
        tags: z2.array(z2.string()).optional(),
        featured: z2.boolean().optional(),
        publishedAt: z2.string().optional()
        // ISO 8601 date string
      })
    ).mutation(async ({ input, ctx }) => {
      const authHeader = ctx.req.headers.authorization;
      const apiKeyAuth = await verifyAPIKey(authHeader);
      if (apiKeyAuth) {
        if (!hasPermission(apiKeyAuth.permissions, "resources:update")) {
          throw new TRPCError4({ code: "FORBIDDEN", message: "API key does not have resources:update permission" });
        }
      } else if (ctx.user) {
        if (ctx.user.role !== "admin") {
          throw new TRPCError4({ code: "FORBIDDEN", message: "Only admins can update resources" });
        }
      } else {
        throw new TRPCError4({ code: "UNAUTHORIZED", message: "Authentication required" });
      }
      let categoryId;
      if (input.categoryName) {
        const category = await getOrCreateCategory(input.categoryName);
        categoryId = category.id;
      }
      let publishedAt;
      if (input.publishedAt) {
        publishedAt = new Date(input.publishedAt);
        if (isNaN(publishedAt.getTime())) {
          throw new TRPCError4({ code: "BAD_REQUEST", message: "Invalid publishedAt date format" });
        }
      }
      await updateResource(input.id, {
        title: input.title,
        content: input.content,
        excerpt: input.excerpt,
        coverImage: input.coverImage,
        authorName: input.authorName,
        status: input.status,
        language: input.language,
        categoryId,
        tags: input.tags,
        featured: input.featured,
        publishedAt
      });
      return { success: true, id: input.id };
    }),
    // Delete a resource article (soft delete: set status to 'archived')
    // Supports both session auth (admin users) and API Key auth
    delete: publicProcedure.input(
      z2.object({
        id: z2.number()
      })
    ).mutation(async ({ input, ctx }) => {
      const authHeader = ctx.req.headers.authorization;
      const apiKeyAuth = await verifyAPIKey(authHeader);
      if (apiKeyAuth) {
        if (!hasPermission(apiKeyAuth.permissions, "resources:delete")) {
          throw new TRPCError4({ code: "FORBIDDEN", message: "API key does not have resources:delete permission" });
        }
      } else if (ctx.user) {
        if (ctx.user.role !== "admin") {
          throw new TRPCError4({ code: "FORBIDDEN", message: "Only admins can delete resources" });
        }
      } else {
        throw new TRPCError4({ code: "UNAUTHORIZED", message: "Authentication required" });
      }
      await updateResource(input.id, {
        status: "archived"
      });
      return { success: true, id: input.id };
    }),
    // Get resource by slug (public)
    getBySlug: publicProcedure.input(
      z2.object({
        slug: z2.string()
      })
    ).query(async ({ input }) => {
      const resource = await getResourceBySlug(input.slug);
      if (!resource) {
        throw new TRPCError4({ code: "NOT_FOUND", message: "Resource not found" });
      }
      if (resource.status !== "published") {
        throw new TRPCError4({ code: "NOT_FOUND", message: "Resource not found" });
      }
      await incrementViewCount(resource.id);
      return resource;
    }),
    // List resources with pagination and filters
    // Public: only shows published resources
    // With API Key: can show all resources including drafts
    list: publicProcedure.input(
      z2.object({
        page: z2.number().min(1).default(1),
        pageSize: z2.number().min(1).max(100).default(12),
        categoryId: z2.number().optional(),
        featured: z2.boolean().optional(),
        language: z2.string().optional(),
        search: z2.string().optional(),
        status: z2.enum(["draft", "published", "archived"]).optional()
      })
    ).query(async ({ input, ctx }) => {
      const authHeader = ctx.req.headers.authorization;
      const apiKeyAuth = await verifyAPIKey(authHeader);
      let status;
      if (apiKeyAuth && hasPermission(apiKeyAuth.permissions, "resources:list")) {
        status = input.status;
      } else {
        status = "published";
      }
      return await listResources({
        page: input.page,
        pageSize: input.pageSize,
        status,
        categoryId: input.categoryId,
        featured: input.featured,
        language: input.language,
        search: input.search
      });
    }),
    // List all categories (public)
    listCategories: publicProcedure.query(async () => {
      return await listCategories();
    })
  })
});

// server/_core/context.ts
init_sdk();
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
import { eq as eq7 } from "drizzle-orm";
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
    const articles = await db.select().from(resources).where(eq7(resources.slug, slug)).limit(1);
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
import { eq as eq8 } from "drizzle-orm";
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
    }).from(resources).where(eq8(resources.status, "published"));
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
import { eq as eq9 } from "drizzle-orm";
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
    const articles = await db.select().from(resources).where(eq9(resources.slug, slug)).limit(1);
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
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  app.use(seoMetaInjectionMiddleware);
  registerOAuthRoutes(app);
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
