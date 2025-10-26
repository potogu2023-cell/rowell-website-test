import { getDb } from './server/db';
import { categories } from './drizzle/schema';

async function checkCategories() {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  const allCategories = await db.select().from(categories);
  
  console.log('\n📂 所有分类:');
  allCategories.forEach(cat => {
    console.log(`   ID: ${cat.id}, Name: ${cat.name}, Parent: ${cat.parentId}, Display: ${cat.displayInNav}`);
  });
  
  console.log('\n');
}

checkCategories().then(() => process.exit(0)).catch(err => {
  console.error('❌ 错误:', err);
  process.exit(1);
});
