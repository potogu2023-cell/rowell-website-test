import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import mysql from 'mysql2/promise';

// Intelligent category classification function
function classifyProduct(productName: string, brand: string): number {
  const name = productName.toLowerCase();
  
  // Restek specific rules
  if (brand === 'Restek') {
    if (name.includes('raptor')) {
      if (name.includes('polar x') || name.includes('inert polar x')) {
        return 8; // HILIC Columns
      }
      return 4; // C18 Columns
    }
    if (name.includes('ultra') && name.includes('ibd')) return 4;
    if (name.includes('allure')) return 4;
    if (name.includes('pfas')) return 4;
  }
  
  // Daicel specific rules
  if (brand === 'Daicel') {
    if (name.includes('chiralpak') || name.includes('chiralcel')) {
      return 15; // Other Columns
    }
  }
  
  // General rules
  if (name.includes('c18')) return 4;
  if (name.includes('c8')) return 5;
  if (name.includes('silica')) return 6;
  if (name.includes('phenyl')) return 7;
  if (name.includes('hilic')) return 8;
  if (name.includes('cyano') || name.includes(' cn ')) return 9;
  if (name.includes('c4')) return 10;
  if (name.includes('pfp')) return 11;
  if (name.includes('amino') || name.includes('nh2')) return 12;
  if (name.includes('diol')) return 13;
  if (name.includes('c30')) return 14;
  if (name.includes('guard')) return 17;
  if (name.includes('spe') || name.includes('cartridge')) return 16;
  if (name.includes('filter')) return 18;
  if (name.includes('vial')) return 19;
  if (name.includes('cap') || name.includes('septa')) return 20;
  if (name.includes('syringe')) return 21;
  if (name.includes('fitting') || name.includes('tubing')) return 22;
  
  return 15; // Other Columns
}

export const batchFixOrphanPaginatedRouter = router({
  execute: publicProcedure
    .input(z.object({
      offset: z.number().default(0),
      limit: z.number().default(100)
    }).optional())
    .query(async ({ input }) => {
      const offset = input?.offset ?? 0;
      const limit = input?.limit ?? 100;
      const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL!,
        ssl: { rejectUnauthorized: true }
      });
      
      try {
        // Get total count
        const [countResult] = await connection.execute(`
          SELECT COUNT(*) as total
          FROM products
          WHERE status = 'active' 
            AND id NOT IN (SELECT DISTINCT product_id FROM product_categories)
        `);
        const totalOrphans = (countResult as any[])[0].total;
        
        // Get batch of orphan products
        const [orphanProducts] = await connection.execute(`
          SELECT id, productId, partNumber, brand, productName, category_id, status
          FROM products
          WHERE status = 'active' 
            AND id NOT IN (SELECT DISTINCT product_id FROM product_categories)
          ORDER BY brand, productName
          LIMIT ? OFFSET ?
        `, [limit, offset]);
        
        const products = orphanProducts as any[];
        const results: any[] = [];
        let successCount = 0;
        let errorCount = 0;
        
        // Process each product
        for (const product of products) {
          try {
            const categoryId = classifyProduct(product.productName, product.brand);
            
            await connection.execute(`
              INSERT INTO product_categories (product_id, category_id, is_primary)
              VALUES (?, ?, 1)
              ON DUPLICATE KEY UPDATE is_primary = 1
            `, [product.id, categoryId]);
            
            if (product.category_id === null) {
              await connection.execute(`
                UPDATE products SET category_id = ? WHERE id = ?
              `, [categoryId, product.id]);
            }
            
            successCount++;
            results.push({
              productId: product.productId,
              productName: product.productName,
              brand: product.brand,
              assignedCategoryId: categoryId,
              status: 'success'
            });
          } catch (error: any) {
            errorCount++;
            results.push({
              productId: product.productId,
              productName: product.productName,
              brand: product.brand,
              status: 'error',
              error: error.message
            });
          }
        }
        
        return {
          success: true,
          totalOrphans,
          currentBatch: {
            offset,
            limit,
            processed: products.length
          },
          successCount,
          errorCount,
          hasMore: offset + limit < totalOrphans,
          nextOffset: offset + limit,
          results
        };
      } finally {
        await connection.end();
      }
    }),
});
