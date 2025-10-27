import { getDb } from './server/db';
import { products, categories, productCategories } from './drizzle/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import csv from 'csv-parser';

/**
 * Import new product types (GC Columns, SPE Cartridges, Guard Columns, Filtration, Chromatography Supplies)
 * from product_expansion.csv
 */

interface ProductRow {
  productId: string;
  partNumber: string;
  brand: string;
  prefix: string;
  name: string;
  category: string;
  description: string;
  specifications: string;
  particleSize: string;
  poreSize: string;
  columnLength: string;
  innerDiameter: string;
  phaseType: string;
  imageUrl: string;
  catalogUrl: string;
  technicalDocsUrl: string;
}

// Category name mapping (English to Chinese/Database name)
const categoryMapping: Record<string, string[]> = {
  'GC Columns': ['GC Columns', '气相色谱柱', 'gc-columns'],
  'SPE Cartridges': ['SPE Cartridges', '固相萃取柱', 'spe-cartridges'],
  'Guard Columns': ['Guard Columns', '保护柱', 'guard-columns'],
  'Filtration': ['Filtration', '过滤器', 'filtration'],
  'Chromatography Supplies': ['Chromatography Supplies', '色谱耗材', 'chromatography-supplies']
};

async function importNewProducts() {
  const db = await getDb();
  if (!db) {
    console.error('Database connection failed');
    process.exit(1);
  }
  console.log('Starting new products import...\n');
  
  const csvFilePath = '/home/ubuntu/upload/product_expansion.csv';
  
  if (!fs.existsSync(csvFilePath)) {
    console.error(`CSV file not found: ${csvFilePath}`);
    process.exit(1);
  }
  
  // Get all categories
  const allCategories = await db.select().from(categories);
  const categoryMap = new Map<string, number>();
  
  for (const cat of allCategories) {
    // Map by name
    if (cat.name) {
      categoryMap.set(cat.name.toLowerCase(), cat.id);
    }
    // Map by nameEn
    if (cat.nameEn) {
      categoryMap.set(cat.nameEn.toLowerCase(), cat.id);
    }
    // Map by slug
    if (cat.slug) {
      categoryMap.set(cat.slug.toLowerCase(), cat.id);
    }
  }
  
  console.log(`Found ${allCategories.length} categories in database`);
  console.log('Sample categories:', allCategories.slice(0, 10).map(c => `${c.name} (${c.nameEn})`));
  console.log('');
  
  const rows: ProductRow[] = [];
  
  // Read CSV file
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row: ProductRow) => {
        rows.push(row);
      })
      .on('end', () => {
        console.log(`Read ${rows.length} products from CSV\n`);
        resolve();
      })
      .on('error', reject);
  });
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  const categoryStats: Record<string, number> = {};
  
  for (const row of rows) {
    try {
      // Check if product already exists
      const existing = await db
        .select()
        .from(products)
        .where(eq(products.productId, row.productId))
        .limit(1);
      
      if (existing.length > 0) {
        skipped++;
        continue;
      }
      
      // Parse specifications JSON
      let specs = {};
      if (row.specifications && row.specifications !== '{}') {
        try {
          specs = JSON.parse(row.specifications);
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      // Extract numeric values for filtering
      const columnLengthNum = extractNumber(row.columnLength);
      const innerDiameterNum = extractNumber(row.innerDiameter);
      const poreSizeNum = extractNumber(row.poreSize);
      
      // Insert product
      const [insertedProduct] = await db.insert(products).values({
        productId: row.productId,
        partNumber: row.partNumber,
        brand: row.brand,
        prefix: row.prefix,
        name: row.name,
        description: row.description || '',
        specifications: specs,
        particleSize: row.particleSize || null,
        poreSize: row.poreSize || null,
        columnLength: row.columnLength || null,
        innerDiameter: row.innerDiameter || null,
        phaseType: row.phaseType || null,
        columnLengthNum: columnLengthNum,
        innerDiameterNum: innerDiameterNum,
        poreSizeNum: poreSizeNum,
        imageUrl: row.imageUrl || null,
        catalogUrl: row.catalogUrl || null,
        technicalDocsUrl: row.technicalDocsUrl || null,
        status: 'active'
      });
      
      // Assign category
      const categoryEnName = row.category;
      const possibleNames = categoryMapping[categoryEnName] || [categoryEnName];
      
      let categoryId: number | undefined;
      
      // Try all possible category names
      for (const name of possibleNames) {
        const lowerName = name.toLowerCase();
        if (categoryMap.has(lowerName)) {
          categoryId = categoryMap.get(lowerName);
          break;
        }
      }
      
      if (categoryId) {
        await db.insert(productCategories).values({
          productId: insertedProduct.insertId as number,
          categoryId: categoryId,
          isPrimary: 1
        });
        
        categoryStats[categoryEnName] = (categoryStats[categoryEnName] || 0) + 1;
      } else {
        console.warn(`Category not found: ${categoryEnName} (tried: ${possibleNames.join(', ')})`);
      }
      
      imported++;
      
      if (imported % 100 === 0) {
        console.log(`Progress: ${imported} products imported...`);
      }
      
    } catch (error) {
      console.error(`Error importing product ${row.productId}:`, error);
      errors++;
    }
  }
  
  console.log('\n=== Import Complete ===');
  console.log(`Total products in CSV: ${rows.length}`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped (already exists): ${skipped}`);
  console.log(`Errors: ${errors}`);
  
  console.log('\n=== Category Statistics ===');
  for (const [category, count] of Object.entries(categoryStats)) {
    console.log(`${category}: ${count} products`);
  }
  
  // Verify total products in database
  const totalProducts = await db.select({ count: products.id }).from(products);
  console.log(`\nTotal products in database: ${totalProducts.length}`);
}

function extractNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  
  // Extract first number from string
  const match = value.match(/[\d.]+/);
  if (match) {
    const num = parseFloat(match[0]);
    return isNaN(num) ? null : num;
  }
  
  return null;
}

importNewProducts()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

