import { publicProcedure, router } from "./_core/trpc";
import { z } from 'zod';
import mysql from 'mysql2/promise';

export const queryCategoriesRouter = router({
  // Query all categories
  listAll: publicProcedure
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
        const [rows] = await connection.execute(
          'SELECT id, name, nameEn, slug, parentId, level FROM categories ORDER BY id'
        );
        
        return {
          success: true,
          categories: rows
        };
      } finally {
        await connection.end();
      }
    }),
});
