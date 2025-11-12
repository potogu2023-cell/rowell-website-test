import { drizzle } from 'drizzle-orm/mysql2';
import { categories } from '../drizzle/schema';
import { eq, inArray } from 'drizzle-orm';

async function hideEmptyCategories() {
  const db = drizzle(process.env.DATABASE_URL!);
  
  console.log('=== 隐藏空分类 ===\n');
  
  // 需要隐藏的空分类ID列表
  const emptyCategoryIds = [
    32,  // Extraction Accessories
    42,  // Membrane Filters
    43,  // Filter Holders
    51,  // Glassware
    53,  // Storage
    112, // Preparative Columns
    113, // UHPLC Columns
    114, // Chiral Columns
    115, // Bio Columns
  ];
  
  console.log(`准备隐藏 ${emptyCategoryIds.length} 个空分类...`);
  
  // 获取这些分类的名称
  const categoriesToHide = await db.select()
    .from(categories)
    .where(inArray(categories.id, emptyCategoryIds));
  
  console.log('\n将隐藏以下分类:');
  categoriesToHide.forEach(cat => {
    console.log(`  - ${cat.name} (ID: ${cat.id})`);
  });
  
  // 隐藏这些分类
  await db.update(categories)
    .set({ isVisible: 0 })
    .where(inArray(categories.id, emptyCategoryIds));
  
  console.log(`\n✅ 已成功隐藏 ${emptyCategoryIds.length} 个空分类`);
  console.log('这些分类数据仍保留在数据库中，未来有产品时可以重新启用');
  
  process.exit(0);
}

hideEmptyCategories().catch(console.error);
