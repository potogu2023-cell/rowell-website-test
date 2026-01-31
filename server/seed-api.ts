import { publicProcedure, router } from './_core/trpc';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

export const seedRouter = router({
  importResources: publicProcedure
    .input(z.object({ secret: z.string().optional() }).optional())
    .mutation(async ({ input }) => {
      // Simple security check (optional)
      const SECRET_KEY = process.env.SEED_SECRET || 'rowell-seed-2025';
      if (input?.secret && input.secret !== SECRET_KEY) {
        throw new Error('Invalid secret key');
      }

      const { getDb } = await import('./db');
      const { resources } = await import('../drizzle/schema');
      const db = await getDb();

      const articlesDir = join(process.cwd(), 'resource_center_articles');
      const categories = ['technical_guides', 'application_notes', 'industry_insights'];
      
      let importedCount = 0;
      const results = [];

      for (const category of categories) {
        const categoryDir = join(articlesDir, category);
        try {
          const files = readdirSync(categoryDir).filter(f => f.endsWith('.md'));
          
          for (const file of files) {
            const filePath = join(categoryDir, file);
            const content = readFileSync(filePath, 'utf-8');
            
            // Extract title from first heading
            const titleMatch = content.match(/^#\s+(.+)$/m);
            const title = titleMatch ? titleMatch[1] : file.replace('.md', '');
            
            // Extract excerpt from first paragraph
            const excerptMatch = content.match(/\n\n(.+?)\n\n/);
            const excerpt = excerptMatch ? excerptMatch[1].substring(0, 200) : '';
            
            // Determine category label
            let categoryLabel = 'Technical Guide';
            if (category === 'application_notes') categoryLabel = 'Application Note';
            if (category === 'industry_insights') categoryLabel = 'Industry Insight';
            
            // Generate slug from filename
            const slug = file.replace('.md', '').toLowerCase();
            
            // Random publish date in the past year
            const daysAgo = Math.floor(Math.random() * 365);
            const publishedAt = new Date();
            publishedAt.setDate(publishedAt.getDate() - daysAgo);
            
            // Insert into database
            await db.insert(resources).values({
              title,
              slug,
              excerpt,
              content,
              category: categoryLabel,
              author: 'Rowell HPLC Team',
              publishedAt,
              featured: Math.random() > 0.7, // 30% chance of being featured
            });
            
            importedCount++;
            results.push({ title, category: categoryLabel, status: 'success' });
          }
        } catch (error) {
          results.push({ 
            category, 
            status: 'error', 
            message: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      return {
        success: true,
        imported: importedCount,
        results,
        message: `Successfully imported ${importedCount} articles!`,
      };
    }),
});
