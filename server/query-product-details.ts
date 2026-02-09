import { publicProcedure, router } from "./_core/trpc";
import { z } from 'zod';
import mysql from 'mysql2/promise';

export const queryProductDetailsRouter = router({
  byPartNumbers: publicProcedure
    .input((raw: unknown) => {
      return z.object({
        adminKey: z.string(),
        partNumbers: z.array(z.string()),
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
        const placeholders = input.partNumbers.map(() => '?').join(',');
        const [rows] = await connection.execute(
          \`SELECT id, product_id as productId, part_number as partNumber, name, brand, category_id as categoryId, status, created_at as createdAt, updated_at as updatedAt FROM products WHERE part_number IN (\${placeholders})\`,
          input.partNumbers
        );
        
        return {
          success: true,
          products: rows
        };
      } finally {
        await connection.end();
      }
    }),
});
