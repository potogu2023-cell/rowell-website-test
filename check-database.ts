import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema';
import { sql } from 'drizzle-orm';

async function checkDatabase() {
  const dbUrl = process.env.DATABASE_URL!;
  const connection = await mysql.createConnection({
    uri: dbUrl.replace('?ssl=true', ''),
    ssl: { rejectUnauthorized: true }
  });
  
  const db = drizzle(connection, { schema, mode: 'default' });

  console.log('=== 检查数据库中的品牌名称 ===\n');
  
  // 查询所有品牌及其产品数量
  const brandCounts = await db.execute(sql`
    SELECT brand, COUNT(*) as count 
    FROM products 
    GROUP BY brand 
    ORDER BY count DESC
  `);
  
  console.log('品牌列表及产品数量:');
  console.log(brandCounts[0]);
  
  console.log('\n=== 检查AI画图团队的品牌名称匹配 ===\n');
  
  // AI画图团队使用的品牌名称
  const aiBrands = [
    'YMC', 'Tosoh', 'Waters', 'Agilent', 'Thermo Fisher', 
    'Phenomenex', 'Shimadzu', 'Merck', 'Avantor', 'Daicel'
  ];
  
  for (const brand of aiBrands) {
    const count = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM products 
      WHERE brand = ${brand}
    `);
    console.log(`${brand}: ${(count[0] as any)[0].count} 个产品`);
  }
  
  console.log('\n=== 检查Part Number示例 ===\n');
  
  // 查询Waters品牌的前5个产品
  const watersProducts = await db.execute(sql`
    SELECT productId, partNumber, name, imageUrl 
    FROM products 
    WHERE brand = 'Waters' 
    LIMIT 5
  `);
  
  console.log('Waters品牌产品示例:');
  console.log(watersProducts[0]);
  
  await connection.end();
}

checkDatabase().catch(console.error);
