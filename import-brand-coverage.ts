import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './server/db';
import { products, productCategories, categories } from './drizzle/schema';
import { eq, and } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ProductRow {
  productId: string;
  partNumber: string;
  brand: string;
  name: string;
  description: string;
  status: string;
  imageUrl?: string;
  catalogUrl?: string;
  particleSize?: string;
  poreSize?: string;
  columnLength?: string;
  innerDiameter?: string;
  phaseType?: string;
  phMin?: string;
  phMax?: string;
  phRange?: string;
  usp?: string;
  maxPressure?: string;
  maxTemperature?: string;
}

// 分类名称到ID的映射
const categoryMapping: Record<string, number> = {
  'hplc_columns': 1,
  'gc_columns': 12,
  'guard_columns': 13,
  'spe_cartridges': 31,
  'filtration': 4,
  'chromatography_supplies': 2,
};

async function importBrandCoverageData() {
  const dataDir = path.join(__dirname, 'complete_coverage_output');
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.csv'));
  
  console.log(`Found ${files.length} CSV files to import`);
  
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  
  for (const file of files) {
    const filePath = path.join(dataDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // 解析文件名：Brand_category.csv
    const match = file.match(/^(.+)_(hplc_columns|gc_columns|guard_columns|spe_cartridges|filtration|chromatography_supplies)\.csv$/);
    if (!match) {
      console.log(`Skipping file with unexpected name: ${file}`);
      continue;
    }
    
    const brand = match[1];
    const categoryKey = match[2];
    const categoryId = categoryMapping[categoryKey];
    
    if (!categoryId) {
      console.log(`Unknown category: ${categoryKey}`);
      continue;
    }
    
    console.log(`\nProcessing: ${file} (Brand: ${brand}, Category: ${categoryKey})`);
    
    const rows: ProductRow[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    
    console.log(`  Found ${rows.length} products`);
    
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const row of rows) {
      try {
        // 检查产品是否已存在
        const db = await getDb();
        if (!db) {
          console.error('Database not available');
          skipped++;
          continue;
        }
        
        const existing = await db.select().from(products).where(eq(products.productId, row.productId)).limit(1);
        
        // 从productId中提取prefix（例如：WATS-186009298 -> WATS）
        const prefix = row.productId.split('-')[0];
        
        const productData = {
          productId: row.productId,
          partNumber: row.partNumber,
          brand: row.brand,
          prefix: prefix,
          name: row.name,
          description: row.description,
          status: row.status || 'active',
          imageUrl: row.imageUrl || null,
          catalogUrl: row.catalogUrl || null,
          particleSize: row.particleSize ? parseFloat(row.particleSize) : null,
          poreSize: row.poreSize ? parseFloat(row.poreSize) : null,
          columnLength: row.columnLength ? parseFloat(row.columnLength) : null,
          innerDiameter: row.innerDiameter ? parseFloat(row.innerDiameter) : null,
          phaseType: row.phaseType || null,
          phMin: row.phMin ? parseFloat(row.phMin) : null,
          phMax: row.phMax ? parseFloat(row.phMax) : null,
          phRange: row.phRange || null,
          usp: row.usp || null,
          maxPressure: row.maxPressure || null,
          maxTemperature: row.maxTemperature || null,
        };
        
        let productDbId: number;
        
        if (existing.length > 0) {
          // 更新现有产品
          await db.update(products)
            .set(productData)
            .where(eq(products.productId, row.productId));
          updated++;
          productDbId = existing[0].id;
        } else {
          // 插入新产品
          const result = await db.insert(products).values(productData);
          inserted++;
          // 获取新插入产品的ID
          const newProduct = await db.select().from(products).where(eq(products.productId, row.productId)).limit(1);
          if (newProduct.length === 0) {
            throw new Error(`Failed to get inserted product ID for ${row.productId}`);
          }
          productDbId = newProduct[0].id;
        }
        
        // 检查产品分类关联是否已存在
        const existingCategory = await db.select()
          .from(productCategories)
          .where(and(
            eq(productCategories.productId, productDbId),
            eq(productCategories.categoryId, categoryId)
          ))
          .limit(1);
        
        if (existingCategory.length === 0) {
          // 添加产品分类关联
          await db.insert(productCategories).values({
            productId: productDbId,
            categoryId: categoryId,
          });
        }
        
      } catch (error) {
        console.error(`  Error processing product ${row.productId}:`, error);
        skipped++;
      }
    }
    
    console.log(`  Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}`);
    totalInserted += inserted;
    totalUpdated += updated;
    totalSkipped += skipped;
  }
  
  console.log(`\n=== Import Summary ===`);
  console.log(`Total Inserted: ${totalInserted}`);
  console.log(`Total Updated: ${totalUpdated}`);
  console.log(`Total Skipped: ${totalSkipped}`);
  console.log(`Total Processed: ${totalInserted + totalUpdated + totalSkipped}`);
}

importBrandCoverageData()
  .then(() => {
    console.log('\nImport completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });

