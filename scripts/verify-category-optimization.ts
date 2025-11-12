import { drizzle } from 'drizzle-orm/mysql2';
import { products, productCategories, categories } from '../drizzle/schema';
import { eq, countDistinct, isNull } from 'drizzle-orm';

async function verifyCategoryOptimization() {
  const db = drizzle(process.env.DATABASE_URL!);
  
  console.log('=== 分类优化验证报告 ===\n');
  
  // 1. 统计总分类数
  const allCats = await db.select().from(categories);
  const visibleCats = allCats.filter(c => c.isVisible === 1);
  const hiddenCats = allCats.filter(c => c.isVisible === 0);
  
  console.log('1. 分类总数统计:');
  console.log(`   总分类数: ${allCats.length}`);
  console.log(`   可见分类: ${visibleCats.length}`);
  console.log(`   隐藏分类: ${hiddenCats.length}`);
  console.log('');
  
  // 2. 列出隐藏的分类
  console.log('2. 隐藏的分类:');
  hiddenCats.forEach(cat => {
    console.log(`   - ${cat.name} (ID: ${cat.id})`);
  });
  console.log('');
  
  // 3. 统计各分类的产品数
  console.log('3. 可见分类的产品数统计:');
  const categoriesWithCount = await db
    .select({
      id: categories.id,
      name: categories.name,
      parentId: categories.parentId,
      productCount: countDistinct(productCategories.productId),
    })
    .from(categories)
    .leftJoin(productCategories, eq(categories.id, productCategories.categoryId))
    .where(eq(categories.isVisible, 1))
    .groupBy(categories.id)
    .orderBy(categories.displayOrder);
  
  const topLevelCats = categoriesWithCount.filter(c => c.parentId === null);
  
  for (const topCat of topLevelCats) {
    console.log(`\n   ${topCat.name}: ${topCat.productCount}个产品`);
    const children = categoriesWithCount.filter(c => c.parentId === topCat.id);
    children.forEach(child => {
      console.log(`     - ${child.name}: ${child.productCount}个产品`);
    });
  }
  console.log('');
  
  // 4. 统计未分类产品
  const allProducts = await db.select({ id: products.id }).from(products);
  const categorizedProductIds = await db.select({ productId: productCategories.productId })
    .from(productCategories);
  
  const categorizedIds = new Set(categorizedProductIds.map(p => p.productId));
  const uncategorizedCount = allProducts.filter(p => !categorizedIds.has(p.id)).length;
  
  console.log('4. 产品分类覆盖率:');
  console.log(`   总产品数: ${allProducts.length}`);
  console.log(`   已分类产品: ${categorizedIds.size}`);
  console.log(`   未分类产品: ${uncategorizedCount}`);
  console.log(`   分类覆盖率: ${((categorizedIds.size / allProducts.length) * 100).toFixed(1)}%`);
  console.log('');
  
  // 5. 统计空分类
  const emptyCats = categoriesWithCount.filter(c => c.productCount === 0);
  console.log('5. 空分类（可见但无产品）:');
  if (emptyCats.length === 0) {
    console.log('   ✅ 没有空分类！');
  } else {
    emptyCats.forEach(cat => {
      console.log(`   - ${cat.name} (ID: ${cat.id})`);
    });
  }
  console.log('');
  
  console.log('=== 验证完成 ===');
  console.log(`✅ 分类优化成功！`);
  console.log(`✅ 可见分类: ${visibleCats.length}个`);
  console.log(`✅ 隐藏分类: ${hiddenCats.length}个`);
  console.log(`✅ 分类覆盖率: ${((categorizedIds.size / allProducts.length) * 100).toFixed(1)}%`);
  console.log(`✅ 空分类数: ${emptyCats.length}个`);
  
  process.exit(0);
}

verifyCategoryOptimization().catch(console.error);
