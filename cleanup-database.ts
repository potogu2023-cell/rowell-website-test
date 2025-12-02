import { drizzle } from 'drizzle-orm/mysql2';
import { eq, inArray, sql } from 'drizzle-orm';
import { products } from './drizzle/schema';
import * as fs from 'fs';

const db = drizzle(process.env.DATABASE_URL!);

// 6个已验证品牌
const VERIFIED_BRANDS = [
  'Shimadzu',
  'Agilent',
  'Thermo Fisher Scientific',
  'Daicel',
  'Phenomenex',
  'Develosil'
];

async function cleanupDatabase() {
  console.log('='.repeat(80));
  console.log('数据库清洗工具 - Rowell HPLC产品数据库');
  console.log('='.repeat(80));
  console.log();

  // Step 1: 分析当前数据库状态
  console.log('步骤 1: 分析当前数据库状态');
  console.log('-'.repeat(80));

  const totalResult = await db.select({ count: sql<number>`count(*)` }).from(products);
  const totalCount = Number(totalResult[0].count);
  console.log(`总产品数: ${totalCount}`);
  console.log();

  const brandResult = await db.select({
    brand: products.brand,
    count: sql<number>`count(*)`
  }).from(products).groupBy(products.brand);

  console.log('品牌分布:');
  let verifiedCount = 0;
  let unverifiedCount = 0;
  const unverifiedBrands: string[] = [];

  for (const row of brandResult) {
    const brand = row.brand;
    const count = Number(row.count);
    const isVerified = VERIFIED_BRANDS.includes(brand);
    
    if (isVerified) {
      console.log(`  ✅ ${brand}: ${count} (已验证)`);
      verifiedCount += count;
    } else {
      console.log(`  ❌ ${brand}: ${count} (未验证，将删除)`);
      unverifiedCount += count;
      unverifiedBrands.push(brand);
    }
  }

  console.log();
  console.log(`已验证产品总数: ${verifiedCount}`);
  console.log(`未验证产品总数: ${unverifiedCount}`);
  console.log();

  // Step 2: 备份数据库
  console.log('步骤 2: 备份当前数据库');
  console.log('-'.repeat(80));

  const allProducts = await db.select().from(products);
  const backupFilename = `products_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(backupFilename, JSON.stringify(allProducts, null, 2));
  console.log(`✅ 备份完成: ${backupFilename}`);
  console.log(`   备份产品数: ${allProducts.length}`);
  console.log();

  // Step 3: 删除未验证品牌的产品
  if (unverifiedBrands.length > 0) {
    console.log('步骤 3: 删除未验证品牌的产品');
    console.log('-'.repeat(80));
    console.log(`将删除以下品牌: ${unverifiedBrands.join(', ')}`);
    console.log(`预计删除产品数: ${unverifiedCount}`);
    console.log();

    const deleteResult = await db.delete(products)
      .where(inArray(products.brand, unverifiedBrands));

    console.log(`✅ 删除完成`);
    console.log();
  } else {
    console.log('步骤 3: 无需删除');
    console.log('-'.repeat(80));
    console.log('✅ 数据库中只有已验证品牌，无需删除');
    console.log();
  }

  // Step 4: 验证最终状态
  console.log('步骤 4: 验证最终数据库状态');
  console.log('-'.repeat(80));

  const finalTotalResult = await db.select({ count: sql<number>`count(*)` }).from(products);
  const finalTotalCount = Number(finalTotalResult[0].count);
  console.log(`最终产品总数: ${finalTotalCount}`);
  console.log();

  const finalBrandResult = await db.select({
    brand: products.brand,
    count: sql<number>`count(*)`
  }).from(products).groupBy(products.brand).orderBy(products.brand);

  console.log('最终品牌分布:');
  for (const row of finalBrandResult) {
    console.log(`  ${row.brand}: ${Number(row.count)}`);
  }
  console.log();

  // Step 5: 生成报告
  console.log('='.repeat(80));
  console.log('清洗结果总结');
  console.log('='.repeat(80));
  console.log(`清洗前总产品数: ${totalCount}`);
  console.log(`删除产品数: ${unverifiedCount}`);
  console.log(`清洗后总产品数: ${finalTotalCount}`);
  console.log();

  const expectedCount = 2411;
  if (finalTotalCount === expectedCount) {
    console.log(`✅ 成功！产品数量符合预期 (${expectedCount})`);
  } else {
    console.log(`⚠️  警告：产品数量与预期不符`);
    console.log(`   预期: ${expectedCount}`);
    console.log(`   实际: ${finalTotalCount}`);
    console.log(`   差异: ${finalTotalCount - expectedCount}`);
  }
  console.log();

  const expectedBrands = 6;
  if (finalBrandResult.length === expectedBrands) {
    console.log(`✅ 成功！品牌数量符合预期 (${expectedBrands})`);
  } else {
    console.log(`⚠️  警告：品牌数量与预期不符`);
    console.log(`   预期: ${expectedBrands}`);
    console.log(`   实际: ${finalBrandResult.length}`);
  }
  console.log();

  console.log('='.repeat(80));
  console.log('数据库清洗完成！');
  console.log('='.repeat(80));
}

cleanupDatabase()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('错误:', err);
    process.exit(1);
  });
