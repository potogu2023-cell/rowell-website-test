import { publicProcedure, router } from "./_core/trpc";
import mysql from 'mysql2/promise';

export const reclassifyGcProductsRouter = router({
  reclassify: publicProcedure.query(async () => {
    try {
      const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL!,
        ssl: {
          rejectUnauthorized: true
        }
      });

      const results = {
        capillary: 0,
        packed: 0,
        guard: 0,
        other: 0,
        total: 0,
        errors: [] as string[]
      };

      // GC Category IDs (from previous query)
      const GC_CATS = {
        CAPILLARY: 30002,
        PACKED: 30003,
        GUARD: 30004,
        OTHER: 30005
      };

      // 1. Reclassify Capillary GC Columns (including Metal Capillary)
      try {
        const [capillaryResult] = await connection.execute(`
          UPDATE products 
          SET category_id = ?
          WHERE (name LIKE '%Capillary GC Column%' 
             OR name LIKE '%GC Cap.%' 
             OR name LIKE '%GC Capillary%'
             OR name LIKE '%GC Metal Capillary%')
          AND name LIKE '%GC%'
        `, [GC_CATS.CAPILLARY]);
        results.capillary = (capillaryResult as any).affectedRows;
      } catch (error: any) {
        results.errors.push(`Capillary error: ${error.message}`);
      }

      // 2. Reclassify Packed GC Columns
      try {
        const [packedResult] = await connection.execute(`
          UPDATE products 
          SET category_id = ?
          WHERE name LIKE '%Packed GC Column%'
          AND name LIKE '%GC%'
        `, [GC_CATS.PACKED]);
        results.packed = (packedResult as any).affectedRows;
      } catch (error: any) {
        results.errors.push(`Packed error: ${error.message}`);
      }

      // 3. Reclassify GC Guard Columns
      try {
        const [guardResult] = await connection.execute(`
          UPDATE products 
          SET category_id = ?
          WHERE name LIKE '%GUARDIAN%'
          AND name LIKE '%GC%'
        `, [GC_CATS.GUARD]);
        results.guard = (guardResult as any).affectedRows;
      } catch (error: any) {
        results.errors.push(`Guard error: ${error.message}`);
      }

      // 4. Reclassify Other GC Columns (all remaining GC columns)
      try {
        const [otherResult] = await connection.execute(`
          UPDATE products 
          SET category_id = ?
          WHERE name LIKE '%GC Column%'
          AND category_id NOT IN (?, ?, ?)
        `, [GC_CATS.OTHER, GC_CATS.CAPILLARY, GC_CATS.PACKED, GC_CATS.GUARD]);
        results.other = (otherResult as any).affectedRows;
      } catch (error: any) {
        results.errors.push(`Other error: ${error.message}`);
      }

      results.total = results.capillary + results.packed + results.guard + results.other;

      await connection.end();

      return {
        success: true,
        results
      };
    } catch (error: any) {
      console.error('Error reclassifying GC products:', error);
      return {
        success: false,
        error: error.message
      };
    }
  })
});
