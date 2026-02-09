import { publicProcedure, router } from "./_core/trpc";
import { z } from 'zod';
import mysql from 'mysql2/promise';

export const checkDataConsistencyRouter = router({
  getStats: publicProcedure
    .input((raw: unknown) => {
      return z.object({
        adminKey: z.string(),
      }).parse(raw);
    })
    .query(async ({ input }) => {
      if (input.adminKey !== 'temp-admin-2024') {
        throw new Error('Unauthorized');
      }

      const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL!,
        ssl: {
          rejectUnauthorized: true
        }
      });
      
      try {
        // Total products in database
        const [totalRows] = await connection.execute(
          'SELECT COUNT(*) as total FROM products'
        );
        
        // Active products
        const [activeRows] = await connection.execute(
          'SELECT COUNT(*) as total FROM products WHERE status = ?',
          ['active']
        );
        
        // Products with category associations
        const [withCategoryRows] = await connection.execute(
          'SELECT COUNT(DISTINCT product_id) as total FROM product_categories'
        );
        
        // Products without category associations
        const [withoutCategoryRows] = await connection.execute(
          'SELECT COUNT(*) as total FROM products WHERE id NOT IN (SELECT DISTINCT product_id FROM product_categories)'
        );
        
        // Category distribution
        const [categoryDist] = await connection.execute(
          'SELECT c.id, c.name_en as name, COUNT(pc.product_id) as product_count FROM categories c LEFT JOIN product_categories pc ON c.id = pc.category_id GROUP BY c.id, c.name_en ORDER BY product_count DESC LIMIT 20'
        );
        
        return {
          success: true,
          stats: {
            totalProducts: (totalRows as any)[0].total,
            activeProducts: (activeRows as any)[0].total,
            productsWithCategory: (withCategoryRows as any)[0].total,
            productsWithoutCategory: (withoutCategoryRows as any)[0].total,
            topCategories: categoryDist
          }
        };
      } finally {
        await connection.end();
      }
    }),
});
