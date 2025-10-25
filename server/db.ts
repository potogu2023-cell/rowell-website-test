import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertProduct, InsertUser, products, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Product queries
export async function insertProducts(productsData: InsertProduct[]) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot insert products: database not available");
    return [];
  }

  try {
    const result = await db.insert(products).values(productsData);
    return result;
  } catch (error) {
    console.error("[Database] Failed to insert products:", error);
    throw error;
  }
}

export async function getAllProducts() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get products: database not available");
    return [];
  }

  const result = await db.select().from(products);
  return result;
}

export async function getProductsByBrand(brand: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get products: database not available");
    return [];
  }

  const result = await db.select().from(products).where(eq(products.brand, brand));
  return result;
}


// Category queries
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  const { categories } = await import("../drizzle/schema");
  return await db.select().from(categories);
}

export async function getVisibleCategories() {
  const db = await getDb();
  if (!db) return [];
  const { categories } = await import("../drizzle/schema");
  return await db.select().from(categories).where(eq(categories.isVisible, 1));
}

export async function getCategoriesByLevel(level: number) {
  const db = await getDb();
  if (!db) return [];
  const { categories } = await import("../drizzle/schema");
  return await db.select().from(categories).where(eq(categories.level, level));
}

export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const { categories } = await import("../drizzle/schema");
  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getChildCategories(parentId: number) {
  const db = await getDb();
  if (!db) return [];
  const { categories } = await import("../drizzle/schema");
  return await db.select().from(categories).where(eq(categories.parentId, parentId));
}

export async function getTopLevelCategories(visibleOnly: boolean = true) {
  const db = await getDb();
  if (!db) return [];
  const { categories } = await import("../drizzle/schema");
  const { and, isNull } = await import("drizzle-orm");
  
  if (visibleOnly) {
    return await db.select().from(categories)
      .where(and(isNull(categories.parentId), eq(categories.isVisible, 1)))
      .orderBy(categories.displayOrder);
  } else {
    return await db.select().from(categories)
      .where(isNull(categories.parentId))
      .orderBy(categories.displayOrder);
  }
}

