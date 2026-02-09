import { publicProcedure, router } from "./_core/trpc";
import mysql from 'mysql2/promise';

export const fixNullCategoriesRouter = router({
  fixAll: publicProcedure.query(async () => {
    try {
      const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL!,
        ssl: {
          rejectUnauthorized: true
        }
      });

      const results = {
        well_plates_null: { updated: 0, errors: [] as string[] },
        syringe_filters: { updated: 0, errors: [] as string[] },
        total_updated: 0
      };

      // 1. Fix 96-Well Plate products with NULL category_id - move to SPE Cartridges (ID 16)
      try {
        const [wellPlatesResult] = await connection.execute(`
          UPDATE products
          SET category_id = 16
          WHERE (name LIKE '%96%Well%' 
             OR name LIKE '%Microplate%'
             OR name LIKE '%96-Well%'
             OR name LIKE '%well-plate%')
            AND (category_id IS NULL OR category_id = 0)
            AND status = 'active'
        `);
        results.well_plates_null.updated = (wellPlatesResult as any).affectedRows || 0;
      } catch (error: any) {
        results.well_plates_null.errors.push(error.message);
      }

      // 2. Fix Syringe Filters - move to Filters (ID 18)
      try {
        const [filtersResult] = await connection.execute(`
          UPDATE products
          SET category_id = 18
          WHERE (name LIKE '%Syringe Filter%' 
             OR productId LIKE 'PHEN-AF%')
            AND category_id != 18
            AND status = 'active'
        `);
        results.syringe_filters.updated = (filtersResult as any).affectedRows || 0;
      } catch (error: any) {
        results.syringe_filters.errors.push(error.message);
      }

      await connection.end();

      results.total_updated = results.well_plates_null.updated + results.syringe_filters.updated;

      return {
        success: true,
        results
      };
    } catch (error: any) {
      console.error('Error fixing NULL categories:', error);
      return {
        success: false,
        error: error.message
      };
    }
  })
});
