import { publicProcedure, router } from "./_core/trpc";
import mysql from 'mysql2/promise';

export const checkSyringeFiltersRouter = router({
  check: publicProcedure.query(async () => {
    try {
      const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL!,
        ssl: {
          rejectUnauthorized: true
        }
      });

      // Find syringe filter products
      const [products] = await connection.execute(`
        SELECT id, productId, name, category_id, status
        FROM products
        WHERE (name LIKE '%Syringe Filter%' 
           OR productId LIKE 'PHEN-AF%')
          AND status = 'active'
        ORDER BY category_id, name
        LIMIT 50
      `);

      await connection.end();

      return {
        success: true,
        products
      };
    } catch (error: any) {
      console.error('Error checking syringe filters:', error);
      return {
        success: false,
        error: error.message
      };
    }
  })
});
