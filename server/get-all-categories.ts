import { publicProcedure, router } from "./_core/trpc";
import mysql from 'mysql2/promise';

export const getAllCategoriesRouter = router({
  list: publicProcedure.query(async () => {
    try {
      const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL!,
        ssl: {
          rejectUnauthorized: true
        }
      });

      const [categories] = await connection.execute(`
        SELECT id, name_en, slug, parent_id
        FROM categories 
        ORDER BY name_en
      `);

      await connection.end();

      return {
        success: true,
        categories
      };
    } catch (error: any) {
      console.error('Error getting categories:', error);
      return {
        success: false,
        error: error.message
      };
    }
  })
});
