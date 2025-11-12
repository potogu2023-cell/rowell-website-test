import { drizzle } from 'drizzle-orm/mysql2';
import { categories } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

async function updateCategoryIcons() {
  const db = drizzle(process.env.DATABASE_URL!);
  
  console.log('=== 更新分类图标 ===\n');
  
  // 定义三个分类的图标路径
  const iconUpdates = [
    {
      name: 'Chromatography Columns',
      icon: '/icons/category-chromatography-columns.png',
      description: '色谱柱类产品，包括HPLC柱、GC柱、保护柱等'
    },
    {
      name: 'Chromatography Supplies',
      icon: '/icons/category-chromatography-supplies.png',
      description: '色谱耗材，包括样品瓶、注射器、管路配件等'
    },
    {
      name: 'Standards',
      icon: '/icons/category-standards-reagents.png',
      description: '标准品与试剂，用于色谱分析的参考物质和化学试剂'
    }
  ];
  
  console.log('准备更新以下分类的图标:\n');
  
  for (const update of iconUpdates) {
    // 查找分类
    const category = await db.select()
      .from(categories)
      .where(eq(categories.name, update.name))
      .limit(1);
    
    if (category.length === 0) {
      console.log(`⚠️  未找到分类: ${update.name}`);
      continue;
    }
    
    // 更新图标和描述
    await db.update(categories)
      .set({ 
        icon: update.icon,
        description: update.description
      })
      .where(eq(categories.name, update.name));
    
    console.log(`✅ ${update.name}`);
    console.log(`   图标: ${update.icon}`);
    console.log(`   描述: ${update.description}\n`);
  }
  
  console.log('=== 更新完成 ===');
  console.log('所有分类图标已成功更新到数据库');
  
  process.exit(0);
}

updateCategoryIcons().catch(console.error);
