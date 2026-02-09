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
        // Update products table
        const [result1] = await connection.execute(
          'UPDATE products SET category_id = ? WHERE id = ?',
          [16, 31323]
        );
        
        const [result2] = await connection.execute(
          'UPDATE products SET category_id = ? WHERE id = ?',
          [16, 31324]
        );
        
        // Insert into product_categories table (or update if exists)
        await connection.execute(
          'INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE category_id = ?, is_primary = 1',
          [31323, 16, 16]
        );
        
        await connection.execute(
          'INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE category_id = ?, is_primary = 1',
          [31324, 16, 16]
        );
        
        // Verify products table
        const [productsRows] = await connection.execute(
          'SELECT id, productId, category_id FROM products WHERE id IN (?, ?)',
          [31323, 31324]
        );
        
        // Verify product_categories table
        const [categoriesRows] = await connection.execute(
          'SELECT * FROM product_categories WHERE product_id IN (?, ?)',
          [31323, 31324]
        );
        
        return {
          success: true,
          updated: [
            { id: 31323, affectedRows: (result1 as any).affectedRows },
            { id: 31324, affectedRows: (result2 as any).affectedRows }
          ],
          productsVerification: productsRows,
          productCategoriesVerification: categoriesRows
        };
      } finally {
        await connection.end();
      }
    }),
});
