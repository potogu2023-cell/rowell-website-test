import { publicProcedure, router } from "./_core/trpc";
import { z } from 'zod';

export const updateProductCategoryRouter = router({
  // Update product category by part numbers
  updateByPartNumbers: publicProcedure
    .input((raw: unknown) => {
      return z.object({
        adminKey: z.string(),
        partNumbers: z.array(z.string()),
        categoryId: z.number(),
      }).parse(raw);
    })
    .mutation(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') {
        throw new Error('Unauthorized');
      }

      const { getDb } = await import('./db');
      const { products } = await import('../drizzle/schema');
      const { eq, inArray, sql } = await import('drizzle-orm');
      const db = await getDb();

      // Update products using raw SQL to avoid Drizzle field mapping issues
      const results = [];
      for (const partNumber of input.partNumbers) {
        await db.execute(sql`UPDATE products SET category_id = ${input.categoryId}, updatedAt = NOW() WHERE partNumber = ${partNumber}`);
        results.push({ partNumber, action: 'updated' });
      }

      return {
        success: true,
        results,
        categoryId: input.categoryId
      };
    }),
});
