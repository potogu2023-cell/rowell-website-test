import { publicProcedure, router } from "./_core/trpc";
import mysql from 'mysql2/promise';

export const findGcColumnsRouter = router({
  find: publicProcedure.query(async () => {
    try {
      const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL!,
        ssl: {
          rejectUnauthorized: true
        }
      });

      // Find all GC column products
      const [products] = await connection.execute(`
        SELECT id, productId, name, category_id, status
        FROM products
        WHERE (name LIKE '%GC Column%' 
           OR name LIKE '%GC column%'
           OR name LIKE '%Gas Chromatography%'
           OR name LIKE '% GC %'
           OR productId LIKE '%GC%')
          AND status = 'active'
        ORDER BY category_id, name
        LIMIT 200
      `);

      // Get category distribution
      const [categoryDist] = await connection.execute(`
        SELECT 
          p.category_id,
          c.name_en as category_name,
          COUNT(*) as product_count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE (p.name LIKE '%GC Column%' 
           OR p.name LIKE '%GC column%'
           OR p.name LIKE '%Gas Chromatography%'
           OR p.name LIKE '% GC %'
           OR p.productId LIKE '%GC%')
          AND p.status = 'active'
        GROUP BY p.category_id, c.name_en
        ORDER BY product_count DESC
      `);

      await connection.end();

      return {
        success: true,
        products,
        categoryDistribution: categoryDist,
        totalProducts: (products as any[]).length
      };
    } catch (error: any) {
      console.error('Error finding GC columns:', error);
      return {
        success: false,
        error: error.message
      };
    }
  })
});
