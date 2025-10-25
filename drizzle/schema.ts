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