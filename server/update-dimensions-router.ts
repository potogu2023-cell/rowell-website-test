import { router, publicProcedure } from './trpc';
import { getDb } from './db';
import { products } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import axios from 'axios';

// One-time execution flag (in-memory, resets on server restart)
let dimensionsUpdateExecuted = false;

// Helper function to properly parse CSV with quoted fields
function parseCSV(csvContent: string): any[] {
  const lines = csvContent.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  
  return lines.slice(1).map((line: string) => {
    const values = parseCSVLine(line);
    const row: any = {};
    headers.forEach((header: string, index: number) => {
      row[header.trim()] = values[index] ? values[index].trim() : '';
    });
    return row;
  });
}

// Parse a single CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result;
}

export const updateDimensionsRouter = router({
  execute: publicProcedure
    .mutation(async () => {
      try {
        // Check if already executed
        if (dimensionsUpdateExecuted) {
          throw new Error("This endpoint has already been executed and is now disabled. Dimensions update can only be performed once.");
        }

        console.log('[DIMENSIONS] Starting one-time dimensions field update for YMC and Tosoh products...');
        
        // CDN URLs for data files
        const YMC_CDN_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/tjohcbqXsySOlnhe.csv';
        const TOSOH_CDN_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/XSAyYRUdzBdDdNIA.csv';
        
        // Fetch YMC data
        console.log('[DIMENSIONS] Fetching YMC data from CDN...');
        const ymcResponse = await axios.get(YMC_CDN_URL);
        const ymcData = parseCSV(ymcResponse.data);
        console.log(`[DIMENSIONS] Found ${ymcData.length} YMC products`);
        
        // Fetch Tosoh data
        console.log('[DIMENSIONS] Fetching Tosoh data from CDN...');
        const tosohResponse = await axios.get(TOSOH_CDN_URL);
        const tosohData = parseCSV(tosohResponse.data);
        console.log(`[DIMENSIONS] Found ${tosohData.length} Tosoh products`);
        
        const allData = [...ymcData, ...tosohData];
        console.log(`[DIMENSIONS] Total products to process: ${allData.length}`);
        
        const db = await getDb();
        let updatedCount = 0;
        let notFoundCount = 0;
        let skippedCount = 0;
        const notFoundProducts: string[] = [];
        
        for (const row of allData) {
          try {
            // Find product by partNumber
            const existingProducts = await db
              .select()
              .from(products)
              .where(eq(products.partNumber, row.productCode))
              .limit(1);
            
            if (existingProducts.length === 0) {
              console.log(`[DIMENSIONS] Product not found: ${row.productCode}`);
              notFoundCount++;
              notFoundProducts.push(row.productCode);
              continue;
            }
            
            // Check if we have valid dimension data
            const columnLength = row.columnLength?.trim();
            const innerDiameter = row.innerDiameter?.trim();
            
            if (!columnLength || !innerDiameter) {
              console.log(`[DIMENSIONS] Skipping ${row.productCode}: missing dimension data (columnLength: "${columnLength}", innerDiameter: "${innerDiameter}")`);
              skippedCount++;
              continue;
            }
            
            // Update product dimensions
            const dimensionsValue = `${columnLength} × ${innerDiameter}`;
            await db
              .update(products)
              .set({
                dimensions: dimensionsValue,
              })
              .where(eq(products.partNumber, row.productCode));
            
            updatedCount++;
            
            if (updatedCount % 20 === 0) {
              console.log(`[DIMENSIONS] Progress: ${updatedCount}/${allData.length} products updated`);
            }
          } catch (error) {
            console.error(`[DIMENSIONS] Error updating product ${row.productCode}:`, error);
          }
        }
        
        console.log('[DIMENSIONS] Update completed!');
        console.log(`[DIMENSIONS] Successfully updated: ${updatedCount}`);
        console.log(`[DIMENSIONS] Not found: ${notFoundCount}`);
        console.log(`[DIMENSIONS] Skipped (missing data): ${skippedCount}`);
        
        // Mark as executed
        dimensionsUpdateExecuted = true;
        
        return {
          success: true,
          summary: {
            totalProcessed: allData.length,
            successfullyUpdated: updatedCount,
            notFound: notFoundCount,
            skipped: skippedCount,
            notFoundProducts: notFoundCount > 0 ? notFoundProducts : null,
          },
          message: "Dimensions update completed successfully. This endpoint is now disabled and cannot be used again.",
          endpointStatus: "DISABLED"
        };
      } catch (error: any) {
        console.error('[DIMENSIONS] Fatal error:', error);
        throw new Error(`Dimensions update failed: ${error.message}`);
      }
    }),
});
