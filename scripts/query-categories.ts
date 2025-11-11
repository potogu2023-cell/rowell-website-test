import { drizzle } from 'drizzle-orm/mysql2';
import { categories } from '../drizzle/schema';
import { asc } from 'drizzle-orm';

async function queryCategories() {
  const db = drizzle(process.env.DATABASE_URL!);
  
  const allCategories = await db.select().from(categories).orderBy(asc(categories.level), asc(categories.displayOrder));
  
  console.log('=== 当前分类结构 ===\n');
  console.log(`总分类数: ${allCategories.length}\n`);
  
  // 按层级分组
  const level1 = allCategories.filter(c => c.level === 1);
  const level2 = allCategories.filter(c => c.level === 2);
  
  console.log(`一级分类: ${level1.length}个`);
  console.log(`二级分类: ${level2.length}个\n`);
  
  console.log('=== 分类详情 ===\n');
  
  for (const cat1 of level1) {
    const children = level2.filter(c => c.parentId === cat1.id);
    console.log(`${cat1.id}. ${cat1.name} (${cat1.nameEn})`);
    console.log(`   Slug: ${cat1.slug}`);
    console.log(`   Visible: ${cat1.isVisible === 1 ? 'Yes' : 'No'}`);
    console.log(`   Children: ${children.length}`);
    
    for (const cat2 of children) {
      console.log(`   ├─ ${cat2.id}. ${cat2.name} (${cat2.nameEn})`);
      console.log(`      Slug: ${cat2.slug}, Visible: ${cat2.isVisible === 1 ? 'Yes' : 'No'}`);
    }
    console.log('');
  }
  
  process.exit(0);
}

queryCategories().catch(console.error);
