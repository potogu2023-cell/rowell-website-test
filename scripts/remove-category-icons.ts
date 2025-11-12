import { drizzle } from 'drizzle-orm/mysql2';
import { categories } from '../drizzle/schema';

async function removeCategoryIcons() {
  const db = drizzle(process.env.DATABASE_URL!);
  
  console.log('=== 移除所有分类图标 ===\n');
  
  // 将所有分类的icon字段设置为null
  await db.update(categories)
    .set({ icon: null });
  
  console.log('✅ 已移除所有分类图标');
  console.log('   所有分类现在显示一致，无图标');
  
  process.exit(0);
}

removeCategoryIcons().catch(console.error);
