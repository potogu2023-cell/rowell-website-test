/**
 * 导入完整的色谱产品数据（1,063个产品）
 * 
 * 功能：
 * 1. 读取chromatography_products_complete_final.csv
 * 2. 清理和标准化数据
 * 3. 映射到数据库schema
 * 4. 批量导入（替换所有旧数据）
 * 5. 显示导入进度和统计
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { getDb } from '../server/db';
import { products } from '../drizzle/schema';
import { sql } from 'drizzle-orm';

// 品牌前缀映射
const BRAND_PREFIX_MAP: Record<string, string> = {
  'Waters': 'WATS',
  'Agilent': 'AGIL',
  'Phenomenex': 'PHEN',
  'Thermo Fisher Scientific': 'THER',
  'Thermo Fisher': 'THER',
  'Shimadzu': 'SHIM',
  'Merck': 'MERC',
  'Restek': 'REST',
  'ACE': 'ACE',
  'Avantor': 'AVAN',
  'Daicel': 'DAIC',
  'Develosil': 'DEVE',
};

// 产品类型映射到category ID
const PRODUCT_TYPE_MAP: Record<string, number> = {
  'HPLC Column': 1,
  'GC Column': 2,
  'Guard Column': 3,
  'SPE Cartridge': 4,
  'Filtration': 5,
  'Chromatography Consumables': 6,
  'UPLC Column': 1, // 映射到HPLC Column
  'UHPLC Column': 1, // 映射到HPLC Column
  'SEC Column': 1, // 映射到HPLC Column
};

interface CSVProduct {
  brand: string;
  productId: string;
  partNumber: string;
  name: string;
  series?: string;
  phaseType?: string;
  particleSize?: string;
  columnLength?: string;
  innerDiameter?: string;
  poreSize?: string;
  productType: string;
  application?: string;
  status: string;
  price?: string;
  sorbentMass?: string;
  cartridgeVolume?: string;
  membraneType?: string;
  diameter?: string;
  material?: string;
  volume?: string;
  consumableType?: string;
  mode?: string;
  filmThickness?: string;
  polarity?: string;
  separationType?: string;
}

interface ImportStats {
  total: number;
  inserted: number;
  skipped: number;
  errors: number;
  by_brand: Record<string, number>;
  by_type: Record<string, number>;
}

async function main() {
  const csvFile = process.argv[2];
  
  if (!csvFile) {
    console.error('❌ 请提供CSV文件路径');
    console.log('使用方法: pnpm tsx scripts/import-complete-data.ts <csv文件路径>');
    process.exit(1);
  }

  if (!fs.existsSync(csvFile)) {
    console.error(`❌ 文件不存在: ${csvFile}`);
    process.exit(1);
  }

  console.log('🚀 开始导入完整产品数据...\n');
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

  // 清空现有数据
  console.log('🗑️  清空现有产品数据...');
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }
  
  await db.delete(products);
  console.log('✅ 现有数据已清空\n');

  // 导入数据
  const stats = await importProducts(rawData, db);

  // 显示统计
  console.log('\n═══════════════════════════════════════');
  console.log('📊 导入统计');
  console.log('═══════════════════════════════════════');
  console.log(`总记录数: ${stats.total}`);
  console.log(`成功导入: ${stats.inserted}`);
  console.log(`跳过记录: ${stats.skipped}`);
  console.log(`错误记录: ${stats.errors}`);
  console.log(`成功率: ${Math.round(stats.inserted / stats.total * 100)}%`);
  console.log('═══════════════════════════════════════\n');

  console.log('📊 按品牌统计:');
  Object.entries(stats.by_brand)
    .sort((a, b) => b[1] - a[1])
    .forEach(([brand, count]) => {
      console.log(`  ${brand}: ${count}个`);
    });

  console.log('\n📊 按产品类型统计:');
  Object.entries(stats.by_type)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}个`);
    });

  if (stats.errors > 0) {
    console.log('\n⚠️  有错误发生，请检查日志');
    process.exit(1);
  } else {
    console.log('\n🎉 导入完成！');
    process.exit(0);
  }
}

async function importProducts(rawData: CSVProduct[], db: any): Promise<ImportStats> {
  const stats: ImportStats = {
    total: rawData.length,
    inserted: 0,
    skipped: 0,
    errors: 0,
    by_brand: {},
    by_type: {},
  };

  console.log('🔄 开始导入数据...\n');

  // 批量处理，每批100条
  const batchSize = 100;
  const allProducts = [];

  for (let i = 0; i < rawData.length; i++) {
    const product = rawData[i];
    
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

      // 解析数值字段
      const particleSize = product.particleSize ? parseFloat(product.particleSize) : null;
      const poreSize = product.poreSize ? parseFloat(product.poreSize) : null;
      const columnLength = product.columnLength ? parseFloat(product.columnLength) : null;
      const innerDiameter = product.innerDiameter ? parseFloat(product.innerDiameter) : null;

      // 构建产品数据
      const productData = {
        productId: product.productId,
        partNumber: product.partNumber,
        name: product.name,
        brand: product.brand,
        prefix,
        category,
        description: product.name,
        detailedDescription: product.application || null,
        specifications: product.series || null,
        particleSize,
        poreSize,
        columnLength,
        innerDiameter,
        phaseType: product.phaseType || null,
        phRange: null,
        phMin: null,
        phMax: null,
        maxPressure: null,
        maxTemperature: null,
        usp: null,
        applications: product.application || null,
        imageUrl: null,
        catalogUrl: null,
        technicalDocsUrl: null,
        status: product.status || 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      allProducts.push(productData);

      // 统计
      stats.by_brand[product.brand] = (stats.by_brand[product.brand] || 0) + 1;
      stats.by_type[product.productType] = (stats.by_type[product.productType] || 0) + 1;

    } catch (error) {
      stats.errors++;
      console.error(`❌ 处理失败: ${product.productId}`, error);
    }
  }

  // 批量插入
  console.log(`📦 准备批量插入 ${allProducts.length} 个产品...\n`);
  
  for (let i = 0; i < allProducts.length; i += batchSize) {
    const batch = allProducts.slice(i, Math.min(i + batchSize, allProducts.length));
    
    try {
      await db.insert(products).values(batch);
      stats.inserted += batch.length;
      
      const processed = Math.min(i + batchSize, allProducts.length);
      const progress = Math.round(processed / allProducts.length * 100);
      console.log(`📊 进度: ${processed}/${allProducts.length} (${progress}%)`);
    } catch (error) {
      stats.errors += batch.length;
      console.error(`❌ 批量插入失败:`, error);
    }
  }

  return stats;
}

main().catch((error) => {
  console.error('❌ 导入过程发生错误:', error);
  process.exit(1);
});

