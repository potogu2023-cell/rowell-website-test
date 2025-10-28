import { drizzle } from 'drizzle-orm/mysql2';
import { productCategories, categories } from './drizzle/schema';
import { sql } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL!);

async function checkMappings() {
  console.log('=== 检查产品分类映射状态 ===\n');
  
  // 查询所有分类ID及其产品数量
  const result = await db.execute(sql`
    SELECT 
      pc.categoryId,
      c.name as category_name,
      c.slug,
      COUNT(*) as product_count
    FROM product_categories pc
    LEFT JOIN categories c ON pc.categoryId = c.id
    GROUP BY pc.categoryId, c.name, c.slug
    ORDER BY product_count DESC
  `);
  
  console.log('分类映射统计:');
  console.table(result);
  
  // 查询未映射的产品数量
  const unmapped = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM products p
    LEFT JOIN product_categories pc ON p.id = pc.productId
    WHERE pc.productId IS NULL
  `);
  
  console.log(`\n未映射产品数: ${(unmapped as any[])[0].count}`);
}

checkMappings().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('错误:', err);
  process.exit(1);
});
