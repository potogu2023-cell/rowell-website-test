/**
 * USP Standards database operations.
 *
 * All product classifications are read from evidence-backed catalog fields.
 * This module deliberately does not infer or write USP values from product names.
 */

import { getDb } from './db';
import { products, uspStandards } from '../drizzle/schema';
import { and, eq, like, or, sql } from 'drizzle-orm';

export async function getAllUSPStandards() {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    return await db.select().from(uspStandards).orderBy(uspStandards.code);
  } catch (error) {
    console.error('Error fetching USP standards:', error);
    throw new Error('Failed to fetch USP standards');
  }
}

export async function getUSPStandardByCode(code: string) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const standard = await db
      .select()
      .from(uspStandards)
      .where(eq(uspStandards.code, code))
      .limit(1);
    return standard[0] || null;
  } catch (error) {
    console.error(`Error fetching USP standard ${code}:`, error);
    throw new Error(`Failed to fetch USP standard ${code}`);
  }
}

/**
 * Match a comma-delimited USP field exactly, so L1 never matches L10.
 */
export async function getProductsByUSPStandard(uspCode: string, limit = 50) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    return await db
      .select()
      .from(products)
      .where(and(
        or(
          eq(products.usp, uspCode),
          like(products.usp, `${uspCode},%`),
          like(products.usp, `%,${uspCode}`),
          like(products.usp, `%,${uspCode},%`),
        ),
        eq(products.status, 'active'),
      ))
      .orderBy(products.brand, products.name)
      .limit(limit);
  } catch (error) {
    console.error(`Error fetching products for USP ${uspCode}:`, error);
    throw new Error(`Failed to fetch products for USP ${uspCode}`);
  }
}

export async function getUSPStandardWithProducts(uspCode: string, productLimit = 50) {
  const standard = await getUSPStandardByCode(uspCode);
  if (!standard) return null;
  const matchedProducts = await getProductsByUSPStandard(uspCode, productLimit);
  return { standard, products: matchedProducts, productCount: matchedProducts.length };
}

export async function getAllUSPStandardsWithProductCount() {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const standards = await getAllUSPStandards();
    return await Promise.all(standards.map(async (standard) => {
      const countResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(products)
        .where(and(
          or(
            eq(products.usp, standard.code),
            like(products.usp, `${standard.code},%`),
            like(products.usp, `%,${standard.code}`),
            like(products.usp, `%,${standard.code},%`),
          ),
          eq(products.status, 'active'),
        ));
      return { ...standard, productCount: Number(countResult[0]?.count || 0) };
    }));
  } catch (error) {
    console.error('Error fetching USP standards with product count:', error);
    throw new Error('Failed to fetch USP standards with product count');
  }
}

/**
 * Automatic name-based USP assignment is intentionally disabled. Product names
 * alone cannot prove a USP classification, so all future updates must enter
 * through the evidence-backed product-data workflow.
 */
export async function fillProductUSPData(): Promise<never> {
  throw new Error(
    'Automatic USP classification is disabled. Use an evidence-backed product-data update instead.',
  );
}
