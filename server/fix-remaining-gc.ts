import { publicProcedure, router } from "./_core/trpc";
import mysql from 'mysql2/promise';

export const fixRemainingGcRouter = router({
  fix: publicProcedure.query(async () => {
    try {
      const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL!,
        ssl: {
          rejectUnauthorized: true
        }
      });

      // These are the 10 MXT Metal Capillary products still in wrong categories
      const productIds = [
        30749, 30774, 30778, 30792, 30762, 
        30763, 30758, 30759, 30748, 30764
      ];

      const CAPILLARY_GC_CAT_ID = 30002;

      const [result] = await connection.execute(`
        UPDATE products 
        SET category_id = ?
        WHERE id IN (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [CAPILLARY_GC_CAT_ID, ...productIds]);

      await connection.end();

      return {
        success: true,
        updated: (result as any).affectedRows,
        productIds
      };
    } catch (error: any) {
      console.error('Error fixing remaining GC products:', error);
      return {
        success: false,
        error: error.message
      };
    }
  })
});
