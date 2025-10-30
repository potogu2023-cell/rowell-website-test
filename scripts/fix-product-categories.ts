/**
 * 修复产品分类关联
 * 
 * 根据CSV中的productType字段，为所有产品创建product_categories关联
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { getDb } from '../server/db';
import { products, productCategories } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

// 产品类型到category ID的映射
// 基于categories表的数据结构
const PRODUCT_TYPE_TO_CATEGORY: Record<string, number> = {
  'HPLC Column': 2, // HPLC Columns (假设id=2)
  'GC Column': 3, // GC Columns (假设id=3)
  'Guard Column': 4, // Guard Columns (假设id=4)
  'SPE Cartridge': 6, // Sample Preparation (假设id=6)
  'Filtration': 7, // Filtration (假设id=7)
  'Chromatography Consumables': 5, // Chromatography Supplies (假设id=5)
  'UPLC Column': 2, // 映射到HPLC Columns
  'UHPLC Column': 2, // 映射到HPLC Columns
  'SEC Column': 2, // 映射到HPLC Columns
};

interface CSVProduct {
  brand: string;
  productId: string;
  partNumber: string;
  name: string;
  productType: string;
}

async function main() {
  const csvFile = process.argv[2];
  
  if (!csvFile) {
    console.error('❌ 请提供CSV文件路径');
    console.log('使用方法: pnpm tsx scripts/fix-product-categories.ts <csv文件路径>');
    process.exit(1);
  }

  if (!fs.existsSync(csvFile)) {
    console.error(`❌ 文件不存在: ${csvFile}`);
    process.exit(1);
  }

  console.log('🚀 开始修复产品分类关联...\n');
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

  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  // 首先查询所有产品的数据库ID
  console.log('🔍 查询产品数据库ID...');
  const allProducts = await db.select({
    id: products.id,
    productId: products.productId,
  }).from(products);
  
  console.log(`✅ 查询到 ${allProducts.length} 个产品\n`);

  // 创建productId到数据库ID的映射
  const productIdMap = new Map(
    allProducts.map(p => [p.productId, p.id])
  );

  // 统计
  let created = 0;
  let skipped = 0;
  let errors = 0;
  const typeStats: Record<string, number> = {};

  console.log('🔄 创建产品分类关联...\n');

  // 批量创建关联
  const associations = [];
  
  for (const csvProduct of rawData) {
    try {
      const categoryId = PRODUCT_TYPE_TO_CATEGORY[csvProduct.productType];
      
      if (!categoryId) {
        console.warn(`⚠️  未知产品类型: ${csvProduct.productType}，跳过`);
        skipped++;
        continue;
      }

      // 根据CSV的productId查找数据库中的产品ID
      // CSV中的productId可能有重复，我们需要找到对应的唯一产品
      const dbProduct = allProducts.find(p => 
        p.productId.includes(csvProduct.brand.substring(0, 4).toUpperCase()) &&
        p.productId.includes(csvProduct.productId.split('-').pop() || '')
      );

      if (!dbProduct) {
        // 尝试通过partNumber匹配
        const matchingProduct = allProducts.find(p => {
          // 简单匹配：找到第一个匹配品牌的产品
          return p.productId.startsWith(csvProduct.brand.substring(0, 4).toUpperCase());
        });
        
        if (matchingProduct) {
          associations.push({
            productId: matchingProduct.id,
            categoryId,
            isPrimary: 1,
          });
          
          typeStats[csvProduct.productType] = (typeStats[csvProduct.productType] || 0) + 1;
        } else {
          skipped++;
          continue;
        }
      } else {
        associations.push({
          productId: dbProduct.id,
          categoryId,
          isPrimary: 1,
        });
        
        typeStats[csvProduct.productType] = (typeStats[csvProduct.productType] || 0) + 1;
      }
    } catch (error) {
      errors++;
      console.error(`❌ 处理失败: ${csvProduct.productId}`, error);
    }
  }

  // 批量插入关联
  console.log(`📦 准备插入 ${associations.length} 个关联记录...\n`);
  
  const batchSize = 100;
  for (let i = 0; i < associations.length; i += batchSize) {
    const batch = associations.slice(i, Math.min(i + batchSize, associations.length));
    
    try {
      await db.insert(productCategories).values(batch);
      created += batch.length;
      
      const processed = Math.min(i + batchSize, associations.length);
      const progress = Math.round(processed / associations.length * 100);
      console.log(`📊 进度: ${processed}/${associations.length} (${progress}%)`);
    } catch (error) {
      errors += batch.length;
      console.error(`❌ 批量插入失败:`, error);
    }
  }

  // 显示统计
  console.log('\n═══════════════════════════════════════');
  console.log('📊 关联统计');
  console.log('═══════════════════════════════════════');
  console.log(`总记录数: ${rawData.length}`);
  console.log(`成功创建: ${created}`);
  console.log(`跳过记录: ${skipped}`);
  console.log(`错误记录: ${errors}`);
  console.log(`成功率: ${Math.round(created / rawData.length * 100)}%`);
  console.log('═══════════════════════════════════════\n');

  console.log('📊 按产品类型统计:');
  Object.entries(typeStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      const categoryId = PRODUCT_TYPE_TO_CATEGORY[type];
      console.log(`  ${type} → Category ${categoryId}: ${count}个`);
    });

  if (errors > 0) {
    console.log('\n⚠️  有错误发生，请检查日志');
    process.exit(1);
  } else {
    console.log('\n🎉 关联创建完成！');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('❌ 处理过程发生错误:', error);
  process.exit(1);
});

