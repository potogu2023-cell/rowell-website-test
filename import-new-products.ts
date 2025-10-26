import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { getDb } from './server/db';
import { products, productCategories } from './drizzle/schema';
import { eq } from 'drizzle-orm';

interface CSVProduct {
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

// 品牌前缀映射
const brandPrefixMap: Record<string, string> = {
  'Phenomenex': 'PHEN',
  'Waters': 'WATS',
  'Agilent': 'AGIL',
  'Shimadzu': 'SHIM',
  'Thermo Fisher Scientific': 'THER',
  'YMC': 'YMC',
  'Daicel': 'DAIC',
  'Tosoh': 'TOSO',
  'Avantor': 'AVAN',
  'Merck': 'MERC',
  'TCI': 'TCI',
};

// 分类ID映射
const categoryMap: Record<string, number> = {
  'GC Column': 2, // GC Columns分类ID
  'Guard Column': 3, // Guard Columns分类ID
};

async function importProducts(csvFile: string, productType: 'GC Column' | 'Guard Column') {
  const db = await getDb();
  if (!db) {
    throw new Error('Database connection failed');
  }

  const productsToImport: CSVProduct[] = [];

  return new Promise<void>((resolve, reject) => {
    createReadStream(csvFile)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', (row: CSVProduct) => {
        productsToImport.push(row);
      })
      .on('end', async () => {
        console.log(`\n📦 开始导入 ${productType}...`);
        console.log(`总计: ${productsToImport.length} 个产品\n`);

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const product of productsToImport) {
          try {
            // 检查是否已存在
            const existing = await db
              .select()
              .from(products)
              .where(eq(products.productId, product.productId))
              .limit(1);

            if (existing.length > 0) {
              console.log(`⏭️  跳过已存在的产品: ${product.productId}`);
              skipCount++;
              continue;
            }

            // 获取品牌前缀
            const prefix = brandPrefixMap[product.brand];
            if (!prefix) {
              console.log(`❌ 未知品牌: ${product.brand} (${product.productId})`);
              errorCount++;
              continue;
            }

            // 准备插入数据
            const insertData: any = {
              productId: product.productId,
              partNumber: product.partNumber,
              brand: product.brand,
              prefix: prefix,
              name: product.name || '',
              description: product.description || '',
              status: product.status || 'active',
            };

            // 可选字段
            if (product.particleSize) {
              insertData.particleSize = product.particleSize;
              const num = parseFloat(product.particleSize);
              if (!isNaN(num)) insertData.particleSizeNum = Math.round(num * 10) / 10;
            }

            if (product.poreSize) {
              insertData.poreSize = product.poreSize;
              const num = parseFloat(product.poreSize);
              if (!isNaN(num)) insertData.poreSizeNum = Math.round(num);
            }

            if (product.columnLength) {
              insertData.columnLength = product.columnLength;
              const num = parseFloat(product.columnLength);
              if (!isNaN(num)) insertData.columnLengthNum = Math.round(num);
            }

            if (product.innerDiameter) {
              insertData.innerDiameter = product.innerDiameter;
              const num = parseFloat(product.innerDiameter);
              if (!isNaN(num)) insertData.innerDiameterNum = Math.round(num * 10) / 10;
            }

            if (product.phaseType) insertData.phaseType = product.phaseType;
            if (product.phRange) insertData.phRange = product.phRange;
            if (product.maxPressure) insertData.maxPressure = product.maxPressure;
            if (product.maxTemperature) insertData.maxTemperature = product.maxTemperature;
            if (product.usp) insertData.usp = product.usp;
            if (product.imageUrl) insertData.imageUrl = product.imageUrl;
            if (product.catalogUrl) insertData.catalogUrl = product.catalogUrl;

            // pH范围
            if (product.phMin) {
              const num = parseInt(product.phMin);
              if (!isNaN(num)) insertData.phMin = num;
            }
            if (product.phMax) {
              const num = parseInt(product.phMax);
              if (!isNaN(num)) insertData.phMax = num;
            }

            // 插入产品
            const result = await db.insert(products).values(insertData);
            const productDbId = Number(result.insertId);

            // 分配分类
            const categoryId = categoryMap[productType];
            if (categoryId && productDbId) {
              await db.insert(productCategories).values({
                productId: productDbId,
                categoryId: categoryId,
              });
            }

            console.log(`✅ 导入成功: ${product.productId} - ${product.name}`);
            successCount++;
          } catch (error: any) {
            console.log(`❌ 导入失败: ${product.productId} - ${error.message}`);
            errorCount++;
          }
        }

        console.log(`\n📊 导入统计 (${productType}):`);
        console.log(`   成功: ${successCount}`);
        console.log(`   跳过: ${skipCount}`);
        console.log(`   失败: ${errorCount}`);
        console.log(`   总计: ${productsToImport.length}\n`);

        resolve();
      })
      .on('error', reject);
  });
}

async function main() {
  console.log('🚀 开始导入新产品数据...\n');

  try {
    // 导入GC Columns
    await importProducts('./gc_columns.csv', 'GC Column');

    // 导入Guard Columns
    await importProducts('./guard_columns.csv', 'Guard Column');

    console.log('✅ 所有产品导入完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 导入失败:', error);
    process.exit(1);
  }
}

main();

