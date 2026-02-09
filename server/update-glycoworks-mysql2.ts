import { publicProcedure, router } from "./_core/trpc";
import { z } from 'zod';
import mysql from 'mysql2/promise';

export const updateGlycoWorksMysql2Router = router({
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
        // Update using primary key ID
        const [result1] = await connection.execute(
          'UPDATE products SET category_id = ? WHERE id = ?',
          [16, 31323]
        );
        
        const [result2] = await connection.execute(
          'UPDATE products SET category_id = ? WHERE id = ?',
          [16, 31324]
        );
        
        // Verify
        const [rows] = await connection.execute(
          'SELECT * FROM products WHERE id IN (?, ?)',
          [31323, 31324]
        );
        
        return {
          success: true,
          updated: [
            { id: 31323, affectedRows: (result1 as any).affectedRows },
            { id: 31324, affectedRows: (result2 as any).affectedRows }
          ],
          verification: rows
        };
      } finally {
        await connection.end();
      }
    }),
});
