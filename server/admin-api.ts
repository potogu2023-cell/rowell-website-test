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

  // Correct only the verified column-length fields for two audited Phenomenex SKUs.
  // This fixed-identity channel intentionally cannot update names, images, types, categories, or other specifications.
  correctVerifiedPhenomenexColumnLengthsRound1: publicProcedure
    .input((raw: unknown) => {
      return z.object({ adminKey: z.string() }).parse(raw);
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

      const verifiedUpdates = [
        { id: 60101, partNumber: '00F-4495-E0', columnLength: '150mm', columnLengthNum: 150 },
        { id: 60088, partNumber: '00F-4723-E0', columnLength: '150mm', columnLengthNum: 150 },
      ] as const;
      const results: Array<Record<string, unknown>> = [];
      for (const update of verifiedUpdates) {
        const existing = await db.select({
          id: products.id,
          partNumber: products.partNumber,
          columnLength: products.columnLength,
          columnLengthNum: products.columnLengthNum,
        }).from(products).where(eq(products.id, update.id)).limit(1);
        if (existing.length === 0) {
          results.push({ id: update.id, partNumber: update.partNumber, status: 'not_found' });
          continue;
        }
        if (existing[0].partNumber !== update.partNumber) {
          results.push({
            id: update.id,
            expectedPartNumber: update.partNumber,
            actualPartNumber: existing[0].partNumber,
            status: 'identity_mismatch',
          });
          continue;
        }
        await db.update(products).set({
          columnLength: update.columnLength,
          columnLengthNum: update.columnLengthNum,
        }).where(eq(products.id, update.id));
        results.push({
          id: update.id,
          partNumber: update.partNumber,
          status: 'updated',
          oldColumnLength: existing[0].columnLength,
          oldColumnLengthNum: existing[0].columnLengthNum,
          newColumnLength: update.columnLength,
          newColumnLengthNum: update.columnLengthNum,
        });
      }
      return {
        success: results.every((item) => item.status === 'updated'),
        totalUpdated: results.filter((item) => item.status === 'updated').length,
        results,
      };
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

  // Restore only two audited high-impression literature URLs with original,
  // source-attributed technical guides. Existing rows are never altered.
  createVerifiedHighVisibilityLiteratureRecoveryEntries: publicProcedure
    .input((raw: unknown) => {
      return z.object({ adminKey: z.string() }).parse(raw);
    })
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') {
        throw new Error('Unauthorized');
      }
      const { getDb } = await import('./db');
      const { literature } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const { VERIFIED_HIGH_VISIBILITY_LITERATURE_RECOVERY } = await import('./verified-literature-recovery');
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const results: Array<{ slug: string; status: 'created' | 'existing_skipped' }> = [];
      for (const entry of VERIFIED_HIGH_VISIBILITY_LITERATURE_RECOVERY) {
        const existing = await db
          .select({ id: literature.id })
          .from(literature)
          .where(eq(literature.slug, entry.slug))
          .limit(1);
        if (existing.length > 0) {
          results.push({ slug: entry.slug, status: 'existing_skipped' });
          continue;
        }
        await db.insert(literature).values({
          ...entry,
          addedDate: now,
          createdAt: now,
          updatedAt: now,
          viewCount: 0,
          contentEnhanced: 1,
          enhancedAt: now,
        });
        results.push({ slug: entry.slug, status: 'created' });
      }
      return {
        success: true,
        created: results.filter((item) => item.status === 'created').length,
        skipped: results.filter((item) => item.status === 'existing_skipped').length,
        results,
      };
    }),

  // Replace only the content fields for the same two audited literature records
  // with original ROWELL technical guidance. Slugs and view counts are preserved.
  restoreVerifiedHighVisibilityLiteratureContent: publicProcedure
    .input((raw: unknown) => {
      return z.object({ adminKey: z.string() }).parse(raw);
    })
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') {
        throw new Error('Unauthorized');
      }
      const { getDb } = await import('./db');
      const { literature } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const { VERIFIED_HIGH_VISIBILITY_LITERATURE_RECOVERY } = await import('./verified-literature-recovery');
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const results: Array<{ slug: string; status: 'updated' | 'missing_skipped' }> = [];
      for (const entry of VERIFIED_HIGH_VISIBILITY_LITERATURE_RECOVERY) {
        const existing = await db
          .select({ id: literature.id })
          .from(literature)
          .where(eq(literature.slug, entry.slug))
          .limit(1);
        if (existing.length === 0) {
          results.push({ slug: entry.slug, status: 'missing_skipped' });
          continue;
        }
        const { slug: _slug, ...content } = entry;
        await db.update(literature)
          .set({
            ...content,
            contentEnhanced: 1,
            enhancedAt: now,
            updatedAt: now,
          })
          .where(eq(literature.id, existing[0].id));
        results.push({ slug: entry.slug, status: 'updated' });
      }
      return {
        success: true,
        updated: results.filter((item) => item.status === 'updated').length,
        missing: results.filter((item) => item.status === 'missing_skipped').length,
        results,
      };
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
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 'draft', ?, ?)`,
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
          // The exact first-party model-level evidence URL; it is stored as catalogUrl.
          catalogUrl: z.string().url().max(500),
          // Product images must already have completed the separate AI generation and visual-QA workflow.
          imageUrl: z.string().url().max(1000).refine((url) => url.startsWith('https://files.manuscdn.com/'), {
            message: 'imageUrl must use the controlled files.manuscdn.com CDN',
          }),
          metaTitle: z.string().min(10).max(255),
          metaDescription: z.string().min(50).max(320),
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
      // Only the controlled accessory types mapped to their public category are eligible for publication.
      const controlledProductTypes: Record<number, string> = {
        19: 'Vials',
        20: 'Caps & Septa',
        21: 'Syringes',
        22: 'Fittings & Tubing',
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
        const normalizedPartNumber = row.partNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedEvidencePath = new URL(row.catalogUrl).pathname.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!normalizedPartNumber || !normalizedEvidencePath.includes(normalizedPartNumber)) {
          results.push({ partNumber: row.partNumber, status: 'error', error: 'catalog URL is not a model-level part-number evidence path' });
          continue;
        }
        if (controlledProductTypes[row.categoryId] !== row.productType) {
          results.push({ partNumber: row.partNumber, status: 'error', error: 'productType is not the controlled type for category' });
          continue;
        }
        const nonemptySpecificationEntries = Object.entries(row.specifications)
          .filter(([key, value]) => key.trim().length > 0 && value !== null && String(value).trim().length > 0);
        if (nonemptySpecificationEntries.length === 0) {
          results.push({ partNumber: row.partNumber, status: 'error', error: 'at least one nonempty technical specification is required' });
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
               metaTitle, metaDescription, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
            [
              importTaskId, productId, row.partNumber, row.brand, prefixes[row.brand], row.name,
              row.description, row.detailedDescription, JSON.stringify(row.specifications),
              row.imageUrl, row.catalogUrl, row.productType, slug, row.category, row.categoryId,
              row.metaTitle, row.metaDescription,
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

  correctVerifiedAgilentSpeProductTypesRound9: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedProducts = [
        { id: 150547, partNumber: '1210C18OHTCB' },
        { id: 150548, partNumber: '12113046' },
        { id: 150549, partNumber: '12113048' },
        { id: 150559, partNumber: '12255021' },
        { id: 150560, partNumber: '12256001' },
        { id: 150561, partNumber: '12256001B' },
        { id: 150562, partNumber: '12256043' },
        { id: 150563, partNumber: '12256044' },
        { id: 150564, partNumber: '12256059' },
        { id: 150565, partNumber: '12256060' },
      ] as const;
      const { getPool } = await import('./db'); const pool = await getPool(); if (!pool) throw new Error('Database pool not available'); const connection = await pool.getConnection();
      try { await connection.beginTransaction(); const results = [];
        for (const expected of verifiedProducts) { const [rows] = await connection.execute('SELECT id, partNumber, brand, category_id AS categoryId, productType, status FROM products WHERE id = ? LIMIT 1', [expected.id]) as any; const product = rows[0];
          if (!product || product.id !== expected.id || product.partNumber !== expected.partNumber || product.brand !== 'Agilent' || product.categoryId !== 16 || product.productType !== null || product.status !== 'active') throw new Error(`Verified round-nine SPE identity mismatch for ${expected.partNumber}`);
          await connection.execute("UPDATE products SET productType = 'SPE Cartridge', updatedAt = NOW() WHERE id = ?", [product.id]); results.push({ id: product.id, partNumber: product.partNumber, status: 'updated' }); }
        await connection.commit(); return { success: true, productType: 'SPE Cartridge', categoryId: 16, results };
      } catch (error: any) { await connection.rollback(); throw new Error(String(error?.sqlMessage || error?.message || error)); } finally { connection.release(); }
    }),

  correctVerifiedAgilentSpeProductTypesRound10: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedProducts = [
        { id: 150566, partNumber: '12282001' },
        { id: 150567, partNumber: '12282002' },
        { id: 150568, partNumber: '12282003' },
        { id: 150569, partNumber: '12282004' },
        { id: 150570, partNumber: '12282005' },
        { id: 150571, partNumber: '12282006' },
        { id: 150606, partNumber: '14102001' },
        { id: 150607, partNumber: '14102025' },
        { id: 150608, partNumber: '14102028' },
        { id: 150609, partNumber: '14102058' },
      ] as const;
      const { getPool } = await import('./db'); const pool = await getPool(); if (!pool) throw new Error('Database pool not available'); const connection = await pool.getConnection();
      try { await connection.beginTransaction(); const results = [];
        for (const expected of verifiedProducts) { const [rows] = await connection.execute('SELECT id, partNumber, brand, category_id AS categoryId, productType, status FROM products WHERE id = ? LIMIT 1', [expected.id]) as any; const product = rows[0];
          if (!product || product.id !== expected.id || product.partNumber !== expected.partNumber || product.brand !== 'Agilent' || product.categoryId !== 16 || product.productType !== null || product.status !== 'active') throw new Error(`Verified round-ten SPE identity mismatch for ${expected.partNumber}`);
          await connection.execute("UPDATE products SET productType = 'SPE Cartridge', updatedAt = NOW() WHERE id = ?", [product.id]); results.push({ id: product.id, partNumber: product.partNumber, status: 'updated' }); }
        await connection.commit(); return { success: true, productType: 'SPE Cartridge', categoryId: 16, results };
      } catch (error: any) { await connection.rollback(); throw new Error(String(error?.sqlMessage || error?.message || error)); } finally { connection.release(); }
    }),

  correctVerifiedAgilentSpeProductTypesRound12: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedProducts = [
        { id: 150620, partNumber: '14256021' },
        { id: 150621, partNumber: '14256023' },
        { id: 150622, partNumber: '14256027' },
        { id: 150623, partNumber: '14256029' },
        { id: 150624, partNumber: '14256031' },
        { id: 150625, partNumber: '14256035' },
        { id: 150626, partNumber: '22102001' },
        { id: 150627, partNumber: '22102017' },
      ] as const;
      const { getPool } = await import('./db'); const pool = await getPool(); if (!pool) throw new Error('Database pool not available'); const connection = await pool.getConnection();
      try { await connection.beginTransaction(); const results = [];
        for (const expected of verifiedProducts) { const [rows] = await connection.execute('SELECT id, partNumber, brand, category_id AS categoryId, productType, status FROM products WHERE id = ? LIMIT 1', [expected.id]) as any; const product = rows[0];
          if (!product || product.id !== expected.id || product.partNumber !== expected.partNumber || product.brand !== 'Agilent' || product.categoryId !== 16 || product.productType !== null || product.status !== 'active') throw new Error(`Verified round-twelve SPE identity mismatch for ${expected.partNumber}`);
          await connection.execute("UPDATE products SET productType = 'SPE Cartridge', updatedAt = NOW() WHERE id = ?", [product.id]); results.push({ id: product.id, partNumber: product.partNumber, status: 'updated' }); }
        await connection.commit(); return { success: true, productType: 'SPE Cartridge', categoryId: 16, results };
      } catch (error: any) { await connection.rollback(); throw new Error(String(error?.sqlMessage || error?.message || error)); } finally { connection.release(); }
    }),

  correctVerifiedAgilentSyringeFilterProductTypesRound13: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedProducts = [
        { id: 150630, partNumber: '5190-5084' },
        { id: 150631, partNumber: '5190-5085' },
        { id: 150632, partNumber: '5190-5086' },
        { id: 150633, partNumber: '5190-5087' },
        { id: 150634, partNumber: '5190-5088' },
        { id: 150635, partNumber: '5190-5091' },
        { id: 150636, partNumber: '5190-5092' },
        { id: 150637, partNumber: '5190-5093' },
        { id: 150638, partNumber: '5190-5094' },
        { id: 150639, partNumber: '5190-5095' },
      ] as const;
      const { getPool } = await import('./db'); const pool = await getPool(); if (!pool) throw new Error('Database pool not available'); const connection = await pool.getConnection();
      try { await connection.beginTransaction(); const results = [];
        for (const expected of verifiedProducts) { const [rows] = await connection.execute('SELECT id, partNumber, brand, category_id AS categoryId, productType, status FROM products WHERE id = ? LIMIT 1', [expected.id]) as any; const product = rows[0];
          if (!product || product.id !== expected.id || product.partNumber !== expected.partNumber || product.brand !== 'Agilent' || product.categoryId !== 1 || product.productType !== null || product.status !== 'active') throw new Error(`Verified round-thirteen syringe-filter identity mismatch for ${expected.partNumber}`);
          await connection.execute("UPDATE products SET productType = 'Syringe Filter', updatedAt = NOW() WHERE id = ?", [product.id]); results.push({ id: product.id, partNumber: product.partNumber, status: 'updated' }); }
        await connection.commit(); return { success: true, productType: 'Syringe Filter', categoryId: 1, results };
      } catch (error: any) { await connection.rollback(); throw new Error(String(error?.sqlMessage || error?.message || error)); } finally { connection.release(); }
    }),

  correctVerifiedAgilentSyringeFilterProductTypesRound14: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedProducts = [
        { id: 150640, partNumber: '5190-5096' },
        { id: 150641, partNumber: '5190-5097' },
        { id: 150642, partNumber: '5190-5098' },
        { id: 150643, partNumber: '5190-5099' },
        { id: 150644, partNumber: '5190-5108' },
        { id: 150645, partNumber: '5190-5116' },
        { id: 150646, partNumber: '5190-5117' },
        { id: 150647, partNumber: '5190-5120' },
        { id: 150648, partNumber: '5190-5122' },
        { id: 150649, partNumber: '5190-5127' },
      ] as const;
      const { getPool } = await import('./db'); const pool = await getPool(); if (!pool) throw new Error('Database pool not available'); const connection = await pool.getConnection();
      try { await connection.beginTransaction(); const results = [];
        for (const expected of verifiedProducts) { const [rows] = await connection.execute('SELECT id, partNumber, brand, category_id AS categoryId, productType, status FROM products WHERE id = ? LIMIT 1', [expected.id]) as any; const product = rows[0];
          if (!product || product.id !== expected.id || product.partNumber !== expected.partNumber || product.brand !== 'Agilent' || product.categoryId !== 1 || product.productType !== null || product.status !== 'active') throw new Error(`Verified round-fourteen syringe-filter identity mismatch for ${expected.partNumber}`);
          await connection.execute("UPDATE products SET productType = 'Syringe Filter', updatedAt = NOW() WHERE id = ?", [product.id]); results.push({ id: product.id, partNumber: product.partNumber, status: 'updated' }); }
        await connection.commit(); return { success: true, productType: 'Syringe Filter', categoryId: 1, results };
      } catch (error: any) { await connection.rollback(); throw new Error(String(error?.sqlMessage || error?.message || error)); } finally { connection.release(); }
    }),

  correctVerifiedAgilentSyringeFilterProductTypesRound15: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedProducts = [
        { id: 150650, partNumber: '5190-5128' },
        { id: 150651, partNumber: '5190-5132' },
        { id: 150652, partNumber: '5190-5134' },
        { id: 150653, partNumber: '5190-5135' },
        { id: 150654, partNumber: '5190-5261' },
        { id: 150655, partNumber: '5190-5262' },
        { id: 150656, partNumber: '5190-5263' },
        { id: 150657, partNumber: '5190-5264' },
        { id: 150658, partNumber: '5190-5265' },
        { id: 150659, partNumber: '5190-5266' },
      ] as const;
      const { getPool } = await import('./db'); const pool = await getPool(); if (!pool) throw new Error('Database pool not available'); const connection = await pool.getConnection();
      try { await connection.beginTransaction(); const results = [];
        for (const expected of verifiedProducts) { const [rows] = await connection.execute('SELECT id, partNumber, brand, category_id AS categoryId, productType, status FROM products WHERE id = ? LIMIT 1', [expected.id]) as any; const product = rows[0];
          if (!product || product.id !== expected.id || product.partNumber !== expected.partNumber || product.brand !== 'Agilent' || product.categoryId !== 1 || product.productType !== null || product.status !== 'active') throw new Error(`Verified round-fifteen syringe-filter identity mismatch for ${expected.partNumber}`);
          await connection.execute("UPDATE products SET productType = 'Syringe Filter', updatedAt = NOW() WHERE id = ?", [product.id]); results.push({ id: product.id, partNumber: product.partNumber, status: 'updated' }); }
        await connection.commit(); return { success: true, productType: 'Syringe Filter', categoryId: 1, results };
      } catch (error: any) { await connection.rollback(); throw new Error(String(error?.sqlMessage || error?.message || error)); } finally { connection.release(); }
    }),

  correctVerifiedRestekGcColumnProductTypesRound16: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedProducts = [
        { id: 151462, partNumber: '76088' },
        { id: 151463, partNumber: '77008' },
      ] as const;
      const { getPool } = await import('./db'); const pool = await getPool(); if (!pool) throw new Error('Database pool not available'); const connection = await pool.getConnection();
      try { await connection.beginTransaction(); const results = [];
        for (const expected of verifiedProducts) { const [rows] = await connection.execute('SELECT id, partNumber, brand, category_id AS categoryId, productType, status FROM products WHERE id = ? LIMIT 1', [expected.id]) as any; const product = rows[0];
          if (!product || product.id !== expected.id || product.partNumber !== expected.partNumber || product.brand !== 'Restek' || product.categoryId !== 30001 || product.productType !== null || product.status !== 'active') throw new Error(`Verified round-sixteen GC-column identity mismatch for ${expected.partNumber}`);
          await connection.execute("UPDATE products SET productType = 'GC Column', updatedAt = NOW() WHERE id = ?", [product.id]); results.push({ id: product.id, partNumber: product.partNumber, status: 'updated' }); }
        await connection.commit(); return { success: true, productType: 'GC Column', categoryId: 30001, results };
      } catch (error: any) { await connection.rollback(); throw new Error(String(error?.sqlMessage || error?.message || error)); } finally { connection.release(); }
    }),

  correctVerifiedRestekGuardCartridgeProductTypesRound16: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedProducts = [
        { id: 151471, partNumber: '910050210' },
        { id: 151472, partNumber: '910050212' },
        { id: 151473, partNumber: '910650212' },
        { id: 151474, partNumber: '910750210' },
        { id: 151475, partNumber: '910950210' },
        { id: 151476, partNumber: '910950212' },
        { id: 151477, partNumber: '912750210' },
        { id: 151478, partNumber: '916050210' },
      ] as const;
      const { getPool } = await import('./db'); const pool = await getPool(); if (!pool) throw new Error('Database pool not available'); const connection = await pool.getConnection();
      try { await connection.beginTransaction(); const results = [];
        for (const expected of verifiedProducts) { const [rows] = await connection.execute('SELECT id, partNumber, brand, category_id AS categoryId, productType, status FROM products WHERE id = ? LIMIT 1', [expected.id]) as any; const product = rows[0];
          if (!product || product.id !== expected.id || product.partNumber !== expected.partNumber || product.brand !== 'Restek' || product.categoryId !== 17 || product.productType !== null || product.status !== 'active') throw new Error(`Verified round-sixteen guard-cartridge identity mismatch for ${expected.partNumber}`);
          await connection.execute("UPDATE products SET productType = 'Guard Cartridge', updatedAt = NOW() WHERE id = ?", [product.id]); results.push({ id: product.id, partNumber: product.partNumber, status: 'updated' }); }
        await connection.commit(); return { success: true, productType: 'Guard Cartridge', categoryId: 17, results };
      } catch (error: any) { await connection.rollback(); throw new Error(String(error?.sqlMessage || error?.message || error)); } finally { connection.release(); }
    }),

  correctVerifiedAgilentSyringeFilterProductTypesRound17: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedProducts = [
        { id: 150670, partNumber: '5190-5277' },
        { id: 150671, partNumber: '5190-5278' },
        { id: 150672, partNumber: '5190-5279' },
        { id: 150673, partNumber: '5190-5280' },
        { id: 150674, partNumber: '5190-5307' },
        { id: 150675, partNumber: '5190-5308' },
        { id: 150676, partNumber: '5190-5309' },
        { id: 150677, partNumber: '5190-5310' },
      ] as const;
      const { getPool } = await import('./db'); const pool = await getPool(); if (!pool) throw new Error('Database pool not available'); const connection = await pool.getConnection();
      try { await connection.beginTransaction(); const results = [];
        for (const expected of verifiedProducts) { const [rows] = await connection.execute('SELECT id, partNumber, brand, category_id AS categoryId, productType, status FROM products WHERE id = ? LIMIT 1', [expected.id]) as any; const product = rows[0];
          if (!product || product.id !== expected.id || product.partNumber !== expected.partNumber || product.brand !== 'Agilent' || product.categoryId !== 1 || product.productType !== null || product.status !== 'active') throw new Error(`Verified round-seventeen syringe-filter identity mismatch for ${expected.partNumber}`);
          await connection.execute("UPDATE products SET productType = 'Syringe Filter', updatedAt = NOW() WHERE id = ?", [product.id]); results.push({ id: product.id, partNumber: product.partNumber, status: 'updated' }); }
        await connection.commit(); return { success: true, productType: 'Syringe Filter', categoryId: 1, results };
      } catch (error: any) { await connection.rollback(); throw new Error(String(error?.sqlMessage || error?.message || error)); } finally { connection.release(); }
    }),

  correctVerifiedAgilentSpeCartridgeProductTypesRound17: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedProducts = [
        { id: 150678, partNumber: '52102001' },
        { id: 150679, partNumber: '52102024' },
      ] as const;
      const { getPool } = await import('./db'); const pool = await getPool(); if (!pool) throw new Error('Database pool not available'); const connection = await pool.getConnection();
      try { await connection.beginTransaction(); const results = [];
        for (const expected of verifiedProducts) { const [rows] = await connection.execute('SELECT id, partNumber, brand, category_id AS categoryId, productType, status FROM products WHERE id = ? LIMIT 1', [expected.id]) as any; const product = rows[0];
          if (!product || product.id !== expected.id || product.partNumber !== expected.partNumber || product.brand !== 'Agilent' || product.categoryId !== 16 || product.productType !== null || product.status !== 'active') throw new Error(`Verified round-seventeen SPE-cartridge identity mismatch for ${expected.partNumber}`);
          await connection.execute("UPDATE products SET productType = 'SPE Cartridge', updatedAt = NOW() WHERE id = ?", [product.id]); results.push({ id: product.id, partNumber: product.partNumber, status: 'updated' }); }
        await connection.commit(); return { success: true, productType: 'SPE Cartridge', categoryId: 16, results };
      } catch (error: any) { await connection.rollback(); throw new Error(String(error?.sqlMessage || error?.message || error)); } finally { connection.release(); }
    }),

  correctVerifiedPhenomenexSyringeFilterProductTypesRound19: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedProducts = [
        { id: 150868, partNumber: 'AF0-1102-12' },
        { id: 150869, partNumber: 'AF0-1107-12' },
        { id: 150870, partNumber: 'AF0-1207-12' },
        { id: 150871, partNumber: 'AF0-1A47-12' },
        { id: 150872, partNumber: 'AF0-1A47-52' },
        { id: 150873, partNumber: 'AF0-2102-12' },
        { id: 150874, partNumber: 'AF0-2102-52' },
        { id: 150875, partNumber: 'AF0-2103-12' },
      ] as const;
      const { getPool } = await import('./db'); const pool = await getPool(); if (!pool) throw new Error('Database pool not available'); const connection = await pool.getConnection();
      try { await connection.beginTransaction(); const results = [];
        for (const expected of verifiedProducts) { const [rows] = await connection.execute('SELECT id, partNumber, brand, category_id AS categoryId, productType, status FROM products WHERE id = ? LIMIT 1', [expected.id]) as any; const product = rows[0];
          if (!product || product.id !== expected.id || product.partNumber !== expected.partNumber || product.brand !== 'Phenomenex' || product.categoryId !== 18 || product.productType !== null || product.status !== 'active') throw new Error(`Verified round-nineteen syringe-filter identity mismatch for ${expected.partNumber}`);
          await connection.execute("UPDATE products SET productType = 'Syringe Filter', updatedAt = NOW() WHERE id = ?", [product.id]); results.push({ id: product.id, partNumber: product.partNumber, status: 'updated' }); }
        await connection.commit(); return { success: true, productType: 'Syringe Filter', categoryId: 18, results };
      } catch (error: any) { await connection.rollback(); throw new Error(String(error?.sqlMessage || error?.message || error)); } finally { connection.release(); }
    }),

  correctVerifiedPhenomenexSyringeFilterProductTypesRound20: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedProducts = [
        { id: 150876, partNumber: 'AF0-2107-12' },
        { id: 150878, partNumber: 'AF0-2202-12' },
        { id: 150879, partNumber: 'AF0-2202-52' },
        { id: 150880, partNumber: 'AF0-2203-12' },
        { id: 150881, partNumber: 'AF0-2203-52' },
        { id: 150882, partNumber: 'AF0-3102-12' },
      ] as const;
      const { getPool } = await import('./db'); const pool = await getPool(); if (!pool) throw new Error('Database pool not available'); const connection = await pool.getConnection();
      try { await connection.beginTransaction(); const results = [];
        for (const expected of verifiedProducts) { const [rows] = await connection.execute('SELECT id, partNumber, brand, category_id AS categoryId, productType, status FROM products WHERE id = ? LIMIT 1', [expected.id]) as any; const product = rows[0];
          if (!product || product.id !== expected.id || product.partNumber !== expected.partNumber || product.brand !== 'Phenomenex' || product.categoryId !== 18 || product.productType !== null || product.status !== 'active') throw new Error(`Verified round-twenty syringe-filter identity mismatch for ${expected.partNumber}`);
          await connection.execute("UPDATE products SET productType = 'Syringe Filter', updatedAt = NOW() WHERE id = ?", [product.id]); results.push({ id: product.id, partNumber: product.partNumber, status: 'updated' }); }
        await connection.commit(); return { success: true, productType: 'Syringe Filter', categoryId: 18, results };
      } catch (error: any) { await connection.rollback(); throw new Error(String(error?.sqlMessage || error?.message || error)); } finally { connection.release(); }
    }),

  correctVerifiedAgilentCatalogUrlsRound21: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedProducts = [
        { id: 150710, partNumber: '699768-901K', catalogUrl: 'https://www.agilent.com/store/en_US/Prod-699768-901K/699768-901K' },
        { id: 150711, partNumber: '699768-901T', catalogUrl: 'https://www.agilent.com/store/en_US/Prod-699768-901T/699768-901T' },
        { id: 150712, partNumber: '699775-742', catalogUrl: 'https://www.agilent.com/store/en_US/Prod-699775-742/699775-742' },
        { id: 150713, partNumber: '699775-942', catalogUrl: 'https://www.agilent.com/store/en_US/Prod-699775-942/699775-942' },
        { id: 150714, partNumber: '699968-301', catalogUrl: 'https://www.agilent.com/store/en_US/Prod-699968-301/699968-301' },
        { id: 150715, partNumber: '699968-301K', catalogUrl: 'https://www.agilent.com/store/en_US/Prod-699968-301K/699968-301K' },
        { id: 150716, partNumber: '699968-301T', catalogUrl: 'https://www.agilent.com/store/en_US/Prod-699968-301T/699968-301T' },
        { id: 150717, partNumber: '699968-901', catalogUrl: 'https://www.agilent.com/store/en_US/Prod-699968-901/699968-901' },
        { id: 150718, partNumber: '699968-901K', catalogUrl: 'https://www.agilent.com/store/en_US/Prod-699968-901K/699968-901K' },
        { id: 150719, partNumber: '699968-901T', catalogUrl: 'https://www.agilent.com/store/en_US/Prod-699968-901T/699968-901T' },
      ] as const;
      const { getPool } = await import('./db'); const pool = await getPool(); if (!pool) throw new Error('Database pool not available'); const connection = await pool.getConnection();
      try { await connection.beginTransaction(); const results = [];
        for (const expected of verifiedProducts) { const [rows] = await connection.execute('SELECT id, partNumber, brand, catalogUrl, status FROM products WHERE id = ? LIMIT 1', [expected.id]) as any; const product = rows[0];
          if (!product || product.id !== expected.id || product.partNumber !== expected.partNumber || product.brand !== 'Agilent' || product.catalogUrl !== null || product.status !== 'active') throw new Error(`Verified round-twenty-one catalog URL identity mismatch for ${expected.partNumber}`);
          await connection.execute('UPDATE products SET catalogUrl = ?, updatedAt = NOW() WHERE id = ?', [expected.catalogUrl, product.id]); results.push({ id: product.id, partNumber: product.partNumber, catalogUrl: expected.catalogUrl, status: 'updated' }); }
        await connection.commit(); return { success: true, results };
      } catch (error: any) { await connection.rollback(); throw new Error(String(error?.sqlMessage || error?.message || error)); } finally { connection.release(); }
    }),

  correctVerifiedRestekHplcColumnProductTypesRound22: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedProducts = [
        { id: 151533, partNumber: '9314A12-T' },
        { id: 151534, partNumber: '9314A62-T' },
        { id: 151535, partNumber: '9314A65' },
      ] as const;
      const { getPool } = await import('./db'); const pool = await getPool(); if (!pool) throw new Error('Database pool not available'); const connection = await pool.getConnection();
      try { await connection.beginTransaction(); const results = [];
        for (const expected of verifiedProducts) { const [rows] = await connection.execute('SELECT id, partNumber, brand, category_id AS categoryId, productType, status FROM products WHERE id = ? LIMIT 1', [expected.id]) as any; const product = rows[0];
          if (!product || product.id !== expected.id || product.partNumber !== expected.partNumber || product.brand !== 'Restek' || product.categoryId !== 1 || product.productType !== null || product.status !== 'active') throw new Error(`Verified round-twenty-two HPLC-column identity mismatch for ${expected.partNumber}`);
          await connection.execute("UPDATE products SET productType = 'HPLC Column', updatedAt = NOW() WHERE id = ?", [product.id]); results.push({ id: product.id, partNumber: product.partNumber, status: 'updated' }); }
        await connection.commit(); return { success: true, productType: 'HPLC Column', categoryId: 1, results };
      } catch (error: any) { await connection.rollback(); throw new Error(String(error?.sqlMessage || error?.message || error)); } finally { connection.release(); }
    }),

  // Bind first-batch, model-verified, unbranded AI product images for high-visibility SKUs.
  // This route deliberately updates imageUrl only after fixed identity verification.
  bindVerifiedHighVisibilityAiImagesRound1: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedImages = [
        { id: 60033, partNumber: '00G-4601-E0', brand: 'Phenomenex', categoryId: 1, productType: 'HPLC Column', imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/RhAFHkkTqgGIdwjB.png' },
        { id: 60063, partNumber: '00G-4633-E0', brand: 'Phenomenex', categoryId: 1, productType: 'HPLC Column', imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/ueYjziXFrcCNnJEa.png' },
        { id: 90301, partNumber: '0008541', brand: 'Tosoh', categoryId: 1, productType: 'HPLC Column', imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/IcDHYSxoVKmfQbdC.png' },
        { id: 30013, partNumber: '695775-742', brand: 'Agilent', categoryId: 1, productType: 'HPLC Column', imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/tCgHXVokQINwUiKm.png' },
        { id: 90253, partNumber: 'TO12S03-2546WT', brand: 'YMC', categoryId: 5, productType: 'HPLC Column', imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/NAHKGFHSTWPNuOiZ.png' },
      ] as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const results: Array<{ id: number; partNumber: string; oldImageUrl: string | null; newImageUrl: string; status: 'updated' }> = [];
        for (const update of verifiedImages) {
          const [rows] = await connection.execute(
            'SELECT id, partNumber, brand, category_id AS categoryId, productType, imageUrl FROM products WHERE id = ? LIMIT 1',
            [update.id]
          ) as any;
          const product = rows[0];
          if (!product || product.id !== update.id || product.partNumber !== update.partNumber || product.brand !== update.brand || Number(product.categoryId) !== update.categoryId || product.productType !== update.productType) {
            throw new Error(`Round1 AI image identity did not match for ${update.partNumber}`);
          }
          await connection.execute(
            'UPDATE products SET imageUrl = ?, updatedAt = NOW() WHERE id = ?',
            [update.imageUrl, update.id]
          );
          results.push({ id: update.id, partNumber: update.partNumber, oldImageUrl: product.imageUrl ?? null, newImageUrl: update.imageUrl, status: 'updated' });
        }
        await connection.commit();
        return { success: true, totalUpdated: results.length, results };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Bind second-batch AI images only after the independent length correction has passed.
  // This route deliberately updates imageUrl only after fixed identity verification.
  bindVerifiedHighVisibilityAiImagesRound2: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedImages = [
        { id: 60101, partNumber: '00F-4495-E0', brand: 'Phenomenex', categoryId: 1, productType: 'HPLC Column', imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/SSELfeqmyEAiMtbd.png' },
        { id: 60088, partNumber: '00F-4723-E0', brand: 'Phenomenex', categoryId: 1, productType: 'HPLC Column', imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/cbZewYTePlApkKLv.png' },
      ] as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const results: Array<{ id: number; partNumber: string; oldImageUrl: string | null; newImageUrl: string; status: 'updated' }> = [];
        for (const update of verifiedImages) {
          const [rows] = await connection.execute(
            'SELECT id, partNumber, brand, category_id AS categoryId, productType, imageUrl FROM products WHERE id = ? LIMIT 1',
            [update.id]
          ) as any;
          const product = rows[0];
          if (!product || product.id !== update.id || product.partNumber !== update.partNumber || product.brand !== update.brand || Number(product.categoryId) !== update.categoryId || product.productType !== update.productType) {
            throw new Error(`Round2 AI image identity did not match for ${update.partNumber}`);
          }
          await connection.execute(
            'UPDATE products SET imageUrl = ?, updatedAt = NOW() WHERE id = ?',
            [update.imageUrl, update.id]
          );
          results.push({ id: update.id, partNumber: update.partNumber, oldImageUrl: product.imageUrl ?? null, newImageUrl: update.imageUrl, status: 'updated' });
        }
        await connection.commit();
        return { success: true, totalUpdated: results.length, results };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Bind nine evidence-qualified Avantor ACE images only when the complete
  // fixed identity and legacy-image precondition remain unchanged. This route
  // deliberately updates imageUrl only and excludes ACE-123-2546, whose phase
  // conflict must be resolved through a separate atomic fact-correction route.
  bindVerifiedAvantorAceAiImagesRound1: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const verifiedImages = [
        { id: 90149, partNumber: 'ACE-121-2546', brand: 'Avantor', categoryId: 4, productType: 'HPLC Column', expectedImageUrl: '/product-images/Avantor/ACE-121-2546.jpg', imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/uJwCxZCQSsjCSsOW.png' },
        { id: 90150, partNumber: 'ACE-121-1546', brand: 'Avantor', categoryId: 4, productType: 'HPLC Column', expectedImageUrl: '/product-images/Avantor/ACE-121-1546.jpg', imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/lqDgBwUOZamWwQEt.png' },
        { id: 90151, partNumber: 'ACE-121-1046', brand: 'Avantor', categoryId: 4, productType: 'HPLC Column', expectedImageUrl: '/product-images/Avantor/ACE-121-1046.jpg', imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/oCPdIazBzNjtxlEW.png' },
        { id: 90152, partNumber: 'ACE-121-0546', brand: 'Avantor', categoryId: 4, productType: 'HPLC Column', expectedImageUrl: '/product-images/Avantor/ACE-121-0546.jpg', imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/njmdhSZqIofWXoHf.png' },
        { id: 90156, partNumber: 'ACE-125-2546', brand: 'Avantor', categoryId: 7, productType: 'HPLC Column', expectedImageUrl: '/product-images/Avantor/ACE-125-2546.jpg', imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/vbEsCcLiOCwvtLbG.png' },
        { id: 90157, partNumber: 'ACE-125-1546', brand: 'Avantor', categoryId: 7, productType: 'HPLC Column', expectedImageUrl: '/product-images/Avantor/ACE-125-1546.jpg', imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/lQYTcDOsCEqNMFLD.png' },
        { id: 90159, partNumber: 'ACE-126-2546', brand: 'Avantor', categoryId: 1, productType: 'HPLC Column', expectedImageUrl: '/product-images/Avantor/ACE-126-2546.jpg', imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/jPrvXLzGzosedjeL.png' },
        { id: 90160, partNumber: 'ACE-122-2546', brand: 'Avantor', categoryId: 5, productType: 'HPLC Column', expectedImageUrl: '/product-images/Avantor/ACE-122-2546.jpg', imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/qChZdyxtvSFFmfWv.png' },
        { id: 90161, partNumber: 'ACE-124-2546', brand: 'Avantor', categoryId: 9, productType: 'HPLC Column', expectedImageUrl: '/product-images/Avantor/ACE-124-2546.jpg', imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/tDoThwratqlBoSDX.png' },
      ] as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const results: Array<{ id: number; partNumber: string; oldImageUrl: string | null; newImageUrl: string; status: 'updated' }> = [];
        for (const update of verifiedImages) {
          if (!update.imageUrl.startsWith('https://files.manuscdn.com/')) {
            throw new Error(`Uncontrolled CDN image rejected for ${update.partNumber}`);
          }
          const [rows] = await connection.execute(
            'SELECT id, partNumber, brand, category_id AS categoryId, productType, imageUrl FROM products WHERE id = ? LIMIT 1',
            [update.id]
          ) as any;
          const product = rows[0];
          if (
            !product || product.id !== update.id || product.partNumber !== update.partNumber ||
            product.brand !== update.brand || Number(product.categoryId) !== update.categoryId ||
            product.productType !== update.productType || product.imageUrl !== update.expectedImageUrl
          ) {
            throw new Error(`Avantor ACE AI image identity or legacy-path precondition did not match for ${update.partNumber}`);
          }
          await connection.execute(
            'UPDATE products SET imageUrl = ?, updatedAt = NOW() WHERE id = ?',
            [update.imageUrl, update.id]
          );
          results.push({ id: update.id, partNumber: update.partNumber, oldImageUrl: product.imageUrl ?? null, newImageUrl: update.imageUrl, status: 'updated' });
        }
        await connection.commit();
        return { success: true, totalUpdated: results.length, results };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Correct only the verified product name for ACE-123-2546. Technical phase,
  // USP classification, descriptions, metadata, and imageUrl remain untouched.
  correctVerifiedAce1232546Name: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const expected = {
        id: 90158,
        partNumber: 'ACE-123-2546',
        brand: 'Avantor',
        categoryId: 6,
        productType: 'HPLC Column',
        oldName: 'ACE 5 SIL, 250 x 4.6 mm',
        newName: 'ACE 5 C4, 250 x 4.6 mm',
      } as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(
          'SELECT id, partNumber, brand, category_id AS categoryId, productType, name FROM products WHERE id = ? LIMIT 1',
          [expected.id]
        ) as any;
        const product = rows[0];
        if (
          !product || product.id !== expected.id || product.partNumber !== expected.partNumber ||
          product.brand !== expected.brand || Number(product.categoryId) !== expected.categoryId ||
          product.productType !== expected.productType || product.name !== expected.oldName
        ) {
          throw new Error('ACE-123-2546 name identity precondition did not match');
        }
        await connection.execute(
          'UPDATE products SET name = ?, updatedAt = NOW() WHERE id = ?',
          [expected.newName, expected.id]
        );
        await connection.commit();
        return { success: true, id: expected.id, partNumber: expected.partNumber, oldName: expected.oldName, newName: expected.newName, updatedField: 'name' as const };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Correct only the verified stationary-phase field for ACE-123-2546.
  // Name, USP, descriptions, metadata, category, type, and imageUrl remain untouched.
  correctVerifiedAce1232546PhaseType: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const expected = {
        id: 90158,
        partNumber: 'ACE-123-2546',
        brand: 'Avantor',
        categoryId: 6,
        productType: 'HPLC Column',
        expectedName: 'ACE 5 C4, 250 x 4.6 mm',
        oldPhaseType: null,
        newPhaseType: 'C4',
      } as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(
          'SELECT id, partNumber, brand, category_id AS categoryId, productType, name, phaseType FROM products WHERE id = ? LIMIT 1',
          [expected.id]
        ) as any;
        const product = rows[0];
        if (
          !product || product.id !== expected.id || product.partNumber !== expected.partNumber ||
          product.brand !== expected.brand || Number(product.categoryId) !== expected.categoryId ||
          product.productType !== expected.productType || product.name !== expected.expectedName ||
          product.phaseType !== expected.oldPhaseType
        ) {
          throw new Error('ACE-123-2546 phaseType identity precondition did not match');
        }
        await connection.execute(
          'UPDATE products SET phaseType = ?, updatedAt = NOW() WHERE id = ?',
          [expected.newPhaseType, expected.id]
        );
        await connection.commit();
        return { success: true, id: expected.id, partNumber: expected.partNumber, oldPhaseType: expected.oldPhaseType, newPhaseType: expected.newPhaseType, updatedField: 'phaseType' as const };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Correct only the verified USP classification for ACE-123-2546.
  // Name, phase, descriptions, metadata, category, type, and imageUrl remain untouched.
  correctVerifiedAce1232546Usp: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const expected = {
        id: 90158,
        partNumber: 'ACE-123-2546',
        brand: 'Avantor',
        categoryId: 6,
        productType: 'HPLC Column',
        expectedName: 'ACE 5 C4, 250 x 4.6 mm',
        expectedPhaseType: 'C4',
        oldUsp: 'L3',
        newUsp: 'L26',
      } as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(
          'SELECT id, partNumber, brand, category_id AS categoryId, productType, name, phaseType, usp FROM products WHERE id = ? LIMIT 1',
          [expected.id]
        ) as any;
        const product = rows[0];
        if (
          !product || product.id !== expected.id || product.partNumber !== expected.partNumber ||
          product.brand !== expected.brand || Number(product.categoryId) !== expected.categoryId ||
          product.productType !== expected.productType || product.name !== expected.expectedName ||
          product.phaseType !== expected.expectedPhaseType || product.usp !== expected.oldUsp
        ) {
          throw new Error('ACE-123-2546 USP identity precondition did not match');
        }
        await connection.execute(
          'UPDATE products SET usp = ?, updatedAt = NOW() WHERE id = ?',
          [expected.newUsp, expected.id]
        );
        await connection.commit();
        return { success: true, id: expected.id, partNumber: expected.partNumber, oldUsp: expected.oldUsp, newUsp: expected.newUsp, updatedField: 'usp' as const };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Correct only the factual narrative and SERP metadata for ACE-123-2546 after
  // name, phase and USP fields were independently verified and corrected.
  correctVerifiedAce1232546Content: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const expected = {
        id: 90158,
        partNumber: 'ACE-123-2546',
        brand: 'Avantor',
        categoryId: 6,
        productType: 'HPLC Column',
        name: 'ACE 5 C4, 250 x 4.6 mm',
        phaseType: 'C4',
        usp: 'L26',
      } as const;
      const corrected = {
        description: 'The Avantor ACE C4 is a 5 µm analytical HPLC column with a C4 stationary phase in a 250 x 4.6 mm stainless-steel format. Confirm suitability through local method development and validation.',
        detailedDescription: '## Product overview\n\nACE-123-2546 is an Avantor ACE C4 analytical HPLC column with 5 µm particles, a 250 mm length, and a 4.6 mm internal diameter. The official ACE C4 product family identifies this SKU as a stainless-steel C4 column and classifies the family under USP L26.\n\n## Method-development considerations\n\nSelect and qualify the column against the actual sample matrix, critical separation, system pressure, and applicable quality requirements. The listed dimensions and stationary phase support method screening, but local feasibility, system suitability, and validation evidence remain necessary before routine use.',
        metaTitle: 'Avantor ACE 5 C4, 250 x 4.6 mm (ACE-123-2546) | ROWELL',
        metaDescription: 'Avantor ACE C4 HPLC column, 5 µm, 250 x 4.6 mm (ACE-123-2546), USP L26. Review listed specifications and request availability from ROWELL.',
      } as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(
          'SELECT id, partNumber, brand, category_id AS categoryId, productType, name, phaseType, usp, description, detailedDescription, metaTitle, metaDescription FROM products WHERE id = ? LIMIT 1',
          [expected.id]
        ) as any;
        const product = rows[0];
        if (
          !product || product.id !== expected.id || product.partNumber !== expected.partNumber ||
          product.brand !== expected.brand || Number(product.categoryId) !== expected.categoryId ||
          product.productType !== expected.productType || product.name !== expected.name ||
          product.phaseType !== expected.phaseType || product.usp !== expected.usp ||
          !String(product.description || '').includes('ACE C18') ||
          !String(product.detailedDescription || '').includes('ACE 5 SIL') ||
          product.metaTitle !== 'Avantor ACE 5 SIL, 250 x 4.6 mm ACE-123-2546 | ROWELL' ||
          product.metaDescription !== 'Avantor ACE 5 SIL, 250 x 4.6 mm (ACE-123-2546) at ROWELL. Review listed specifications and request availability or a quote.'
        ) {
          throw new Error('ACE-123-2546 content identity precondition did not match');
        }
        await connection.execute(
          'UPDATE products SET description = ?, detailedDescription = ?, metaTitle = ?, metaDescription = ?, updatedAt = NOW() WHERE id = ?',
          [corrected.description, corrected.detailedDescription, corrected.metaTitle, corrected.metaDescription, expected.id]
        );
        await connection.commit();
        return { success: true, id: expected.id, partNumber: expected.partNumber, updatedFields: ['description', 'detailedDescription', 'metaTitle', 'metaDescription'] as const };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Bind only the reviewed, unbranded AI image for ACE-123-2546.
  // Product facts, content, category, type and all other fields remain untouched.
  bindVerifiedAce1232546AiImage: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const expected = {
        id: 90158,
        partNumber: 'ACE-123-2546',
        brand: 'Avantor',
        categoryId: 6,
        productType: 'HPLC Column',
        name: 'ACE 5 C4, 250 x 4.6 mm',
        phaseType: 'C4',
        usp: 'L26',
        oldImageUrl: '/product-images/Avantor/ACE-123-2546.jpg',
        newImageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/DLXKjLhCUzRfSZmX.png',
      } as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(
          'SELECT id, partNumber, brand, category_id AS categoryId, productType, name, phaseType, usp, imageUrl FROM products WHERE id = ? LIMIT 1',
          [expected.id]
        ) as any;
        const product = rows[0];
        if (
          !product || product.id !== expected.id || product.partNumber !== expected.partNumber ||
          product.brand !== expected.brand || Number(product.categoryId) !== expected.categoryId ||
          product.productType !== expected.productType || product.name !== expected.name ||
          product.phaseType !== expected.phaseType || product.usp !== expected.usp ||
          product.imageUrl !== expected.oldImageUrl
        ) {
          throw new Error('ACE-123-2546 image identity precondition did not match');
        }
        await connection.execute(
          'UPDATE products SET imageUrl = ?, updatedAt = NOW() WHERE id = ?',
          [expected.newImageUrl, expected.id]
        );
        await connection.commit();
        return { success: true, id: expected.id, partNumber: expected.partNumber, oldImageUrl: expected.oldImageUrl, newImageUrl: expected.newImageUrl, updatedField: 'imageUrl' as const };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Complete only productType for the verified Tosoh round-1 columns.
  // ImageUrl, names, specifications, categories, content and metadata remain untouched.
  completeVerifiedTosohRound1ProductTypes: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const corrections = [
        { id: 90305, partNumber: '0021462', brand: 'Tosoh', categoryId: 4, name: 'TSKgel ODS-100Z 5um 4.6x250mm', oldImageUrl: '/product-images/Tosoh/0021462.jpg' },
        { id: 90374, partNumber: '0018341', brand: 'Tosoh', categoryId: 1, name: 'TSKgel Alpha-4000', oldImageUrl: '/product-images/Tosoh/0018341.jpg' },
        { id: 90375, partNumber: '0018342', brand: 'Tosoh', categoryId: 1, name: 'TSKgel Alpha-5000', oldImageUrl: '/product-images/Tosoh/0018342.jpg' },
      ] as const;
      const newProductType = 'HPLC Column';
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        for (const expected of corrections) {
          const [rows] = await connection.execute(
            'SELECT id, partNumber, brand, category_id AS categoryId, name, productType, imageUrl FROM products WHERE id = ? LIMIT 1',
            [expected.id]
          ) as any;
          const product = rows[0];
          if (
            !product || product.id !== expected.id || product.partNumber !== expected.partNumber ||
            product.brand !== expected.brand || Number(product.categoryId) !== expected.categoryId ||
            product.name !== expected.name || product.productType !== null || product.imageUrl !== expected.oldImageUrl
          ) {
            throw new Error(`Tosoh productType identity precondition did not match for ${expected.partNumber}`);
          }
          await connection.execute(
            'UPDATE products SET productType = ?, updatedAt = NOW() WHERE id = ?',
            [newProductType, expected.id]
          );
        }
        await connection.commit();
        return { success: true, updatedField: 'productType' as const, productType: newProductType, products: corrections.map(({ id, partNumber }) => ({ id, partNumber })) };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Bind only the reviewed, unbranded AI images for the verified Tosoh round-1 columns.
  // Names, type, specifications, categories, content and metadata remain untouched.
  bindVerifiedTosohRound1AiImages: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const corrections = [
        { id: 90305, partNumber: '0021462', brand: 'Tosoh', categoryId: 4, productType: 'HPLC Column', name: 'TSKgel ODS-100Z 5um 4.6x250mm', oldImageUrl: '/product-images/Tosoh/0021462.jpg', newImageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/xiTeKwiAytJrfAEV.png' },
        { id: 90374, partNumber: '0018341', brand: 'Tosoh', categoryId: 1, productType: 'HPLC Column', name: 'TSKgel Alpha-4000', oldImageUrl: '/product-images/Tosoh/0018341.jpg', newImageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/bAgEPTCHajgDxXgh.png' },
        { id: 90375, partNumber: '0018342', brand: 'Tosoh', categoryId: 1, productType: 'HPLC Column', name: 'TSKgel Alpha-5000', oldImageUrl: '/product-images/Tosoh/0018342.jpg', newImageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/QIAYAkMwfQYScNwR.png' },
      ] as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        for (const expected of corrections) {
          const [rows] = await connection.execute(
            'SELECT id, partNumber, brand, category_id AS categoryId, productType, name, imageUrl FROM products WHERE id = ? LIMIT 1',
            [expected.id]
          ) as any;
          const product = rows[0];
          if (
            !product || product.id !== expected.id || product.partNumber !== expected.partNumber ||
            product.brand !== expected.brand || Number(product.categoryId) !== expected.categoryId ||
            product.productType !== expected.productType || product.name !== expected.name || product.imageUrl !== expected.oldImageUrl
          ) {
            throw new Error(`Tosoh image identity precondition did not match for ${expected.partNumber}`);
          }
          await connection.execute(
            'UPDATE products SET imageUrl = ?, updatedAt = NOW() WHERE id = ?',
            [expected.newImageUrl, expected.id]
          );
        }
        await connection.commit();
        return { success: true, updatedField: 'imageUrl' as const, products: corrections.map(({ id, partNumber, newImageUrl }) => ({ id, partNumber, newImageUrl })) };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Correct only the verified display name for Waters SKU 186003768.
  // Product type, specifications, content, metadata, category and image remain untouched.
  correctVerifiedWaters186003768Name: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const expected = {
        id: 120040,
        partNumber: '186003768',
        brand: 'Waters',
        categoryId: 1,
        productType: 'HPLC Column',
        usp: 'L1',
        oldName: 'Atlantis T3 Column, 100Å, 10 µm, 19 mm X 150 mm, 1/pk',
        newName: 'XBridge BEH C18 Method Validation Kit, 130Å, 3.5 µm, 3 mm X 150 mm, 3/pk',
        imageUrl: '/product-images/Waters/186003768.jpg',
      } as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(
          'SELECT id, partNumber, brand, category_id AS categoryId, productType, usp, name, imageUrl FROM products WHERE id = ? LIMIT 1',
          [expected.id]
        ) as any;
        const product = rows[0];
        if (
          !product || product.id !== expected.id || product.partNumber !== expected.partNumber ||
          product.brand !== expected.brand || Number(product.categoryId) !== expected.categoryId ||
          product.productType !== expected.productType || product.usp !== expected.usp ||
          product.name !== expected.oldName || product.imageUrl !== expected.imageUrl
        ) {
          throw new Error('Waters 186003768 name identity precondition did not match');
        }
        await connection.execute(
          'UPDATE products SET name = ?, updatedAt = NOW() WHERE id = ?',
          [expected.newName, expected.id]
        );
        await connection.commit();
        return { success: true, id: expected.id, partNumber: expected.partNumber, oldName: expected.oldName, newName: expected.newName, updatedField: 'name' as const };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Correct only the verified technical specifications for Waters SKU 186003768.
  // Name, product type, category, narrative content, metadata and image remain untouched.
  correctVerifiedWaters186003768TechnicalSpecs: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const expected = {
        id: 120040,
        partNumber: '186003768',
        brand: 'Waters',
        categoryId: 1,
        name: 'XBridge BEH C18 Method Validation Kit, 130Å, 3.5 µm, 3 mm X 150 mm, 3/pk',
        productType: 'HPLC Column',
        usp: 'L1',
        oldPhaseType: null,
        oldParticleSize: '10um',
        oldParticleSizeNum: 100,
        oldPoreSize: '100A',
        oldPoreSizeNum: 100,
        oldInnerDiameter: '19mm',
        oldInnerDiameterNum: 190,
        newPhaseType: 'C18',
        newParticleSize: '3.5µm',
        newPoreSize: '130Å',
        newPoreSizeNum: 130,
        newInnerDiameter: '3mm',
        newInnerDiameterNum: 3,
      } as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(
          'SELECT id, partNumber, brand, category_id AS categoryId, name, productType, usp, phaseType, particleSize, particleSizeNum, poreSize, poreSizeNum, innerDiameter, innerDiameterNum FROM products WHERE id = ? LIMIT 1',
          [expected.id]
        ) as any;
        const product = rows[0];
        if (
          !product || product.id !== expected.id || product.partNumber !== expected.partNumber ||
          product.brand !== expected.brand || Number(product.categoryId) !== expected.categoryId ||
          product.name !== expected.name || product.productType !== expected.productType || product.usp !== expected.usp ||
          product.phaseType !== expected.oldPhaseType || product.particleSize !== expected.oldParticleSize ||
          Number(product.particleSizeNum) !== expected.oldParticleSizeNum || product.poreSize !== expected.oldPoreSize ||
          Number(product.poreSizeNum) !== expected.oldPoreSizeNum || product.innerDiameter !== expected.oldInnerDiameter ||
          Number(product.innerDiameterNum) !== expected.oldInnerDiameterNum
        ) {
          throw new Error('Waters 186003768 technical specification identity precondition did not match');
        }
        await connection.execute(
          'UPDATE products SET phaseType = ?, particleSize = ?, particleSizeNum = NULL, poreSize = ?, poreSizeNum = ?, innerDiameter = ?, innerDiameterNum = ?, updatedAt = NOW() WHERE id = ?',
          [expected.newPhaseType, expected.newParticleSize, expected.newPoreSize, expected.newPoreSizeNum, expected.newInnerDiameter, expected.newInnerDiameterNum, expected.id]
        );
        await connection.commit();
        return {
          success: true,
          id: expected.id,
          partNumber: expected.partNumber,
          updatedFields: ['phaseType', 'particleSize', 'particleSizeNum', 'poreSize', 'poreSizeNum', 'innerDiameter', 'innerDiameterNum'] as const,
        };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Correct only narrative content and SERP metadata for Waters SKU 186003768.
  // Product identity, type, specifications, category, source URL and image remain untouched.
  correctVerifiedWaters186003768Content: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const expected = {
        id: 120040,
        partNumber: '186003768',
        brand: 'Waters',
        categoryId: 1,
        name: 'XBridge BEH C18 Method Validation Kit, 130Å, 3.5 µm, 3 mm X 150 mm, 3/pk',
        productType: 'HPLC Column',
        usp: 'L1',
        phaseType: 'C18',
        particleSize: '3.5µm',
        poreSize: '130Å',
        innerDiameter: '3mm',
        columnLength: '150mm',
        imageUrl: '/product-images/Waters/186003768.jpg',
        metaTitle: 'Waters XBridge BEH C18 Method Validation Kit 186003768 | ROWELL',
        metaDescription: 'Waters XBridge BEH C18 Method Validation Kit, 130Å, 3.5 µm, 3 mm × 150 mm, 3/pk. Review specifications and request a quote from ROWELL.',
        description: 'Waters XBridge BEH C18 Method Validation Kit contains three 3 mm × 150 mm HPLC columns with 3.5 µm, 130 Å C18 packing. This SKU supports method-validation workflows where users need a consistent, clearly identified column set.',
        detailedDescription: 'The Waters XBridge BEH C18 Method Validation Kit, part number 186003768, is a three-column HPLC kit built around C18 chemistry. The listed columns have a 3 mm internal diameter, 150 mm length, 3.5 µm particles and 130 Å pore size.\n\nROWELL presents this item with its published C18 and USP L1 classification to help laboratories confirm the part number and core format before requesting a quotation. Method suitability, operating conditions and validation remain the responsibility of the laboratory using the product.\n\nFor a product enquiry, include the part number, intended application and destination country or region so ROWELL can review availability and support requirements.',
      } as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(
          'SELECT id, partNumber, brand, category_id AS categoryId, name, productType, usp, phaseType, particleSize, poreSize, innerDiameter, columnLength, imageUrl, description, detailedDescription, metaTitle, metaDescription FROM products WHERE id = ? LIMIT 1',
          [expected.id]
        ) as any;
        const product = rows[0];
        if (
          !product || product.id !== expected.id || product.partNumber !== expected.partNumber ||
          product.brand !== expected.brand || Number(product.categoryId) !== expected.categoryId ||
          product.name !== expected.name || product.productType !== expected.productType || product.usp !== expected.usp ||
          product.phaseType !== expected.phaseType || product.particleSize !== expected.particleSize ||
          product.poreSize !== expected.poreSize || product.innerDiameter !== expected.innerDiameter ||
          product.columnLength !== expected.columnLength || product.imageUrl !== expected.imageUrl ||
          !String(product.description || '').includes('Atlantis T3') ||
          !String(product.detailedDescription || '').includes('Atlantis T3') ||
          !String(product.metaTitle || '').includes('Atlantis T3') ||
          !String(product.metaDescription || '').includes('Atlantis T3')
        ) {
          throw new Error('Waters 186003768 content identity precondition did not match');
        }
        await connection.execute(
          'UPDATE products SET description = ?, detailedDescription = ?, metaTitle = ?, metaDescription = ?, updatedAt = NOW() WHERE id = ?',
          [expected.description, expected.detailedDescription, expected.metaTitle, expected.metaDescription, expected.id]
        );
        await connection.commit();
        return {
          success: true,
          id: expected.id,
          partNumber: expected.partNumber,
          updatedFields: ['description', 'detailedDescription', 'metaTitle', 'metaDescription'] as const,
        };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Bind only the verified AI image for Waters SKU 186003768.
  // Product name, type, specifications, content and metadata remain untouched.
  bindVerifiedWaters186003768AiImage: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const expected = {
        id: 120040,
        partNumber: '186003768',
        brand: 'Waters',
        categoryId: 1,
        name: 'XBridge BEH C18 Method Validation Kit, 130Å, 3.5 µm, 3 mm X 150 mm, 3/pk',
        productType: 'HPLC Column',
        usp: 'L1',
        phaseType: 'C18',
        particleSize: '3.5µm',
        poreSize: '130Å',
        columnLength: '150mm',
        innerDiameter: '3mm',
        oldImageUrl: '/product-images/Waters/186003768.jpg',
        newImageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/BiWqSQocaRXgQImY.png',
      } as const;
      if (!expected.newImageUrl.startsWith('https://files.manuscdn.com/')) {
        throw new Error('Uncontrolled image URL');
      }
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(
          'SELECT id, partNumber, brand, category_id AS categoryId, name, productType, usp, phaseType, particleSize, poreSize, columnLength, innerDiameter, imageUrl FROM products WHERE id = ? LIMIT 1',
          [expected.id]
        ) as any;
        const product = rows[0];
        if (
          !product || product.id !== expected.id || product.partNumber !== expected.partNumber ||
          product.brand !== expected.brand || Number(product.categoryId) !== expected.categoryId ||
          product.name !== expected.name || product.productType !== expected.productType || product.usp !== expected.usp ||
          product.phaseType !== expected.phaseType || product.particleSize !== expected.particleSize ||
          product.poreSize !== expected.poreSize || product.columnLength !== expected.columnLength ||
          product.innerDiameter !== expected.innerDiameter || product.imageUrl !== expected.oldImageUrl
        ) {
          throw new Error('Waters 186003768 image identity precondition did not match');
        }
        await connection.execute(
          'UPDATE products SET imageUrl = ?, updatedAt = NOW() WHERE id = ?',
          [expected.newImageUrl, expected.id]
        );
        await connection.commit();
        return { success: true, id: expected.id, partNumber: expected.partNumber, oldImageUrl: expected.oldImageUrl, newImageUrl: expected.newImageUrl, updatedField: 'imageUrl' as const };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Controlled CTR experiment for the verified high-impression Kinetex F5 page.
  // Only SERP narrative fields are updated; product facts, content and image remain unchanged.
  applyVerifiedKinetexF5CtrExperiment: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const expected = {
        id: 60083,
        partNumber: '00D-4723-E0',
        brand: 'Phenomenex',
        categoryId: 1,
        productType: 'HPLC Column',
        name: 'Phenomenex Kinetex F5 LC Column, 100 × 4.6mm',
        phaseType: 'F5 core-shell pentafluorophenyl propyl',
        particleSize: '2.6µm',
        poreSize: '10nm (100Å)',
        columnLength: '100mm',
        innerDiameter: '4.6mm',
        usp: 'L43',
        imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/YuwHStkUZrUyCpCH.webp',
        oldMetaTitle: 'Kinetex F5 2.6µm 4.6×100mm 00D-4723-E0',
        oldMetaDescription: 'Phenomenex Kinetex F5 LC column, 2.6µm, 100Å, 4.6×100mm (00D-4723-E0). USP L43; request a quote.',
        newMetaTitle: 'Phenomenex Kinetex F5 USP L43 HPLC Column 100 × 4.6 mm | ROWELL',
        newMetaDescription: 'Phenomenex Kinetex F5 HPLC column, 2.6 µm, 100 Å, 100 × 4.6 mm (00D-4723-E0), USP L43. View specifications and request a quote from ROWELL.',
      } as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(
          'SELECT id, partNumber, brand, category_id AS categoryId, productType, name, phaseType, particleSize, poreSize, columnLength, innerDiameter, usp, imageUrl, metaTitle, metaDescription FROM products WHERE id = ? LIMIT 1',
          [expected.id]
        ) as any;
        const product = rows[0];
        if (
          !product || product.id !== expected.id || product.partNumber !== expected.partNumber ||
          product.brand !== expected.brand || Number(product.categoryId) !== expected.categoryId ||
          product.productType !== expected.productType || product.name !== expected.name ||
          product.phaseType !== expected.phaseType || product.particleSize !== expected.particleSize ||
          product.poreSize !== expected.poreSize || product.columnLength !== expected.columnLength ||
          product.innerDiameter !== expected.innerDiameter || product.usp !== expected.usp ||
          product.imageUrl !== expected.imageUrl || product.metaTitle !== expected.oldMetaTitle ||
          product.metaDescription !== expected.oldMetaDescription
        ) {
          throw new Error('Kinetex F5 CTR experiment identity precondition did not match');
        }
        await connection.execute(
          'UPDATE products SET metaTitle = ?, metaDescription = ?, updatedAt = NOW() WHERE id = ?',
          [expected.newMetaTitle, expected.newMetaDescription, expected.id]
        );
        await connection.commit();
        return {
          success: true,
          id: expected.id,
          partNumber: expected.partNumber,
          oldMetaTitle: expected.oldMetaTitle,
          newMetaTitle: expected.newMetaTitle,
          oldMetaDescription: expected.oldMetaDescription,
          newMetaDescription: expected.newMetaDescription,
          updatedFields: ['metaTitle', 'metaDescription'] as const,
        };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Controlled CTR experiment for the verified high-impression Tosoh G3000SWxl page.
  // Only SERP narrative fields are updated; product facts, content and image remain unchanged.
  applyVerifiedTosohG3000SwxlCtrExperiment: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const expected = {
        id: 90301,
        partNumber: '0008541',
        brand: 'Tosoh',
        categoryId: 1,
        productType: 'HPLC Column',
        name: 'TSKgel G3000SWxl Aqueous SEC/GFC Column, 7.8 mm × 300 mm, 5 µm',
        phaseType: 'Silica-based aqueous SEC/GFC phase',
        particleSize: '5µm',
        poreSize: '25nm',
        columnLength: '300mm',
        innerDiameter: '7.8mm',
        usp: null,
        imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/IcDHYSxoVKmfQbdC.png',
        oldMetaTitle: 'Tosoh G3000SWxl GFC 7.8x300 mm 0008541 | ROWELL',
        oldMetaDescription: 'Tosoh TSKgel G3000SWxl aqueous SEC/GFC column, 7.8 mm x 300 mm, 5 µm (0008541). Review listed specifications and request a quote.',
        newMetaTitle: 'Tosoh TSKgel G3000SWxl SEC/GFC Column 7.8 × 300 mm | ROWELL',
        newMetaDescription: 'Tosoh TSKgel G3000SWxl aqueous SEC/GFC column, 7.8 × 300 mm, 5 µm, 25 nm (0008541). View listed specifications and request a quote from ROWELL.',
      } as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(
          'SELECT id, partNumber, brand, category_id AS categoryId, productType, name, phaseType, particleSize, poreSize, columnLength, innerDiameter, usp, imageUrl, metaTitle, metaDescription FROM products WHERE id = ? LIMIT 1',
          [expected.id]
        ) as any;
        const product = rows[0];
        if (
          !product || product.id !== expected.id || product.partNumber !== expected.partNumber ||
          product.brand !== expected.brand || Number(product.categoryId) !== expected.categoryId ||
          product.productType !== expected.productType || product.name !== expected.name ||
          product.phaseType !== expected.phaseType || product.particleSize !== expected.particleSize ||
          product.poreSize !== expected.poreSize || product.columnLength !== expected.columnLength ||
          product.innerDiameter !== expected.innerDiameter || product.usp !== expected.usp ||
          product.imageUrl !== expected.imageUrl || product.metaTitle !== expected.oldMetaTitle ||
          product.metaDescription !== expected.oldMetaDescription
        ) {
          throw new Error('Tosoh G3000SWxl CTR experiment identity precondition did not match');
        }
        await connection.execute(
          'UPDATE products SET metaTitle = ?, metaDescription = ?, updatedAt = NOW() WHERE id = ?',
          [expected.newMetaTitle, expected.newMetaDescription, expected.id]
        );
        await connection.commit();
        return {
          success: true,
          id: expected.id,
          partNumber: expected.partNumber,
          oldMetaTitle: expected.oldMetaTitle,
          newMetaTitle: expected.newMetaTitle,
          oldMetaDescription: expected.oldMetaDescription,
          newMetaDescription: expected.newMetaDescription,
          updatedFields: ['metaTitle', 'metaDescription'] as const,
        };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Controlled CTR experiment for the verified high-impression Kinetex PFP page.
  // Only SERP narrative fields are updated; product facts, content and image remain unchanged.
  applyVerifiedKinetexPfpCtrExperiment: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const expected = {
        id: 60069,
        partNumber: '00D-4476-AN',
        brand: 'Phenomenex',
        categoryId: 1,
        productType: 'HPLC Column',
        name: 'Kinetex 1.7 µm PFP 100 Å, LC Column 100 × 2.1 mm',
        phaseType: 'PFP',
        particleSize: '1.7um',
        poreSize: '100A',
        columnLength: '100mm',
        innerDiameter: '2.1mm',
        usp: 'L43',
        imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/vpWAilCfNChUfpCl.webp',
        oldMetaTitle: 'Phenomenex Kinetex PFP 100 x 2.1 mm 00D-4476-AN | ROWELL',
        oldMetaDescription: 'Phenomenex Kinetex PFP 100 Å LC column, 100 x 2.1 mm, 1.7 µm (00D-4476-AN). Review listed specifications and request a quote.',
        newMetaTitle: 'Phenomenex Kinetex PFP USP L43 HPLC Column 100 × 2.1 mm | ROWELL',
        newMetaDescription: 'Phenomenex Kinetex PFP HPLC column, 1.7 µm, 100 Å, 100 × 2.1 mm (00D-4476-AN), USP L43. View specifications and request a quote from ROWELL.',
      } as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(
          'SELECT id, partNumber, brand, category_id AS categoryId, productType, name, phaseType, particleSize, poreSize, columnLength, innerDiameter, usp, imageUrl, metaTitle, metaDescription FROM products WHERE id = ? LIMIT 1',
          [expected.id]
        ) as any;
        const product = rows[0];
        if (
          !product || product.id !== expected.id || product.partNumber !== expected.partNumber ||
          product.brand !== expected.brand || Number(product.categoryId) !== expected.categoryId ||
          product.productType !== expected.productType || product.name !== expected.name ||
          product.phaseType !== expected.phaseType || product.particleSize !== expected.particleSize ||
          product.poreSize !== expected.poreSize || product.columnLength !== expected.columnLength ||
          product.innerDiameter !== expected.innerDiameter || product.usp !== expected.usp ||
          product.imageUrl !== expected.imageUrl || product.metaTitle !== expected.oldMetaTitle ||
          product.metaDescription !== expected.oldMetaDescription
        ) {
          throw new Error('Kinetex PFP CTR experiment identity precondition did not match');
        }
        await connection.execute(
          'UPDATE products SET metaTitle = ?, metaDescription = ?, updatedAt = NOW() WHERE id = ?',
          [expected.newMetaTitle, expected.newMetaDescription, expected.id]
        );
        await connection.commit();
        return {
          success: true,
          id: expected.id,
          partNumber: expected.partNumber,
          oldMetaTitle: expected.oldMetaTitle,
          newMetaTitle: expected.newMetaTitle,
          oldMetaDescription: expected.oldMetaDescription,
          newMetaDescription: expected.newMetaDescription,
          updatedFields: ['metaTitle', 'metaDescription'] as const,
        };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Controlled CTR experiment for the verified high-impression Waters XBridge BEH C18 page.
  // Only SERP narrative fields are updated; product facts, content and image remain unchanged.
  applyVerifiedWatersXbridgeCtrExperiment: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const expected = {
        id: 120012,
        partNumber: '186003117',
        brand: 'Waters',
        categoryId: 4,
        productType: 'HPLC Column',
        name: 'XBridge BEH C18 Column, 130Å, 5µm, 4.6mm × 250mm',
        phaseType: 'BEH C18 reversed-phase hybrid',
        particleSize: '5µm',
        poreSize: '13nm (130Å)',
        columnLength: '250mm',
        innerDiameter: '4.6mm',
        usp: 'L1',
        imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/MRKsQHrMsOwfvrFo.webp',
        oldMetaTitle: 'Waters XBridge BEH C18 4.6x250mm 5µm 186003117 | ROWELL',
        oldMetaDescription: 'Waters XBridge BEH C18 column, 130 Å, 5µm, 4.6mm x 250mm (186003117). Review listed specifications and request a quote.',
        newMetaTitle: 'Waters XBridge BEH C18 USP L1 HPLC Column 4.6 × 250 mm | ROWELL',
        newMetaDescription: 'Waters XBridge BEH C18 HPLC column, 130 Å, 5 µm, 4.6 × 250 mm (186003117), USP L1. Review listed specifications and request a quote from ROWELL.',
      } as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(
          'SELECT id, partNumber, brand, category_id AS categoryId, productType, name, phaseType, particleSize, poreSize, columnLength, innerDiameter, usp, imageUrl, metaTitle, metaDescription FROM products WHERE id = ? LIMIT 1',
          [expected.id]
        ) as any;
        const product = rows[0];
        if (
          !product || product.id !== expected.id || product.partNumber !== expected.partNumber ||
          product.brand !== expected.brand || Number(product.categoryId) !== expected.categoryId ||
          product.productType !== expected.productType || product.name !== expected.name ||
          product.phaseType !== expected.phaseType || product.particleSize !== expected.particleSize ||
          product.poreSize !== expected.poreSize || product.columnLength !== expected.columnLength ||
          product.innerDiameter !== expected.innerDiameter || product.usp !== expected.usp ||
          product.imageUrl !== expected.imageUrl || product.metaTitle !== expected.oldMetaTitle ||
          product.metaDescription !== expected.oldMetaDescription
        ) {
          throw new Error('Waters XBridge CTR experiment identity precondition did not match');
        }
        await connection.execute(
          'UPDATE products SET metaTitle = ?, metaDescription = ?, updatedAt = NOW() WHERE id = ?',
          [expected.newMetaTitle, expected.newMetaDescription, expected.id]
        );
        await connection.commit();
        return {
          success: true,
          id: expected.id,
          partNumber: expected.partNumber,
          oldMetaTitle: expected.oldMetaTitle,
          newMetaTitle: expected.newMetaTitle,
          oldMetaDescription: expected.oldMetaDescription,
          newMetaDescription: expected.newMetaDescription,
          updatedFields: ['metaTitle', 'metaDescription'] as const,
        };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Controlled product-type completion for two Tosoh records with public model-level evidence.
  // This route is intentionally limited to productType; technical specifications, content and images remain isolated.
  applyVerifiedTosohHplcColumnTypeCompletion: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const expected = [
        { id: 90373, partNumber: '0018339', brand: 'Tosoh', categoryId: 1, name: 'TSKgel Alpha-2500', oldProductType: null },
        { id: 90378, partNumber: '0008029', brand: 'Tosoh', categoryId: 1, name: 'TSKgel G2500PW', oldProductType: null },
      ] as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        for (const item of expected) {
          const [rows] = await connection.execute(
            'SELECT id, partNumber, brand, category_id AS categoryId, name, productType FROM products WHERE id = ? LIMIT 1',
            [item.id]
          ) as any;
          const product = rows[0];
          if (
            !product || product.id !== item.id || product.partNumber !== item.partNumber ||
            product.brand !== item.brand || Number(product.categoryId) !== item.categoryId ||
            product.name !== item.name || product.productType !== item.oldProductType
          ) {
            throw new Error(`Tosoh productType identity precondition did not match for ${item.partNumber}`);
          }
          await connection.execute(
            'UPDATE products SET productType = ?, updatedAt = NOW() WHERE id = ?',
            ['HPLC Column', item.id]
          );
        }
        await connection.commit();
        return {
          success: true,
          updated: expected.map((item) => ({
            id: item.id,
            partNumber: item.partNumber,
            oldProductType: item.oldProductType,
            newProductType: 'HPLC Column' as const,
          })),
          updatedFields: ['productType'] as const,
        };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Controlled technical-specification correction for two Tosoh HPLC columns.
  // It intentionally updates only display specification fields and never writes integer numeric helper columns.
  applyVerifiedTosohTechnicalSpecificationCorrections: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const expected = [
        {
          id: 90373, partNumber: '0018339', brand: 'Tosoh', categoryId: 1,
          productType: 'HPLC Column', name: 'TSKgel Alpha-2500',
          oldParticleSize: '5um', oldPoreSize: 'N/A', oldColumnLength: '300mm', oldInnerDiameter: '7.8mm',
          newParticleSize: '7um', newPoreSize: '2.5nm', newColumnLength: '300mm', newInnerDiameter: '7.8mm',
        },
        {
          id: 90378, partNumber: '0008029', brand: 'Tosoh', categoryId: 1,
          productType: 'HPLC Column', name: 'TSKgel G2500PW',
          oldParticleSize: '5um', oldPoreSize: 'N/A', oldColumnLength: '300mm', oldInnerDiameter: '7.8mm',
          newParticleSize: '12um', newPoreSize: '15nm', newColumnLength: '600mm', newInnerDiameter: '7.5mm',
        },
      ] as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        for (const item of expected) {
          const [rows] = await connection.execute(
            'SELECT id, partNumber, brand, category_id AS categoryId, productType, name, particleSize, poreSize, columnLength, innerDiameter FROM products WHERE id = ? LIMIT 1',
            [item.id]
          ) as any;
          const product = rows[0];
          if (
            !product || product.id !== item.id || product.partNumber !== item.partNumber ||
            product.brand !== item.brand || Number(product.categoryId) !== item.categoryId ||
            product.productType !== item.productType || product.name !== item.name ||
            product.particleSize !== item.oldParticleSize || product.poreSize !== item.oldPoreSize ||
            product.columnLength !== item.oldColumnLength || product.innerDiameter !== item.oldInnerDiameter
          ) {
            throw new Error(`Tosoh technical specification identity precondition did not match for ${item.partNumber}`);
          }
          await connection.execute(
            'UPDATE products SET particleSize = ?, poreSize = ?, columnLength = ?, innerDiameter = ?, updatedAt = NOW() WHERE id = ?',
            [item.newParticleSize, item.newPoreSize, item.newColumnLength, item.newInnerDiameter, item.id]
          );
        }
        await connection.commit();
        return {
          success: true,
          updated: expected.map((item) => ({
            id: item.id,
            partNumber: item.partNumber,
            old: {
              particleSize: item.oldParticleSize,
              poreSize: item.oldPoreSize,
              columnLength: item.oldColumnLength,
              innerDiameter: item.oldInnerDiameter,
            },
            updated: {
              particleSize: item.newParticleSize,
              poreSize: item.newPoreSize,
              columnLength: item.newColumnLength,
              innerDiameter: item.newInnerDiameter,
            },
          })),
          updatedFields: ['particleSize', 'poreSize', 'columnLength', 'innerDiameter'] as const,
        };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Controlled narrative and SERP correction for two Tosoh records after independent technical-field verification.
  // This route does not alter product facts, classifications, or images.
  applyVerifiedTosohNarrativeContentCorrections: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const expected = [
        {
          id: 90373, partNumber: '0018339', brand: 'Tosoh', categoryId: 1,
          productType: 'HPLC Column', name: 'TSKgel Alpha-2500', particleSize: '7um', poreSize: '2.5nm', columnLength: '300mm', innerDiameter: '7.8mm',
          oldDescription: 'High-performance GPC column: TSKgel Alpha-2500',
          oldMetaTitle: 'Tosoh TSKgel Alpha-2500 0018339 | ROWELL',
          oldMetaDescription: 'Tosoh TSKgel Alpha-2500 (0018339) at ROWELL. Review listed specifications and request availability or a quote.',
          oldDetailNeedle: 'a 5 µm packing',
          newDescription: 'Organic SEC/GPC HPLC column: TSKgel Alpha-2500',
          newDetailedDescription: `### Product Overview\n\nThe **Tosoh TSKgel Alpha-2500** (Part No. **0018339**) is an HPLC column for organic size-exclusion chromatography (SEC/GPC). According to the manufacturer, it uses rigid porous polymer beads engineered for operation in polar organic solvents.\n\n### Verified Specifications\n\n- **Product category:** HPLC column\n- **Separation mode:** Organic size-exclusion — GPC\n- **Column dimensions:** 7.8 mm i.d. × 300 mm\n- **Particle size:** 7 µm\n- **Pore size:** 2.5 nm\n- **Housing:** Stainless steel\n\n### Application Scope\n\nThe manufacturer describes this column for polymer analyses in polar organic solvents, including workflows involving polymers soluble in solvents such as methanol, acetonitrile, DMSO, isopropanol, THF or HFIP. Method conditions, solvent compatibility, calibration and detector selection should be verified against the current manufacturer documentation for the specific sample and laboratory method.`,
          newMetaTitle: 'Tosoh TSKgel Alpha-2500 GPC HPLC Column 7.8 × 300 mm | ROWELL',
          newMetaDescription: 'Tosoh TSKgel Alpha-2500 organic SEC/GPC HPLC column, 7.8 × 300 mm, 7 µm, 2.5 nm (0018339). Review specifications and request a quote.',
        },
        {
          id: 90378, partNumber: '0008029', brand: 'Tosoh', categoryId: 1,
          productType: 'HPLC Column', name: 'TSKgel G2500PW', particleSize: '12um', poreSize: '15nm', columnLength: '600mm', innerDiameter: '7.5mm',
          oldDescription: 'High-performance GPC column: TSKgel G2500PW',
          oldMetaTitle: 'Tosoh TSKgel G2500PW 0008029 | ROWELL',
          oldMetaDescription: 'Tosoh TSKgel G2500PW (0008029) at ROWELL. Review listed specifications and request availability or a quote.',
          oldDetailNeedle: 'This 300 mm × 7.8 mm i.d. analytical column with a 5 µm particle bed',
          newDescription: 'Aqueous SEC/GFC HPLC column: TSKgel G2500PW',
          newDetailedDescription: `### Product Overview\n\nThe **Tosoh TSKgel G2500PW** (Part No. **0008029**) is an HPLC column for aqueous size-exclusion chromatography (SEC/GFC). The manufacturer describes G2500PW columns as suited to water-soluble polymers with molecular weights below 3,000 Da and as packed with spherical hydrophilic polymethacrylate beads.\n\n### Verified Specifications\n\n- **Product category:** HPLC column\n- **Separation mode:** Aqueous size-exclusion — GFC\n- **Column dimensions:** 7.5 mm i.d. × 600 mm\n- **Particle size:** 12 µm\n- **Pore size:** 15 nm\n- **Housing:** Stainless steel\n\n### Application Scope\n\nThe manufacturer identifies applications involving water-soluble polymers, including celluloses, acrylamides, glycols, dextrans, polyvinyl alcohol and oligosaccharides. Manufacturer-published operating boundaries state pH 2–12, aqueous or buffered mobile phases with up to 20% methanol, and temperatures up to 80 °C. Confirm method suitability, operating conditions and calibration with current manufacturer documentation before use.`,
          newMetaTitle: 'Tosoh TSKgel G2500PW Aqueous SEC/GFC Column 7.5 × 600 mm | ROWELL',
          newMetaDescription: 'Tosoh TSKgel G2500PW aqueous SEC/GFC HPLC column, 7.5 × 600 mm, 12 µm, 15 nm (0008029). Review listed specifications and request a quote.',
        },
      ] as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        for (const item of expected) {
          const [rows] = await connection.execute(
            'SELECT id, partNumber, brand, category_id AS categoryId, productType, name, particleSize, poreSize, columnLength, innerDiameter, description, detailedDescription, metaTitle, metaDescription FROM products WHERE id = ? LIMIT 1',
            [item.id]
          ) as any;
          const product = rows[0];
          if (
            !product || product.id !== item.id || product.partNumber !== item.partNumber ||
            product.brand !== item.brand || Number(product.categoryId) !== item.categoryId ||
            product.productType !== item.productType || product.name !== item.name ||
            product.particleSize !== item.particleSize || product.poreSize !== item.poreSize ||
            product.columnLength !== item.columnLength || product.innerDiameter !== item.innerDiameter ||
            product.description !== item.oldDescription || product.metaTitle !== item.oldMetaTitle ||
            product.metaDescription !== item.oldMetaDescription || !String(product.detailedDescription || '').includes(item.oldDetailNeedle)
          ) {
            throw new Error(`Tosoh narrative content identity precondition did not match for ${item.partNumber}`);
          }
          await connection.execute(
            'UPDATE products SET description = ?, detailedDescription = ?, metaTitle = ?, metaDescription = ?, updatedAt = NOW() WHERE id = ?',
            [item.newDescription, item.newDetailedDescription, item.newMetaTitle, item.newMetaDescription, item.id]
          );
        }
        await connection.commit();
        return {
          success: true,
          updated: expected.map((item) => ({ id: item.id, partNumber: item.partNumber, metaTitle: item.newMetaTitle, metaDescription: item.newMetaDescription })),
          updatedFields: ['description', 'detailedDescription', 'metaTitle', 'metaDescription'] as const,
        };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Controlled image-only binding for two independently verified Tosoh HPLC columns.
  applyVerifiedTosohRound2AiImageBindings: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const expected = [
        {
          id: 90373, partNumber: '0018339', brand: 'Tosoh', categoryId: 1,
          productType: 'HPLC Column', name: 'TSKgel Alpha-2500',
          particleSize: '7um', poreSize: '2.5nm', columnLength: '300mm', innerDiameter: '7.8mm',
          oldImageUrl: '/product-images/Tosoh/0018339.jpg',
          newImageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/IlXJoBoaMwAXstdI.png',
        },
        {
          id: 90378, partNumber: '0008029', brand: 'Tosoh', categoryId: 1,
          productType: 'HPLC Column', name: 'TSKgel G2500PW',
          particleSize: '12um', poreSize: '15nm', columnLength: '600mm', innerDiameter: '7.5mm',
          oldImageUrl: '/product-images/Tosoh/0008029.jpg',
          newImageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/WNMKzJUrJaSVhuef.png',
        },
      ] as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        for (const item of expected) {
          const [rows] = await connection.execute(
            'SELECT id, partNumber, brand, category_id AS categoryId, productType, name, particleSize, poreSize, columnLength, innerDiameter, imageUrl FROM products WHERE id = ? LIMIT 1',
            [item.id]
          ) as any;
          const product = rows[0];
          if (
            !product || product.id !== item.id || product.partNumber !== item.partNumber ||
            product.brand !== item.brand || Number(product.categoryId) !== item.categoryId ||
            product.productType !== item.productType || product.name !== item.name ||
            product.particleSize !== item.particleSize || product.poreSize !== item.poreSize ||
            product.columnLength !== item.columnLength || product.innerDiameter !== item.innerDiameter ||
            product.imageUrl !== item.oldImageUrl
          ) {
            throw new Error(`Tosoh image binding identity precondition did not match for ${item.partNumber}`);
          }
          await connection.execute('UPDATE products SET imageUrl = ?, updatedAt = NOW() WHERE id = ?', [item.newImageUrl, item.id]);
        }
        await connection.commit();
        return {
          success: true,
          updated: expected.map((item) => ({ id: item.id, partNumber: item.partNumber, oldImageUrl: item.oldImageUrl, imageUrl: item.newImageUrl })),
          updatedFields: ['imageUrl'] as const,
        };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
    }),

  // Fixed-identity, length-only correction for a verified Phenomenex exact-model conflict.
  applyVerifiedPhenomenex00F4622E0LengthCorrection: publicProcedure
    .input((raw: unknown) => z.object({ adminKey: z.string() }).parse(raw))
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') throw new Error('Unauthorized');
      const expected = {
        id: 60047,
        partNumber: '00F-4622-E0',
        brand: 'Phenomenex',
        categoryId: 1,
        productType: 'HPLC Column',
        name: 'Kinetex 2.6 µm Biphenyl 100 Å, LC Column 250 x 4.6 mm',
        particleSize: '2.6um',
        poreSize: '100A',
        oldColumnLength: '250mm',
        oldColumnLengthNum: 250,
        innerDiameter: '4.6mm',
        newColumnLength: '150mm',
        newColumnLengthNum: 150,
      } as const;
      const { getPool } = await import('./db');
      const pool = await getPool();
      if (!pool) throw new Error('Database pool not available');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(
          'SELECT id, partNumber, brand, category_id AS categoryId, productType, name, particleSize, poreSize, columnLength, columnLengthNum, innerDiameter FROM products WHERE id = ? LIMIT 1',
          [expected.id]
        ) as any;
        const product = rows[0];
        if (
          !product || product.id !== expected.id || product.partNumber !== expected.partNumber ||
          product.brand !== expected.brand || Number(product.categoryId) !== expected.categoryId ||
          product.productType !== expected.productType || product.name !== expected.name ||
          product.particleSize !== expected.particleSize || product.poreSize !== expected.poreSize ||
          product.columnLength !== expected.oldColumnLength || Number(product.columnLengthNum) !== expected.oldColumnLengthNum ||
          product.innerDiameter !== expected.innerDiameter
        ) {
          throw new Error(`Phenomenex length identity precondition did not match for ${expected.partNumber}`);
        }
        await connection.execute(
          'UPDATE products SET columnLength = ?, columnLengthNum = ?, updatedAt = NOW() WHERE id = ?',
          [expected.newColumnLength, expected.newColumnLengthNum, expected.id]
        );
        await connection.commit();
        return {
          success: true,
          updated: [{ id: expected.id, partNumber: expected.partNumber, columnLength: expected.newColumnLength }],
          updatedFields: ['columnLength', 'columnLengthNum'] as const,
        };
      } catch (error: any) {
        await connection.rollback();
        throw new Error(String(error?.sqlMessage || error?.message || error));
      } finally {
        connection.release();
      }
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
