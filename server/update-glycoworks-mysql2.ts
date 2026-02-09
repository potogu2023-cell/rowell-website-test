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
        // Update first product
        const [result1] = await connection.execute(
          'UPDATE products SET category_id = ? WHERE part_number = ?',
          [16, '186007239']
        );
        
        // Update second product
        const [result2] = await connection.execute(
          'UPDATE products SET category_id = ? WHERE part_number = ?',
          [16, '186007080']
        );
        
        // Verify
        const [rows] = await connection.execute(
          'SELECT id, product_id, part_number, name, brand, category_id, status, image_url FROM products WHERE part_number IN (?, ?)',
          ['186007239', '186007080']
        );
        
        return {
          success: true,
          updated: [
            { partNumber: '186007239', result: result1 },
            { partNumber: '186007080', result: result2 }
          ],
          verification: rows
        };
      } finally {
        await connection.end();
      }
    }),
});
