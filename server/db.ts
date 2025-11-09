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

export async function getCategoriesWithProductCount() {
  const db = await getDb();
  if (!db) return [];
  const { categories, productCategories } = await import("../drizzle/schema");
  const { countDistinct } = await import("drizzle-orm");
  
  // Get all visible categories with DISTINCT product count
  const result = await db
    .select({
      id: categories.id,
      name: categories.name,
      nameEn: categories.nameEn,
      slug: categories.slug,
      parentId: categories.parentId,
      level: categories.level,
      displayOrder: categories.displayOrder,
      isVisible: categories.isVisible,
      description: categories.description,
      icon: categories.icon,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
      productCount: countDistinct(productCategories.productId),
    })
    .from(categories)
    .leftJoin(productCategories, eq(categories.id, productCategories.categoryId))
    .where(eq(categories.isVisible, 1))
    .groupBy(categories.id)
    .orderBy(categories.displayOrder);
  
  return result;
}



// Authentication queries
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(userData: InsertUser) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create user: database not available");
    return undefined;
  }

  try {
    const result = await db.insert(users).values(userData);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create user:", error);
    throw error;
  }
}

export async function updateUserEmailVerified(email: string, verified: number = 1) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user: database not available");
    return;
  }

  try {
    await db.update(users)
      .set({ emailVerified: verified })
      .where(eq(users.email, email));
  } catch (error) {
    console.error("[Database] Failed to update email verification:", error);
    throw error;
  }
}

export async function updateUserPassword(email: string, hashedPassword: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update password: database not available");
    return;
  }

  try {
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, email));
  } catch (error) {
    console.error("[Database] Failed to update password:", error);
    throw error;
  }
}

export async function updateUserProfile(userId: number, profileData: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update profile: database not available");
    return;
  }

  try {
    await db.update(users)
      .set(profileData)
      .where(eq(users.id, userId));
  } catch (error) {
    console.error("[Database] Failed to update profile:", error);
    throw error;
  }
}



// Cart queries
export async function getCartByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get cart: database not available");
    return [];
  }

  const { cart, products } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  // Join cart with products to get product details
  const result = await db
    .select({
      id: cart.id,
      userId: cart.userId,
      productId: cart.productId,
      quantity: cart.quantity,
      notes: cart.notes,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      product: products,
    })
    .from(cart)
    .leftJoin(products, eq(cart.productId, products.id))
    .where(eq(cart.userId, userId));

  return result;
}

export async function addToCart(userId: number, productId: number, quantity: number = 1, notes?: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add to cart: database not available");
    return undefined;
  }

  const { cart } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  // Check if product already in cart
  const existing = await db
    .select()
    .from(cart)
    .where(and(eq(cart.userId, userId), eq(cart.productId, productId)))
    .limit(1);

  if (existing.length > 0) {
    // Update quantity
    await db
      .update(cart)
      .set({ 
        quantity: existing[0].quantity + quantity,
        notes: notes || existing[0].notes,
      })
      .where(eq(cart.id, existing[0].id));
    return existing[0].id;
  } else {
    // Insert new
    const result = await db.insert(cart).values({
      userId,
      productId,
      quantity,
      notes: notes || null,
    });
    return result;
  }
}

export async function updateCartItem(cartId: number, quantity: number, notes?: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update cart: database not available");
    return;
  }

  const { cart } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  await db
    .update(cart)
    .set({ 
      quantity,
      notes: notes || null,
    })
    .where(eq(cart.id, cartId));
}

export async function removeFromCart(cartId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot remove from cart: database not available");
    return;
  }

  const { cart } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  await db.delete(cart).where(eq(cart.id, cartId));
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot clear cart: database not available");
    return;
  }

  const { cart } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  await db.delete(cart).where(eq(cart.userId, userId));
}

// Inquiry queries
export async function createInquiry(inquiryData: {
  userId: number;
  urgency: "normal" | "urgent" | "very_urgent";
  budgetRange?: string;
  applicationNotes?: string;
  deliveryAddress?: string;
  customerNotes?: string;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create inquiry: database not available");
    return undefined;
  }

  const { inquiries } = await import("../drizzle/schema");

  // Generate inquiry number: INQ-YYYYMMDD-XXX
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  
  // Get count of inquiries today
  const { count, gte } = await import("drizzle-orm");
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayCount = await db
    .select({ count: count() })
    .from(inquiries)
    .where(gte(inquiries.createdAt, todayStart));
  
  const sequence = String((todayCount[0]?.count || 0) + 1).padStart(3, "0");
  const inquiryNumber = `INQ-${dateStr}-${sequence}`;

  const result = await db.insert(inquiries).values({
    inquiryNumber,
    userId: inquiryData.userId,
    urgency: inquiryData.urgency,
    budgetRange: inquiryData.budgetRange || null,
    applicationNotes: inquiryData.applicationNotes || null,
    deliveryAddress: inquiryData.deliveryAddress || null,
    customerNotes: inquiryData.customerNotes || null,
    totalItems: 0,
    status: "pending",
  });

  return { inquiryNumber, insertId: result };
}

export async function addInquiryItems(inquiryId: number, items: Array<{ productId: number; quantity: number; notes?: string }>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add inquiry items: database not available");
    return;
  }

  const { inquiryItems, inquiries } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  // Insert items
  await db.insert(inquiryItems).values(
    items.map(item => ({
      inquiryId,
      productId: item.productId,
      quantity: item.quantity,
      notes: item.notes || null,
    }))
  );

  // Update total items count
  await db
    .update(inquiries)
    .set({ totalItems: items.length })
    .where(eq(inquiries.id, inquiryId));
}

export async function getInquiriesByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get inquiries: database not available");
    return [];
  }

  const { inquiries } = await import("../drizzle/schema");
  const { eq, desc } = await import("drizzle-orm");

  const result = await db
    .select()
    .from(inquiries)
    .where(eq(inquiries.userId, userId))
    .orderBy(desc(inquiries.createdAt));

  return result;
}

export async function getInquiryById(inquiryId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get inquiry: database not available");
    return undefined;
  }

  const { inquiries } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  const result = await db
    .select()
    .from(inquiries)
    .where(eq(inquiries.id, inquiryId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getInquiryItems(inquiryId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get inquiry items: database not available");
    return [];
  }

  const { inquiryItems, products } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  const result = await db
    .select({
      id: inquiryItems.id,
      inquiryId: inquiryItems.inquiryId,
      productId: inquiryItems.productId,
      quantity: inquiryItems.quantity,
      notes: inquiryItems.notes,
      quotedPrice: inquiryItems.quotedPrice,
      createdAt: inquiryItems.createdAt,
      product: products,
    })
    .from(inquiryItems)
    .leftJoin(products, eq(inquiryItems.productId, products.id))
    .where(eq(inquiryItems.inquiryId, inquiryId));

  return result;
}


/**
 * Update user's AI advisor consent mode
 */
export async function updateUserConsent(
  userId: number,
  consentMode: "standard" | "privacy"
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update consent: database not available");
    return;
  }

  try {
    await db
      .update(users)
      .set({
        consentMode,
        consentTimestamp: new Date(),
      })
      .where(eq(users.id, userId));
  } catch (error) {
    console.error("[Database] Failed to update user consent:", error);
    throw error;
  }
}
