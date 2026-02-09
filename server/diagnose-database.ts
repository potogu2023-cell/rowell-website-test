import { publicProcedure, router } from "./_core/trpc";
import mysql from 'mysql2/promise';

export const diagnoseDatabaseRouter = router({
  check: publicProcedure.query(async () => {
    try {
      const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL!,
        ssl: {
          rejectUnauthorized: true
        }
      });

      const results: any = {
        categories: [],
        products_sample: [],
        product_categories_sample: [],
        products_columns: []
      };

      // 1. Get all categories with SPE, Well, Plate, or Filter in name
      const [categories] = await connection.execute(`
        SELECT id, name_en, slug 
        FROM categories 
        WHERE name_en LIKE '%SPE%' 
           OR name_en LIKE '%Well%' 
           OR name_en LIKE '%Plate%' 
           OR name_en LIKE '%Filter%'
        ORDER BY name_en
      `);
      results.categories = categories;

      // 2. Get sample products with Bond Elut
      const [bondElutProducts] = await connection.execute(`
        SELECT id, product_id, name, category_id, status
        FROM products 
        WHERE name LIKE '%Bond Elut%'
        LIMIT 5
      `);
      results.products_sample = bondElutProducts;

      // 3. Get products table structure
      const [columns] = await connection.execute(`
        DESCRIBE products
      `);
      results.products_columns = columns;

      // 4. Get sample product_categories entries
      const [productCategories] = await connection.execute(`
        SELECT pc.*, p.name, p.product_id
        FROM product_categories pc
        JOIN products p ON pc.product_id = p.id
        WHERE p.name LIKE '%Bond Elut%'
        LIMIT 5
      `);
      results.product_categories_sample = productCategories;

      await connection.end();

      return {
        success: true,
        results
      };
    } catch (error: any) {
      console.error('Error diagnosing database:', error);
      return {
        success: false,
        error: error.message
      };
    }
  })
});
