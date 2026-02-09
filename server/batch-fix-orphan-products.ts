import { publicProcedure, router } from "./_core/trpc";
import mysql from 'mysql2/promise';

// Intelligent category classification function
function classifyProduct(productName: string, brand: string): number {
  const name = productName.toLowerCase();
  
  // Restek specific rules
  if (brand === 'Restek') {
    // Raptor series
    if (name.includes('raptor')) {
      if (name.includes('polar x') || name.includes('inert polar x')) {
        return 8; // HILIC Columns
      }
      return 4; // C18 Columns (default for Raptor)
    }
    
    // Ultra IBD series
    if (name.includes('ultra') && name.includes('ibd')) {
      return 4; // C18 Columns
    }
    
    // Allure series
    if (name.includes('allure')) {
      return 4; // C18 Columns
    }
    
    // PFAS series
    if (name.includes('pfas')) {
      return 4; // C18 Columns
    }
  }
  
  // Daicel specific rules (Chiral columns)
  if (brand === 'Daicel') {
    if (name.includes('chiralpak') || name.includes('chiralcel')) {
      return 15; // Other Columns (temporary, should be Chiral Columns)
    }
  }
  
  // General rules based on keywords
  if (name.includes('c18')) return 4; // C18 Columns
  if (name.includes('c8')) return 5; // C8 Columns
  if (name.includes('silica')) return 6; // Silica Columns
  if (name.includes('phenyl')) return 7; // Phenyl Columns
  if (name.includes('hilic')) return 8; // HILIC Columns
  if (name.includes('cyano') || name.includes(' cn ')) return 9; // Cyano Columns
  if (name.includes('c4')) return 10; // C4 Columns
  if (name.includes('pfp')) return 11; // PFP Columns
  if (name.includes('amino') || name.includes('nh2')) return 12; // Amino Columns
  if (name.includes('diol')) return 13; // Diol Columns
  if (name.includes('c30')) return 14; // C30 Columns
  
  // Sample preparation
  if (name.includes('guard')) return 17; // Guard Columns
  if (name.includes('spe') || name.includes('cartridge')) return 16; // SPE Cartridges
  if (name.includes('filter')) return 18; // Filters
  
  // Accessories
  if (name.includes('vial')) return 19; // Vials
  if (name.includes('cap') || name.includes('septa')) return 20; // Caps & Septa
  if (name.includes('syringe')) return 21; // Syringes
  if (name.includes('fitting') || name.includes('tubing')) return 22; // Fittings & Tubing
  
  // Default
  return 15; // Other Columns
}

export const batchFixOrphanProductsRouter = router({
  execute: publicProcedure
    .query(async () => {
      const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL!,
        ssl: { rejectUnauthorized: true }
      });
      
      try {
        // Get all orphan products
        const [orphanProducts] = await connection.execute(`
          SELECT id, productId, partNumber, brand, productName, category_id, status
          FROM products
          WHERE status = 'active' 
            AND id NOT IN (SELECT DISTINCT product_id FROM product_categories)
          ORDER BY brand, productName
        `);
        
        const products = orphanProducts as any[];
        const results: any[] = [];
        let successCount = 0;
        let errorCount = 0;
        
        // Process each product
        for (const product of products) {
          try {
            // Classify product
            const categoryId = classifyProduct(product.productName, product.brand);
            
            // Insert into product_categories
            await connection.execute(`
              INSERT INTO product_categories (product_id, category_id, is_primary)
              VALUES (?, ?, 1)
              ON DUPLICATE KEY UPDATE is_primary = 1
            `, [product.id, categoryId]);
            
            // Also update products.category_id if it's NULL
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
          totalProcessed: products.length,
          successCount,
          errorCount,
          results: results.slice(0, 50) // Return first 50 for review
        };
      } finally {
        await connection.end();
      }
    }),
});
