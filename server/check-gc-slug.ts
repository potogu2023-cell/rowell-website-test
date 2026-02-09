import { publicProcedure, router } from "./_core/trpc";
import mysql from 'mysql2/promise';

export const checkGcSlugRouter = router({
  check: publicProcedure.query(async () => {
    try {
      const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL!,
        ssl: {
          rejectUnauthorized: true
        }
      });

      // Query GC categories (ID 30001-30005)
      const [categories] = await connection.execute(`
        SELECT id, name, name_en, slug, parent_id
        FROM categories
        WHERE id BETWEEN 30001 AND 30005
        ORDER BY id
      `);

      // Also count products in each category
      const [productCounts] = await connection.execute(`
        SELECT category_id, COUNT(*) as product_count
        FROM products
        WHERE category_id BETWEEN 30001 AND 30005
        GROUP BY category_id
      `);

      await connection.end();

      return {
        success: true,
        categories,
        productCounts
      };
    } catch (error: any) {
      console.error('Error checking GC slug:', error);
      return {
        success: false,
        error: error.message
      };
    }
  })
});
