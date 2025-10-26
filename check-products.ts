import { getDb } from './server/db';
import { products, productCategories, categories } from './drizzle/schema';
import { eq, sql } from 'drizzle-orm';

async function checkProducts() {
  const db = await getDb();
  if (!db) {
    throw new Error('Database connection failed');
  }

  // 总产品数
  const totalProducts = await db.select({ count: sql<number>`count(*)` }).from(products);
  console.log(`\n📊 产品统计:`);
  console.log(`   总产品数: ${totalProducts[0].count}`);

  // 按品牌统计
  const brandStats = await db
    .select({
      brand: products.brand,
      count: sql<number>`count(*)`,
    })
    .from(products)
    .groupBy(products.brand)
    .orderBy(sql`count(*) DESC`);

  console.log(`\n📦 品牌统计:`);
  brandStats.forEach(stat => {
    console.log(`   ${stat.brand}: ${stat.count}`);
  });

  // 按分类统计
  const categoryStats = await db
    .select({
      categoryId: productCategories.categoryId,
      categoryName: categories.name,
      count: sql<number>`count(*)`,
    })
    .from(productCategories)
    .leftJoin(categories, eq(productCategories.categoryId, categories.id))
    .groupBy(productCategories.categoryId, categories.name)
    .orderBy(sql`count(*) DESC`);

  console.log(`\n🏷️  分类统计:`);
  categoryStats.forEach(stat => {
    console.log(`   ${stat.categoryName}: ${stat.count}`);
  });

  // 检查新导入的产品
  const gcProducts = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(sql`${products.productId} LIKE 'PHEN-ZB-%' OR ${products.productId} LIKE 'WATS-WAT2%' OR ${products.productId} LIKE 'AGIL-19091%'`);

  console.log(`\n🆕 新导入的GC产品（部分检查）: ${gcProducts[0].count}`);

  const guardProducts = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(sql`${products.productId} LIKE 'PHEN-Z-Guard-%' OR ${products.productId} LIKE 'WATS-WAT3%' OR ${products.productId} LIKE 'AGIL-5188-%'`);

  console.log(`🆕 新导入的Guard产品（部分检查）: ${guardProducts[0].count}`);

  console.log('\n✅ 数据验证完成！\n');
}

checkProducts().then(() => process.exit(0)).catch(err => {
  console.error('❌ 验证失败:', err);
  process.exit(1);
});
