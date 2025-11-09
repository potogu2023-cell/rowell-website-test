#!/usr/bin/env node
/**
 * Import Crawler Batch Data Script
 * 
 * This script imports product data from crawler team's CSV files into the database.
 * It handles the specific format from crawler tasks (with specifications JSON, descriptionQuality, etc.)
 * 
 * Usage: node import-crawler-batch.mjs <csv_file_path> [--update-only]
 * 
 * Example: node import-crawler-batch.mjs ./agilent_columns_crawl_results.csv
 * Example: node import-crawler-batch.mjs ./waters_batch2_crawl_results.csv --update-only
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

/**
 * Extract specifications from JSON string
 */
function parseSpecifications(specsJson) {
  if (!specsJson || specsJson === '{}') return null;
  try {
    return JSON.parse(specsJson);
  } catch (error) {
    console.warn(`⚠️  Failed to parse specifications JSON: ${error.message}`);
    return null;
  }
}

/**
 * Extract numeric value from specification field
 * Example: "5 µm" -> 5, "150 mm" -> 150, "2.7 µm" -> 2.7
 */
function extractNumeric(value) {
  if (!value) return null;
  const str = String(value);
  const match = str.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Extract pH range from specifications
 */
function extractPhRange(specs) {
  if (!specs) return { min: null, max: null };
  
  const phMin = specs['pH Range Min'] || specs['pH Min'] || null;
  const phMax = specs['pH Range Max'] || specs['pH Max'] || null;
  
  return {
    min: extractNumeric(phMin),
    max: extractNumeric(phMax),
  };
}

/**
 * Extract product fields from specifications JSON
 */
function extractProductFields(specs) {
  if (!specs) {
    return {
      particleSize: null,
      poreSize: null,
      columnLength: null,
      innerDiameter: null,
      phRange: null,
      maxPressure: null,
      maxTemperature: null,
      usp: null,
      phaseType: null,
      particleSizeNum: null,
      poreSizeNum: null,
      columnLengthNum: null,
      innerDiameterNum: null,
      phMin: null,
      phMax: null,
    };
  }

  const phRange = extractPhRange(specs);
  
  // Extract particle size
  const particleSize = specs['Particle Size'] || specs['Particle Diameter'] || null;
  
  // Extract pore size
  const poreSize = specs['Pore Size'] || specs['Pore Diameter'] || null;
  
  // Extract column length
  const columnLength = specs['Length'] || specs['Column Length'] || null;
  
  // Extract inner diameter
  const innerDiameter = specs['Inner Diameter'] || specs['Inner Diameter (ID)'] || specs['ID'] || null;
  
  // Extract phase type
  const phaseType = specs['Phase'] || specs['Chemistry'] || specs['Stationary Phase'] || null;
  
  // Extract USP
  const usp = specs['USP Designation'] || specs['USP Classification'] || specs['USP'] || null;
  
  // Extract max pressure
  const maxPressure = specs['Maximum Pressure'] || specs['Max Pressure'] || null;
  
  // Extract max temperature (from Temperature Range if available)
  const tempRange = specs['Temperature Range'] || null;
  let maxTemperature = null;
  if (tempRange) {
    const match = tempRange.match(/(\d+)\s*°C$/);
    if (match) {
      maxTemperature = `${match[1]} °C`;
    }
  }
  
  // Build pH range string
  let phRangeStr = null;
  if (phRange.min !== null && phRange.max !== null) {
    phRangeStr = `${phRange.min}-${phRange.max}`;
  }
  
  return {
    particleSize,
    poreSize,
    columnLength,
    innerDiameter,
    phRange: phRangeStr,
    maxPressure,
    maxTemperature,
    usp,
    phaseType,
    particleSizeNum: extractNumeric(particleSize),
    poreSizeNum: extractNumeric(poreSize),
    columnLengthNum: extractNumeric(columnLength),
    innerDiameterNum: extractNumeric(innerDiameter),
    phMin: phRange.min,
    phMax: phRange.max,
  };
}

/**
 * Transform CSV row to database product object
 */
function transformProduct(row) {
  const specs = parseSpecifications(row.specifications);
  const fields = extractProductFields(specs);
  
  // Determine product type from specifications or name
  let productType = null;
  if (specs) {
    const technique = specs['Technique'] || '';
    const format = specs['Format'] || '';
    const productTypeField = specs['Product Type'] || '';
    
    if (technique.includes('GC') || format.includes('GC')) {
      productType = 'GC Columns';
    } else if (technique.includes('LC') || technique.includes('HPLC') || format.includes('HPLC')) {
      productType = 'HPLC Columns';
    } else if (productTypeField.includes('Column')) {
      productType = 'HPLC Columns'; // Default to HPLC if not specified
    }
  }
  
  // If still no product type, try to infer from name
  if (!productType && row.name) {
    if (row.name.includes('GC Column')) {
      productType = 'GC Columns';
    } else if (row.name.includes('HPLC') || row.name.includes('LC Column')) {
      productType = 'HPLC Columns';
    }
  }
  
  return {
    productId: row.productId,
    partNumber: row.partNumber,
    brand: row.brand,
    productType,
    name: row.name,
    description: row.description || null,
    specifications: specs ? JSON.stringify(specs) : null,
    imageUrl: row.imageUrl || null,
    catalogUrl: row.catalogUrl || null,
    technicalDocsUrl: row.technicalDocUrl || null,
    ...fields,
  };
}

/**
 * Check if product exists in database
 */
async function productExists(connection, productId) {
  const [rows] = await connection.execute(
    'SELECT productId FROM products WHERE productId = ?',
    [productId]
  );
  return rows.length > 0;
}

/**
 * Update existing product
 */
async function updateProduct(connection, product) {
  const updateFields = [];
  const values = [];
  
  // Build dynamic UPDATE query
  if (product.name) {
    updateFields.push('name = ?');
    values.push(product.name);
  }
  if (product.productType) {
    updateFields.push('productType = ?');
    values.push(product.productType);
  }
  if (product.description) {
    updateFields.push('description = ?');
    values.push(product.description);
  }
  if (product.specifications) {
    updateFields.push('specifications = ?');
    values.push(product.specifications);
  }
  if (product.particleSize) {
    updateFields.push('particleSize = ?');
    values.push(product.particleSize);
  }
  if (product.poreSize) {
    updateFields.push('poreSize = ?');
    values.push(product.poreSize);
  }
  if (product.columnLength) {
    updateFields.push('columnLength = ?');
    values.push(product.columnLength);
  }
  if (product.innerDiameter) {
    updateFields.push('innerDiameter = ?');
    values.push(product.innerDiameter);
  }
  if (product.phRange) {
    updateFields.push('phRange = ?');
    values.push(product.phRange);
  }
  if (product.maxPressure) {
    updateFields.push('maxPressure = ?');
    values.push(product.maxPressure);
  }
  if (product.maxTemperature) {
    updateFields.push('maxTemperature = ?');
    values.push(product.maxTemperature);
  }
  if (product.usp) {
    updateFields.push('usp = ?');
    values.push(product.usp);
  }
  if (product.phaseType) {
    updateFields.push('phaseType = ?');
    values.push(product.phaseType);
  }
  if (product.particleSizeNum !== null) {
    updateFields.push('particleSizeNum = ?');
    values.push(product.particleSizeNum);
  }
  if (product.poreSizeNum !== null) {
    updateFields.push('poreSizeNum = ?');
    values.push(product.poreSizeNum);
  }
  if (product.columnLengthNum !== null) {
    updateFields.push('columnLengthNum = ?');
    values.push(product.columnLengthNum);
  }
  if (product.innerDiameterNum !== null) {
    updateFields.push('innerDiameterNum = ?');
    values.push(product.innerDiameterNum);
  }
  if (product.phMin !== null) {
    updateFields.push('phMin = ?');
    values.push(product.phMin);
  }
  if (product.phMax !== null) {
    updateFields.push('phMax = ?');
    values.push(product.phMax);
  }
  if (product.imageUrl) {
    updateFields.push('imageUrl = ?');
    values.push(product.imageUrl);
  }
  if (product.catalogUrl) {
    updateFields.push('catalogUrl = ?');
    values.push(product.catalogUrl);
  }
  if (product.technicalDocsUrl) {
    updateFields.push('technicalDocsUrl = ?');
    values.push(product.technicalDocsUrl);
  }
  
  // Always update updatedAt
  updateFields.push('updatedAt = NOW()');
  
  // Add productId for WHERE clause
  values.push(product.productId);
  
  const query = `UPDATE products SET ${updateFields.join(', ')} WHERE productId = ?`;
  
  await connection.execute(query, values);
}

/**
 * Insert new product
 */
async function insertProduct(connection, product) {
  const query = `
    INSERT INTO products (
      productId, partNumber, brand, productType, name, description, specifications,
      particleSize, poreSize, columnLength, innerDiameter, phRange, maxPressure, maxTemperature,
      usp, phaseType, particleSizeNum, poreSizeNum, columnLengthNum, innerDiameterNum,
      phMin, phMax, imageUrl, catalogUrl, technicalDocsUrl, status, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
  `;
  
  await connection.execute(query, [
    product.productId,
    product.partNumber,
    product.brand,
    product.productType,
    product.name,
    product.description,
    product.specifications,
    product.particleSize,
    product.poreSize,
    product.columnLength,
    product.innerDiameter,
    product.phRange,
    product.maxPressure,
    product.maxTemperature,
    product.usp,
    product.phaseType,
    product.particleSizeNum,
    product.poreSizeNum,
    product.columnLengthNum,
    product.innerDiameterNum,
    product.phMin,
    product.phMax,
    product.imageUrl,
    product.catalogUrl,
    product.technicalDocsUrl,
  ]);
}

/**
 * Main import function
 */
async function importCrawlerBatch(csvFilePath, updateOnly = false) {
  console.log('='.repeat(80));
  console.log('ROWELL Crawler Batch Data Import Script');
  console.log('='.repeat(80));
  console.log(`\nCSV File: ${csvFilePath}`);
  console.log(`Mode: ${updateOnly ? 'Update existing products only' : 'Update existing + Add new products'}\n`);
  
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
      bom: true, // Handle BOM
    });
  } catch (error) {
    console.error(`❌ Error parsing CSV: ${error.message}`);
    process.exit(1);
  }
  
  console.log(`✅ Found ${records.length} records in CSV`);
  
  // Filter successful products only
  const successfulRecords = records.filter(row => {
    // Handle different status field names: status (Thermo/Daicel), crawlStatus (Agilent), matchType (Waters)
    // If no status field exists, assume all records are successful (for cleaned/final CSVs)
    const hasStatusField = row.status !== undefined || row.crawlStatus !== undefined || row.matchType !== undefined;
    if (!hasStatusField) {
      return true; // Assume all records are successful if no status field
    }
    return row.status === 'success' || row.crawlStatus === 'success' || row.matchType === 'exact' || row.matchType === 'partial';
  });
  
  console.log(`✅ Successful products: ${successfulRecords.length}`);
  console.log(`⚠️  Skipped (failed/not_found): ${records.length - successfulRecords.length}\n`);
  
  if (successfulRecords.length === 0) {
    console.error('❌ No successful products to import. Exiting.');
    process.exit(1);
  }
  
  // Transform products
  console.log('🔄 Transforming data...');
  const products = successfulRecords.map(transformProduct);
  console.log(`✅ Transformed ${products.length} products\n`);
  
  // Connect to database
  console.log('🔌 Connecting to database...');
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Import products
  console.log('💾 Importing products to database...\n');
  let updatedCount = 0;
  let insertedCount = 0;
  let skippedCount = 0;
  let failCount = 0;
  const failedProducts = [];
  
  for (const product of products) {
    try {
      const exists = await productExists(connection, product.productId);
      
      if (exists) {
        await updateProduct(connection, product);
        updatedCount++;
        console.log(`✅ Updated: ${product.productId} - ${product.name}`);
      } else {
        if (updateOnly) {
          skippedCount++;
          console.log(`⏭️  Skipped (new): ${product.productId} - ${product.name}`);
        } else {
          await insertProduct(connection, product);
          insertedCount++;
          console.log(`✅ Inserted: ${product.productId} - ${product.name}`);
        }
      }
    } catch (error) {
      failCount++;
      failedProducts.push({ productId: product.productId, error: error.message });
      console.log(`❌ Failed: ${product.productId} - ${error.message}`);
    }
  }
  
  await connection.end();
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('IMPORT SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total records in CSV: ${records.length}`);
  console.log(`Successful products: ${successfulRecords.length}`);
  console.log(`Failed/Not found: ${records.length - successfulRecords.length}`);
  console.log(`Updated existing products: ${updatedCount}`);
  console.log(`Inserted new products: ${insertedCount}`);
  console.log(`Skipped (update-only mode): ${skippedCount}`);
  console.log(`Failed to import: ${failCount}`);
  console.log('='.repeat(80));
  
  // Save report
  const reportPath = path.join(
    path.dirname(csvFilePath),
    `import_report_${path.basename(csvFilePath, '.csv')}_${Date.now()}.json`
  );
  const report = {
    timestamp: new Date().toISOString(),
    csvFile: csvFilePath,
    mode: updateOnly ? 'update-only' : 'update-and-insert',
    totalRecords: records.length,
    successfulRecords: successfulRecords.length,
    updatedCount,
    insertedCount,
    skippedCount,
    failCount,
    failedProducts,
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Import report saved to: ${reportPath}\n`);
  
  process.exit(failCount > 0 ? 1 : 0);
}

// Main execution
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node import-crawler-batch.mjs <csv_file_path> [--update-only]');
  console.error('Example: node import-crawler-batch.mjs ./agilent_columns_crawl_results.csv');
  console.error('Example: node import-crawler-batch.mjs ./waters_batch2_crawl_results.csv --update-only');
  process.exit(1);
}

const csvFilePath = path.resolve(args[0]);
const updateOnly = args.includes('--update-only');

importCrawlerBatch(csvFilePath, updateOnly).catch(error => {
  console.error(`\n❌ Fatal error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
