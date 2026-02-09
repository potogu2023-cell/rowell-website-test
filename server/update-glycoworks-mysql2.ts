import { publicProcedure, router } from "./_core/trpc";
import { z } from 'zod';
import mysql from 'mysql2/promise';

export const updateGlycoWorksMysql2Router = router({
  // Update using mysql2 directly
  updateDirect: publicProcedure
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
        // Update using product_id instead
        const [result1] = await connection.execute(
          'UPDATE products SET category_id = ? WHERE product_id = ?',
          [16, 'WATS-186007239']
        );
        
        const [result2] = await connection.execute(
          'UPDATE products SET category_id = ? WHERE product_id = ?',
          [16, 'WATS-186007080']
        );
        
        // Verify using product_id
        const [rows] = await connection.execute(
          'SELECT * FROM products WHERE product_id IN (?, ?)',
          ['WATS-186007239', 'WATS-186007080']
        );
        
        return {
          success: true,
          updated: [
            { productId: 'WATS-186007239', affectedRows: (result1 as any).affectedRows },
            { productId: 'WATS-186007080', affectedRows: (result2 as any).affectedRows }
          ],
          verification: rows
        };
      } finally {
        await connection.end();
      }
    }),
});
