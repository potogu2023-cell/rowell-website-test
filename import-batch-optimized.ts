import { getDb } from './server/db';
import { products, productCategories, categories } from './drizzle/schema';
import { eq, inArray } from 'drizzle-orm';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';

const db = await getDb();

if (!db) {
  console.error('❌ Failed to connect to database');
  process.exit(1);
}

interface ProductCSVRow {
  productId: string;
  partNumber: string;
  brand: string;
  name: string;
  description: string;
  particleSize?: string;
  poreSize?: string;
  columnLength?: string;
  innerDiameter?: string;
  phaseType?: string;
  phMin?: string;
  phMax?: string;
  phRange?: string;
  maxPressure?: string;
  maxTemperature?: string;
  usp?: string;
  imageUrl?: string;
  catalogUrl?: string;
  status: string;
}

interface ImportConfig {
  file: string;
  categoryName: string;
  categoryId?: number;
}

const importConfigs: ImportConfig[] = [
  { file: 'hplc_columns.csv', categoryName: 'HPLC Columns' },
  { file: 'gc_columns.csv', categoryName: 'GC Columns' },
  { file: 'guard_columns.csv', categoryName: 'Guard Columns' },
  { file: 'spe_cartridges.csv', categoryName: 'SPE Cartridges' },
  { file: 'filters.csv', categoryName: 'Filtration' },
  { file: 'vials_caps.csv', categoryName: 'Chromatography Supplies' },
];

async function main() {
  console.log('🚀 Starting optimized batch product import...\n');

  // Step 1: Get category IDs
  console.log('📋 Step 1: Fetching category IDs...');
  for (const config of importConfigs) {
    const category = await db!
      .select()
      .from(categories)
      .where(eq(categories.name, config.categoryName))
      .limit(1);
    
    if (category.length === 0) {
      console.error(`❌ Category "${config.categoryName}" not found!`);
      process.exit(1);
    }
    
    config.categoryId = category[0].id;
    console.log(`  ✓ ${config.categoryName}: ID ${config.categoryId}`);
  }
  console.log('');

  // Step 2: Import products from each CSV file
  let totalImported = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const config of importConfigs) {
    console.log(`\n📦 Processing ${config.file}...`);
    
    const csvContent = fs.readFileSync(config.file, 'utf-8');
    const rows: ProductCSVRow[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`  Found ${rows.length} products in CSV`);

    // Get all existing product IDs in one query
    const productIds = rows.map(r => r.productId);
    const existingProducts = await db!
      .select({ id: products.id, productId: products.productId })
      .from(products)
      .where(inArray(products.productId, productIds));

    const existingMap = new Map(existingProducts.map(p => [p.productId, p.id]));
    console.log(`  Found ${existingProducts.length} existing products`);

    // Separate into new and existing products
    const newProducts: any[] = [];
    const updateProducts: any[] = [];

    for (const row of rows) {
      const productData = {
        productId: row.productId,
        partNumber: row.partNumber,
        brand: row.brand,
        prefix: row.brand.substring(0, 4).toUpperCase(),
        name: row.name,
        description: row.description,
        detailedDescription: row.description,
        particleSize: row.particleSize || null,
        poreSize: row.poreSize || null,
        columnLength: row.columnLength || null,
        innerDiameter: row.innerDiameter || null,
        phaseType: row.phaseType || null,
        phMin: row.phMin || null,
        phMax: row.phMax || null,
        phRange: row.phRange || null,
        maxPressure: row.maxPressure || null,
        maxTemperature: row.maxTemperature || null,
        usp: row.usp || null,
        imageUrl: row.imageUrl || null,
        catalogUrl: row.catalogUrl || null,
        status: row.status as 'active' | 'inactive' | 'discontinued',
        particleSizeNum: row.particleSize ? parseFloat(row.particleSize) : null,
        poreSizeNum: row.poreSize ? parseFloat(row.poreSize) : null,
        columnLengthNum: row.columnLength ? parseFloat(row.columnLength) : null,
        innerDiameterNum: row.innerDiameter ? parseFloat(row.innerDiameter) : null,
        phMinNum: row.phMin ? parseFloat(row.phMin) : null,
        phMaxNum: row.phMax ? parseFloat(row.phMax) : null,
      };

      if (existingMap.has(row.productId)) {
        updateProducts.push({ ...productData, id: existingMap.get(row.productId) });
      } else {
        newProducts.push(productData);
      }
    }

    // Batch insert new products
    if (newProducts.length > 0) {
      console.log(`  Inserting ${newProducts.length} new products...`);
      const BATCH_SIZE = 100;
      for (let i = 0; i < newProducts.length; i += BATCH_SIZE) {
        const batch = newProducts.slice(i, i + BATCH_SIZE);
        const insertedProducts = await db!.insert(products).values(batch).$returningId();
        
        // Assign categories
        const categoryAssignments = insertedProducts.map(p => ({
          productId: p.id,
          categoryId: config.categoryId!,
        }));
        await db!.insert(productCategories).values(categoryAssignments);
        
        totalImported += batch.length;
        if ((i + BATCH_SIZE) % 500 === 0 || i + BATCH_SIZE >= newProducts.length) {
          console.log(`    Progress: ${Math.min(i + BATCH_SIZE, newProducts.length)}/${newProducts.length}`);
        }
      }
    }

    // Update existing products
    if (updateProducts.length > 0) {
      console.log(`  Updating ${updateProducts.length} existing products...`);
      for (let i = 0; i < updateProducts.length; i++) {
        const product = updateProducts[i];
        const { id, ...data } = product;
        await db!.update(products).set(data).where(eq(products.id, id));
        
        // Check and add category assignment if needed
        const categoryAssignment = await db!
          .select()
          .from(productCategories)
          .where(eq(productCategories.productId, id))
          .where(eq(productCategories.categoryId, config.categoryId!))
          .limit(1);

        if (categoryAssignment.length === 0) {
          await db!.insert(productCategories).values({
            productId: id,
            categoryId: config.categoryId!,
          });
        }
        
        totalUpdated++;
        if ((i + 1) % 100 === 0 || i + 1 === updateProducts.length) {
          console.log(`    Progress: ${i + 1}/${updateProducts.length}`);
        }
      }
    }

    console.log(`  ✓ Imported: ${newProducts.length}, Updated: ${updateProducts.length}`);
  }

  console.log('\n\n✅ Batch import completed!');
  console.log(`📊 Summary:`);
  console.log(`  - Total imported: ${totalImported}`);
  console.log(`  - Total updated: ${totalUpdated}`);
  console.log(`  - Grand total: ${totalImported + totalUpdated}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  });

