import { publicProcedure, router } from "./_core/trpc";
import { z } from 'zod';

export const adminRouter = router({
  // Add GlycoWorks products
  addGlycoWorksProducts: publicProcedure
    .input((raw: unknown) => {
      return z.object({
        adminKey: z.string(),
      }).parse(raw);
    })
    .mutation(async ({ input }) => {
      // Simple admin key check (in production, use proper authentication)
      if (input.adminKey !== 'temp-admin-2024') {
        throw new Error('Unauthorized');
      }

      const { getDb } = await import('./db');
      const { products, categories } = await import('../drizzle/schema');
      const { eq, or } = await import('drizzle-orm');
      const db = await getDb();

      // Get SPE Cartridges category ID (slug: spe-cartridges)
      const speCategories = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, "spe-cartridges"));

      if (speCategories.length === 0) {
        throw new Error('SPE Cartridges category not found');
      }

      const speCategoryId = speCategories[0].id;

      // Check if products already exist
      const existingProducts = await db
        .select()
        .from(products)
        .where(
          or(
            eq(products.partNumber, "WATS-186007239"),
            eq(products.partNumber, "WATS-186007080")
          )
        );

      const newProducts = [
        {
          partNumber: "WATS-186007239",
          productId: "WATS-186007239",
          name: "GlycoWorks HILIC 1 cc Flangeless Cartridge",
          brand: "Waters",
          categoryId: speCategoryId,
          status: "active" as const,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          partNumber: "WATS-186007080",
          productId: "WATS-186007080",
          name: "GlycoWorks HILIC 1 cc Cartridge, 20/pk",
          brand: "Waters",
          categoryId: speCategoryId,
          status: "active" as const,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const results = [];
      
      for (const product of newProducts) {
        const existing = existingProducts.find(p => p.partNumber === product.partNumber);
        
        if (existing) {
          // Update existing product
          await db
            .update(products)
            .set({
              name: product.name,
              categoryId: product.categoryId,
              updatedAt: new Date()
            })
            .where(eq(products.partNumber, product.partNumber));
          results.push({ partNumber: product.partNumber, action: 'updated' });
        } else {
          // Insert new product
          await db.insert(products).values(product);
          results.push({ partNumber: product.partNumber, action: 'added' });
        }
      }

      return {
        success: true,
        results,
        categoryId: speCategoryId
      };
    }),

  // Batch update metaTitles for high-impression zero-click products
  batchUpdateMetaTitles: publicProcedure
    .input((raw: unknown) => {
      return z.object({
        adminKey: z.string(),
        updates: z.array(z.object({
          partNumber: z.string(),
          metaTitle: z.string(),
        })),
      }).parse(raw);
    })
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') {
        throw new Error('Unauthorized');
      }

      const { getDb } = await import('./db');
      const { products } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const db = await getDb();

      const results = [];

      for (const update of input.updates) {
        try {
          // Verify product exists
          const existing = await db
            .select({ partNumber: products.partNumber, metaTitle: products.metaTitle })
            .from(products)
            .where(eq(products.partNumber, update.partNumber))
            .limit(1);

          if (existing.length === 0) {
            results.push({ partNumber: update.partNumber, status: 'not_found' });
            continue;
          }

          await db
            .update(products)
            .set({ metaTitle: update.metaTitle, updatedAt: new Date() })
            .where(eq(products.partNumber, update.partNumber));

          results.push({
            partNumber: update.partNumber,
            status: 'updated',
            oldMetaTitle: existing[0].metaTitle,
            newMetaTitle: update.metaTitle,
          });
        } catch (err) {
          results.push({ partNumber: update.partNumber, status: 'error', error: String(err) });
        }
      }

      return { success: true, results };
    }),

  // Batch update metaTitles by product ID (for products where partNumber-based update fails)
  batchUpdateMetaTitlesById: publicProcedure
    .input((raw: unknown) => {
      return z.object({
        adminKey: z.string(),
        updates: z.array(z.object({
          id: z.number(),
          metaTitle: z.string(),
        })),
      }).parse(raw);
    })
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') {
        throw new Error('Unauthorized');
      }
      const { getDb } = await import('./db');
      const { products } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const db = await getDb();
      const results = [];
      for (const update of input.updates) {
        try {
          const existing = await db
            .select({ id: products.id, partNumber: products.partNumber, metaTitle: products.metaTitle })
            .from(products)
            .where(eq(products.id, update.id))
            .limit(1);
          if (existing.length === 0) {
            results.push({ id: update.id, status: 'not_found' });
            continue;
          }
          await db
            .update(products)
            .set({ metaTitle: update.metaTitle })
            .where(eq(products.id, update.id));
          results.push({
            id: update.id,
            partNumber: existing[0].partNumber,
            status: 'updated',
            oldMetaTitle: existing[0].metaTitle,
            newMetaTitle: update.metaTitle,
          });
        } catch (err) {
          results.push({ id: update.id, status: 'error', error: String(err) });
        }
      }
      return { success: true, results };
    }),

  // Check data consistency
  checkDataConsistency: publicProcedure
    .input((raw: unknown) => {
      return z.object({
        adminKey: z.string(),
      }).parse(raw);
    })
    .query(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') {
        throw new Error('Unauthorized');
      }

      const { getDb } = await import('./db');
      const { products, categories } = await import('../drizzle/schema');
      const { eq, sql } = await import('drizzle-orm');
      const db = await getDb();

      // Total products
      const totalProductsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(products);
      const totalProducts = totalProductsResult[0].count;

      // Active products
      const activeProductsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.status, "active"));
      const activeProducts = activeProductsResult[0].count;

      // Products by category
      const categoryStats = await db
        .select({
          categoryId: products.categoryId,
          categoryName: categories.nameEn,
          count: sql<number>`count(*)`
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .groupBy(products.categoryId, categories.nameEn);

      // Products with NULL category
      const nullCategoryResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(sql`${products.categoryId} IS NULL`);
      const nullCategoryCount = nullCategoryResult[0].count;

      // Check for duplicate part numbers
      const duplicates = await db.execute(sql`
        SELECT part_number, COUNT(*) as count 
        FROM products 
        GROUP BY part_number 
        HAVING count > 1
      `);

      // Waters brand products
      const watersProductsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.brand, "Waters"));
      const watersProducts = watersProductsResult[0].count;

      return {
        totalProducts,
        activeProducts,
        categoryStats,
        nullCategoryCount,
        duplicatePartNumbers: duplicates.rows,
        watersProducts
      };
    }),

  // Batch create resources/articles
  createResources: publicProcedure
    .input((raw: unknown) => {
      return z.object({
        adminKey: z.string(),
        resources: z.array(z.object({
          title: z.string(),
          slug: z.string(),
          content: z.string(),
          excerpt: z.string().optional(),
          category: z.string().optional(),
          author: z.string().optional(),
          tags: z.array(z.string()).optional(),
          publishedAt: z.string().optional(),
          status: z.string().optional(),
        })),
      }).parse(raw);
    })
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') {
        throw new Error('Unauthorized');
      }
      const { getDb } = await import('./db');
      const { resources } = await import('../drizzle/schema');
      const db = await getDb();
      const results = [];
      for (const resource of input.resources) {
        try {
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          await db.insert(resources).values({
            title: resource.title,
            slug: resource.slug,
            content: resource.content,
            excerpt: resource.excerpt || null,
            category: resource.category || null,
            author: resource.author || null,
            tags: resource.tags ? JSON.stringify(resource.tags) : null,
            publishedAt: resource.publishedAt || now,
            status: resource.status || 'published',
            views: 0,
            createdAt: now,
            updatedAt: now,
          });
          results.push({ slug: resource.slug, status: 'created' });
        } catch (err: any) {
          if (err?.message?.includes('Duplicate')) {
            results.push({ slug: resource.slug, status: 'duplicate_skipped' });
          } else {
            results.push({ slug: resource.slug, status: 'error', error: String(err) });
          }
        }
      }
      return { success: true, results };
    }),

  // List all draft resources (for date update)
  listDraftResources: publicProcedure
    .input((raw: unknown) => {
      return z.object({
        adminKey: z.string(),
        limit: z.number().optional(),
      }).parse(raw);
    })
    .query(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') {
        throw new Error('Unauthorized');
      }
      const { getDb } = await import('./db');
      const { resources } = await import('../drizzle/schema');
      const { eq, desc } = await import('drizzle-orm');
      const db = await getDb();
      const items = await db
        .select({ id: resources.id, title: resources.title, slug: resources.slug, publishedAt: resources.publishedAt, status: resources.status })
        .from(resources)
        .where(eq(resources.status, 'draft'))
        .orderBy(desc(resources.id))
        .limit(input.limit || 200);
      return { success: true, count: items.length, items };
    }),

  // Batch update publishedAt dates for resources
  updateResourcesDates: publicProcedure
    .input((raw: unknown) => {
      return z.object({
        adminKey: z.string(),
        updates: z.array(z.object({
          id: z.number(),
          publishedAt: z.string(),
        })),
      }).parse(raw);
    })
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') {
        throw new Error('Unauthorized');
      }
      const { getDb } = await import('./db');
      const { resources } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const db = await getDb();
      let updated = 0;
      for (const update of input.updates) {
        await db.update(resources)
          .set({ publishedAt: update.publishedAt })
          .where(eq(resources.id, update.id));
        updated++;
      }
      return { success: true, updated };
    }),

  // Batch set product status (active/inactive) by product ID list
  // Used for bulk product discontinuation/reactivation operations
  batchSetProductStatus: publicProcedure
    .input((raw: unknown) => {
      return z.object({
        adminKey: z.string(),
        productIds: z.array(z.number()),
        status: z.enum(['active', 'inactive']),
      }).parse(raw);
    })
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') {
        throw new Error('Unauthorized');
      }
      const { getDb } = await import('./db');
      const { products } = await import('../drizzle/schema');
      const { inArray } = await import('drizzle-orm');
      const db = await getDb();
      const results: { id: number; status: string }[] = [];
      // Process in batches of 50 to avoid query size limits
      const batchSize = 50;
      let totalUpdated = 0;
      for (let i = 0; i < input.productIds.length; i += batchSize) {
        const batch = input.productIds.slice(i, i + batchSize);
        try {
          await db.update(products)
            .set({ status: input.status })
            .where(inArray(products.id, batch));
          batch.forEach(id => results.push({ id, status: 'updated' }));
          totalUpdated += batch.length;
        } catch (err) {
          batch.forEach(id => results.push({ id, status: 'error' }));
        }
      }
      return { success: true, totalUpdated, results };
    }),

  // Publish all draft resources (for scheduled task on 2026-06-10)
  publishDraftResources: publicProcedure
    .input((raw: unknown) => {
      return z.object({
        adminKey: z.string(),
      }).parse(raw);
    })
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') {
        throw new Error('Unauthorized');
      }
      const { getDb } = await import('./db');
      const { resources } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const db = await getDb();
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const result = await db.update(resources)
        .set({ status: 'published', updatedAt: now })
        .where(eq(resources.status, 'draft'));
      return { success: true, message: 'All draft resources have been published.' };
    }),
});
