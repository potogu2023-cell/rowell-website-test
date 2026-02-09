import { publicProcedure, router } from "./_core/trpc";
import mysql from 'mysql2/promise';

export const fixKnownMisclassificationsRouter = router({
  fixAll: publicProcedure.query(async () => {
    try {
      const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL!,
        ssl: {
          rejectUnauthorized: true
        }
      });

      const results = {
        spe_products: { updated: 0, errors: [] as string[] },
        well_plates: { updated: 0, errors: [] as string[] },
        syringe_filters: { updated: 0, errors: [] as string[] },
        total_updated: 0
      };

      // 1. Fix Bond Elut SPE products - should be in SPE Cartridges (category_id: 31)
      // Pattern: "Bond Elut" in name
      try {
        const [speResult] = await connection.execute(`
          UPDATE product_categories pc
          INNER JOIN products p ON pc.product_id = p.id
          SET pc.category_id = 31
          WHERE p.name LIKE '%Bond Elut%'
            AND p.name NOT LIKE '%Column%'
            AND pc.category_id != 31
            AND p.status = 'active'
        `);
        results.spe_products.updated = (speResult as any).affectedRows || 0;
        
        // Also update products table
        await connection.execute(`
          UPDATE products
          SET category_id = 31
          WHERE name LIKE '%Bond Elut%'
            AND name NOT LIKE '%Column%'
            AND category_id != 31
            AND status = 'active'
        `);
      } catch (error: any) {
        results.spe_products.errors.push(error.message);
      }

      // 2. Fix 96-Well Plates - should be in 96-Well Plates category
      // First, find the 96-Well Plates category ID
      const [wellPlatesCat] = await connection.execute(`
        SELECT id FROM categories WHERE name_en LIKE '%96%Well%Plate%' OR name_en LIKE '%Microplate%' LIMIT 1
      `);
      
      if ((wellPlatesCat as any[]).length > 0) {
        const wellPlatesCategoryId = (wellPlatesCat as any[])[0].id;
        
        try {
          const [wellPlatesResult] = await connection.execute(`
            UPDATE product_categories pc
            INNER JOIN products p ON pc.product_id = p.id
            SET pc.category_id = ?
            WHERE (p.name LIKE '%96%Well%Plate%' OR p.name LIKE '%Microplate%')
              AND pc.category_id != ?
              AND p.status = 'active'
          `, [wellPlatesCategoryId, wellPlatesCategoryId]);
          results.well_plates.updated = (wellPlatesResult as any).affectedRows || 0;
          
          // Also update products table
          await connection.execute(`
            UPDATE products
            SET category_id = ?
            WHERE (name LIKE '%96%Well%Plate%' OR name LIKE '%Microplate%')
              AND category_id != ?
              AND status = 'active'
          `, [wellPlatesCategoryId, wellPlatesCategoryId]);
        } catch (error: any) {
          results.well_plates.errors.push(error.message);
        }
      } else {
        results.well_plates.errors.push('96-Well Plates category not found');
      }

      // 3. Fix Syringe Filters - should be in Filters category
      // Pattern: "Syringe Filter" in name OR product_id starts with "PHEN-AF"
      // First, find the Filters category ID
      const [filtersCat] = await connection.execute(`
        SELECT id FROM categories WHERE name_en = 'Filters' OR slug = 'filters' LIMIT 1
      `);
      
      if ((filtersCat as any[]).length > 0) {
        const filtersCategoryId = (filtersCat as any[])[0].id;
        
        try {
          const [filtersResult] = await connection.execute(`
            UPDATE product_categories pc
            INNER JOIN products p ON pc.product_id = p.id
            SET pc.category_id = ?
            WHERE (p.name LIKE '%Syringe Filter%' OR p.product_id LIKE 'PHEN-AF%')
              AND pc.category_id != ?
              AND p.status = 'active'
          `, [filtersCategoryId, filtersCategoryId]);
          results.syringe_filters.updated = (filtersResult as any).affectedRows || 0;
          
          // Also update products table
          await connection.execute(`
            UPDATE products
            SET category_id = ?
            WHERE (name LIKE '%Syringe Filter%' OR product_id LIKE 'PHEN-AF%')
              AND category_id != ?
              AND status = 'active'
          `, [filtersCategoryId, filtersCategoryId]);
        } catch (error: any) {
          results.syringe_filters.errors.push(error.message);
        }
      } else {
        results.syringe_filters.errors.push('Filters category not found');
      }

      await connection.end();

      results.total_updated = results.spe_products.updated + results.well_plates.updated + results.syringe_filters.updated;

      return {
        success: true,
        results
      };
    } catch (error: any) {
      console.error('Error fixing misclassifications:', error);
      return {
        success: false,
        error: error.message
      };
    }
  })
});
