#!/usr/bin/env node
/**
 * Import Agilent Batch Crawler Data Script
 * 
 * This script imports Agilent product data from the new crawler format into the database.
 * Supports the new data format with specifications JSON and descriptionQuality fields.
 * 
 * Usage: node import-agilent-batch-data.mjs <csv_file_path>
 * 
 * Example: node import-agilent-batch-data.mjs ./agilent_full_results.csv
 */

import { drizzle } from 'drizzle-orm/mysql2';
import { products } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

/**
 * Parse JSON string safely
 */
function parseJSON(jsonString) {
  if (!jsonString) return null;
  
  try {
    // Handle double-quoted JSON in CSV
    let cleaned = jsonString;
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
      cleaned = cleaned.replace(/""/g, '"');
    }
    return JSON.parse(cleaned);
  } catch (error) {
    console.warn(`⚠️  JSON parse error: ${error.message}`);
    return null;
  }
}

/**
 * Validate required fields
 */
function validateProduct(product) {
  const errors = [];
  
  if (!product.productId) {
    errors.push('Missing required field: productId');
  }
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
 * Validate specifications JSON
 */
function validateSpecifications(specs) {
  if (!specs) return false;
  if (typeof specs !== 'object') return false;
  if (Array.isArray(specs)) return false;
  
  const keys = Object.keys(specs);
  return keys.length >= 3; // At least 3 fields
}

/**
 * Transform CSV row to database update object
 */
function transformProduct(row) {
  const specifications = parseJSON(row.specifications);
  
  return {
    productId: row.productId,
    partNumber: row.partNumber,
    brand: row.brand,
    name: row.name,
    description: row.description || null,
    specifications: specifications ? JSON.stringify(specifications) : null,
    descriptionQuality: row.descriptionQuality || 'none',
    imageUrl: row.imageUrl || null,
    catalogUrl: row.catalogUrl || null,
    technicalDocsUrl: row.technicalDocUrl || null,
    detailedDescription: row.detailedDescription || null,
  };
}

/**
 * Main import function
 */
async function importCrawlerData(csvFilePath) {
  console.log('='.repeat(70));
  console.log('ROWELL Agilent Batch Data Import Script');
  console.log('='.repeat(70));
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
      bom: true, // Handle UTF-8 BOM
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
      invalidProducts.push({ 
        row: i + 2, 
        productId: row.productId, 
        partNumber: row.partNumber, 
        errors 
      });
      console.log(`⚠️  Row ${i + 2} (${row.productId}): ${errors.join(', ')}`);
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
  console.log('💾 Updating products in database...\n');
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const skippedProducts = [];
  const errorProducts = [];
  const updateDetails = [];
  
  for (const product of validProducts) {
    try {
      // Check if product exists in database
      const existing = await db.select()
        .from(products)
        .where(eq(products.productId, product.productId))
        .limit(1);
      
      if (existing.length === 0) {
        skippedCount++;
        skippedProducts.push({
          productId: product.productId,
          partNumber: product.partNumber,
          reason: 'Product not found in database'
        });
        console.log(`⏭️  Skipped: ${product.productId} (not in database)`);
        continue;
      }
      
      // Count how many fields will be updated
      let updatedFields = 0;
      const fieldUpdates = [];
      
      if (product.name && product.name !== existing[0].name) {
        updatedFields++;
        fieldUpdates.push('name');
      }
      if (product.description && product.description !== existing[0].description) {
        updatedFields++;
        fieldUpdates.push('description');
      }
      if (product.specifications && product.specifications !== existing[0].specifications) {
        updatedFields++;
        fieldUpdates.push('specifications');
      }
      if (product.descriptionQuality && product.descriptionQuality !== existing[0].descriptionQuality) {
        updatedFields++;
        fieldUpdates.push('descriptionQuality');
      }
      
      // Update product
      await db.update(products)
        .set({
          name: product.name,
          description: product.description,
          specifications: product.specifications,
          descriptionQuality: product.descriptionQuality,
          imageUrl: product.imageUrl,
          catalogUrl: product.catalogUrl,
          technicalDocsUrl: product.technicalDocsUrl,
          detailedDescription: product.detailedDescription,
          updatedAt: new Date(),
        })
        .where(eq(products.productId, product.productId));
      
      updatedCount++;
      updateDetails.push({
        productId: product.productId,
        partNumber: product.partNumber,
        name: product.name,
        descriptionQuality: product.descriptionQuality,
        updatedFields: fieldUpdates.length,
        fields: fieldUpdates,
      });
      
      console.log(`✅ Updated: ${product.productId} - ${product.name.substring(0, 60)}... (${updatedFields} fields)`);
    } catch (error) {
      errorCount++;
      errorProducts.push({ 
        productId: product.productId, 
        partNumber: product.partNumber,
        error: error.message 
      });
      console.log(`❌ Error: ${product.productId} - ${error.message}`);
    }
  }
  
  // Data quality statistics
  console.log('\n' + '='.repeat(70));
  console.log('DATA QUALITY STATISTICS');
  console.log('='.repeat(70));
  
  const qualityStats = {
    high: 0,
    medium: 0,
    low: 0,
    extracted: 0,
    none: 0,
  };
  
  const specsStats = {
    valid: 0,
    invalid: 0,
    missing: 0,
  };
  
  for (const product of validProducts) {
    // Description quality
    const quality = product.descriptionQuality || 'none';
    if (qualityStats[quality] !== undefined) {
      qualityStats[quality]++;
    }
    
    // Specifications
    const specs = parseJSON(product.specifications);
    if (!specs) {
      specsStats.missing++;
    } else if (validateSpecifications(specs)) {
      specsStats.valid++;
    } else {
      specsStats.invalid++;
    }
  }
  
  console.log('\nDescription Quality Distribution:');
  console.log(`  A级 (high):      ${qualityStats.high.toString().padStart(4)} (${(qualityStats.high / validProducts.length * 100).toFixed(1)}%)`);
  console.log(`  B级 (medium):    ${qualityStats.medium.toString().padStart(4)} (${(qualityStats.medium / validProducts.length * 100).toFixed(1)}%)`);
  console.log(`  C级 (low):       ${qualityStats.low.toString().padStart(4)} (${(qualityStats.low / validProducts.length * 100).toFixed(1)}%)`);
  console.log(`  D级 (extracted): ${qualityStats.extracted.toString().padStart(4)} (${(qualityStats.extracted / validProducts.length * 100).toFixed(1)}%)`);
  console.log(`  N/A (none):      ${qualityStats.none.toString().padStart(4)} (${(qualityStats.none / validProducts.length * 100).toFixed(1)}%)`);
  
  const abCount = qualityStats.high + qualityStats.medium;
  console.log(`\n  A/B级合计:       ${abCount.toString().padStart(4)} (${(abCount / validProducts.length * 100).toFixed(1)}%)`);
  
  console.log('\nSpecifications Quality:');
  console.log(`  Valid (≥3 fields): ${specsStats.valid.toString().padStart(4)} (${(specsStats.valid / validProducts.length * 100).toFixed(1)}%)`);
  console.log(`  Invalid (<3):      ${specsStats.invalid.toString().padStart(4)} (${(specsStats.invalid / validProducts.length * 100).toFixed(1)}%)`);
  console.log(`  Missing:           ${specsStats.missing.toString().padStart(4)} (${(specsStats.missing / validProducts.length * 100).toFixed(1)}%)`);
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('IMPORT SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total products in CSV:     ${records.length}`);
  console.log(`Valid products:            ${validProducts.length}`);
  console.log(`Invalid products:          ${invalidProducts.length}`);
  console.log(`Successfully updated:      ${updatedCount}`);
  console.log(`Skipped (not in DB):       ${skippedCount}`);
  console.log(`Errors:                    ${errorCount}`);
  console.log('='.repeat(70));
  
  // Quality assessment
  console.log('\n' + '='.repeat(70));
  console.log('QUALITY ASSESSMENT');
  console.log('='.repeat(70));
  
  const successRate = (updatedCount / validProducts.length * 100).toFixed(1);
  const specsRate = (specsStats.valid / validProducts.length * 100).toFixed(1);
  const descRate = ((validProducts.length - qualityStats.none) / validProducts.length * 100).toFixed(1);
  const abRate = (abCount / validProducts.length * 100).toFixed(1);
  
  console.log(`Success Rate:              ${successRate}% (target: ≥90%)`);
  console.log(`Specifications Complete:   ${specsRate}% (target: ≥90%)`);
  console.log(`Description Coverage:      ${descRate}% (target: ≥70%)`);
  console.log(`A/B Description Ratio:     ${abRate}% (target: ≥30%)`);
  
  let qualityGrade = 'FAIL';
  if (parseFloat(successRate) >= 90 && parseFloat(specsRate) >= 90) {
    if (parseFloat(descRate) >= 70 && parseFloat(abRate) >= 30) {
      qualityGrade = 'EXCELLENT';
    } else {
      qualityGrade = 'GOOD';
    }
  } else if (parseFloat(successRate) >= 80) {
    qualityGrade = 'ACCEPTABLE';
  }
  
  console.log(`\nOverall Quality Grade:     ${qualityGrade}`);
  console.log('='.repeat(70));
  
  // Save detailed report
  const timestamp = Date.now();
  const reportPath = path.join(
    path.dirname(csvFilePath), 
    `import_agilent_batch_report_${timestamp}.json`
  );
  
  const report = {
    timestamp: new Date().toISOString(),
    csvFile: csvFilePath,
    summary: {
      total: records.length,
      valid: validProducts.length,
      invalid: invalidProducts.length,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errorCount,
    },
    qualityStats: {
      description: qualityStats,
      specifications: specsStats,
      successRate: parseFloat(successRate),
      specsRate: parseFloat(specsRate),
      descRate: parseFloat(descRate),
      abRate: parseFloat(abRate),
      grade: qualityGrade,
    },
    invalidProducts,
    skippedProducts,
    errorProducts,
    updateDetails,
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  // Save summary report (Markdown)
  const summaryPath = path.join(
    path.dirname(csvFilePath), 
    `import_agilent_batch_summary_${timestamp}.md`
  );
  
  const summaryMd = `# Agilent Batch Import Summary

**Date**: ${new Date().toISOString()}  
**CSV File**: ${path.basename(csvFilePath)}

## Import Results

| Metric | Count | Percentage |
|--------|-------|------------|
| Total Products | ${records.length} | 100% |
| Valid Products | ${validProducts.length} | ${(validProducts.length / records.length * 100).toFixed(1)}% |
| Successfully Updated | ${updatedCount} | ${successRate}% |
| Skipped (Not in DB) | ${skippedCount} | ${(skippedCount / validProducts.length * 100).toFixed(1)}% |
| Errors | ${errorCount} | ${(errorCount / validProducts.length * 100).toFixed(1)}% |

## Data Quality

### Description Quality Distribution

| Quality Level | Count | Percentage |
|--------------|-------|------------|
| A级 (high) | ${qualityStats.high} | ${(qualityStats.high / validProducts.length * 100).toFixed(1)}% |
| B级 (medium) | ${qualityStats.medium} | ${(qualityStats.medium / validProducts.length * 100).toFixed(1)}% |
| C级 (low) | ${qualityStats.low} | ${(qualityStats.low / validProducts.length * 100).toFixed(1)}% |
| D级 (extracted) | ${qualityStats.extracted} | ${(qualityStats.extracted / validProducts.length * 100).toFixed(1)}% |
| N/A (none) | ${qualityStats.none} | ${(qualityStats.none / validProducts.length * 100).toFixed(1)}% |
| **A/B合计** | **${abCount}** | **${abRate}%** |

### Specifications Quality

| Metric | Count | Percentage |
|--------|-------|------------|
| Valid (≥3 fields) | ${specsStats.valid} | ${specsRate}% |
| Invalid (<3 fields) | ${specsStats.invalid} | ${(specsStats.invalid / validProducts.length * 100).toFixed(1)}% |
| Missing | ${specsStats.missing} | ${(specsStats.missing / validProducts.length * 100).toFixed(1)}% |

## Quality Assessment

| Metric | Actual | Target | Status |
|--------|--------|--------|--------|
| Success Rate | ${successRate}% | ≥90% | ${parseFloat(successRate) >= 90 ? '✅' : '❌'} |
| Specifications Complete | ${specsRate}% | ≥90% | ${parseFloat(specsRate) >= 90 ? '✅' : '❌'} |
| Description Coverage | ${descRate}% | ≥70% | ${parseFloat(descRate) >= 70 ? '✅' : '❌'} |
| A/B Description Ratio | ${abRate}% | ≥30% | ${parseFloat(abRate) >= 30 ? '✅' : '❌'} |

**Overall Quality Grade**: **${qualityGrade}**

${qualityGrade === 'EXCELLENT' ? '🎉 Excellent! All quality targets met.' : ''}
${qualityGrade === 'GOOD' ? '✅ Good! Core quality targets met.' : ''}
${qualityGrade === 'ACCEPTABLE' ? '⚠️ Acceptable, but improvements needed.' : ''}
${qualityGrade === 'FAIL' ? '❌ Failed to meet minimum quality standards.' : ''}

---

Generated by ROWELL Import Script  
${new Date().toISOString()}
`;
  
  fs.writeFileSync(summaryPath, summaryMd);
  console.log(`📄 Summary report saved to: ${summaryPath}\n`);
  
  // Exit with appropriate code
  if (qualityGrade === 'FAIL') {
    console.error('❌ Import failed quality check. Please review the data.');
    process.exit(1);
  } else {
    console.log(`✅ Import completed successfully with grade: ${qualityGrade}`);
    process.exit(0);
  }
}

// Main execution
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node import-agilent-batch-data.mjs <csv_file_path>');
  console.error('Example: node import-agilent-batch-data.mjs ./agilent_full_results.csv');
  process.exit(1);
}

const csvFilePath = path.resolve(args[0]);
importCrawlerData(csvFilePath).catch(error => {
  console.error(`\n❌ Fatal error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
