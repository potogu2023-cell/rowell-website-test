import { publicProcedure, router } from "./_core/trpc";
import { z } from 'zod';
import mysql from 'mysql2/promise';

export const describeProductsTableRouter = router({
  getSchema: publicProcedure
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
        const [columns] = await connection.execute('SHOW COLUMNS FROM products');
        return {
          success: true,
          columns
        };
      } finally {
        await connection.end();
      }
    }),
});
