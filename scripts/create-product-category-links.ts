/**
 * 为所有产品创建分类关联
 * 
 * 策略：
 * 1. 查询所有产品
 * 2. 根据产品名称判断产品类型
 * 3. 批量创建product_categories关联
 */

import { getDb } from '../server/db';
import { products, productCategories, categories } from '../drizzle/schema';

// 产品类型关键词映射到category ID
// 基于实际数据库中的分类结构
const detectProductType = (name: string): number | null => {
  const nameLower = name.toLowerCase();
  
  // Guard Column - 保护柱
  if (nameLower.includes('guard') || nameLower.includes('vanguard') || nameLower.includes('securityguard')) {
    return 13; // Guard Columns (ID 13)
  }
  
  // SPE Cartridge - 固相萃取柱
  if (nameLower.includes('oasis') || nameLower.includes('strata') || nameLower.includes('bond elut') || 
      nameLower.includes('spe') || nameLower.includes('extraction')) {
    return 31; // SPE Cartridges (ID 31)
  }
  
  // Filtration - 过滤产品
  if (nameLower.includes('filter') || nameLower.includes('syringe filter') || nameLower.includes('membrane')) {
    return 41; // Syringe Filters (ID 41)
  }
  
  // Chromatography Consumables - 色谱耗材（vials等）
  if (nameLower.includes('vial') || nameLower.includes('cap') || nameLower.includes('septa') || 
      nameLower.includes('insert') || nameLower.includes('ferrule')) {
    return 21; // Vials & Caps (ID 21)
  }
  
  // GC Column - 气相色谱柱
  if (nameLower.includes('gc') || nameLower.includes('gas chromatography') || 
      nameLower.includes('zebron') || nameLower.includes('rtx') || nameLower.includes('stabilwax')) {
    return 12; // GC Columns (ID 12)
  }
  
  // HPLC/UPLC/UHPLC Column - 液相色谱柱（默认）
  // 包含各种系列名称
  if (nameLower.includes('hplc') || nameLower.includes('uplc') || nameLower.includes('uhplc') ||
      nameLower.includes('column') || nameLower.includes('acquity') || nameLower.includes('zorbax') ||
      nameLower.includes('luna') || nameLower.includes('kinetex') || nameLower.includes('hypersil') ||
      nameLower.includes('shim-pack') || nameLower.includes('develosil') || nameLower.includes('chiralpak') ||
      nameLower.includes('excel') || nameLower.includes('ascentis') || nameLower.includes('c18') ||
      nameLower.includes('c8') || nameLower.includes('c30') || nameLower.includes('phenyl')) {
    return 11; // HPLC Columns (ID 11)
  }
  
  // 默认返回HPLC Columns
  return 11;
};

async function main() {
  console.log('🚀 开始创建产品分类关联...\n');

  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  // 查询所有分类
  console.log('📋 查询分类信息...');
  const allCategories = await db.select().from(categories);
  console.log(`✅ 找到 ${allCategories.length} 个分类\n`);
  
  allCategories.forEach(cat => {
    console.log(`  ID ${cat.id}: ${cat.name} (${cat.nameEn}) - slug: ${cat.slug}`);
  });
  console.log('');

  // 查询所有产品
  console.log('🔍 查询所有产品...');
  const allProducts = await db.select({
    id: products.id,
    productId: products.productId,
    name: products.name,
    brand: products.brand,
  }).from(products);
  
  console.log(`✅ 找到 ${allProducts.length} 个产品\n`);

  // 统计
  let created = 0;
  let errors = 0;
  const typeStats: Record<number, number> = {};

  console.log('🔄 创建分类关联...\n');

  // 批量创建关联
  const associations = [];
  
  for (const product of allProducts) {
    try {
      const categoryId = detectProductType(product.name || '');
      
      if (!categoryId) {
        console.warn(`⚠️  无法确定产品类型: ${product.productId} - ${product.name}`);
        continue;
      }

      associations.push({
        productId: product.id,
        categoryId,
        isPrimary: 1,
      });
      
      typeStats[categoryId] = (typeStats[categoryId] || 0) + 1;
    } catch (error) {
      errors++;
      console.error(`❌ 处理失败: ${product.productId}`, error);
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
  console.log(`总产品数: ${allProducts.length}`);
  console.log(`成功创建: ${created}`);
  console.log(`错误记录: ${errors}`);
  console.log(`成功率: ${Math.round(created / allProducts.length * 100)}%`);
  console.log('═══════════════════════════════════════\n');

  console.log('📊 按分类统计:');
  Object.entries(typeStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([catId, count]) => {
      const category = allCategories.find(c => c.id === parseInt(catId));
      console.log(`  Category ${catId} (${category?.nameEn}): ${count}个产品`);
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

