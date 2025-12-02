import { drizzle } from 'drizzle-orm/mysql2';
import { eq, sql, desc } from 'drizzle-orm';
import { products } from './drizzle/schema';
import * as fs from 'fs';

const db = drizzle(process.env.DATABASE_URL!);

// 目标产品数量分布（基于您确认的2,411个已验证产品）
const TARGET_COUNTS = {
  'Shimadzu': 856,
  'Agilent': 620,
  'Thermo Fisher Scientific': 366,
  'Daicel': 277,
  'Phenomenex': 247,
  'Develosil': 45
};

const TOTAL_TARGET = 2411;

async function cleanupTo2411() {
  console.log('='.repeat(80));
  console.log('数据库精确清洗 - 目标: 2,411个产品');
  console.log('='.repeat(80));
  console.log();

  // Step 1: 检查当前状态
  console.log('步骤 1: 检查当前数据库状态');
  console.log('-'.repeat(80));

  const currentBrandCounts = await db.select({
    brand: products.brand,
    count: sql<number>`count(*)`
  }).from(products).groupBy(products.brand);

  console.log('当前品牌分布:');
  let currentTotal = 0;
  const excessByBrand: { [key: string]: number } = {};

  for (const row of currentBrandCounts) {
    const brand = row.brand;
    const currentCount = Number(row.count);
    const targetCount = TARGET_COUNTS[brand] || 0;
    const excess = currentCount - targetCount;
    
    currentTotal += currentCount;
    excessByBrand[brand] = excess;
    
    const status = excess > 0 ? `(多 ${excess})` : excess < 0 ? `(少 ${Math.abs(excess)})` : '(正确)';
    console.log(`  ${brand}: ${currentCount} / ${targetCount} ${status}`);
  }

  console.log();
  console.log(`当前总数: ${currentTotal}`);
  console.log(`目标总数: ${TOTAL_TARGET}`);
  console.log(`需删除: ${currentTotal - TOTAL_TARGET}`);
  console.log();

  // Step 2: 计划删除策略
  console.log('步骤 2: 计划删除策略');
  console.log('-'.repeat(80));

  const deletionPlan: { brand: string; deleteCount: number }[] = [];
  let totalToDelete = 0;

  for (const [brand, excess] of Object.entries(excessByBrand)) {
    if (excess > 0) {
      deletionPlan.push({ brand, deleteCount: excess });
      totalToDelete += excess;
      console.log(`  ${brand}: 删除 ${excess} 个产品`);
    }
  }

  console.log();
  console.log(`计划删除总数: ${totalToDelete}`);
  console.log();

  if (totalToDelete === 0) {
    console.log('✅ 数据库已经符合目标，无需删除');
    return;
  }

  // Step 3: 执行删除
  console.log('步骤 3: 执行删除操作');
  console.log('-'.repeat(80));

  for (const plan of deletionPlan) {
    console.log(`正在处理 ${plan.brand}...`);
    
    // 获取该品牌的所有产品，按ID降序排列（删除最新添加的）
    const brandProducts = await db.select({
      id: products.id,
      partNumber: products.partNumber
    })
    .from(products)
    .where(eq(products.brand, plan.brand))
    .orderBy(desc(products.id))
    .limit(plan.deleteCount);

    console.log(`  找到 ${brandProducts.length} 个产品待删除`);
    
    if (brandProducts.length > 0) {
      const idsToDelete = brandProducts.map(p => p.id);
      
      // 删除这些产品
      await db.delete(products)
        .where(sql`id IN (${sql.join(idsToDelete.map(id => sql`${id}`), sql`, `)})`);
      
      console.log(`  ✅ 已删除 ${brandProducts.length} 个产品`);
      
      // 记录被删除的产品
      const deletedLog = brandProducts.map(p => ({
        id: p.id,
        partNumber: p.partNumber,
        brand: plan.brand
      }));
      
      const logFile = `deleted_products_${plan.brand.replace(/\s+/g, '_')}_${Date.now()}.json`;
      fs.writeFileSync(logFile, JSON.stringify(deletedLog, null, 2));
      console.log(`  📝 删除记录已保存: ${logFile}`);
    }
    
    console.log();
  }

  // Step 4: 验证最终结果
  console.log('步骤 4: 验证最终结果');
  console.log('-'.repeat(80));

  const finalBrandCounts = await db.select({
    brand: products.brand,
    count: sql<number>`count(*)`
  }).from(products).groupBy(products.brand).orderBy(products.brand);

  console.log('最终品牌分布:');
  let finalTotal = 0;
  let allCorrect = true;

  for (const row of finalBrandCounts) {
    const brand = row.brand;
    const finalCount = Number(row.count);
    const targetCount = TARGET_COUNTS[brand] || 0;
    const match = finalCount === targetCount;
    
    finalTotal += finalCount;
    
    const status = match ? '✅' : '❌';
    console.log(`  ${status} ${brand}: ${finalCount} / ${targetCount}`);
    
    if (!match) {
      allCorrect = false;
    }
  }

  console.log();
  console.log(`最终总数: ${finalTotal}`);
  console.log(`目标总数: ${TOTAL_TARGET}`);
  console.log();

  // Step 5: 总结
  console.log('='.repeat(80));
  console.log('清洗结果总结');
  console.log('='.repeat(80));
  
  if (finalTotal === TOTAL_TARGET && allCorrect) {
    console.log('✅ 成功！数据库已精确清洗到2,411个产品');
    console.log('✅ 所有品牌的产品数量都符合目标');
  } else {
    console.log('⚠️  警告：清洗结果与目标不符');
    console.log(`   目标总数: ${TOTAL_TARGET}`);
    console.log(`   实际总数: ${finalTotal}`);
    console.log(`   差异: ${finalTotal - TOTAL_TARGET}`);
  }
  
  console.log();
  console.log('='.repeat(80));
  console.log('数据库清洗完成！');
  console.log('='.repeat(80));
}

cleanupTo2411()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('错误:', err);
    process.exit(1);
  });
