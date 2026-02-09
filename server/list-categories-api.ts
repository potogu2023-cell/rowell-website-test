import { publicProcedure, router } from "./_core/trpc";
import { z } from 'zod';

export const listCategoriesRouter = router({
  // List all categories
  listAll: publicProcedure
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
      const { categories } = await import('../drizzle/schema');
      const db = await getDb();

      const allCategories = await db
        .select()
        .from(categories);

      return {
        success: true,
        categories: allCategories.map(c => ({
          id: c.id,
          name: c.name,
          nameEn: c.nameEn,
          slug: c.slug,
          parentId: c.parentId,
          level: c.level
        }))
      };
    }),
});
