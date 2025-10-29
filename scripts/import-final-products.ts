/**
 * 导入最终修复的产品数据
 * 
 * 功能：
 * 1. 读取products_final_ready.csv
 * 2. 批量导入到数据库（每批100条）
 * 3. 显示导入进度和统计
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { getDb } from '../server/db';
import { products } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

// 品牌前缀映射
const BRAND_PREFIX_MAP: Record<string, string> = {
  'Waters': 'WATS',
  'Agilent': 'AGIL',
  'Phenomenex': 'PHEN',
  'Thermo Fisher Scientific': 'THER',
  'Shimadzu': 'SHIM',
  'Merck': 'MERC',
  'Restek': 'REST',
  'ACE': 'ACE',
  'Avantor': 'AVAN',
  'Daicel': 'DAIC',
  'Develosil': 'DEVE',
};

// 产品类型映射
const PRODUCT_TYPE_MAP: Record<string, number> = {
  'HPLC Column': 1,
  'GC Column': 2,
  'Guard Column': 3,
  'SPE Cartridge': 4,
  'Filtration': 5,
  'Chromatography Consumables': 6,
};

interface CSVProduct {
  productId: string;
  partNumber: string;
  name: string;
  brand: string;
  productType: string;
  particleSize?: string;
  poreSize?: string;
  columnLength?: string;
  innerDiameter?: string;
  phaseType?: string;
  phRange?: string;
  status: string;
}

interface ImportStats {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
}

async function main() {
  const csvFile = process.argv[2];
  
  if (!csvFile) {
    console.error('❌ 请提供CSV文件路径');
    console.log('使用方法: pnpm tsx scripts/import-final-products.ts <csv文件路径>');
    process.exit(1);
  }

  if (!fs.existsSync(csvFile)) {
    console.error(`❌ 文件不存在: ${csvFile}`);
    process.exit(1);
  }

  console.log('🚀 开始导入产品数据...\n');
  console.log(`📁 CSV文件: ${csvFile}\n`);

  // 读取CSV文件
  console.log('📖 读取CSV文件...');
  const csvContent = fs.readFileSync(csvFile, 'utf-8');
  const rawData: CSVProduct[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  console.log(`✅ 读取完成，共 ${rawData.length} 条记录\n`);

  // 导入数据
  const stats = await importProducts(rawData);

  // 显示统计
  console.log('\n═══════════════════════════════════════');
  console.log('📊 导入统计');
  console.log('═══════════════════════════════════════');
  console.log(`总记录数: ${stats.total}`);
  console.log(`新增产品: ${stats.inserted}`);
  console.log(`更新产品: ${stats.updated}`);
  console.log(`跳过记录: ${stats.skipped}`);
  console.log(`错误记录: ${stats.errors}`);
  console.log(`成功率: ${Math.round((stats.inserted + stats.updated) / stats.total * 100)}%`);
  console.log('═══════════════════════════════════════\n');

  if (stats.errors > 0) {
    console.log('⚠️  有错误发生，请检查日志');
    process.exit(1);
  } else {
    console.log('🎉 导入完成！');
    process.exit(0);
  }
}

async function importProducts(rawData: CSVProduct[]): Promise<ImportStats> {
  const stats: ImportStats = {
    total: rawData.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  console.log('🔄 开始导入数据...\n');

  // 批量处理，每批100条
  const batchSize = 100;
  for (let i = 0; i < rawData.length; i += batchSize) {
    const batch = rawData.slice(i, Math.min(i + batchSize, rawData.length));
    
    for (const product of batch) {
      try {
        // 获取品牌前缀和分类ID
        const prefix = BRAND_PREFIX_MAP[product.brand];
        const category = PRODUCT_TYPE_MAP[product.productType];

        if (!prefix) {
          console.warn(`⚠️  未知品牌: ${product.brand}，跳过`);
          stats.skipped++;
          continue;
        }

        if (!category) {
          console.warn(`⚠️  未知产品类型: ${product.productType}，跳过`);
          stats.skipped++;
          continue;
        }

        // 解析pH范围
        let phMin: number | null = null;
        let phMax: number | null = null;
        if (product.phRange) {
          const match = product.phRange.match(/(\d+\.?\d*)-(\d+\.?\d*)/);
          if (match) {
            phMin = parseFloat(match[1]);
            phMax = parseFloat(match[2]);
          }
        }

        // 解析数值字段
        const particleSize = product.particleSize ? parseFloat(product.particleSize) : null;
        const poreSize = product.poreSize ? parseFloat(product.poreSize) : null;
        const columnLength = product.columnLength ? parseFloat(product.columnLength) : null;
        const innerDiameter = product.innerDiameter ? parseFloat(product.innerDiameter) : null;

        // 检查产品是否已存在
        const existing = await db
          .select()
          .from(products)
          .where(eq(products.productId, product.productId))
          .limit(1);

        const productData = {
          productId: product.productId,
          partNumber: product.partNumber,
          name: product.name,
          brand: product.brand,
          prefix,
          category,
          description: product.name,
          detailedDescription: null,
          specifications: null,
          particleSize: particleSize,
          poreSize: poreSize,
          columnLength: columnLength,
          innerDiameter: innerDiameter,
          phaseType: product.phaseType || null,
          phRange: product.phRange || null,
          phMin,
          phMax,
          maxPressure: null,
          maxTemperature: null,
          usp: null,
          applications: null,
          imageUrl: null,
          catalogUrl: null,
          technicalDocsUrl: null,
          status: product.status,
          updatedAt: new Date(),
        };

        if (existing.length > 0) {
          // 更新现有产品
          await db
            .update(products)
            .set(productData)
            .where(eq(products.productId, product.productId));
          
          stats.updated++;
        } else {
          // 插入新产品
          await db.insert(products).values({
            ...productData,
            createdAt: new Date(),
          });
          
          stats.inserted++;
        }
      } catch (error) {
        stats.errors++;
        console.error(`❌ 导入失败: ${product.productId}`, error);
      }
    }

    // 显示进度
    const processed = Math.min(i + batchSize, rawData.length);
    const progress = Math.round(processed / rawData.length * 100);
    console.log(`📊 进度: ${processed}/${rawData.length} (${progress}%) - 新增:${stats.inserted} 更新:${stats.updated}`);
  }

  return stats;
}

main().catch((error) => {
  console.error('❌ 导入过程发生错误:', error);
  process.exit(1);
});

