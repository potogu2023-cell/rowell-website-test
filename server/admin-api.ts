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
      if (!db) throw new Error('Database unavailable');

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
          prefix: "WATS",
          name: "GlycoWorks HILIC 1 cc Flangeless Cartridge",
          brand: "Waters",
          categoryId: speCategoryId,
          status: "active" as const,
          createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
          updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
        },
        {
          partNumber: "WATS-186007080",
          productId: "WATS-186007080",
          prefix: "WATS",
          name: "GlycoWorks HILIC 1 cc Cartridge, 20/pk",
          brand: "Waters",
          categoryId: speCategoryId,
          status: "active" as const,
          createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
          updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
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
              updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
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
      if (!db) throw new Error('Database unavailable');

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
            .set({ metaTitle: update.metaTitle, updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') })
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
          metaDescription: z.string().optional(),
          detailedDescription: z.string().optional(),
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
      if (!db) throw new Error('Database unavailable');
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
          const setFields: Record<string, unknown> = { metaTitle: update.metaTitle };
          if (update.metaDescription !== undefined) {
            setFields.metaDescription = update.metaDescription;
          }
          if (update.detailedDescription !== undefined) {
            setFields.detailedDescription = update.detailedDescription;
          }
          await db
            .update(products)
            .set(setFields as any)
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

  // Clear public product descriptions only. This endpoint is intentionally
  // destructive-only: it cannot create or alter product facts, specifications,
  // status, pricing, or images.
  batchClearProductDescriptions: publicProcedure
    .input((raw: unknown) => {
      return z.object({
        adminKey: z.string(),
        ids: z.array(z.number().int().positive()).min(1).max(50),
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
      if (!db) throw new Error('Database unavailable');
      const results: Array<{ id: number; partNumber?: string; status: 'cleared' | 'not_found' | 'error'; error?: string }> = [];

      for (const id of input.ids) {
        try {
          const existing = await db
            .select({ id: products.id, partNumber: products.partNumber })
            .from(products)
            .where(eq(products.id, id))
            .limit(1);
          if (existing.length === 0) {
            results.push({ id, status: 'not_found' });
            continue;
          }
          await db
            .update(products)
            .set({ description: null, detailedDescription: null })
            .where(eq(products.id, id));
          results.push({ id, partNumber: existing[0].partNumber, status: 'cleared' });
        } catch (err) {
          results.push({ id, status: 'error', error: String(err) });
        }
      }
      return { success: true, results };
    }),

  // Bind approved product images by numeric product ID. Restrict image URLs to the
  // controlled Manus CDN to prevent arbitrary external image injection.
  batchUpdateProductImageUrls: publicProcedure
    .input((raw: unknown) => {
      return z.object({
        adminKey: z.string(),
        updates: z.array(z.object({
          id: z.number().int().positive(),
          imageUrl: z.string().url().max(500).refine(
            (url) => url.startsWith('https://files.manuscdn.com/'),
            'imageUrl must use the controlled files.manuscdn.com domain'
          ),
        })).min(1).max(50),
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
      if (!db) throw new Error('Database unavailable');
      const results: Array<{
        id: number;
        partNumber?: string;
        status: 'updated' | 'not_found' | 'error';
        oldImageUrl?: string | null;
        newImageUrl?: string;
        error?: string;
      }> = [];

      for (const update of input.updates) {
        try {
          const existing = await db
            .select({ id: products.id, partNumber: products.partNumber, imageUrl: products.imageUrl })
            .from(products)
            .where(eq(products.id, update.id))
            .limit(1);
          if (existing.length === 0) {
            results.push({ id: update.id, status: 'not_found' });
            continue;
          }
          await db
            .update(products)
            .set({ imageUrl: update.imageUrl, updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') })
            .where(eq(products.id, update.id));
          results.push({
            id: update.id,
            partNumber: existing[0].partNumber,
            status: 'updated',
            oldImageUrl: existing[0].imageUrl,
            newImageUrl: update.imageUrl,
          });
        } catch (error) {
          results.push({ id: update.id, status: 'error', error: String(error) });
        }
      }

      return {
        success: results.every((result) => result.status === 'updated'),
        totalUpdated: results.filter((result) => result.status === 'updated').length,
        results,
      };
    }),

  // Remove public images that have been audited as incorrect, branded, or otherwise noncompliant.
  // This destructive-only endpoint cannot bind a replacement image or modify product facts.
  batchClearProductImages: publicProcedure
    .input((raw: unknown) => {
      return z.object({
        adminKey: z.string(),
        ids: z.array(z.number().int().positive()).min(1).max(50),
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
      if (!db) throw new Error('Database unavailable');
      const results: Array<{ id: number; partNumber?: string; status: 'cleared' | 'not_found' | 'error'; oldImageUrl?: string | null; error?: string }> = [];

      for (const id of input.ids) {
        try {
          const existing = await db
            .select({ id: products.id, partNumber: products.partNumber, imageUrl: products.imageUrl })
            .from(products)
            .where(eq(products.id, id))
            .limit(1);
          if (existing.length === 0) {
            results.push({ id, status: 'not_found' });
            continue;
          }
          await db
            .update(products)
            .set({ imageUrl: null, updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') })
            .where(eq(products.id, id));
          results.push({
            id,
            partNumber: existing[0].partNumber,
            status: 'cleared',
            oldImageUrl: existing[0].imageUrl,
          });
        } catch (error) {
          results.push({ id, status: 'error', error: String(error) });
        }
      }

      return {
        success: results.every((result) => result.status === 'cleared'),
        totalCleared: results.filter((result) => result.status === 'cleared').length,
        results,
      };
    }),

  // Correct only the nine HyperSep SPE records independently verified on Thermo Fisher model pages.
  // The server owns the allowed identity and target value so this route cannot be repurposed for broad product edits.
  correctVerifiedHyperSepSpeProductTypes: publicProcedure
    .input((raw: unknown) => {
      return z.object({
        adminKey: z.string(),
        updates: z.array(z.object({
          id: z.number().int().positive(),
          expectedPartNumber: z.string().min(1),
          expectedBrand: z.literal('Thermo Fisher'),
          evidenceUrl: z.string().url(),
        })).min(1).max(9),
      }).parse(raw);
    })
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') {
        throw new Error('Unauthorized');
      }
      const approved = new Map<string, { id: number; evidenceUrl: string }>([
        ['60108-301', { id: 31479, evidenceUrl: 'https://www.thermofisher.com/order/catalog/product/60108-301' }],
        ['60108-302', { id: 31473, evidenceUrl: 'https://www.thermofisher.com/order/catalog/product/60108-302' }],
        ['60108-303', { id: 31475, evidenceUrl: 'https://www.thermofisher.com/order/catalog/product/60108-303' }],
        ['60108-304', { id: 31476, evidenceUrl: 'https://www.thermofisher.com/order/catalog/product/60108-304' }],
        ['60108-305', { id: 31477, evidenceUrl: 'https://www.thermofisher.com/order/catalog/product/60108-305' }],
        ['60108-376', { id: 31471, evidenceUrl: 'https://www.thermofisher.com/order/catalog/product/60108-376' }],
        ['60108-390', { id: 31472, evidenceUrl: 'https://www.thermofisher.com/order/catalog/product/60108-390' }],
        ['60108-701', { id: 31481, evidenceUrl: 'https://www.thermofisher.com/order/catalog/product/60108-701' }],
        ['60108-702', { id: 31483, evidenceUrl: 'https://www.thermofisher.com/order/catalog/product/60108-702' }],
      ]);
      const { getDb } = await import('./db');
      const { products } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');
      const results: Array<{ id: number; partNumber: string; status: 'updated' | 'already_correct' | 'identity_mismatch' | 'not_found' | 'not_approved' }> = [];
      for (const update of input.updates) {
        const approvedRecord = approved.get(update.expectedPartNumber);
        if (!approvedRecord || approvedRecord.id !== update.id || approvedRecord.evidenceUrl !== update.evidenceUrl) {
          results.push({ id: update.id, partNumber: update.expectedPartNumber, status: 'not_approved' });
          continue;
        }
        const existing = await db.select({ id: products.id, partNumber: products.partNumber, brand: products.brand, productType: products.productType })
          .from(products).where(eq(products.id, update.id)).limit(1);
        if (existing.length === 0) {
          results.push({ id: update.id, partNumber: update.expectedPartNumber, status: 'not_found' });
          continue;
        }
        if (existing[0].partNumber !== update.expectedPartNumber || existing[0].brand !== update.expectedBrand) {
          results.push({ id: update.id, partNumber: existing[0].partNumber, status: 'identity_mismatch' });
          continue;
        }
        if (existing[0].productType === 'Solid Phase Extraction Cartridge') {
          results.push({ id: update.id, partNumber: existing[0].partNumber, status: 'already_correct' });
          continue;
        }
        await db.update(products).set({ productType: 'Solid Phase Extraction Cartridge', updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') }).where(eq(products.id, update.id));
        results.push({ id: update.id, partNumber: existing[0].partNumber, status: 'updated' });
      }
      return { success: results.every((result) => result.status === 'updated' || result.status === 'already_correct'), results };
    }),

  // Correct verified product identity and raw specifications only. This endpoint intentionally excludes
  // prices, inventory, fulfillment promises, image URLs, and status to keep evidence-backed corrections narrow.
  batchCorrectVerifiedProductFacts: publicProcedure
    .input((raw: unknown) => {
      return z.object({
        adminKey: z.string(),
        updates: z.array(z.object({
          id: z.number().int().positive(),
          name: z.string().min(3).max(255),
          description: z.string().max(3000).nullable().optional(),
          detailedDescription: z.string().max(12000).nullable().optional(),
          productType: z.string().max(100).optional(),
          category: z.string().max(100).optional(),
          applications: z.string().max(1000).nullable().optional(),
          particleSize: z.string().max(50).nullable().optional(),
          poreSize: z.string().max(50).nullable().optional(),
          columnLength: z.string().max(50).nullable().optional(),
          innerDiameter: z.string().max(50).nullable().optional(),
          phRange: z.string().max(50).nullable().optional(),
          maxPressure: z.string().max(50).nullable().optional(),
          maxTemperature: z.string().max(50).nullable().optional(),
          usp: z.string().max(50).nullable().optional(),
          phaseType: z.string().max(100).nullable().optional(),
          particleSizeNum: z.number().int().positive().nullable().optional(),
          poreSizeNum: z.number().int().positive().nullable().optional(),
          columnLengthNum: z.number().int().positive().nullable().optional(),
          innerDiameterNum: z.number().int().positive().nullable().optional(),
          phMin: z.number().int().nullable().optional(),
          phMax: z.number().int().nullable().optional(),
          catalogUrl: z.string().url().max(500).optional(),
          metaTitle: z.string().max(70).optional(),
          metaDescription: z.string().max(155).optional(),
        })).min(1).max(10),
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
      if (!db) throw new Error('Database unavailable');
      const results: Array<{ id: number; partNumber?: string; status: 'updated' | 'not_found' | 'error'; changedFields?: string[]; error?: string }> = [];

      for (const update of input.updates) {
        try {
          const existing = await db
            .select({ id: products.id, partNumber: products.partNumber })
            .from(products)
            .where(eq(products.id, update.id))
            .limit(1);
          if (existing.length === 0) {
            results.push({ id: update.id, status: 'not_found' });
            continue;
          }

          const setFields: Record<string, unknown> = { name: update.name, updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') };
          const optionalFields = [
            'description', 'detailedDescription', 'productType', 'category', 'applications', 'particleSize', 'poreSize',
            'columnLength', 'innerDiameter', 'phRange', 'maxPressure', 'maxTemperature', 'usp', 'phaseType',
            'particleSizeNum', 'poreSizeNum', 'columnLengthNum', 'innerDiameterNum', 'phMin', 'phMax',
            'catalogUrl', 'metaTitle', 'metaDescription',
          ] as const;
          for (const field of optionalFields) {
            if (update[field] !== undefined) setFields[field] = update[field];
          }

          await db.update(products).set(setFields as any).where(eq(products.id, update.id));
          results.push({
            id: update.id,
            partNumber: existing[0].partNumber,
            status: 'updated',
            changedFields: Object.keys(setFields).filter((field) => field !== 'updatedAt'),
          });
        } catch (error) {
          results.push({ id: update.id, status: 'error', error: String(error) });
        }
      }

      return {
        success: results.every((result) => result.status === 'updated'),
        totalUpdated: results.filter((result) => result.status === 'updated').length,
        results,
      };
    }),

  // Correct verified product dimensions and display names only; intentionally narrow to prevent broad product edits.
  batchCorrectProductDimensions: publicProcedure
    .input((raw: unknown) => {
      return z.object({
        adminKey: z.string(),
        updates: z.array(z.object({
          id: z.number(),
          name: z.string().min(3).max(255).optional(),
          columnLength: z.string().regex(/^\d+(?:\.\d+)?mm$/),
          columnLengthNum: z.number().positive(),
        })).min(1).max(50),
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
      if (!db) throw new Error('Database unavailable');
      const results = [];
      for (const update of input.updates) {
        const existing = await db
          .select({ id: products.id, partNumber: products.partNumber, name: products.name, columnLength: products.columnLength })
          .from(products)
          .where(eq(products.id, update.id))
          .limit(1);
        if (existing.length === 0) {
          results.push({ id: update.id, status: 'not_found' });
          continue;
        }
        await db
          .update(products)
          .set({
            ...(update.name ? { name: update.name } : {}),
            columnLength: update.columnLength,
            columnLengthNum: update.columnLengthNum,
          })
          .where(eq(products.id, update.id));
        results.push({
          id: update.id,
          partNumber: existing[0].partNumber,
          status: 'updated',
          oldName: existing[0].name,
          newName: update.name ?? existing[0].name,
          oldColumnLength: existing[0].columnLength,
          newColumnLength: update.columnLength,
        });
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
      if (!db) throw new Error('Database unavailable');

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
        duplicatePartNumbers: duplicates,
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
      if (!db) throw new Error('Database unavailable');
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
      if (!db) throw new Error('Database unavailable');
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
      if (!db) throw new Error('Database unavailable');
      let updated = 0;
      for (const update of input.updates) {
        await db.update(resources)
          .set({ publishedAt: update.publishedAt })
          .where(eq(resources.id, update.id));
        updated++;
      }
      return { success: true, updated };
    }),

  // Correct only two audited C18 resource catalog links. The server owns the exact IDs, slugs,
  // old fragments, and replacements so this endpoint cannot update unrelated editorial content.
  correctAuditedC18ResourceCatalogLinks: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const audited = [
        {
          id: 90001,
          slug: 'hplc-c18-column-selection-guide',
          oldFragment: 'For the workflows discussed in this guide, browse ROWELL\'s [HPLC column catalog](/products?category=1) to compare stationary phases, dimensions, and manufacturer options.',
          newFragment: 'For the workflows discussed in this guide, browse ROWELL\'s [C18 HPLC column collection](/categories/c18-columns) to compare current listings, then review [HPLC guard-column considerations](/categories/guard-columns) where protection is method-compatible.',
        },
        {
          id: 90036,
          slug: 'c18-vs-c8-hplc-column-selection-guide',
          oldFragment: 'For the workflows discussed in this guide, browse ROWELL\'s [HPLC column catalog](/products?category=1) to compare stationary phases, dimensions, and manufacturer options.',
          newFragment: 'For the workflows discussed in this guide, browse ROWELL\'s [C18 HPLC column collection](/categories/c18-columns) and [C8 HPLC column collection](/categories/c8-hplc-columns) to compare current listings for a method evaluation.',
        },
      ] as const;
      const { getDb } = await import('./db');
      const { resources } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const results: Array<{ id: number; slug: string; status: 'updated' | 'already_correct' | 'identity_mismatch' | 'fragment_mismatch' | 'not_found' }> = [];
      for (const item of audited) {
        const existing = await db.select({ id: resources.id, slug: resources.slug, content: resources.content }).from(resources).where(eq(resources.id, item.id)).limit(1);
        if (existing.length === 0) {
          results.push({ id: item.id, slug: item.slug, status: 'not_found' });
          continue;
        }
        if (existing[0].slug !== item.slug) {
          results.push({ id: item.id, slug: existing[0].slug, status: 'identity_mismatch' });
          continue;
        }
        const content = existing[0].content || '';
        if (content.includes(item.newFragment)) {
          results.push({ id: item.id, slug: item.slug, status: 'already_correct' });
          continue;
        }
        if (!content.includes(item.oldFragment)) {
          results.push({ id: item.id, slug: item.slug, status: 'fragment_mismatch' });
          continue;
        }
        await db.update(resources).set({ content: content.replace(item.oldFragment, item.newFragment), updatedAt: now }).where(eq(resources.id, item.id));
        results.push({ id: item.id, slug: item.slug, status: 'updated' });
      }
      return { success: results.every((result) => result.status === 'updated' || result.status === 'already_correct'), results };
    }),

  // Batch update resource/article content by numeric ID. This is used for
  // audited editorial updates such as adding topic-relevant internal links.
  batchUpdateResourceContents: publicProcedure
    .input((raw: unknown) => {
      return z.object({
        adminKey: z.string(),
        updates: z.array(z.object({
          id: z.number(),
          content: z.string().min(1),
        })).min(1).max(150),
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
      if (!db) throw new Error('Database unavailable');
      const results: { id: number; status: 'updated' | 'error' }[] = [];
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

      for (const update of input.updates) {
        try {
          await db.update(resources)
            .set({ content: update.content, updatedAt: now })
            .where(eq(resources.id, update.id));
          results.push({ id: update.id, status: 'updated' });
        } catch (error) {
          console.error('[Admin] Failed to update resource content:', update.id, error);
          results.push({ id: update.id, status: 'error' });
        }
      }

      return {
        success: results.every((result) => result.status === 'updated'),
        totalUpdated: results.filter((result) => result.status === 'updated').length,
        results,
      };
    }),

  // Batch update article content by numeric ID. This is intentionally restricted to
  // audited editorial syncs and does not expose article metadata, author, status, or product fields.
  batchUpdateArticleContents: publicProcedure
    .input((raw: unknown) => {
      return z.object({
        adminKey: z.string(),
        updates: z.array(z.object({
          id: z.number().int().positive(),
          content: z.string().min(1).max(60000),
        })).min(1).max(25),
      }).parse(raw);
    })
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') {
        throw new Error('Unauthorized');
      }
      const { getDb } = await import('./db');
      const { articles } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');
      const results: Array<{ id: number; status: 'updated' | 'not_found' | 'error'; error?: string }> = [];
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

      for (const update of input.updates) {
        try {
          const existing = await db.select({ id: articles.id }).from(articles).where(eq(articles.id, update.id)).limit(1);
          if (existing.length === 0) {
            results.push({ id: update.id, status: 'not_found' });
            continue;
          }
          await db.update(articles).set({ content: update.content, updatedAt: now }).where(eq(articles.id, update.id));
          results.push({ id: update.id, status: 'updated' });
        } catch (error) {
          results.push({ id: update.id, status: 'error', error: String(error) });
        }
      }

      return {
        success: results.every((result) => result.status === 'updated'),
        totalUpdated: results.filter((result) => result.status === 'updated').length,
        results,
      };
    }),

  // Batch set product status (active/inactive) by product ID list.
  // Used for bulk product discontinuation/reactivation operations.
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
      if (!db) throw new Error('Database unavailable');
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

  // Narrow, evidence-gated discontinuation route for the first 2026-08-19 fact-verification tranche.
  // It deliberately accepts only the two exact Thermo Fisher records whose official
  // product pages explicitly state that the SKUs are discontinued. No other record,
  // field, status transition, or brand can be changed through this route.
  deactivateAuditedDiscontinuedProducts: publicProcedure
    .input((raw: unknown) => z.object({
      adminKey: z.string(),
      updates: z.array(z.object({
        id: z.number().int().positive(),
        expectedPartNumber: z.string().min(1).max(100),
        expectedBrand: z.string().min(1).max(100),
        evidenceUrl: z.string().url(),
      })).min(1).max(2),
    }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');

      const allowedEvidence = new Map<number, { partNumber: string; brand: string; evidenceUrl: string }>([
        [150001, {
          partNumber: '037042',
          brand: 'Thermo Fisher',
          evidenceUrl: 'https://www.thermofisher.com/order/catalog/product/037042',
        }],
        [150002, {
          partNumber: '043182',
          brand: 'Thermo Fisher',
          evidenceUrl: 'https://www.thermofisher.com/order/catalog/product/043182',
        }],
      ]);
      const ids = input.updates.map((update) => update.id);
      if (new Set(ids).size !== ids.length) throw new Error('Duplicate product IDs are not allowed');
      for (const update of input.updates) {
        const allowed = allowedEvidence.get(update.id);
        if (!allowed ||
          update.expectedPartNumber !== allowed.partNumber ||
          update.expectedBrand !== allowed.brand ||
          update.evidenceUrl !== allowed.evidenceUrl) {
          throw new Error(`Update is not eligible for evidence-gated deactivation: ${update.id}`);
        }
      }

      const { getDb } = await import('./db');
      const { products } = await import('../drizzle/schema');
      const { eq, inArray } = await import('drizzle-orm');
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');
      const currentProducts = await db.select().from(products).where(inArray(products.id, ids));
      if (currentProducts.length !== ids.length) throw new Error('One or more audited products no longer exist');
      for (const update of input.updates) {
        const current = currentProducts.find((product: any) => product.id === update.id);
        if (!current || current.partNumber !== update.expectedPartNumber || current.brand !== update.expectedBrand) {
          throw new Error(`Current database identity does not match audited evidence: ${update.id}`);
        }
      }

      await db.transaction(async (tx: any) => {
        for (const update of input.updates) {
          await tx.update(products).set({ status: 'inactive' }).where(eq(products.id, update.id));
        }
      });

      return {
        success: true,
        deactivated: input.updates.map((update) => ({
          id: update.id,
          partNumber: update.expectedPartNumber,
          brand: update.expectedBrand,
          status: 'inactive',
        })),
      };
    }),

  // Batch import new products from CSV data (SUBTASK-005)
  batchImportProducts: publicProcedure
    .input((raw: unknown) => {
      return z.object({
        adminKey: z.string(),
        products: z.array(z.object({
          brand: z.string(),
          partNumber: z.string(),
          name: z.string(),
          productType: z.string(),
          description: z.string().optional(),
          detailedDescription: z.string().optional(),
          particleSize: z.string().optional(),
          poreSize: z.string().optional(),
          columnLength: z.string().optional(),
          innerDiameter: z.string().optional(),
          phaseType: z.string().optional(),
          applications: z.string().optional(),
        })),
      }).parse(raw);
    })
        .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') {
        throw new Error('Unauthorized');
      }
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');

      // Brand prefix mapping
      const brandPrefixMap: Record<string, string> = {
        'Thermo Fisher': 'THER',
        'Agilent': 'AGIL',
        'Restek': 'RES',
        'Phenomenex': 'PHE',
      };
      // Category ID mapping
      const categoryIdMap: Record<string, number> = {
        'HPLC Column': 1,
        'GC Column': 30001,
      };
      // Helper: extract numeric value from string like "2.7um", "50mm", "30m"
      const extractNum = (s: string | undefined): number | null => {
        if (!s) return null;
        const m = s.match(/[\d.]+/);
        return m ? Math.round(parseFloat(m[0])) : null;
      };
      // Helper: extract columnLength in mm (convert m to mm)
      const extractColumnLengthMm = (s: string | undefined): number | null => {
        if (!s) return null;
        const m = s.match(/[\d.]+/);
        if (!m) return null;
        const val = parseFloat(m[0]);
        if (s.includes('m') && !s.toLowerCase().includes('mm')) {
          return Math.round(val * 1000);
        }
        return Math.round(val);
      };

      const results: Array<{ partNumber: string; action: string; productId?: string; error?: string }> = [];
      let inserted = 0, skipped = 0, errors = 0;
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

      for (const row of input.products) {
        try {
          // Check if product already exists
          const [existRows] = await pool.execute(
            'SELECT id FROM products WHERE partNumber = ? LIMIT 1',
            [row.partNumber]
          ) as any;
          if (existRows.length > 0) {
            skipped++;
            results.push({ partNumber: row.partNumber, action: 'skipped', error: 'already exists' });
            continue;
          }
          // Generate productId and prefix
          const prefix = brandPrefixMap[row.brand];
          if (!prefix) {
            errors++;
            results.push({ partNumber: row.partNumber, action: 'error', error: `Unknown brand: ${row.brand}` });
            continue;
          }
          const productId = `${prefix}-${row.partNumber}`;
          const categoryId = categoryIdMap[row.productType] ?? null;

          // Insert product using raw SQL (imageUrl always null)
          await pool.execute(
            `INSERT INTO products
              (productId, partNumber, brand, prefix, name, productType, description, detailedDescription,
               particleSize, particleSizeNum, poreSize, poreSizeNum,
               columnLength, columnLengthNum, innerDiameter, innerDiameterNum,
               phaseType, applications, imageUrl, category_id, status, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 'active', ?, ?)`,
            [
              productId, row.partNumber, row.brand, prefix, row.name, row.productType,
              row.description || null, row.detailedDescription || null,
              row.particleSize || null, extractNum(row.particleSize),
              row.poreSize || null, extractNum(row.poreSize),
              row.columnLength || null, extractColumnLengthMm(row.columnLength),
              row.innerDiameter || null, extractNum(row.innerDiameter),
              row.phaseType || null, row.applications || null,
              categoryId, now, now,
            ]
          );
          inserted++;
          results.push({ partNumber: row.partNumber, action: 'inserted', productId });
        } catch (err: any) {
          errors++;
          const errDetail = `code=${err.code} errno=${err.errno} sqlMessage=${err.sqlMessage} msg=${err.message}`;
          results.push({ partNumber: row.partNumber, action: 'error', error: errDetail });
        }
      }
      return {
        success: true,
        summary: { inserted, skipped, errors, total: input.products.length },
        results,
      };
    }),

  // Insert first-party-verified consumables without modifying any existing product.
  // This route is intentionally narrow: it only supports the four Accessories leaf
  // categories and only the brands for which a first-party SKU page was audited.
  batchInsertVerifiedConsumables: publicProcedure
    .input((raw: unknown) => {
      return z.object({
        adminKey: z.string(),
        products: z.array(z.object({
          brand: z.enum(['Thermo Fisher', 'Restek', 'Waters']),
          partNumber: z.string().min(1).max(128),
          name: z.string().min(3).max(255),
          productType: z.string().min(3).max(100),
          categoryId: z.number().int().refine((id) => [19, 20, 21, 22].includes(id)),
          category: z.enum(['Vials', 'Caps & Septa', 'Syringes', 'Fittings & Tubing']),
          description: z.string().min(10).max(2000),
          detailedDescription: z.string().min(20).max(5000),
          specifications: z.record(z.string(), z.unknown()),
          catalogUrl: z.string().url().max(500),
        })).min(1).max(20),
      }).parse(raw);
    })
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') {
        throw new Error('Unauthorized');
      }
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');

      const categoryNames: Record<number, string> = {
        19: 'Vials',
        20: 'Caps & Septa',
        21: 'Syringes',
        22: 'Fittings & Tubing',
      };
      const prefixes: Record<'Thermo Fisher' | 'Restek' | 'Waters', string> = {
        'Thermo Fisher': 'THER',
        Restek: 'RESTEK',
        Waters: 'WATERS',
      };
      const allowedHosts: Record<'Thermo Fisher' | 'Restek' | 'Waters', string[]> = {
        'Thermo Fisher': ['thermofisher.com'],
        Restek: ['restek.com'],
        Waters: ['waters.com'],
      };
      // Production's legacy products table requires a non-null taskId. This new,
      // batch-specific identifier preserves provenance instead of reusing an
      // unrelated historical import task.
      const importTaskId = 'manual-verified-consumables-20260819';
      const results: Array<{ partNumber: string; status: 'inserted' | 'skipped' | 'error'; id?: number; slug?: string; error?: string }> = [];

      for (const row of input.products) {
        if (categoryNames[row.categoryId] !== row.category) {
          results.push({ partNumber: row.partNumber, status: 'error', error: 'categoryId/category mismatch' });
          continue;
        }
        let catalogHost = '';
        try {
          catalogHost = new URL(row.catalogUrl).hostname.toLowerCase();
        } catch {
          results.push({ partNumber: row.partNumber, status: 'error', error: 'invalid catalog URL' });
          continue;
        }
        if (!allowedHosts[row.brand].some((host) => catalogHost === host || catalogHost.endsWith(`.${host}`))) {
          results.push({ partNumber: row.partNumber, status: 'error', error: 'catalog URL host does not match brand' });
          continue;
        }

        const partSlug = row.partNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const slug = row.brand === 'Restek'
          ? `restek-${partSlug}`
          : row.brand === 'Waters'
            ? `waters-${partSlug}`
            : partSlug;
        const productId = `${prefixes[row.brand]}-${row.partNumber}`;
        const connection = await pool.getConnection();
        try {
          await connection.beginTransaction();
          const [existingRows] = await connection.execute(
            'SELECT id FROM products WHERE partNumber = ? OR productId = ? OR slug = ? LIMIT 1',
            [row.partNumber, productId, slug]
          ) as any;
          if (existingRows.length > 0) {
            await connection.rollback();
            results.push({ partNumber: row.partNumber, status: 'skipped', error: 'partNumber, productId, or slug already exists' });
            continue;
          }

          const [insertResult] = await connection.execute(
            `INSERT INTO products
              (taskId, productId, partNumber, brand, prefix, name, description, detailedDescription,
               specifications, imageUrl, catalogUrl, productType, slug, category, category_id,
               status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, 'active')`,
            [
              importTaskId, productId, row.partNumber, row.brand, prefixes[row.brand], row.name,
              row.description, row.detailedDescription, JSON.stringify(row.specifications),
              row.catalogUrl, row.productType, slug, row.category, row.categoryId,
            ]
          ) as any;
          const insertedId = Number(insertResult.insertId);
          await connection.execute(
            'INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (?, ?, 1)',
            [insertedId, row.categoryId]
          );
          await connection.commit();
          results.push({ partNumber: row.partNumber, status: 'inserted', id: insertedId, slug });
        } catch (err: any) {
          await connection.rollback();
          results.push({ partNumber: row.partNumber, status: 'error', error: String(err?.sqlMessage || err?.message || err) });
        } finally {
          connection.release();
        }
      }

      const inserted = results.filter((result) => result.status === 'inserted').length;
      const skipped = results.filter((result) => result.status === 'skipped').length;
      const errors = results.filter((result) => result.status === 'error').length;
      return { success: errors === 0, summary: { inserted, skipped, errors, total: results.length }, results };
    }),

  // Correct an audited Waters consumable collision atomically. This narrow route
  // preserves identifier/slug/status fields, accepts only a matching existing
  // Waters part number, and replaces just the evidence-backed facts, category
  // relation and noncompliant image binding.
  correctVerifiedWatersConsumableConflict: publicProcedure
    .input((raw: unknown) => {
      return z.object({
        adminKey: z.string(),
        updates: z.array(z.object({
          id: z.number().int().positive(),
          expectedPartNumber: z.string().min(1).max(128),
          name: z.string().min(3).max(255),
          description: z.string().min(10).max(2000),
          detailedDescription: z.string().min(20).max(5000),
          productType: z.literal('Caps & Septa'),
          categoryId: z.literal(20),
          category: z.literal('Caps & Septa'),
          specifications: z.record(z.string(), z.unknown()),
          catalogUrl: z.string().url().max(500),
          metaTitle: z.string().min(3).max(70),
          metaDescription: z.string().min(10).max(155),
        })).min(1).max(10),
      }).parse(raw);
    })
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') {
        throw new Error('Unauthorized');
      }
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const results: Array<{ id: number; partNumber: string; status: 'updated' | 'skipped' | 'error'; error?: string }> = [];

      for (const update of input.updates) {
        let catalogHost = '';
        try {
          catalogHost = new URL(update.catalogUrl).hostname.toLowerCase();
        } catch {
          results.push({ id: update.id, partNumber: update.expectedPartNumber, status: 'error', error: 'invalid catalog URL' });
          continue;
        }
        if (!(catalogHost === 'waters.com' || catalogHost.endsWith('.waters.com'))) {
          results.push({ id: update.id, partNumber: update.expectedPartNumber, status: 'error', error: 'catalog URL host does not match Waters' });
          continue;
        }

        const connection = await pool.getConnection();
        try {
          await connection.beginTransaction();
          const [existingRows] = await connection.execute(
            'SELECT id, partNumber, brand, productId, slug FROM products WHERE id = ? LIMIT 1',
            [update.id]
          ) as any;
          const existing = existingRows[0];
          if (!existing || existing.partNumber !== update.expectedPartNumber || existing.brand !== 'Waters') {
            await connection.rollback();
            results.push({ id: update.id, partNumber: update.expectedPartNumber, status: 'skipped', error: 'existing product identity did not match guarded Waters part number' });
            continue;
          }

          await connection.execute(
            `UPDATE products SET
              prefix = 'WATERS', name = ?, description = ?, detailedDescription = ?, specifications = ?,
              imageUrl = NULL, catalogUrl = ?, productType = ?, category = ?, category_id = ?,
              applications = NULL, particleSize = NULL, poreSize = NULL, columnLength = NULL,
              innerDiameter = NULL, phRange = NULL, maxPressure = NULL, maxTemperature = NULL,
              usp = NULL, phaseType = NULL, particleSizeNum = NULL, poreSizeNum = NULL,
              columnLengthNum = NULL, innerDiameterNum = NULL, phMin = NULL, phMax = NULL,
              metaTitle = ?, metaDescription = ?, updatedAt = NOW()
             WHERE id = ?`,
            [
              update.name, update.description, update.detailedDescription, JSON.stringify(update.specifications),
              update.catalogUrl, update.productType, update.category, update.categoryId,
              update.metaTitle, update.metaDescription, update.id,
            ]
          );
          await connection.execute('DELETE FROM product_categories WHERE product_id = ?', [update.id]);
          await connection.execute(
            'INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (?, ?, 1)',
            [update.id, update.categoryId]
          );
          await connection.commit();
          results.push({ id: update.id, partNumber: update.expectedPartNumber, status: 'updated' });
        } catch (error: any) {
          await connection.rollback();
          results.push({ id: update.id, partNumber: update.expectedPartNumber, status: 'error', error: String(error?.sqlMessage || error?.message || error) });
        } finally {
          connection.release();
        }
      }

      const updated = results.filter((result) => result.status === 'updated').length;
      const skipped = results.filter((result) => result.status === 'skipped').length;
      const errors = results.filter((result) => result.status === 'error').length;
      return { success: errors === 0 && skipped === 0, summary: { updated, skipped, errors, total: results.length }, results };
    }),

  // Restore the explicit product_categories relation for three independently
  // verified Restek tubing records that remain active and publicly addressable
  // but are absent from the Fittings & Tubing collection query.
  restoreVerifiedRestekFittingsCategoryLinks: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedPartNumbers = ['27767', '27795', '27804'] as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const results: Array<{ id: number; partNumber: string; status: 'updated' }> = [];
        for (const partNumber of verifiedPartNumbers) {
          const [rows] = await connection.execute(
            'SELECT id, partNumber, brand FROM products WHERE partNumber = ? LIMIT 1',
            [partNumber]
          ) as any;
          const product = rows[0];
          if (!product || product.partNumber !== partNumber || product.brand !== 'Restek') {
            throw new Error(`Verified Restek identity did not match for ${partNumber}`);
          }
          await connection.execute(
            'UPDATE products SET category_id = 22, category = ?, updatedAt = NOW() WHERE id = ?',
            ['Fittings & Tubing', product.id]
          );
          await connection.execute('DELETE FROM product_categories WHERE product_id = ?', [product.id]);
          await connection.execute(
            'INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (?, 22, 1)',
            [product.id]
          );
          results.push({ id: product.id, partNumber, status: 'updated' });
        }
        await connection.commit();
        return { success: true, categoryId: 22, category: 'Fittings & Tubing', results };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Move only three Shimadzu GC column records whose exact official model pages
  // were independently verified. Series-page-only SKUs remain outside this route.
  correctVerifiedShimadzuGcCategoryRelations: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedProducts = [
        { id: 90075, partNumber: '221-75895-60' },
        { id: 90076, partNumber: '221-75896-30' },
        { id: 90077, partNumber: '221-75896-50' },
      ] as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const results: Array<{ id: number; partNumber: string; status: 'updated' }> = [];
        for (const expected of verifiedProducts) {
          const [rows] = await connection.execute(
            'SELECT id, partNumber, brand, category_id AS categoryId, category, productType, status FROM products WHERE id = ? LIMIT 1',
            [expected.id]
          ) as any;
          const product = rows[0];
          if (
            !product || product.id !== expected.id || product.partNumber !== expected.partNumber ||
            product.brand !== 'Shimadzu' || product.categoryId !== 1 || product.category !== 'Other' ||
            product.productType !== 'GC Column' || product.status !== 'active'
          ) {
            throw new Error(`Verified Shimadzu GC identity did not match for ${expected.partNumber}`);
          }
          await connection.execute(
            'UPDATE products SET category_id = 30001, updatedAt = NOW() WHERE id = ?',
            [product.id]
          );
          await connection.execute('DELETE FROM product_categories WHERE product_id = ?', [product.id]);
          await connection.execute(
            'INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (?, 30001, 1)',
            [product.id]
          );
          results.push({ id: product.id, partNumber: product.partNumber, status: 'updated' });
        }
        await connection.commit();
        return { success: true, categoryId: 30001, category: 'GC Columns', results };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Set the normalized GC Column product type for exactly 30 active records
  // that have a blank current type, category_id=30001, and an exact original-manufacturer model page.
  correctVerifiedGcColumnProductTypes: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedProducts = [
        { id: 150520, partNumber: '121-1012', brand: 'Agilent' },
        { id: 150521, partNumber: '121-1012E', brand: 'Agilent' },
        { id: 150522, partNumber: '121-1012LTM', brand: 'Agilent' },
        { id: 150523, partNumber: '121-1013', brand: 'Agilent' },
        { id: 150524, partNumber: '121-1013LTM', brand: 'Agilent' },
        { id: 150525, partNumber: '121-101A', brand: 'Agilent' },
        { id: 150526, partNumber: '121-101ALTM', brand: 'Agilent' },
        { id: 150550, partNumber: '122-1011', brand: 'Agilent' },
        { id: 150551, partNumber: '122-1012', brand: 'Agilent' },
        { id: 150552, partNumber: '122-1012E', brand: 'Agilent' },
        { id: 151283, partNumber: '23399-U', brand: 'Merck' },
        { id: 151284, partNumber: '24028', brand: 'Merck' },
        { id: 151285, partNumber: '24034', brand: 'Merck' },
        { id: 151286, partNumber: '24044', brand: 'Merck' },
        { id: 151287, partNumber: '24045-U', brand: 'Merck' },
        { id: 151288, partNumber: '24047', brand: 'Merck' },
        { id: 151289, partNumber: '24048', brand: 'Merck' },
        { id: 151290, partNumber: '24079', brand: 'Merck' },
        { id: 151291, partNumber: '24080-U', brand: 'Merck' },
        { id: 151292, partNumber: '24081', brand: 'Merck' },
        { id: 151420, partNumber: '10180', brand: 'Restek' },
        { id: 151421, partNumber: '10221', brand: 'Restek' },
        { id: 151422, partNumber: '10254-125', brand: 'Restek' },
        { id: 151423, partNumber: '10427', brand: 'Restek' },
        { id: 151424, partNumber: '10535', brand: 'Restek' },
        { id: 151425, partNumber: '10640', brand: 'Restek' },
        { id: 151426, partNumber: '10641', brand: 'Restek' },
        { id: 151427, partNumber: '10655-126', brand: 'Restek' },
        { id: 151428, partNumber: '10820', brand: 'Restek' },
        { id: 151429, partNumber: '10921', brand: 'Restek' },
      ] as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const results: Array<{ id: number; partNumber: string; status: 'updated' }> = [];
        for (const expected of verifiedProducts) {
          const [rows] = await connection.execute(
            'SELECT id, partNumber, brand, category_id AS categoryId, productType, status FROM products WHERE id = ? LIMIT 1',
            [expected.id]
          ) as any;
          const product = rows[0];
          if (
            !product || product.id !== expected.id || product.partNumber !== expected.partNumber ||
            product.brand !== expected.brand || product.categoryId !== 30001 ||
            ![null, ''].includes(product.productType) || product.status !== 'active'
          ) {
            throw new Error(`Verified GC product identity did not match for ${expected.partNumber}`);
          }
          await connection.execute(
            "UPDATE products SET productType = 'GC Column', updatedAt = NOW() WHERE id = ?",
            [product.id]
          );
          results.push({ id: product.id, partNumber: product.partNumber, status: 'updated' });
        }
        await connection.commit();
        return { success: true, productType: 'GC Column', categoryId: 30001, results };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Normalize the GC Column product type for exactly 10 active Restek records
  // with a blank type, category_id=30001, and exact original-manufacturer model evidence.
  correctVerifiedRestekGcColumnProductTypesRound2: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedProducts = [
        { id: 151430, partNumber: '10968' },
        { id: 151431, partNumber: '11051' },
        { id: 151432, partNumber: '11062' },
        { id: 151437, partNumber: '13373' },
        { id: 151438, partNumber: '13481' },
        { id: 151439, partNumber: '13623' },
        { id: 151440, partNumber: '13868' },
        { id: 151441, partNumber: '13876' },
        { id: 151442, partNumber: '15059' },
        { id: 151443, partNumber: '16620' },
      ] as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const results: Array<{ id: number; partNumber: string; status: 'updated' }> = [];
        for (const expected of verifiedProducts) {
          const [rows] = await connection.execute(
            'SELECT id, partNumber, brand, category_id AS categoryId, productType, status FROM products WHERE id = ? LIMIT 1',
            [expected.id]
          ) as any;
          const product = rows[0];
          if (
            !product || product.id !== expected.id || product.partNumber !== expected.partNumber ||
            product.brand !== 'Restek' || product.categoryId !== 30001 ||
            ![null, ''].includes(product.productType) || product.status !== 'active'
          ) {
            throw new Error(`Verified Restek GC identity did not match for ${expected.partNumber}`);
          }
          await connection.execute(
            "UPDATE products SET productType = 'GC Column', updatedAt = NOW() WHERE id = ?",
            [product.id]
          );
          results.push({ id: product.id, partNumber: product.partNumber, status: 'updated' });
        }
        await connection.commit();
        return { success: true, productType: 'GC Column', categoryId: 30001, results };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Normalize the GC Column product type for exactly 20 active records
  // with a blank type, category_id=30001, and exact original-manufacturer model evidence.
  correctVerifiedGcColumnProductTypesRound3: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedProducts = [
        { id: 150576, partNumber: '123-1014', brand: 'Agilent' },
        { id: 150577, partNumber: '123-1015', brand: 'Agilent' },
        { id: 150578, partNumber: '123-1015E', brand: 'Agilent' },
        { id: 150579, partNumber: '123-1015LTM', brand: 'Agilent' },
        { id: 150580, partNumber: '125-1011', brand: 'Agilent' },
        { id: 150581, partNumber: '125-1011E', brand: 'Agilent' },
        { id: 150582, partNumber: '125-1012', brand: 'Agilent' },
        { id: 150583, partNumber: '125-1012E', brand: 'Agilent' },
        { id: 150584, partNumber: '125-1012LTM', brand: 'Agilent' },
        { id: 150585, partNumber: '125-1014', brand: 'Agilent' },
        { id: 151303, partNumber: '24155', brand: 'Merck' },
        { id: 151304, partNumber: '24156', brand: 'Merck' },
        { id: 151305, partNumber: '24157', brand: 'Merck' },
        { id: 151306, partNumber: '24158', brand: 'Merck' },
        { id: 151307, partNumber: '24160-U', brand: 'Merck' },
        { id: 151308, partNumber: '24166', brand: 'Merck' },
        { id: 151309, partNumber: '24181', brand: 'Merck' },
        { id: 151310, partNumber: '24196-U', brand: 'Merck' },
        { id: 151311, partNumber: '24205-U', brand: 'Merck' },
        { id: 151312, partNumber: '24211', brand: 'Merck' },
      ] as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const results: Array<{ id: number; partNumber: string; status: 'updated' }> = [];
        for (const expected of verifiedProducts) {
          const [rows] = await connection.execute(
            'SELECT id, partNumber, brand, category_id AS categoryId, productType, status FROM products WHERE id = ? LIMIT 1',
            [expected.id]
          ) as any;
          const product = rows[0];
          if (
            !product || product.id !== expected.id || product.partNumber !== expected.partNumber ||
            product.brand !== expected.brand || product.categoryId !== 30001 ||
            ![null, ''].includes(product.productType) || product.status !== 'active'
          ) {
            throw new Error(`Verified GC identity did not match for ${expected.partNumber}`);
          }
          await connection.execute(
            "UPDATE products SET productType = 'GC Column', updatedAt = NOW() WHERE id = ?",
            [product.id]
          );
          results.push({ id: product.id, partNumber: product.partNumber, status: 'updated' });
        }
        await connection.commit();
        return { success: true, productType: 'GC Column', categoryId: 30001, results };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Normalize the GC Column product type for exactly 22 active records with blank type,
  // category_id=30001, and exact original-manufacturer model evidence from the fourth continuous-governance batch.
  correctVerifiedGcColumnProductTypesRound4: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedProducts = [
        { id: 150586, partNumber: '125-1015', brand: 'Agilent' },
        { id: 150587, partNumber: '125-1015E', brand: 'Agilent' },
        { id: 150588, partNumber: '125-1017', brand: 'Agilent' },
        { id: 150589, partNumber: '125-101J', brand: 'Agilent' },
        { id: 150590, partNumber: '125-101K', brand: 'Agilent' },
        { id: 150591, partNumber: '125-10B5', brand: 'Agilent' },
        { id: 150592, partNumber: '125-10H5', brand: 'Agilent' },
        { id: 150593, partNumber: '125-10HB', brand: 'Agilent' },
        { id: 150594, partNumber: '125-10HBE', brand: 'Agilent' },
        { id: 150595, partNumber: '126-1012', brand: 'Agilent' },
        { id: 151313, partNumber: '24212', brand: 'Merck' },
        { id: 151314, partNumber: '24217-U', brand: 'Merck' },
        { id: 151315, partNumber: '24218-U', brand: 'Merck' },
        { id: 151316, partNumber: '24251', brand: 'Merck' },
        { id: 151317, partNumber: '24255', brand: 'Merck' },
        { id: 151318, partNumber: '24256', brand: 'Merck' },
        { id: 151319, partNumber: '24277', brand: 'Merck' },
        { id: 151320, partNumber: '24284', brand: 'Merck' },
        { id: 151321, partNumber: '24343', brand: 'Merck' },
        { id: 151322, partNumber: '25003', brand: 'Merck' },
        { id: 151469, partNumber: '80480-800', brand: 'Restek' },
        { id: 151470, partNumber: '88000-875', brand: 'Restek' },
      ] as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const results: Array<{ id: number; partNumber: string; status: 'updated' }> = [];
        for (const expected of verifiedProducts) {
          const [rows] = await connection.execute(
            'SELECT id, partNumber, brand, category_id AS categoryId, productType, status FROM products WHERE id = ? LIMIT 1',
            [expected.id]
          ) as any;
          const product = rows[0];
          if (!product || product.id !== expected.id || product.partNumber !== expected.partNumber ||
              product.brand !== expected.brand || product.categoryId !== 30001 ||
              ![null, ''].includes(product.productType) || product.status !== 'active') {
            throw new Error(`Verified fourth-batch GC identity did not match for ${expected.partNumber}`);
          }
          await connection.execute("UPDATE products SET productType = 'GC Column', updatedAt = NOW() WHERE id = ?", [product.id]);
          results.push({ id: product.id, partNumber: product.partNumber, status: 'updated' });
        }
        await connection.commit();
        return { success: true, productType: 'GC Column', categoryId: 30001, results };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally { connection.release(); }
    }),

  // Add exact Restek model-level catalog URLs for exactly two active GC records that currently lack URLs.
  correctVerifiedRestekGcCatalogUrlsRound4: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedProducts = [
        { id: 151469, partNumber: '80480-800', catalogUrl: 'https://www.restek.com/p/80480-800' },
        { id: 151470, partNumber: '88000-875', catalogUrl: 'https://www.restek.com/p/88000-875' },
      ] as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const results: Array<{ id: number; partNumber: string; catalogUrl: string; status: 'updated' }> = [];
        for (const expected of verifiedProducts) {
          const [rows] = await connection.execute(
            'SELECT id, partNumber, brand, category_id AS categoryId, catalogUrl, status FROM products WHERE id = ? LIMIT 1',
            [expected.id]
          ) as any;
          const product = rows[0];
          if (!product || product.id !== expected.id || product.partNumber !== expected.partNumber ||
              product.brand !== 'Restek' || product.categoryId !== 30001 ||
              product.catalogUrl !== null || product.status !== 'active') {
            throw new Error(`Verified fourth-batch Restek URL identity did not match for ${expected.partNumber}`);
          }
          await connection.execute('UPDATE products SET catalogUrl = ?, updatedAt = NOW() WHERE id = ?', [expected.catalogUrl, product.id]);
          results.push({ id: product.id, partNumber: product.partNumber, catalogUrl: expected.catalogUrl, status: 'updated' });
        }
        await connection.commit();
        return { success: true, results };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally { connection.release(); }
    }),

  // Apply exact original-manufacturer GC type facts for exactly 20 active records in continuous batch five.
  correctVerifiedGcProductTypesRound5: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedProducts = [
        { id: 150596, partNumber: '126-1013', brand: 'Agilent', currentProductType: null, targetProductType: 'GC Column' },
        { id: 150597, partNumber: '127-1012', brand: 'Agilent', currentProductType: null, targetProductType: 'GC Column' },
        { id: 150598, partNumber: '127-1012E', brand: 'Agilent', currentProductType: null, targetProductType: 'GC Column' },
        { id: 150599, partNumber: '127-1013', brand: 'Agilent', currentProductType: null, targetProductType: 'GC Column' },
        { id: 150600, partNumber: '127-1013E', brand: 'Agilent', currentProductType: null, targetProductType: 'GC Column' },
        { id: 150601, partNumber: '127-1013LTM', brand: 'Agilent', currentProductType: null, targetProductType: 'GC Column' },
        { id: 150602, partNumber: '127-1022', brand: 'Agilent', currentProductType: null, targetProductType: 'GC Column' },
        { id: 150603, partNumber: '127-1022E', brand: 'Agilent', currentProductType: null, targetProductType: 'GC Column' },
        { id: 150604, partNumber: '128-1012', brand: 'Agilent', currentProductType: null, targetProductType: 'GC Column' },
        { id: 150605, partNumber: '12A-1015', brand: 'Agilent', currentProductType: null, targetProductType: 'GC Column' },
        { id: 151323, partNumber: '25301-U', brand: 'Merck', currentProductType: null, targetProductType: 'Capillary GC Column' },
        { id: 151324, partNumber: '25303', brand: 'Merck', currentProductType: null, targetProductType: 'Capillary GC Column' },
        { id: 151325, partNumber: '25305-U', brand: 'Merck', currentProductType: null, targetProductType: 'Capillary GC Column' },
        { id: 151326, partNumber: '25312', brand: 'Merck', currentProductType: null, targetProductType: 'Capillary GC Column' },
        { id: 151327, partNumber: '25317', brand: 'Merck', currentProductType: null, targetProductType: 'Capillary GC Column' },
        { id: 151328, partNumber: '25320-U', brand: 'Merck', currentProductType: null, targetProductType: 'Capillary GC Column' },
        { id: 151329, partNumber: '25325', brand: 'Merck', currentProductType: null, targetProductType: 'Capillary GC Column' },
        { id: 151330, partNumber: '25326', brand: 'Merck', currentProductType: null, targetProductType: 'Capillary GC Column' },
        { id: 151331, partNumber: '25327', brand: 'Merck', currentProductType: null, targetProductType: 'Capillary GC Column' },
        { id: 151332, partNumber: '25341-U', brand: 'Merck', currentProductType: null, targetProductType: 'Capillary GC Column' },
      ] as const;
      const { getPool } = await import('./db'); const pool = await getPool(); if (!pool) throw new Error('Database pool not available'); const connection = await pool.getConnection();
      try { await connection.beginTransaction(); const results: Array<{ id: number; partNumber: string; productType: string; status: 'updated' }> = [];
        for (const expected of verifiedProducts) { const [rows] = await connection.execute('SELECT id, partNumber, brand, category_id AS categoryId, productType, status FROM products WHERE id = ? LIMIT 1',[expected.id]) as any; const product=rows[0];
          if (!product || product.id!==expected.id || product.partNumber!==expected.partNumber || product.brand!==expected.brand || product.categoryId!==30001 || product.productType!==expected.currentProductType || product.status!=='active') throw new Error(`Verified fifth-batch GC identity did not match for ${expected.partNumber}`);
          await connection.execute('UPDATE products SET productType = ?, updatedAt = NOW() WHERE id = ?',[expected.targetProductType,product.id]); results.push({id:product.id,partNumber:product.partNumber,productType:expected.targetProductType,status:'updated'}); }
        await connection.commit(); return {success:true,results};
      } catch(error:any) { await connection.rollback(); throw new Error(String(error?.sqlMessage || error?.message || error)); } finally { connection.release(); }
    }),

  // Normalize exactly 10 verified Merck capillary GC records in continuous batch six.
  correctVerifiedMerckCapillaryGcTypesRound6: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedProducts=[
        { id: 151333, partNumber: '25345-U' },
        { id: 151334, partNumber: '25347' },
        { id: 151335, partNumber: '25351' },
        { id: 151336, partNumber: '25353' },
        { id: 151337, partNumber: '25358' },
        { id: 151338, partNumber: '25375-U' },
        { id: 151339, partNumber: '25376' },
        { id: 151340, partNumber: '25381' },
        { id: 151341, partNumber: '25391' },
        { id: 151342, partNumber: '25396' },
      ] as const; const { getPool }=await import('./db'); const pool=await getPool(); if(!pool) throw new Error('Database pool not available'); const connection=await pool.getConnection();
      try { await connection.beginTransaction(); const results=[]; for(const expected of verifiedProducts) { const [rows]=await connection.execute('SELECT id,partNumber,brand,category_id AS categoryId,productType,status FROM products WHERE id=? LIMIT 1',[expected.id]) as any; const product=rows[0]; if(!product||product.id!==expected.id||product.partNumber!==expected.partNumber||product.brand!=='Merck'||product.categoryId!==30001||![null,''].includes(product.productType)||product.status!=='active') throw new Error(`Verified capillary GC identity mismatch for ${expected.partNumber}`); await connection.execute("UPDATE products SET productType='Capillary GC Column',updatedAt=NOW() WHERE id=?",[product.id]); results.push({id:product.id,partNumber:product.partNumber,status:'updated'}); } await connection.commit(); return {success:true,productType:'Capillary GC Column',results}; } catch(error:any) {await connection.rollback();throw new Error(String(error?.sqlMessage||error?.message||error));} finally {connection.release();}
    }),

  correctVerifiedAgilentGcCategoryRelationsRound7: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedProducts=[
        { id: 60141, partNumber: '122-5532' },
        { id: 60142, partNumber: '122-5562' },
        { id: 60147, partNumber: '122-7032' },
        { id: 60148, partNumber: '122-7062' },
        { id: 60149, partNumber: '123-1334' },
        { id: 60150, partNumber: '123-1364' },
        { id: 60155, partNumber: '19091J-413' },
        { id: 60145, partNumber: '19091S-433' },
        { id: 60146, partNumber: '19091S-436' },
        { id: 60156, partNumber: '19091Z-413' },
      ] as const; const { getPool }=await import('./db'); const pool=await getPool(); if(!pool) throw new Error('Database pool not available'); const connection=await pool.getConnection();
      try {await connection.beginTransaction(); const results=[]; for(const expected of verifiedProducts) {const [rows]=await connection.execute('SELECT id,partNumber,brand,category_id AS categoryId,category,productType,status FROM products WHERE id=? LIMIT 1',[expected.id]) as any; const product=rows[0]; if(!product||product.id!==expected.id||product.partNumber!==expected.partNumber||product.brand!=='Agilent'||product.categoryId!==1||product.category!=='HPLC Column'||product.productType!=='GC Capillary Column'||product.status!=='active') throw new Error(`Verified round-seven GC identity mismatch for ${expected.partNumber}`); await connection.execute('UPDATE products SET category_id=30001,updatedAt=NOW() WHERE id=?',[product.id]); await connection.execute('DELETE FROM product_categories WHERE product_id=?',[product.id]); await connection.execute('INSERT INTO product_categories (product_id,category_id,is_primary) VALUES (?,30001,1)',[product.id]); results.push({id:product.id,partNumber:product.partNumber,status:'updated'}); } await connection.commit();return {success:true,categoryId:30001,results};}catch(error:any){await connection.rollback();throw new Error(String(error?.sqlMessage||error?.message||error));}finally{connection.release();}
    }),

  correctVerifiedAgilentSpeProductTypesRound8: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedProducts = [
        { id: 150528, partNumber: '12102017TB' },
        { id: 150538, partNumber: '12102071' },
        { id: 150539, partNumber: '12102090' },
        { id: 150540, partNumber: '12102096' },
      ] as const;
      const { getPool } = await import('./db'); const pool = await getPool(); if (!pool) throw new Error('Database pool not available'); const connection = await pool.getConnection();
      try { await connection.beginTransaction(); const results = [];
        for (const expected of verifiedProducts) { const [rows] = await connection.execute('SELECT id, partNumber, brand, category_id AS categoryId, productType, status FROM products WHERE id = ? LIMIT 1', [expected.id]) as any; const product = rows[0];
          if (!product || product.id !== expected.id || product.partNumber !== expected.partNumber || product.brand !== 'Agilent' || product.categoryId !== 16 || product.productType !== null || product.status !== 'active') throw new Error(`Verified round-eight SPE identity mismatch for ${expected.partNumber}`);
          await connection.execute("UPDATE products SET productType = 'SPE Cartridge', updatedAt = NOW() WHERE id = ?", [product.id]); results.push({ id: product.id, partNumber: product.partNumber, status: 'updated' }); }
        await connection.commit(); return { success: true, productType: 'SPE Cartridge', categoryId: 16, results };
      } catch (error: any) { await connection.rollback(); throw new Error(String(error?.sqlMessage || error?.message || error)); } finally { connection.release(); }
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
      if (!db) throw new Error('Database unavailable');
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const result = await db.update(resources)
        .set({ status: 'published', updatedAt: now })
        .where(eq(resources.status, 'draft'));
      return { success: true, message: 'All draft resources have been published.' };
    }),
});
