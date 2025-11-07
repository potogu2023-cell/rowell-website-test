/**
 * Import Test Data Script
 * 
 * This script imports test data from the crawler into the database.
 */

import { drizzle } from 'drizzle-orm/mysql2';
import { products } from './drizzle/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const CSV_FILE = process.argv[2] || 'test_10_results.csv';

interface CrawlerProduct {
  productId: string;
  partNumber: string;
  brand: string;
  name?: string;
  description?: string;
  specifications?: string;
  descriptionQuality?: string;
  detailedDescription?: string;
}

function parseJSON(jsonString: string | undefined): any {
  if (!jsonString || jsonString.trim() === '' || jsonString === '{}') return null;
  
  try {
    let cleaned = jsonString.trim();
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1).replace(/""/g, '"');
    }
    const parsed = JSON.parse(cleaned);
    return Object.keys(parsed).length > 0 ? parsed : null;
  } catch (error) {
    console.warn(`⚠️  JSON parse error for: ${jsonString.substring(0, 50)}...`);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting test data import...\n');
  
  // Read CSV file
  const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as CrawlerProduct[];
  
  console.log(`📄 Found ${records.length} products in CSV\n`);
  
  // Connect to database
  const db = drizzle(process.env.DATABASE_URL!);
  
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const record of records) {
    try {
      const productId = record.productId?.trim();
      
      if (!productId) {
        console.log(`⏭️  Skipped: No productId`);
        skipped++;
        continue;
      }
      
      // Check if product exists in database
      const existing = await db.select().from(products).where(eq(products.productId, productId)).limit(1);
      
      if (existing.length === 0) {
        console.log(`⏭️  Skipped: ${productId} - Not found in database`);
        skipped++;
        continue;
      }
      
      // Parse specifications
      const specs = parseJSON(record.specifications);
      const specsCount = specs ? Object.keys(specs).length : 0;
      
      // Prepare update data
      const updateData: any = {};
      
      // Only update if we have new data
      if (record.description && record.description.trim()) {
        updateData.description = record.description.trim();
      }
      
      if (specs) {
        updateData.specifications = specs;
      }
      
      if (record.descriptionQuality && record.descriptionQuality !== 'none') {
        updateData.descriptionQuality = record.descriptionQuality;
      }
      
      if (Object.keys(updateData).length > 0) {
        await db.update(products)
          .set(updateData)
          .where(eq(products.productId, productId));
        
        console.log(`✅ Updated: ${productId} (${existing[0].partNumber})`);
        console.log(`   - Description: ${record.description ? record.description.substring(0, 60) + '...' : 'N/A'}`);
        console.log(`   - Quality: ${record.descriptionQuality || 'N/A'}`);
        console.log(`   - Specs: ${specsCount} fields`);
        updated++;
      } else {
        console.log(`⏭️  Skipped: ${productId} - No new data to update`);
        skipped++;
      }
      
    } catch (error: any) {
      console.error(`❌ Error processing ${record.productId}: ${error.message}`);
      errors++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Import Summary');
  console.log('='.repeat(60));
  console.log(`Total products in CSV: ${records.length}`);
  console.log(`✅ Successfully updated: ${updated}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log('='.repeat(60));
  
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
