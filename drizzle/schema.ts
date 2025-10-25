import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  /** Product name/title */
  name: text("name"),
  /** Product description */
  description: text("description"),
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
 * Product-Category relationship table
 * Allows products to belong to multiple categories
 */
export const productCategories = mysqlTable("product_categories", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  categoryId: int("categoryId").notNull(),
  isPrimary: int("isPrimary").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

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