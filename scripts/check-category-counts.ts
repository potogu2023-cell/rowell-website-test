import { drizzle } from 'drizzle-orm/mysql2';
import { categories, productCategories } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';

async function checkCategoryCounts() {
  const db = drizzle(process.env.DATABASE_URL!);
  
  // Get all categories with their product counts
  const result = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      parentId: categories.parentId,
      productCount: sql<number>`COUNT(DISTINCT ${productCategories.productId})`.as('productCount')
    })
    .from(categories)
    .leftJoin(productCategories, eq(categories.id, productCategories.categoryId))
    .groupBy(categories.id, categories.name, categories.slug, categories.parentId)
    .orderBy(categories.parentId, categories.id);
  
  // Organize by parent/child structure
  const parentCategories = result.filter(c => c.parentId === null);
  const childCategories = result.filter(c => c.parentId !== null);
  
  console.log('=== 分类产品数量统计 ===\n');
  
  let totalCategories = 0;
  let emptyCategoriesCount = 0;
  let emptyCategories: any[] = [];
  
  for (const parent of parentCategories) {
    const children = childCategories.filter(c => c.parentId === parent.id);
    const parentCount = Number(parent.productCount);
    
    console.log(`\n📁 ${parent.name} (${parentCount} 产品)`);
    totalCategories++;
    
    if (parentCount === 0) {
      emptyCategoriesCount++;
      emptyCategories.push({ name: parent.name, slug: parent.slug, level: 'parent' });
    }
    
    for (const child of children) {
      const childCount = Number(child.productCount);
      const status = childCount === 0 ? '❌' : '✅';
      console.log(`  ${status} ${child.name}: ${childCount} 产品`);
      totalCategories++;
      
      if (childCount === 0) {
        emptyCategoriesCount++;
        emptyCategories.push({ name: child.name, slug: child.slug, level: 'child', parent: parent.name });
      }
    }
  }
  
  console.log('\n\n=== 统计总结 ===');
  console.log(`总分类数: ${totalCategories}`);
  console.log(`有产品的分类: ${totalCategories - emptyCategoriesCount} (${((totalCategories - emptyCategoriesCount) / totalCategories * 100).toFixed(1)}%)`);
  console.log(`空分类数: ${emptyCategoriesCount} (${(emptyCategoriesCount / totalCategories * 100).toFixed(1)}%)`);
  
  if (emptyCategories.length > 0) {
    console.log('\n\n=== 空分类清单 ===');
    for (const cat of emptyCategories) {
      if (cat.level === 'parent') {
        console.log(`❌ ${cat.name} (父分类)`);
      } else {
        console.log(`  ❌ ${cat.name} (${cat.parent} 的子分类)`);
      }
    }
  } else {
    console.log('\n✅ 所有分类都有产品！');
  }
  
  process.exit(0);
}

checkCategoryCounts().catch(console.error);
