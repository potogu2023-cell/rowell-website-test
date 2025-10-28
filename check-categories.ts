import { getDb } from './server/db';

async function checkCategories() {
  const db = await getDb();
  if (!db) {
    console.error('无法连接数据库');
    process.exit(1);
  }

  console.log('=== 所有分类信息 ===\n');
  
  const query = `
    SELECT id, name, slug, parentId
    FROM categories
    ORDER BY parentId, id
  `;
  
  const result: any = await db.execute(query);
  console.table(result[0]);
  
  console.log('\n=== 各分类的产品数量 ===\n');
  
  const statsQuery = `
    SELECT 
      c.id,
      c.name,
      c.slug,
      c.parentId,
      COUNT(pc.productId) as product_count
    FROM categories c
    LEFT JOIN product_categories pc ON c.id = pc.categoryId
    GROUP BY c.id, c.name, c.slug, c.parentId
    HAVING product_count > 0
    ORDER BY product_count DESC
  `;
  
  const stats: any = await db.execute(statsQuery);
  console.table(stats[0]);
}

checkCategories().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
