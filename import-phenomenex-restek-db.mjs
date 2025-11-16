import { readFileSync, writeFileSync } from 'fs';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import mysql from 'mysql2/promise';

/**
 * Import script for Phenomenex + Restek verified data
 * Task: ROWELL-CRAWL-008-PHENOMENEX-RESTEK
 * Date: 2025-11-16
 * 
 * This script updates products in the database with verified data from crawler team
 */

// Database connection
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Define products table structure (simplified for this script)
const productsTable = {
  id: 'id',
  productId: 'productId',
  partNumber: 'partNumber',
  brand: 'brand',
  name: 'name',
  description: 'description',
  catalogUrl: 'catalogUrl',
  particleSize: 'particleSize',
  poreSize: 'poreSize',
  columnLength: 'columnLength',
  innerDiameter: 'innerDiameter',
  phRange: 'phRange'
};

// Load verified data
const phenomenexPath = '/home/ubuntu/upload/phenomenex_verified_data(1).json';
const restekPath = '/home/ubuntu/upload/restek_verified_data.json';

const phenomenexVerified = JSON.parse(readFileSync(phenomenexPath, 'utf-8'));
const restekVerified = JSON.parse(readFileSync(restekPath, 'utf-8'));

console.log(`📥 Loaded ${phenomenexVerified.length} Phenomenex verified products`);
console.log(`📥 Loaded ${restekVerified.length} Restek verified products`);

// Statistics
const stats = {
  phenomenex: {
    total: 0,
    updated: 0,
    skipped: 0,
    notFound: 0,
    descriptionUpdated: 0,
    specsUpdated: 0,
    errors: 0
  },
  restek: {
    total: 0,
    updated: 0,
    skipped: 0,
    notFound: 0,
    descriptionUpdated: 0,
    specsUpdated: 0,
    errors: 0
  }
};

// Helper function to update product in database
async function updateProductInDB(verified, brand, brandStats) {
  brandStats.total++;

  if (verified.verificationStatus !== 'verified') {
    brandStats.skipped++;
    return;
  }

  try {
    // Find product by catalogUrl and brand
    const [rows] = await connection.execute(
      'SELECT * FROM products WHERE catalogUrl = ? AND brand = ? LIMIT 1',
      [verified.catalogUrl, brand]
    );

    if (rows.length === 0) {
      brandStats.notFound++;
      console.log(`⚠️  Product not found: ${verified.catalogUrl}`);
      return;
    }

    const product = rows[0];
    const updates = {};
    let hasUpdates = false;

    // Update description if missing or empty
    if (verified.description && (!product.description || product.description.trim() === '')) {
      updates.description = verified.description;
      brandStats.descriptionUpdated++;
      hasUpdates = true;
    }

    // Update specifications if available
    if (verified.specifications) {
      const specs = verified.specifications;
      let specsChanged = false;

      if (specs.particleSize && !product.particleSize) {
        updates.particleSize = specs.particleSize;
        specsChanged = true;
      }
      if (specs.poreSize && !product.poreSize) {
        updates.poreSize = specs.poreSize;
        specsChanged = true;
      }
      if (specs.columnLength && !product.columnLength) {
        updates.columnLength = specs.columnLength;
        specsChanged = true;
      }
      if (specs.innerDiameter && !product.innerDiameter) {
        updates.innerDiameter = specs.innerDiameter;
        specsChanged = true;
      }
      if (specs.phRange && !product.phRange) {
        updates.phRange = specs.phRange;
        specsChanged = true;
      }

      if (specsChanged) {
        brandStats.specsUpdated++;
        hasUpdates = true;
      }
    }

    if (hasUpdates) {
      // Build UPDATE query
      const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(updates), product.id];
      
      await connection.execute(
        `UPDATE products SET ${setClause} WHERE id = ?`,
        values
      );
      
      brandStats.updated++;
    } else {
      brandStats.skipped++;
    }
  } catch (error) {
    console.error(`❌ Error updating product ${verified.catalogUrl}:`, error.message);
    brandStats.errors++;
  }
}

// Process Phenomenex products
console.log('\n🔄 Processing Phenomenex products...');
for (const verified of phenomenexVerified) {
  await updateProductInDB(verified, 'Phenomenex', stats.phenomenex);
}

// Process Restek products
console.log('\n🔄 Processing Restek products...');
for (const verified of restekVerified) {
  await updateProductInDB(verified, 'Restek', stats.restek);
}

// Close database connection
await connection.end();

// Print statistics
console.log('\n' + '='.repeat(60));
console.log('📊 IMPORT STATISTICS');
console.log('='.repeat(60));

console.log('\n📦 Phenomenex:');
console.log(`   Total verified: ${stats.phenomenex.total}`);
console.log(`   ✅ Updated: ${stats.phenomenex.updated}`);
console.log(`   📝 Description updated: ${stats.phenomenex.descriptionUpdated}`);
console.log(`   📏 Specifications updated: ${stats.phenomenex.specsUpdated}`);
console.log(`   ⏭️  Skipped: ${stats.phenomenex.skipped}`);
console.log(`   ❌ Not found: ${stats.phenomenex.notFound}`);
console.log(`   ⚠️  Errors: ${stats.phenomenex.errors}`);

console.log('\n📦 Restek:');
console.log(`   Total verified: ${stats.restek.total}`);
console.log(`   ✅ Updated: ${stats.restek.updated}`);
console.log(`   📝 Description updated: ${stats.restek.descriptionUpdated}`);
console.log(`   📏 Specifications updated: ${stats.restek.specsUpdated}`);
console.log(`   ⏭️  Skipped: ${stats.restek.skipped}`);
console.log(`   ❌ Not found: ${stats.restek.notFound}`);
console.log(`   ⚠️  Errors: ${stats.restek.errors}`);

console.log('\n📊 Overall:');
const totalProcessed = stats.phenomenex.total + stats.restek.total;
const totalUpdated = stats.phenomenex.updated + stats.restek.updated;
console.log(`   Total processed: ${totalProcessed}`);
console.log(`   Total updated: ${totalUpdated}`);
console.log(`   Success rate: ${(totalUpdated / totalProcessed * 100).toFixed(1)}%`);

console.log('\n✅ Import completed successfully!');

// Generate import report
const report = {
  taskId: 'ROWELL-CRAWL-008-PHENOMENEX-RESTEK',
  importDate: new Date().toISOString(),
  statistics: stats,
  overallSuccessRate: `${(totalUpdated / totalProcessed * 100).toFixed(1)}%`,
  totalUpdated: totalUpdated,
  totalProcessed: totalProcessed
};

const reportPath = '/home/ubuntu/phenomenex_restek_import_report.json';
writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
console.log(`📄 Import report saved to: ${reportPath}`);
