import { publicProcedure, router } from "./_core/trpc";
import mysql from 'mysql2/promise';

export const fixProductCategoriesFinalRouter = router({
  fixAll: publicProcedure.query(async () => {
    try {
      const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL!,
        ssl: {
          rejectUnauthorized: true
        }
      });

      const results = {
        well_plates: { updated: 0, errors: [] as string[] },
        syringe_filters: { updated: 0, errors: [] as string[] },
        total_updated: 0
      };

      // 1. Fix 96-Well Plate products - move to SPE Cartridges (ID 16)
      try {
        // Update product_categories table
        const [wellPlatesResult] = await connection.execute(`
          UPDATE product_categories pc
          INNER JOIN products p ON pc.product_id = p.id
          SET pc.category_id = 16
          WHERE (p.name LIKE '%96%Well%' 
             OR p.name LIKE '%Microplate%'
             OR p.name LIKE '%96-Well%')
            AND pc.category_id != 16
            AND p.status = 'active'
        `);
        results.well_plates.updated = (wellPlatesResult as any).affectedRows || 0;
        
        // Also update products table
        await connection.execute(`
          UPDATE products
          SET category_id = 16
          WHERE (name LIKE '%96%Well%' 
             OR name LIKE '%Microplate%'
             OR name LIKE '%96-Well%')
            AND category_id != 16
            AND status = 'active'
        `);
      } catch (error: any) {
        results.well_plates.errors.push(error.message);
      }

      // 2. Fix Syringe Filters - move to Filters (ID 18)
      try {
        // Update product_categories table
        const [filtersResult] = await connection.execute(`
          UPDATE product_categories pc
          INNER JOIN products p ON pc.product_id = p.id
          SET pc.category_id = 18
          WHERE (p.name LIKE '%Syringe Filter%' 
             OR p.productId LIKE 'PHEN-AF%')
            AND pc.category_id != 18
            AND p.status = 'active'
        `);
        results.syringe_filters.updated = (filtersResult as any).affectedRows || 0;
        
        // Also update products table
        await connection.execute(`
          UPDATE products
          SET category_id = 18
          WHERE (name LIKE '%Syringe Filter%' 
             OR productId LIKE 'PHEN-AF%')
            AND category_id != 18
            AND status = 'active'
        `);
      } catch (error: any) {
        results.syringe_filters.errors.push(error.message);
      }

      await connection.end();

      results.total_updated = results.well_plates.updated + results.syringe_filters.updated;

      return {
        success: true,
        results
      };
    } catch (error: any) {
      console.error('Error fixing product categories:', error);
      return {
        success: false,
        error: error.message
      };
    }
  })
});
