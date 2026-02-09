import { publicProcedure, router } from "./_core/trpc";
import { z } from 'zod';

export const addGlycoWorksSimpleRouter = router({
  // Add products with hardcoded category ID
  addWithCategoryId: publicProcedure
    .input((raw: unknown) => {
      return z.object({
        adminKey: z.string(),
        categoryId: z.number(),
      }).parse(raw);
    })
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') {
        throw new Error('Unauthorized');
      }

      const { getDb } = await import('./db');
      const { products } = await import('../drizzle/schema');
      const { eq, or } = await import('drizzle-orm');
      const db = await getDb();

      // Check if products already exist
      const existingProducts = await db
        .select()
        .from(products)
        .where(
          or(
            eq(products.partNumber, "186007239"),
            eq(products.partNumber, "186007080")
          )
        );

      const newProducts = [
        {
          partNumber: "186007239",
          productId: "WATS-186007239",
          name: "GlycoWorks HILIC 1 cc Flangeless Cartridge",
          brand: "Waters",
          categoryId: input.categoryId,
          status: "active" as const,
          productType: "SPE Cartridge",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          partNumber: "186007080",
          productId: "WATS-186007080",
          name: "GlycoWorks HILIC 1 cc Cartridge, 20/pk",
          brand: "Waters",
          categoryId: input.categoryId,
          status: "active" as const,
          productType: "SPE Cartridge",
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
              productType: product.productType,
              updatedAt: new Date()
            })
            .where(eq(products.partNumber, product.partNumber));
          results.push({ partNumber: product.partNumber, action: 'updated', id: existing.id });
        } else {
          // Insert new product
          const result = await db.insert(products).values(product);
          results.push({ partNumber: product.partNumber, action: 'added', id: result[0].insertId });
        }
      }

      return {
        success: true,
        results,
        categoryId: input.categoryId
      };
    }),
});
