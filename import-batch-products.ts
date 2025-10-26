import { getDb } from './server/db';
import { products, productCategories, categories } from './drizzle/schema';
import { eq, and } from 'drizzle-orm';
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
  if (!db) {
    console.error('❌ Database not available');
    process.exit(1);
  }
  console.log('🚀 Starting batch product import...\n');

  // Step 1: Get category IDs
  console.log('📋 Step 1: Fetching category IDs...');
  for (const config of importConfigs) {
    const category = await db
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

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      try {
        // Check if product already exists
        const existing = await db
          .select()
          .from(products)
          .where(eq(products.productId, row.productId))
          .limit(1);

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

        if (existing.length > 0) {
          // Update existing product
          await db
            .update(products)
            .set(productData)
            .where(eq(products.id, existing[0].id));
          
          // Check if category assignment exists
          const categoryAssignment = await db
            .select()
            .from(productCategories)
            .where(
              and(
                eq(productCategories.productId, existing[0].id),
                eq(productCategories.categoryId, config.categoryId!)
              )
            )
            .limit(1);

          if (categoryAssignment.length === 0) {
            // Add category assignment
            await db.insert(productCategories).values({
              productId: existing[0].id,
              categoryId: config.categoryId!,
            });
          }

          updated++;
        } else {
          // Insert new product
          const [newProduct] = await db
            .insert(products)
            .values(productData)
            .$returningId();

          // Assign category
          await db.insert(productCategories).values({
            productId: newProduct.id,
            categoryId: config.categoryId!,
          });

          imported++;
        }
      } catch (error) {
        console.error(`  ❌ Error processing ${row.productId}:`, error);
        skipped++;
      }
    }

    console.log(`  ✓ Imported: ${imported}, Updated: ${updated}, Skipped: ${skipped}`);
    totalImported += imported;
    totalUpdated += updated;
    totalSkipped += skipped;
  }

  console.log('\n\n✅ Batch import completed!');
  console.log(`📊 Summary:`);
  console.log(`  - Total imported: ${totalImported}`);
  console.log(`  - Total updated: ${totalUpdated}`);
  console.log(`  - Total skipped: ${totalSkipped}`);
  console.log(`  - Grand total: ${totalImported + totalUpdated}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  });

