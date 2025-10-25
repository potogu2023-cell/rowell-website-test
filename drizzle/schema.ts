import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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