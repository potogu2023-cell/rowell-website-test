import { publicProcedure, router } from "./_core/trpc";
import { seedArticles } from './seed-articles';

export const seedArticlesRouter = router({
  execute: publicProcedure
    .mutation(async () => {
      try {
        console.log('Executing article seeding...');
        const result = await seedArticles();
        return result;
      } catch (error) {
        console.error('Seeding failed:', error);
        throw new Error(`Seeding failed: ${String(error)}`);
      }
    }),
});
