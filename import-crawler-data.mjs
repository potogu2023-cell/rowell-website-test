#!/usr/bin/env node
/**
 * Import Crawler Data Script
 * 
 * This script imports product data from crawler task CSV files into the database.
 * Usage: node import-crawler-data.mjs <csv_file_path>
 * 
 * Example: node import-crawler-data.mjs ./agilent_products_test_20250103.csv
 */

import { drizzle } from 'drizzle-orm/mysql2';
import { products } from './drizzle/schema.ts';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Brand prefix mapping
const BRAND_PREFIX_MAP = {
  'Agilent': 'AGIL',
  'Waters': 'WATS',
  'Thermo Fisher': 'THER',
  'Phenomenex': 'PHEN',
  'Restek': 'REST',
  'Sigma-Aldrich': 'SIGM',
  'Merck': 'MERC',
  'Shimadzu': 'SHIM',
  'PerkinElmer': 'PERK',
  'Dionex': 'DION',
  'YMC': 'YMC',
};

/**
 * Extract numeric value from string with unit
 * Example: "5 µm" -> 5, "150 mm" -> 150
 */
function extractNumeric(value) {
  if (!value) return null;
  const match = value.match(/^(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Extract pH range
 * Example: "2-9" -> { min: 2, max: 9 }
 */
function extractPhRange(value) {
  if (!value) return { min: null, max: null };
  const match = value.match(/^(\d+)-(\d+)$/);
  if (match) {
    return { min: parseInt(match[1]), max: parseInt(match[2]) };
  }
  return { min: null, max: null };
}

/**
 * Generate productId with brand prefix
 * Example: "820750-902" + "Agilent" -> "AGIL-820750-902"
 */
function generateProductId(partNumber, brand) {
  const prefix = BRAND_PREFIX_MAP[brand] || 'UNKN';
  return `${prefix}-${partNumber}`;
}

/**
 * Validate required fields
 */
function validateProduct(product) {
  const errors = [];
  
  if (!product.partNumber) {
    errors.push('Missing required field: partNumber');
  }
  if (!product.brand) {
    errors.push('Missing required field: brand');
  }
  if (!product.name) {
    errors.push('Missing required field: name');
  }
  
  return errors;
}

/**
 * Transform CSV row to database product object
 */
function transformProduct(row) {
  const phRange = extractPhRange(row.phRange);
  
  return {
    productId: generateProductId(row.partNumber, row.brand),
    partNumber: row.partNumber,
    brand: row.brand,
    prefix: BRAND_PREFIX_MAP[row.brand] || 'UNKN',
    productType: row.productType || null,
    name: row.name,
    description: row.description || null,
    detailedDescription: null, // Not provided by crawler
    specifications: null, // Can be added later
    particleSize: row.particleSize || null,
    poreSize: row.poreSize || null,
    columnLength: row.columnLength || null,
    innerDiameter: row.innerDiameter || null,
    phRange: row.phRange || null,
    maxPressure: row.maxPressure || null,
    maxTemperature: row.maxTemperature || null,
    usp: row.usp || null,
    phaseType: row.phaseType || null,
    // Numeric fields for filtering
    particleSizeNum: extractNumeric(row.particleSize),
    poreSizeNum: extractNumeric(row.poreSize),
    columnLengthNum: extractNumeric(row.columnLength),
    innerDiameterNum: extractNumeric(row.innerDiameter),
    phMin: phRange.min,
    phMax: phRange.max,
    applications: row.applications || null,
    imageUrl: row.imageUrl || null,
    catalogUrl: row.catalogUrl || null,
    technicalDocsUrl: null, // Can be added later
    status: 'new',
  };
}

/**
 * Main import function
 */
async function importCrawlerData(csvFilePath) {
  console.log('='.repeat(60));
  console.log('ROWELL Product Data Import Script');
  console.log('='.repeat(60));
  console.log(`\nCSV File: ${csvFilePath}\n`);
  
  // Check if file exists
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ Error: File not found: ${csvFilePath}`);
    process.exit(1);
  }
  
  // Read CSV file
  console.log('📖 Reading CSV file...');
  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
  
  // Parse CSV
  console.log('📊 Parsing CSV data...');
  let records;
  try {
    records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (error) {
    console.error(`❌ Error parsing CSV: ${error.message}`);
    process.exit(1);
  }
  
  console.log(`✅ Found ${records.length} products in CSV\n`);
  
  // Validate and transform products
  console.log('🔍 Validating and transforming data...');
  const validProducts = [];
  const invalidProducts = [];
  
  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const errors = validateProduct(row);
    
    if (errors.length > 0) {
      invalidProducts.push({ row: i + 2, partNumber: row.partNumber, errors });
      console.log(`⚠️  Row ${i + 2}: ${errors.join(', ')}`);
    } else {
      const product = transformProduct(row);
      validProducts.push(product);
    }
  }
  
  console.log(`\n✅ Valid products: ${validProducts.length}`);
  console.log(`❌ Invalid products: ${invalidProducts.length}\n`);
  
  if (validProducts.length === 0) {
    console.error('❌ No valid products to import. Exiting.');
    process.exit(1);
  }
  
  // Connect to database
  console.log('🔌 Connecting to database...');
  const db = drizzle(process.env.DATABASE_URL);
  
  // Import products
  console.log('💾 Importing products to database...\n');
  let successCount = 0;
  let failCount = 0;
  const failedProducts = [];
  
  for (const product of validProducts) {
    try {
      await db.insert(products).values(product).onDuplicateKeyUpdate({
        set: {
          name: product.name,
          productType: product.productType,
          description: product.description,
          particleSize: product.particleSize,
          poreSize: product.poreSize,
          columnLength: product.columnLength,
          innerDiameter: product.innerDiameter,
          phRange: product.phRange,
          maxPressure: product.maxPressure,
          maxTemperature: product.maxTemperature,
          usp: product.usp,
          phaseType: product.phaseType,
          particleSizeNum: product.particleSizeNum,
          poreSizeNum: product.poreSizeNum,
          columnLengthNum: product.columnLengthNum,
          innerDiameterNum: product.innerDiameterNum,
          phMin: product.phMin,
          phMax: product.phMax,
          applications: product.applications,
          imageUrl: product.imageUrl,
          catalogUrl: product.catalogUrl,
          updatedAt: new Date(),
        },
      });
      successCount++;
      console.log(`✅ Imported: ${product.productId} - ${product.name}`);
    } catch (error) {
      failCount++;
      failedProducts.push({ productId: product.productId, error: error.message });
      console.log(`❌ Failed: ${product.productId} - ${error.message}`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total products in CSV: ${records.length}`);
  console.log(`Valid products: ${validProducts.length}`);
  console.log(`Invalid products: ${invalidProducts.length}`);
  console.log(`Successfully imported: ${successCount}`);
  console.log(`Failed to import: ${failCount}`);
  console.log('='.repeat(60));
  
  // Save report
  const reportPath = path.join(path.dirname(csvFilePath), `import_report_${Date.now()}.json`);
  const report = {
    timestamp: new Date().toISOString(),
    csvFile: csvFilePath,
    totalRecords: records.length,
    validProducts: validProducts.length,
    invalidProducts: invalidProducts.map(p => ({
      row: p.row,
      partNumber: p.partNumber,
      errors: p.errors,
    })),
    successCount,
    failCount,
    failedProducts,
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Import report saved to: ${reportPath}`);
  
  process.exit(failCount > 0 ? 1 : 0);
}

// Main execution
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node import-crawler-data.mjs <csv_file_path>');
  console.error('Example: node import-crawler-data.mjs ./agilent_products_test_20250103.csv');
  process.exit(1);
}

const csvFilePath = path.resolve(args[0]);
importCrawlerData(csvFilePath).catch(error => {
  console.error(`\n❌ Fatal error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
