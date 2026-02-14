// New products.list implementation with advanced filters
import { z } from "zod";
import { eq, and, gte, lte, inArray, sql } from "drizzle-orm";

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
  
  // Particle size range
  if (input?.particleSizeMin !== undefined) {
    conditions.push(gte(products.particleSizeNum, input.particleSizeMin));
  }
  if (input?.particleSizeMax !== undefined) {
    conditions.push(lte(products.particleSizeNum, input.particleSizeMax));
  }
  
  // Pore size range
  if (input?.poreSizeMin !== undefined) {
    conditions.push(gte(products.poreSizeNum, input.poreSizeMin));
  }
  if (input?.poreSizeMax !== undefined) {
    conditions.push(lte(products.poreSizeNum, input.poreSizeMax));
  }
  
  // Column length range
  if (input?.columnLengthMin !== undefined) {
    conditions.push(gte(products.columnLengthNum, input.columnLengthMin));
  }
  if (input?.columnLengthMax !== undefined) {
    conditions.push(lte(products.columnLengthNum, input.columnLengthMax));
  }
  
  // Inner diameter range
  if (input?.innerDiameterMin !== undefined) {
    conditions.push(gte(products.innerDiameterNum, input.innerDiameterMin));
  }
  if (input?.innerDiameterMax !== undefined) {
    conditions.push(lte(products.innerDiameterNum, input.innerDiameterMax));
  }
  
  // Phase types (multiple selection)
  if (input?.phaseTypes && input.phaseTypes.length > 0) {
    conditions.push(inArray(products.phaseType, input.phaseTypes));
  }
  
  // pH range
  if (input?.phMin !== undefined) {
    conditions.push(gte(products.phMax, input.phMin)); // Product's max pH >= filter's min pH
  }
  if (input?.phMax !== undefined) {
    conditions.push(lte(products.phMin, input.phMax)); // Product's min pH <= filter's max pH
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

