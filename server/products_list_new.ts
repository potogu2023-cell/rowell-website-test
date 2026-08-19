// New products.list implementation with advanced filters
import { z } from "zod";
import { eq, and, inArray, sql } from "drizzle-orm";

export const productsListInput = z.object({
  categoryId: z.number().optional(),
  brand: z.string().optional(),
  search: z.string().optional(),
  // Advanced filters
  particleSizeMin: z.number().optional(),
  particleSizeMax: z.number().optional(),
  poreSizeMin: z.number().optional(),
  poreSizeMax: z.number().optional(),
  columnLengthMin: z.number().optional(),
  columnLengthMax: z.number().optional(),
  innerDiameterMin: z.number().optional(),
  innerDiameterMax: z.number().optional(),
  phaseTypes: z.array(z.string()).optional(),
  phMin: z.number().optional(),
  phMax: z.number().optional(),
  usp: z.string().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(24),
}).optional();

export async function productsListQuery(input: z.infer<typeof productsListInput>, db: any) {
  if (!db) return { products: [], total: 0, page: 1, pageSize: 24, totalPages: 0 };
  
  const { products, productCategories } = await import("../drizzle/schema");
  const page = input?.page || 1;
  const pageSize = input?.pageSize || 24;
  const offset = (page - 1) * pageSize;
  
  // Build WHERE conditions
  const conditions: any[] = [];
  
  // Always filter by active status
  conditions.push(eq(products.status, 'active'));
  
  // Search active products by identifier, name, manufacturer, or recorded category.
  // Users frequently paste catalog numbers with spaces, hyphens, or slashes omitted,
  // so identifier matching also compares a punctuation-normalized representation.
  if (input?.search && input.search.trim().length > 0) {
    const searchTerm = input.search.trim().toLowerCase();
    const normalizedIdentifier = searchTerm.replace(/[^a-z0-9]/g, '');
    const identifierClause = normalizedIdentifier.length >= 2
      ? sql`
          OR LOWER(REPLACE(REPLACE(REPLACE(${products.productId}, '-', ''), ' ', ''), '/', '')) LIKE ${`%${normalizedIdentifier}%`}
          OR LOWER(REPLACE(REPLACE(REPLACE(${products.partNumber}, '-', ''), ' ', ''), '/', '')) LIKE ${`%${normalizedIdentifier}%`}
        `
      : sql``;
    conditions.push(
      sql`(
        LOWER(${products.productId}) LIKE ${`%${searchTerm}%`} OR
        LOWER(${products.name}) LIKE ${`%${searchTerm}%`} OR
        LOWER(${products.partNumber}) LIKE ${`%${searchTerm}%`} OR
        LOWER(${products.brand}) LIKE ${`%${searchTerm}%`} OR
        LOWER(${products.category}) LIKE ${`%${searchTerm}%`}
        ${identifierClause}
      )`
    );
  }
  
  // Brand filter
  if (input?.brand) {
    conditions.push(eq(products.brand, input.brand));
  }
  
  // The legacy *Num columns are integer fields and lose decimal precision.
  // Numeric specs are therefore parsed strictly in application memory after
  // SQL applies the inexpensive status/category/brand/text constraints.
  const hasSpecificationFilters = [
    input?.particleSizeMin,
    input?.particleSizeMax,
    input?.poreSizeMin,
    input?.poreSizeMax,
    input?.columnLengthMin,
    input?.columnLengthMax,
    input?.innerDiameterMin,
    input?.innerDiameterMax,
    input?.phMin,
    input?.phMax,
  ].some((value) => value !== undefined);
  
  // Phase types (multiple selection)
  if (input?.phaseTypes && input.phaseTypes.length > 0) {
    conditions.push(inArray(products.phaseType, input.phaseTypes));
  }
  
  // USP filter (exact match)
  if (input?.usp) {
    const { or, like } = await import('drizzle-orm');
    conditions.push(
      or(
        eq(products.usp, input.usp),                      // "L1"
        like(products.usp, `${input.usp},%`),            // "L1,..."
        like(products.usp, `%,${input.usp}`),            // "...,L1"
        like(products.usp, `%,${input.usp},%`)           // "...,L1,..."
      )
    );
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const categoryCondition = input?.categoryId
    ? sql`${products.id} IN (SELECT product_id FROM product_categories WHERE category_id = ${input.categoryId})`
    : undefined;
  const finalCondition = categoryCondition && whereClause
    ? and(categoryCondition, whereClause)
    : categoryCondition || whereClause;
  const baseQuery = db.select().from(products).where(finalCondition);

  // Debug: log the DB-safe prefilter query; specification comparison below is
  // deterministic application code so malformed raw values can never break SQL.
  console.log('[products_list_new] categoryId:', input?.categoryId);
  console.log('[products_list_new] specification filters active:', hasSpecificationFilters);
  console.log('[products_list_new] base query SQL:', baseQuery.toSQL ? baseQuery.toSQL() : 'no toSQL method');

  const parseStrictUnit = (value: unknown, expression: RegExp, multiplier = 1): number | null => {
    if (typeof value !== 'string') return null;
    const match = expression.exec(value.trim());
    if (!match) return null;
    const numeric = Number(match[1]);
    return Number.isFinite(numeric) ? numeric * multiplier : null;
  };
  const inRange = (value: number | null, min?: number, max?: number) =>
    (min === undefined && max === undefined) ||
    (value !== null && (min === undefined || value >= min) && (max === undefined || value <= max));
  const parseRecordedNumber = (value: unknown): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const matchesSpecificationFilters = (product: any) => {
    const particleSize = parseStrictUnit(product.particleSize, /^(\d+(?:\.\d+)?)\s*(?:µm|um)$/i);
    const poreSize = parseStrictUnit(product.poreSize, /^(\d+(?:\.\d+)?)\s*(?:Å|A)$/);
    const innerDiameter = parseStrictUnit(product.innerDiameter, /^(\d+(?:\.\d+)?)\s*mm$/i);
    const columnLengthMatch = typeof product.columnLength === 'string'
      ? /^(\d+(?:\.\d+)?)\s*(mm|m)$/i.exec(product.columnLength.trim())
      : null;
    const columnLength = columnLengthMatch
      ? Number(columnLengthMatch[1]) * (columnLengthMatch[2].toLowerCase() === 'm' ? 1000 : 1)
      : null;
    const recordedPhMin = parseRecordedNumber(product.phMin);
    const recordedPhMax = parseRecordedNumber(product.phMax);
    const matchesPh = (input?.phMin === undefined && input?.phMax === undefined) ||
      (recordedPhMin !== null && recordedPhMax !== null &&
        (input?.phMin === undefined || recordedPhMax >= input.phMin) &&
        (input?.phMax === undefined || recordedPhMin <= input.phMax));

    return inRange(particleSize, input?.particleSizeMin, input?.particleSizeMax) &&
      inRange(poreSize, input?.poreSizeMin, input?.poreSizeMax) &&
      inRange(columnLength, input?.columnLengthMin, input?.columnLengthMax) &&
      inRange(innerDiameter, input?.innerDiameterMin, input?.innerDiameterMax) &&
      matchesPh;
  };

  let productList: any[];
  let total: number;
  if (hasSpecificationFilters) {
    const candidates = await baseQuery;
    const matchingProducts = candidates.filter(matchesSpecificationFilters);
    total = matchingProducts.length;
    productList = matchingProducts.slice(offset, offset + pageSize);
  } else {
    const pagedQuery = baseQuery.limit(pageSize).offset(offset);
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(finalCondition);
    const [productResults, countResults] = await Promise.all([pagedQuery, countQuery]);
    productList = productResults;
    total = Number(countResults[0]?.count || 0);
  }

  const totalPages = Math.ceil(total / pageSize);
  
  return {
    products: productList,
    total,
    page,
    pageSize,
    totalPages,
  };
}

