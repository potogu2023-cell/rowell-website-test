import { publicProcedure, router } from "./_core/trpc";
import mysql from 'mysql2/promise';

export const findPlateCategoriesRouter = router({
  find: publicProcedure.query(async () => {
    try {
      const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL!,
        ssl: {
          rejectUnauthorized: true
        }
      });

      // Find all categories with "plate" or "well" in name
      const [categories] = await connection.execute(`
        SELECT id, name_en, slug
        FROM categories 
        WHERE LOWER(name_en) LIKE '%plate%' 
           OR LOWER(name_en) LIKE '%well%'
           OR LOWER(slug) LIKE '%plate%'
           OR LOWER(slug) LIKE '%well%'
        ORDER BY name_en
      `);

      // Find sample 96-well plate products
      const [products] = await connection.execute(`
        SELECT id, productId, name, category_id, status
        FROM products 
        WHERE name LIKE '%96%Well%' 
           OR name LIKE '%Microplate%'
           OR name LIKE '%96-Well%'
        LIMIT 10
      `);

      await connection.end();

      return {
        success: true,
        categories,
        products
      };
    } catch (error: any) {
      console.error('Error finding plate categories:', error);
      return {
        success: false,
        error: error.message
      };
    }
  })
});
