// New products.list implementation with advanced filters
import { z } from "zod";
import { eq, and, gte, lte, inArray, sql } from "drizzle-orm";

export const productsListInput = z.object({
  categoryId: z.number().optional(),
  brand: z.string().optional(),
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
  
  // Build query based on category filter
  let query;
  let countQuery;
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  if (input?.categoryId) {
    // Query with category filter
    const categoryCondition = eq(productCategories.categoryId, input.categoryId);
    const finalCondition = whereClause 
      ? and(categoryCondition, whereClause)
      : categoryCondition;
    
    query = db
      .select({ product: products })
      .from(products)
      .innerJoin(productCategories, eq(products.id, productCategories.productId))
      .where(finalCondition)
      .limit(pageSize)
      .offset(offset);
    
    countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .innerJoin(productCategories, eq(products.id, productCategories.productId))
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
  
  const [productResults, countResults] = await Promise.all([
    query,
    countQuery,
  ]);
  
  const productList = input?.categoryId 
    ? productResults.map((r: any) => r.product)
    : productResults;
  
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

