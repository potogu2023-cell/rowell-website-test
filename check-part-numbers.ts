import { db } from './server/db';
import { products } from './drizzle/schema';
import { sql } from 'drizzle-orm';

async function checkPartNumbers() {
  console.log('=== 检查产品Part Number ===\n');
  
  // 查询前20个产品
  const sampleProducts = await db
    .select({
      id: products.id,
      name: products.name,
      partNumber: products.partNumber,
      brand: products.brand,
    })
    .from(products)
    .limit(20);
  
  console.log('产品示例:');
  sampleProducts.forEach((p, i) => {
    console.log(`${i + 1}. ${p.brand} - ${p.name}`);
    console.log(`   Part Number: ${p.partNumber}\n`);
  });
  
  // 统计Part Number模式
  const partNumberPatterns = await db.execute(sql`
    SELECT 
      SUBSTRING(partNumber, 1, 5) as prefix,
      COUNT(*) as count
    FROM products
    WHERE partNumber IS NOT NULL
    GROUP BY prefix
    ORDER BY count DESC
    LIMIT 10
  `);
  
  console.log('\n=== Part Number前缀统计 ===');
  console.log(partNumberPatterns);
  
  process.exit(0);
}

checkPartNumbers().catch(console.error);
