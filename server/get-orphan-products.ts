import { publicProcedure, router } from "./_core/trpc";
import mysql from 'mysql2/promise';

export const getOrphanProductsRouter = router({
  getAll: publicProcedure
    .query(async () => {
      const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL!,
        ssl: { rejectUnauthorized: true }
      });
      
      try {
        // Get all active products without category associations
        const [rows] = await connection.execute(`
          SELECT id, productId, partNumber, brand, productName, category_id, status
          FROM products
          WHERE status = 'active' 
            AND id NOT IN (SELECT DISTINCT product_id FROM product_categories)
          ORDER BY brand, productName
        `);
        
        return {
          success: true,
          count: (rows as any[]).length,
          products: rows
        };
      } finally {
        await connection.end();
      }
    }),
});
