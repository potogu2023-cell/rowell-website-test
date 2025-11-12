import { drizzle } from 'drizzle-orm/mysql2';
import { categories, productCategories } from '../drizzle/schema';
import { eq, countDistinct } from 'drizzle-orm';

async function verifyFrontendDisplay() {
  const db = drizzle(process.env.DATABASE_URL!);
  
  console.log('=== 前台展示验证报告 ===\n');
  
  // 1. 获取所有可见分类及其产品数
  const visibleCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      parentId: categories.parentId,
      icon: categories.icon,
      productCount: countDistinct(productCategories.productId),
    })
    .from(categories)
    .leftJoin(productCategories, eq(categories.id, productCategories.categoryId))
    .where(eq(categories.isVisible, 1))
    .groupBy(categories.id)
    .orderBy(categories.displayOrder);
  
  console.log('1. 可见分类列表:\n');
  
  const topLevel = visibleCategories.filter(c => c.parentId === null);
  
  for (const top of topLevel) {
    const iconStatus = top.icon ? '✅ 有图标' : '❌ 无图标';
    console.log(`${top.name}: ${top.productCount}个产品 ${iconStatus}`);
    
    const children = visibleCategories.filter(c => c.parentId === top.id);
    children.forEach(child => {
      const childIconStatus = child.icon ? '✅' : '❌';
      console.log(`  - ${child.name}: ${child.productCount}个产品 ${childIconStatus}`);
    });
    console.log('');
  }
  
  // 2. 统计图标情况
  const withIcon = visibleCategories.filter(c => c.icon);
  const withoutIcon = visibleCategories.filter(c => !c.icon);
  
  console.log('\n2. 图标统计:');
  console.log(`   有图标: ${withIcon.length}个分类`);
  console.log(`   无图标: ${withoutIcon.length}个分类`);
  console.log('');
  
  if (withIcon.length > 0) {
    console.log('   有图标的分类:');
    withIcon.forEach(c => {
      console.log(`     - ${c.name}: ${c.icon}`);
    });
  }
  
  // 3. 验证产品总数
  const totalProducts = visibleCategories.reduce((sum, c) => {
    if (c.parentId === null) return sum + c.productCount;
    return sum;
  }, 0);
  
  console.log(`\n3. 产品总数统计:`);
  console.log(`   通过分类统计: ${totalProducts}个`);
  console.log(`   (注意：一个产品可能属于多个分类)`);
  
  process.exit(0);
}

verifyFrontendDisplay().catch(console.error);
