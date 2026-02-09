import { publicProcedure, router } from "./_core/trpc";
import { z } from 'zod';
import mysql from 'mysql2/promise';

export const cleanupProductCategoriesRouter = router({
  removeOldCategories: publicProcedure
    .input((raw: unknown) => {
      return z.object({
        adminKey: z.string(),
      }).parse(raw);
    })
    .mutation(async ({ input }) => {
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
        // Delete old category associations (category_id = 8)
        const [result] = await connection.execute(
          'DELETE FROM product_categories WHERE product_id IN (?, ?) AND category_id = ?',
          [31323, 31324, 8]
        );
        
        // Verify remaining associations
        const [rows] = await connection.execute(
          'SELECT * FROM product_categories WHERE product_id IN (?, ?)',
          [31323, 31324]
        );
        
        return {
          success: true,
          deleted: (result as any).affectedRows,
          remainingAssociations: rows
        };
      } finally {
        await connection.end();
      }
    }),
});
