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
  
  // Search filter (search in productId, name, partNumber, brand)
  if (input?.search && input.search.trim().length > 0) {
    const searchTerm = input.search.trim().toLowerCase();
    conditions.push(
      sql`(
        LOWER(${products.productId}) LIKE ${`%${searchTerm}%`} OR
        LOWER(${products.name}) LIKE ${`%${searchTerm}%`} OR
        LOWER(${products.partNumber}) LIKE ${`%${searchTerm}%`} OR
        LOWER(${products.brand}) LIKE ${`%${searchTerm}%`}
      )`
    );
  }
  
  // Brand filter
  if (input?.brand) {
    conditions.push(eq(products.brand, input.brand));
  }
  
  // Numeric filters intentionally parse only strict, unit-qualified raw values.
  // The legacy *Num columns are integer fields and are known to lose decimal
  // precision for chromatography specifications; they must not drive results.
  const particleSizeValue = sql<number>`CAST(REPLACE(REPLACE(REPLACE(LOWER(TRIM(${products.particleSize})), 'µm', ''), 'um', ''), ' ', '') AS DECIMAL(12,4))`;
  const poreSizeValue = sql<number>`CAST(REPLACE(REPLACE(REPLACE(LOWER(TRIM(${products.poreSize})), 'å', ''), 'a', ''), ' ', '') AS DECIMAL(12,4))`;
  const innerDiameterValue = sql<number>`CAST(REPLACE(LOWER(TRIM(${products.innerDiameter})), 'mm', '') AS DECIMAL(12,4))`;
  const columnLengthValueMm = sql<number>`CASE
    WHEN LOWER(TRIM(${products.columnLength})) REGEXP '^[0-9]+(\\.[0-9]+)?[[:space:]]*mm$'
      THEN CAST(REPLACE(LOWER(TRIM(${products.columnLength})), 'mm', '') AS DECIMAL(12,4))
    WHEN LOWER(TRIM(${products.columnLength})) REGEXP '^[0-9]+(\\.[0-9]+)?[[:space:]]*m$'
      THEN CAST(REPLACE(LOWER(TRIM(${products.columnLength})), 'm', '') AS DECIMAL(12,4)) * 1000
    ELSE NULL
  END`;

  const strictParticleSize = sql`${products.particleSize} REGEXP '^[0-9]+(\\.[0-9]+)?[[:space:]]*(µm|um)$'`;
  const strictPoreSize = sql`${products.poreSize} REGEXP '^[0-9]+(\\.[0-9]+)?[[:space:]]*(Å|A)$'`;
  const strictInnerDiameter = sql`${products.innerDiameter} REGEXP '^[0-9]+(\\.[0-9]+)?[[:space:]]*mm$'`;
  const strictColumnLength = sql`LOWER(TRIM(${products.columnLength})) REGEXP '^[0-9]+(\\.[0-9]+)?[[:space:]]*(mm|m)$'`;

  if (input?.particleSizeMin !== undefined) {
    conditions.push(sql`${strictParticleSize} AND ${particleSizeValue} >= ${input.particleSizeMin}`);
  }
  if (input?.particleSizeMax !== undefined) {
    conditions.push(sql`${strictParticleSize} AND ${particleSizeValue} <= ${input.particleSizeMax}`);
  }
  if (input?.poreSizeMin !== undefined) {
    conditions.push(sql`${strictPoreSize} AND ${poreSizeValue} >= ${input.poreSizeMin}`);
  }
  if (input?.poreSizeMax !== undefined) {
    conditions.push(sql`${strictPoreSize} AND ${poreSizeValue} <= ${input.poreSizeMax}`);
  }
  if (input?.columnLengthMin !== undefined) {
    conditions.push(sql`${strictColumnLength} AND ${columnLengthValueMm} >= ${input.columnLengthMin}`);
  }
  if (input?.columnLengthMax !== undefined) {
    conditions.push(sql`${strictColumnLength} AND ${columnLengthValueMm} <= ${input.columnLengthMax}`);
  }
  if (input?.innerDiameterMin !== undefined) {
    conditions.push(sql`${strictInnerDiameter} AND ${innerDiameterValue} >= ${input.innerDiameterMin}`);
  }
  if (input?.innerDiameterMax !== undefined) {
    conditions.push(sql`${strictInnerDiameter} AND ${innerDiameterValue} <= ${input.innerDiameterMax}`);
  }
  
  // Phase types (multiple selection)
  if (input?.phaseTypes && input.phaseTypes.length > 0) {
    conditions.push(inArray(products.phaseType, input.phaseTypes));
  }
  
  // pH range: only products with both independently recorded boundaries can match.
  if (input?.phMin !== undefined) {
    conditions.push(sql`${products.phMax} IS NOT NULL AND ${products.phMax} >= ${input.phMin}`);
  }
  if (input?.phMax !== undefined) {
    conditions.push(sql`${products.phMin} IS NOT NULL AND ${products.phMin} <= ${input.phMax}`);
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
  
  // Build query based on category filter
  let query;
  let countQuery;
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  if (input?.categoryId) {
    // Query with category filter using IN subquery
    const categoryProductIds = sql`(SELECT product_id FROM product_categories WHERE category_id = ${input.categoryId})`;
    const categoryCondition = sql`${products.id} IN ${categoryProductIds}`;
    const finalCondition = whereClause 
      ? and(categoryCondition, whereClause)
      : categoryCondition;
    
    query = db
      .select()
      .from(products)
      .where(finalCondition)
      .limit(pageSize)
      .offset(offset);
    
    countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(finalCondition);
  } else {
    // Query all products with filters
    query = db
      .select()
      .from(products)
      .where(whereClause)
      .limit(pageSize)
      .offset(offset);
    
    countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause);
  }
  
  // Debug: log query
  console.log('[products_list_new] categoryId:', input?.categoryId);
  console.log('[products_list_new] query SQL:', query.toSQL ? query.toSQL() : 'no toSQL method');
  
  const [productResults, countResults] = await Promise.all([
    query,
    countQuery,
  ]);
  
  const productList = productResults;
  
  const total = countResults[0]?.count || 0;
  const totalPages = Math.ceil(total / pageSize);
  
  return {
    products: productList,
    total,
    page,
    pageSize,
    totalPages,
  };
}

