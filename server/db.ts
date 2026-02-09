import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';
import mysql from 'mysql2/promise';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Parse DATABASE_URL and configure SSL properly
      const dbUrl = new URL(process.env.DATABASE_URL);
      const sslParam = dbUrl.searchParams.get('ssl');
      
      // Remove ssl parameter from URL
      dbUrl.searchParams.delete('ssl');
      
      // Parse connection parameters
      const host = dbUrl.hostname;
      const port = dbUrl.port ? parseInt(dbUrl.port) : 3306;
      const user = dbUrl.username;
      const password = dbUrl.password;
      const database = dbUrl.pathname.slice(1); // Remove leading '/'
      
      // Parse SSL configuration
      let sslConfig: any = null;
      if (sslParam) {
        if (sslParam === 'true') {
          sslConfig = { rejectUnauthorized: true };
        } else {
          try {
            sslConfig = JSON.parse(sslParam);
          } catch (e) {
            console.warn('[Database] Failed to parse SSL config, using default:', e);
            sslConfig = { rejectUnauthorized: true };
          }
        }
      }
      
      console.log('[Database] Connecting with config:', {
        host,
        port,
        user,
        database,
        hasPassword: !!password,
        sslEnabled: !!sslConfig
      });
      
      const poolConfig: any = {
        host,
        port,
        user,
        password,
        database,
      };
      
      // Configure SSL if needed
      if (sslConfig) {
        poolConfig.ssl = sslConfig;
      }
      
      const pool = mysql.createPool(poolConfig);
      
      // Test connection
      try {
        const connection = await pool.getConnection();
        console.log('[Database] Connection test successful');
        connection.release();
      } catch (testError) {
        console.error('[Database] Connection test failed:', testError);
        throw testError;
      }
      
      _db = drizzle(pool);
      console.log('[Database] Drizzle instance created successfully');
    } catch (error) {
      console.error("[Database] Failed to initialize:", error);
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

/**
 * Product queries
 */
export async function getProductById(productId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get product: database not available");
    return undefined;
  }

  const { products } = await import("../drizzle/schema");
  const result = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProductsByIds(productIds: number[]) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get products: database not available");
    return [];
  }

  const { products } = await import("../drizzle/schema");
  const { inArray } = await import("drizzle-orm");
  return await db.select().from(products).where(inArray(products.id, productIds));
}

export async function getAllProducts() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get products: database not available");
    return [];
  }

  const { products } = await import("../drizzle/schema");
  return await db.select().from(products);
}

/**
 * Inquiry queries
 */
export async function createInquiry(data: {
  inquiryNumber: string;
  userName: string;
  userEmail: string;
  userCompany?: string;
  userPhone?: string;
  userMessage?: string;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const { inquiries } = await import("../drizzle/schema");
  const result = await db.insert(inquiries).values(data);
  return Number(result[0].insertId);
}

export async function createInquiryItems(inquiryId: number, items: Array<{
  productId: number;
  partNumber?: string;
  productName?: string;
  brand?: string;
}>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const { inquiryItems } = await import("../drizzle/schema");
  const values = items.map(item => ({
    inquiryId,
    productId: item.productId,
    partNumber: item.partNumber,
    productName: item.productName,
    brand: item.brand,
  }));

  await db.insert(inquiryItems).values(values);
}

export async function getInquiryByNumber(inquiryNumber: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get inquiry: database not available");
    return undefined;
  }

  const { inquiries } = await import("../drizzle/schema");
  const result = await db.select().from(inquiries).where(eq(inquiries.inquiryNumber, inquiryNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getInquiryItems(inquiryId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get inquiry items: database not available");
    return [];
  }

  const { inquiryItems } = await import("../drizzle/schema");
  return await db.select().from(inquiryItems).where(eq(inquiryItems.inquiryId, inquiryId));
}

/**
 * User authentication queries
 */
export async function createUser(data: {
  email: string;
  passwordHash: string;
  name: string;
  company?: string;
  phone?: string;
  country?: string;
  industry?: string;
  purchasingRole?: string;
  annualPurchaseVolume?: string;
}) {
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
    loginMethod: 'password',
    role: 'user',
    lastSignedIn: new Date(),
  });

  return Number(result[0].insertId);
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserLastSignIn(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user: database not available");
    return;
  }

  await db.update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, userId));
}
