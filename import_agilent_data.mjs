import { drizzle } from 'drizzle-orm/mysql2';
import { products, productCategories } from './drizzle/schema.ts';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { eq } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

console.log('=== Agilent产品数据导入 ===\n');

// Read CSV
const csvContent = readFileSync('/home/ubuntu/upload/agilent_columns_crawl_results.csv', 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  bom: true // Handle BOM
});

console.log(`读取CSV文件: ${records.length}个产品`);

// Filter successful products only
const successProducts = records.filter(r => r.crawlStatus === 'success');
console.log(`成功爬取的产品: ${successProducts.length}个`);
console.log(`失败的产品: ${records.length - successProducts.length}个\n`);

// Prepare products for import
const productsToImport = [];
let skipped = 0;

for (const record of successProducts) {
  try {
    // Parse specifications JSON
    const specs = JSON.parse(record.specifications || '{}');
    
    // Extract common fields from specifications
    const particleSize = specs['Particle Size'] || null;
    const poreSize = specs['Pore Size'] || null;
    const columnLength = specs['Length'] || null;
    const innerDiameter = specs['Inner Diameter (ID)'] || specs['Inner Diameter'] || null;
    const usp = specs['USP Designation'] || null;
    const phaseType = specs['Phase'] || null;
    const filmThickness = specs['Film Thickness'] || null;
    const temperatureRange = specs['Temperature Range'] || null;
    const phRange = specs['pH Range'] || null;
    
    // Determine category based on product name/description
    let category = 'HPLC Columns'; // default
    const nameDesc = (record.name + ' ' + record.description).toLowerCase();
    if (nameDesc.includes('gc column') || nameDesc.includes('gas chromatography')) {
      category = 'GC Columns';
    } else if (nameDesc.includes('guard') || nameDesc.includes('vanguard')) {
      category = 'Guard Columns';
    }
    
    productsToImport.push({
      productId: record.productId,
      partNumber: record.partNumber,
      brand: 'Agilent',
      name: record.name,
      description: record.description || null,
      specifications: JSON.stringify(specs),
      particleSize,
      poreSize,
      columnLength,
      innerDiameter,
      usp,
      phaseType,
      filmThickness,
      temperatureRange,
      phRange,
      imageUrl: record.imageUrl || null,
      catalogUrl: record.catalogUrl || null,
      category // Store for later category association
    });
  } catch (error) {
    console.error(`跳过产品 ${record.partNumber}: ${error.message}`);
    skipped++;
  }
}

console.log(`准备导入: ${productsToImport.length}个产品`);
if (skipped > 0) {
  console.log(`跳过: ${skipped}个产品\n`);
}

// Check for existing Agilent products
const existingProducts = await db.select().from(products).where(eq(products.brand, 'Agilent'));
console.log(`数据库中现有Agilent产品: ${existingProducts.length}个`);

// Find duplicates
const existingPartNumbers = new Set(existingProducts.map(p => p.partNumber));
const newProducts = productsToImport.filter(p => !existingPartNumbers.has(p.partNumber));
const duplicates = productsToImport.length - newProducts.length;

console.log(`新产品: ${newProducts.length}个`);
console.log(`重复产品(将跳过): ${duplicates}个\n`);

if (newProducts.length === 0) {
  console.log('没有新产品需要导入!');
  process.exit(0);
}

// Import products in batches
console.log('开始导入产品...');
const batchSize = 100;
let imported = 0;

for (let i = 0; i < newProducts.length; i += batchSize) {
  const batch = newProducts.slice(i, i + batchSize);
  
  // Remove category field before inserting
  const batchToInsert = batch.map(({ category, ...rest }) => rest);
  
  try {
    await db.insert(products).values(batchToInsert);
    imported += batch.length;
    console.log(`✓ 已导入 ${imported}/${newProducts.length} 个产品`);
  } catch (error) {
    console.error(`批次导入失败: ${error.message}`);
    // Try inserting one by one
    for (const product of batchToInsert) {
      try {
        await db.insert(products).values(product);
        imported++;
      } catch (err) {
        console.error(`  跳过产品 ${product.partNumber}: ${err.message}`);
      }
    }
  }
}

console.log(`\n✓ 产品导入完成! 共导入 ${imported} 个产品`);

// Now associate products with categories
console.log('\n=== 关联产品到分类 ===\n');

// Get category IDs
const categoriesResult = await db.execute(`
  SELECT id, slug FROM categories 
  WHERE slug IN ('hplc-columns', 'gc-columns', 'guard-columns')
`);

const categoryMap = {};
for (const cat of categoriesResult[0]) {
  categoryMap[cat.slug] = cat.id;
}

console.log('分类映射:');
console.log(`  HPLC Columns: ID ${categoryMap['hplc-columns']}`);
console.log(`  GC Columns: ID ${categoryMap['gc-columns']}`);
console.log(`  Guard Columns: ID ${categoryMap['guard-columns']}\n`);

// Get imported product IDs
const importedProductIds = await db.execute(`
  SELECT id, partNumber FROM products 
  WHERE brand = 'Agilent' 
  AND partNumber IN (${newProducts.map(p => `'${p.partNumber}'`).join(',')})
`);

const productIdMap = {};
for (const p of importedProductIds[0]) {
  productIdMap[p.partNumber] = p.id;
}

// Create associations
const associations = [];
for (const product of newProducts) {
  const productId = productIdMap[product.partNumber];
  if (!productId) continue;
  
  let categoryId;
  if (product.category === 'GC Columns') {
    categoryId = categoryMap['gc-columns'];
  } else if (product.category === 'Guard Columns') {
    categoryId = categoryMap['guard-columns'];
  } else {
    categoryId = categoryMap['hplc-columns'];
  }
  
  if (categoryId) {
    associations.push({ productId, categoryId });
  }
}

console.log(`准备关联 ${associations.length} 个产品到分类...`);

// Insert associations in batches
let associated = 0;
for (let i = 0; i < associations.length; i += batchSize) {
  const batch = associations.slice(i, i + batchSize);
  
  try {
    await db.insert(productCategories).values(batch).onDuplicateKeyUpdate({
      set: { categoryId: batch[0].categoryId } // Dummy update
    });
    associated += batch.length;
    console.log(`✓ 已关联 ${associated}/${associations.length} 个产品`);
  } catch (error) {
    console.error(`批次关联失败: ${error.message}`);
  }
}

console.log(`\n✓ 分类关联完成! 共关联 ${associated} 个产品`);

// Summary
console.log('\n=== 导入总结 ===');
console.log(`总产品数: ${records.length}`);
console.log(`成功爬取: ${successProducts.length}`);
console.log(`新增产品: ${imported}`);
console.log(`关联分类: ${associated}`);
console.log(`\n✓ Agilent产品数据导入完成!`);
