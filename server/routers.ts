
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { getProductsByIds } from './db';
import { z } from 'zod';
import { adminRouter } from './admin-api';
import { listCategoriesRouter } from './list-categories-api';
import { updateProductCategoryRouter } from './update-product-category';
import { updateGlycoWorksMysql2Router } from './update-glycoworks-mysql2';
import { cleanupProductCategoriesRouter } from './cleanup-product-categories';
import { checkDataConsistencyRouter } from './check-data-consistency';
import { describeProductsTableRouter } from './describe-products-table';
import { queryCategoriesRouter } from './query-categories';
import { fullConsistencyCheckRouter } from "./full-consistency-check";
import { getOrphanProductsRouter } from "./get-orphan-products";
import { batchFixOrphanProductsRouter } from "./batch-fix-orphan-products";
import { batchFixOrphanPaginatedRouter } from "./batch-fix-orphan-paginated";
import { exportAllProductsRouter } from "./export-all-products";
import { fixKnownMisclassificationsRouter } from "./fix-known-misclassifications";
import { diagnoseDatabaseRouter } from "./diagnose-database";
import { findPlateCategoriesRouter } from "./find-plate-categories";
import { getAllCategoriesRouter } from "./get-all-categories";
import { fixProductCategoriesFinalRouter } from "./fix-product-categories-final";
import { fixNullCategoriesRouter } from "./fix-null-categories";
import { checkSyringeFiltersRouter } from "./check-syringe-filters";
import { findGcColumnsRouter } from "./find-gc-columns";
import { createGcCategoriesRouter } from "./create-gc-categories";
import { reclassifyGcProductsRouter } from "./reclassify-gc-products";
import { fixRemainingGcRouter } from "./fix-remaining-gc";
import { checkGcSlugRouter } from "./check-gc-slug";
import { updateYmcTosohRouter } from "./update-ymc-tosoh-router";
import { updateDimensionsRouter } from "./update-dimensions-router";
import { learningCenterRouter } from "./learning-center-api";
import { seedArticlesRouter } from "./seed-articles-router";
import { manualImportRouter } from "./manual-import-api";
import { standardsRouter } from "./standards-api";
// Removed unused imports: uploadProductImagesBatchRouter, fixCapsSeptaRouter


export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,

  // Product routes
  products: router({
    list: publicProcedure
      .input((raw: unknown) => {
        const { productsListInput } = require('./products_list_new');
        return productsListInput.parse(raw);
      })
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const { productsListQuery } = await import('./products_list_new');
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        return await productsListQuery(input, db);
      }),

    getBrandStats: publicProcedure
      .input((raw: unknown) => z.object({ categoryId: z.number().optional() }).parse(raw))
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const { products } = await import('../drizzle/schema');
        const { and, eq, sql } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) return {} as Record<string, number>;

        const conditions = [eq(products.status, 'active')];
        if (input.categoryId) {
          conditions.push(sql`${products.id} IN (SELECT product_id FROM product_categories WHERE category_id = ${input.categoryId})`);
        }
        const rows = await db
          .select({ brand: products.brand, count: sql<number>`COUNT(*)` })
          .from(products)
          .where(and(...conditions))
          .groupBy(products.brand);
        return Object.fromEntries(
          rows
            .filter((row) => Boolean(row.brand))
            .map((row) => [row.brand, Number(row.count)])
        ) as Record<string, number>;
      }),
    
    getByIds: publicProcedure
      .input((raw: unknown) => {
        return z.object({
          productIds: z.array(z.number()),
        }).parse(raw);
      })
      .query(async ({ input }) => {
        return await getProductsByIds(input.productIds);
      }),
    
    getBySlug: publicProcedure
      .input((raw: unknown) => {
        return z.string().parse(raw);
      })
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const { products } = await import('../drizzle/schema');
        const { and, eq } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Public detail lookups must mirror the active-only catalog policy.
        const result = await db
          .select()
          .from(products)
          .where(and(eq(products.slug, input), eq(products.status, 'active')))
          .limit(1);
        
        return result[0] || null;
      }),
    
    getRelated: publicProcedure
      .input((raw: unknown) => {
        return z.object({
          productId: z.string(),
          limit: z.number().optional().default(6),
        }).parse(raw);
      })
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const { products } = await import('../drizzle/schema');
        const { eq, and, or, ne, sql } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // First, get the current product
        const currentProduct = await db
          .select()
          .from(products)
          .where(eq(products.productId, input.productId))
          .limit(1);
        
        if (!currentProduct || currentProduct.length === 0) {
          return [];
        }
        
        const product = currentProduct[0];
        
        // When a product type is recorded, preserve it as a hard compatibility
        // boundary. This prevents a GC column from being recommended alongside
        // unrelated HPLC columns or SPE cartridges merely because the brand matches.
        const normalizedProductType = product.productType?.trim();
        // Within that boundary, prioritize same brand, listed phase, USP, and dimensions.
        const relatedProducts = await db
          .select()
          .from(products)
          .where(
            and(
              ne(products.id, product.id), // Exclude current product
              eq(products.status, 'active'), // Only active products
              normalizedProductType ? eq(products.productType, normalizedProductType) : undefined,
              or(
                eq(products.brand, product.brand), // Same brand
                product.phaseType ? eq(products.phaseType, product.phaseType) : undefined, // Same phase type
                product.usp ? eq(products.usp, product.usp) : undefined, // Same USP
                // Similar particle size (within 1 µm)
                product.particleSize ? sql`ABS(${products.particleSize} - ${product.particleSize}) <= 1` : undefined,
              )
            )
          )
          .limit(input.limit);
        
        return relatedProducts;
      }),
  }),

  // Customer messages contain personal contact details and are restricted to authenticated administrators.
  messages: router({
    list: adminProcedure
      .input((raw: unknown) => {
        return z.object({
          status: z.enum(['new', 'read', 'replied', 'closed', 'all']).optional().default('all'),
          page: z.number().optional().default(1),
          pageSize: z.number().optional().default(20),
          search: z.string().optional(),
        }).parse(raw);
      })
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const { customerMessages } = await import('../drizzle/schema');
        const { eq, desc, or, sql, and } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const conditions = [];
        
        // Status filter
        if (input.status !== 'all') {
          conditions.push(eq(customerMessages.status, input.status));
        }
        
        // Search filter
        if (input.search) {
          const searchTerm = `%${input.search}%`;
          conditions.push(
            or(
              sql`LOWER(${customerMessages.name}) LIKE ${searchTerm.toLowerCase()}`,
              sql`LOWER(${customerMessages.email}) LIKE ${searchTerm.toLowerCase()}`,
              sql`LOWER(${customerMessages.productId}) LIKE ${searchTerm.toLowerCase()}`,
              sql`LOWER(${customerMessages.message}) LIKE ${searchTerm.toLowerCase()}`
            )!
          );
        }
        
        // Build where clause
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        
        // Get total count
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(customerMessages)
          .where(whereClause);
        const total = countResult[0]?.count || 0;
        
        // Get messages with pagination
        const messages = await db
          .select()
          .from(customerMessages)
          .where(whereClause)
          .orderBy(desc(customerMessages.createdAt))
          .limit(input.pageSize)
          .offset((input.page - 1) * input.pageSize);
        
        return {
          messages,
          total,
          totalPages: Math.ceil(total / input.pageSize),
        };
      }),
    
    updateStatus: adminProcedure
      .input((raw: unknown) => {
        return z.object({
          id: z.number(),
          status: z.enum(['new', 'read', 'replied', 'closed']),
        }).parse(raw);
      })
      .mutation(async ({ input }) => {
        const { getDb } = await import('./db');
        const { customerMessages } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db
          .update(customerMessages)
          .set({ status: input.status })
          .where(eq(customerMessages.id, input.id));
        
        return { success: true };
      }),
    
    getStats: adminProcedure
      .query(async () => {
        const { getDb } = await import('./db');
        const { customerMessages } = await import('../drizzle/schema');
        const { eq, sql } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const stats = await db
          .select({
            status: customerMessages.status,
            count: sql<number>`count(*)`
          })
          .from(customerMessages)
          .groupBy(customerMessages.status);
        
        const statsMap = {
          new: 0,
          read: 0,
          replied: 0,
          closed: 0,
          total: 0,
        };
        
        stats.forEach(stat => {
          statsMap[stat.status as keyof typeof statsMap] = stat.count;
          statsMap.total += stat.count;
        });
        
        return statsMap;
      }),
    
    create: publicProcedure
      .input((raw: unknown) => {
        return z.object({
          type: z.enum(['inquiry', 'message', 'quote_request']).default('message'),
          name: z.string().min(2, '姓名至少 2 个字符').max(100, '姓名最多 100 个字符'),
          email: z.string().email('请输入有效的邮箱地址'),
          company: z.string().optional(),
          phone: z.string().optional(),
          productId: z.string().optional(),
          productName: z.string().optional(),
          message: z.string().min(10, '留言至少 10 个字符').max(1000, '留言最多 1000 个字符'),
        }).parse(raw);
      })
      .mutation(async ({ input }) => {
        const { getDb } = await import('./db');
        const { customerMessages } = await import('../drizzle/schema');
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Insert message into database
        const result = await db.insert(customerMessages).values({
          type: input.type || 'message',
          name: input.name,
          email: input.email,
          company: input.company,
          phone: input.phone,
          productId: input.productId,
          productName: input.productName,
          message: input.message,
          status: 'new',
        });
        
        // Send notification email (optional)
        try {
          const { sendCustomerMessageNotification } = await import('./email_notification');
          await sendCustomerMessageNotification({
            type: input.type || 'message',
            name: input.name,
            email: input.email,
            phone: input.phone,
            company: input.company,
            message: input.message,
            productId: input.productId,
            productName: input.productName,
          });
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError);
        }
        
        return {
          success: true,
          messageId: result[0].insertId,
        };
      }),
  }),

  // Inquiry routes
  inquiries: router({
    create: publicProcedure
      .input((raw: unknown) => {
        return z.object({
          productIds: z.array(z.number()).min(1, '请选择至少一个产品'),
          userInfo: z.object({
            name: z.string().min(2, '姓名至少 2 个字符').max(50, '姓名最多 50 个字符'),
            email: z.string().email('请输入有效的邮箱地址'),
            company: z.string().optional(),
            phone: z.string().optional(),
            message: z.string().max(500, '留言最多 500 个字符').optional(),
          }),
        }).parse(raw);
      })
      .mutation(async () => {
        // The legacy inquiry table requires an authenticated owner (userId).
        // Public product messages are handled by customerMessages.create, which
        // stores the minimum necessary contact data without inventing a userId.
        throw new Error('Direct inquiry creation requires an authenticated account. Use the product inquiry form instead.');
      }),
  }),

  // USP Standards routes
  usp: router({
    listWithProductCount: publicProcedure
      .query(async () => {
        const { getAllUSPStandardsWithProductCount } = await import('./db-usp');
        return await getAllUSPStandardsWithProductCount();
      }),
    
    getByCode: publicProcedure
      .input((raw: unknown) => {
        return z.object({
          code: z.string(),
          productLimit: z.number().optional().default(50),
        }).parse(raw);
      })
      .query(async ({ input }) => {
        const { getUSPStandardWithProducts } = await import('./db-usp');
        return await getUSPStandardWithProducts(input.code, input.productLimit);
      }),
    
    fillProductData: publicProcedure
      .mutation(async () => {
        const { fillProductUSPData } = await import('./db-usp');
        return await fillProductUSPData();
      }),
  }),

  // Resources routes
  resources: router({
    list: publicProcedure
      .input((raw: unknown) => {
        return z.object({
          page: z.number().min(1).optional(),
          pageSize: z.number().min(1).max(100).optional(),
          search: z.string().optional(),
          category: z.string().optional(),
        }).optional().parse(raw);
      })
      .query(async ({ input }) => {
        const page = input?.page || 1;
        const pageSize = input?.pageSize || 12;
        const { getDb } = await import('./db');
        const db = await getDb();
        if (!db) {
          return { items: [], total: 0, page, pageSize };
        }

        const { resources } = await import('../drizzle/schema');
        const { eq, like, and, desc } = await import('drizzle-orm');

        // Build where conditions
        const conditions: any[] = [];
        if (input?.search) {
          conditions.push(
            like(resources.title, `%${input.search}%`)
          );
        }
        if (input?.category) {
          conditions.push(eq(resources.category, input.category));
        }

        // Get total count
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const allResources = await db.select().from(resources).where(whereClause);
        const total = allResources.length;

        // Get paginated results
        const offset = (page - 1) * pageSize;
        const results = await db
          .select()
          .from(resources)
          .where(whereClause)
          .orderBy(desc(resources.publishedAt))
          .limit(pageSize)
          .offset(offset);

        return {
          items: results,
          total,
          page,
          pageSize,
        };
      }),

    getBySlug: publicProcedure
      .input((raw: unknown) => {
        return z.object({
          slug: z.string(),
        }).parse(raw);
      })
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const db = await getDb();
        if (!db) {
          return null;
        }

        const { resources } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');

        const results = await db
          .select()
          .from(resources)
          .where(eq(resources.slug, input.slug))
          .limit(1);

        return results.length > 0 ? results[0] : null;
      }),

    listCategories: publicProcedure.query(async () => {
      const { getDb } = await import('./db');
      const db = await getDb();
      if (!db) {
        return [];
      }

      const { resources } = await import('../drizzle/schema');
      const { sql } = await import('drizzle-orm');

      const results = await db
        .select({ category: resources.category })
        .from(resources)
        .groupBy(resources.category);

      return results.map(r => r.category).filter(Boolean);
    }),
  }),

  // Category routes
  category: router({
    getAll: publicProcedure
      .query(async () => {
        const { getDb } = await import('./db');
        const { categories } = await import('../drizzle/schema');
        const { asc } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const result = await db
          .select()
          .from(categories)
          .orderBy(asc(categories.parentId), asc(categories.displayOrder));
        
        return result;
      }),
    
    getWithProductCount: publicProcedure
      .query(async () => {
        const { getDb } = await import('./db');
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Count only active public products and roll each child count into its
        // ancestors. The catalog navigation shows parent nodes such as Sample
        // Preparation, so a direct-only join incorrectly rendered those nodes as 0.
        const result = await db.execute(`
          WITH RECURSIVE category_tree AS (
            SELECT id AS ancestor_id, id AS descendant_id
            FROM categories
            UNION ALL
            SELECT tree.ancestor_id, child.id AS descendant_id
            FROM category_tree tree
            INNER JOIN categories child ON child.parent_id = tree.descendant_id
          ), category_counts AS (
            SELECT tree.ancestor_id AS category_id,
                   COUNT(DISTINCT pc.product_id) AS productCount
            FROM category_tree tree
            INNER JOIN product_categories pc ON pc.category_id = tree.descendant_id
            INNER JOIN products p ON p.id = pc.product_id AND p.status = 'active'
            GROUP BY tree.ancestor_id
          )
          SELECT
            c.id,
            c.name,
            c.name_en as nameEn,
            c.slug,
            c.parent_id as parentId,
            c.level,
            c.display_order as displayOrder,
            c.is_visible as isVisible,
            c.description,
            c.icon,
            c.created_at as createdAt,
            c.updated_at as updatedAt,
            COALESCE(counts.productCount, 0) as productCount
          FROM categories c
          LEFT JOIN category_counts counts ON counts.category_id = c.id
          ORDER BY c.parent_id, c.display_order
        `);
        
        return Array.isArray(result[0]) ? result[0] : [];
      }),
  }),
  
  // Brand routes
  brand: router({
    getWithProductCount: publicProcedure
      .query(async () => {
        const { getDb } = await import('./db');
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Use raw SQL query to get brands with product counts
        const result = await db.execute(`
          SELECT 
            brand,
            COUNT(*) as productCount
          FROM products
          WHERE brand IS NOT NULL AND brand != '' AND status = 'active'
          GROUP BY brand
          ORDER BY productCount DESC, brand ASC        `);
        
        return Array.isArray(result[0]) ? result[0] : [];
      }),
  }),
  
  // Seed APII for importing resources

  // Admin API for data management
  admin: adminRouter,

  // List categories API
  listCategories: listCategoriesRouter,


  // Update product category
  updateProductCategory: updateProductCategoryRouter,

  // Update GlycoWorks using mysql2
  updateGlycoWorksMysql2: updateGlycoWorksMysql2Router,
  cleanupProductCategories: cleanupProductCategoriesRouter,
  checkDataConsistency: checkDataConsistencyRouter,
  describeProductsTable: describeProductsTableRouter,

  // Query categories
  queryCategories: queryCategoriesRouter,

  // Full consistency check
  fullConsistencyCheck: fullConsistencyCheckRouter,

  // Get orphan products
  getOrphanProducts: getOrphanProductsRouter,

  // Batch fix orphan products
  batchFixOrphanProducts: batchFixOrphanProductsRouter,

  // Batch fix orphan products (paginated)
  batchFixOrphanPaginated: batchFixOrphanPaginatedRouter,

  // Export all products
  exportAllProducts: exportAllProductsRouter,

  // Fix known misclassifications
  fixKnownMisclassifications: fixKnownMisclassificationsRouter,

  // Diagnose database structure and categories
  diagnoseDatabase: diagnoseDatabaseRouter,

  // Find plate-related categories
  findPlateCategories: findPlateCategoriesRouter,

  // Get all categories
  getAllCategories: getAllCategoriesRouter,

  // Fix product categories (final version)
  fixProductCategoriesFinal: fixProductCategoriesFinalRouter,

  // Fix products with NULL category_id
  fixNullCategories: fixNullCategoriesRouter,

  // Check syringe filter products
  checkSyringeFilters: checkSyringeFiltersRouter,

  // Find GC column products
  findGcColumns: findGcColumnsRouter,

  // Create GC Column categories
  createGcCategories: createGcCategoriesRouter,

  // Reclassify GC column products
  reclassifyGcProducts: reclassifyGcProductsRouter,

  // Fix remaining GC products
  fixRemainingGc: fixRemainingGcRouter,

  // Check GC categories slug
  checkGcSlug: checkGcSlugRouter,

  // One-time update for YMC and Tosoh product data
  updateYmcTosoh: updateYmcTosohRouter,
  updateDimensions: updateDimensionsRouter,
  
  // Learning Center routes
  learningCenter: learningCenterRouter,
  
  // Seed articles (one-time operation)
  seedArticles: seedArticlesRouter,
  
  // Manual import articles for testing
  manualImport: manualImportRouter,

  // ANPEL Reference Standards
  standards: standardsRouter,
  // Removed unused routers: uploadProductImagesBatch, fixCapsSepta
});

export type AppRouter = typeof appRouter;
