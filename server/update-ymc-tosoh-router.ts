import { publicProcedure, router } from "./_core/trpc";
import axios from 'axios';

// One-time execution flag (in-memory, resets on server restart)
let updateExecuted = false;

// Helper function to parse CSV
function parseCSV(csvContent: string): any[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map((line: string) => {
    const values = line.split(',');
    const row: any = {};
    headers.forEach((header: string, index: number) => {
      row[header] = values[index] || '';
    });
    return row;
  });
}

export const updateYmcTosohRouter = router({
  execute: publicProcedure
    .mutation(async () => {
      try {
        // Check if already executed
        if (updateExecuted) {
          throw new Error("This endpoint has already been executed and is now disabled. Data update can only be performed once.");
        }

        console.log('[UPDATE] Starting one-time YMC and Tosoh product data update...');
        
        // CDN URLs for data files
        const YMC_CDN_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/tjohcbqXsySOlnhe.csv';
        const TOSOH_CDN_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/XSAyYRUdzBdDdNIA.csv';
        
        // Fetch YMC data
        console.log('[UPDATE] Fetching YMC data from CDN...');
        const ymcResponse = await axios.get(YMC_CDN_URL);
        const ymcData = parseCSV(ymcResponse.data);
        console.log(`[UPDATE] Found ${ymcData.length} YMC products`);
        
        // Fetch Tosoh data
        console.log('[UPDATE] Fetching Tosoh data from CDN...');
        const tosohResponse = await axios.get(TOSOH_CDN_URL);
        const tosohData = parseCSV(tosohResponse.data);
        console.log(`[UPDATE] Found ${tosohData.length} Tosoh products`);
        
        const allData = [...ymcData, ...tosohData];
        
        let updatedCount = 0;
        let notFoundCount = 0;
        const notFoundProducts: string[] = [];
        
        console.log('[UPDATE] Starting database update...');
        
        const { getDb } = await import('./db');
        const { products } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const db = await getDb();
        
        for (const row of allData) {
          try {
            // Find product by partNumber
            const existingProducts = await db
              .select()
              .from(products)
              .where(eq(products.partNumber, row.productCode))
              .limit(1);
            
            if (existingProducts.length === 0) {
              console.log(`[UPDATE] Product not found: ${row.productCode}`);
              notFoundCount++;
              notFoundProducts.push(row.productCode);
              continue;
            }
            
            // Update product with complete data
            await db
              .update(products)
              .set({
                particleSize: row.particleSize || null,
                poreSize: row.poreSize || null,
                dimensions: `${row.columnLength} × ${row.innerDiameter}`,
                status: 'active', // Set status to active
                phRange: row.phRange || null,
                usp: row.usp || null,
                description: row.description || null,
                applications: row.applications || null,
              })
              .where(eq(products.partNumber, row.productCode));
            
            updatedCount++;
            
            if (updatedCount % 20 === 0) {
              console.log(`[UPDATE] Progress: ${updatedCount}/${allData.length} products updated`);
            }
          } catch (error) {
            console.error(`[UPDATE] Error updating product ${row.productCode}:`, error);
          }
        }
        
        // Mark as executed to disable future calls
        updateExecuted = true;
        
        console.log('[UPDATE] ========================================');
        console.log('[UPDATE] UPDATE SUMMARY');
        console.log('[UPDATE] ========================================');
        console.log(`[UPDATE] Total products processed:    ${allData.length}`);
        console.log(`[UPDATE] Successfully updated:        ${updatedCount}`);
        console.log(`[UPDATE] Not found in database:       ${notFoundCount}`);
        console.log('[UPDATE] ========================================');
        console.log('[UPDATE] Endpoint is now DISABLED');
        
        return {
          success: true,
          summary: {
            totalProcessed: allData.length,
            successfullyUpdated: updatedCount,
            notFound: notFoundCount,
            notFoundProducts: notFoundProducts.length > 0 ? notFoundProducts : undefined
          },
          message: "Update completed successfully. This endpoint is now disabled and cannot be used again.",
          endpointStatus: "DISABLED"
        };
        
      } catch (error) {
        console.error('[UPDATE] Update failed:', error);
        throw error;
      }
    }),
});
