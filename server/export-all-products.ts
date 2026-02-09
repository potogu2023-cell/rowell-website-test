import { publicProcedure, router } from "./_core/trpc";
import { db } from "../drizzle/db";
import { sql } from "drizzle-orm";
import mysql from 'mysql2/promise';

export const exportAllProductsRouter = router({
  getAllProducts: publicProcedure.query(async () => {
    try {
      // Parse DATABASE_URL from environment
      const databaseUrl = process.env.DATABASE_URL || '';
      console.log('DATABASE_URL exists:', !!databaseUrl);
      
      // Extract connection details from DATABASE_URL
      // Format: mysql://username:password@host:port/database
      const urlMatch = databaseUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      
      if (!urlMatch) {
        throw new Error('Invalid DATABASE_URL format');
      }
      
      const [, user, password, host, port, database] = urlMatch;
      
      console.log('Connecting to database:', { host, port, database, user: user.substring(0, 3) + '***' });
      
      // Use mysql2 to get all products with their categories
      const connection = await mysql.createConnection({
        host,
        user,
        password,
        database,
        port: parseInt(port),
        ssl: {
          rejectUnauthorized: true
        }
      });

      // Get all products with their primary category
      const [products] = await connection.execute(`
        SELECT 
          p.id,
          p.product_id,
          p.part_number,
          p.name,
          p.brand,
          p.status,
          p.category_id as primary_category_id,
          GROUP_CONCAT(DISTINCT pc.category_id) as all_category_ids,
          GROUP_CONCAT(DISTINCT c.name_en) as all_category_names
        FROM products p
        LEFT JOIN product_categories pc ON p.id = pc.product_id
        LEFT JOIN categories c ON pc.category_id = c.id
        WHERE p.status = 'active'
        GROUP BY p.id
        ORDER BY p.brand, p.product_id
      `);

      await connection.end();

      return {
        success: true,
        totalProducts: (products as any[]).length,
        products: products
      };
    } catch (error: any) {
      console.error('Error exporting products:', error);
      return {
        success: false,
        error: error.message,
        products: []
      };
    }
  })
});
