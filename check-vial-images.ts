import { getDb } from './server/db';

async function checkVialImages() {
  const db = await getDb();
  if (!db) {
    console.error('无法连接数据库');
    process.exit(1);
  }

  const query = `
    SELECT p.id, p.name, p.imageUrl 
    FROM products p
    INNER JOIN product_categories pc ON p.id = pc.productId
    WHERE pc.categoryId = 21
    LIMIT 10
  `;
  
  const result: any = await db.execute(query);
  const rows = result[0];
  
  console.log('=== Vials & Caps产品图片URL ===\n');
  rows.forEach((row: any) => {
    console.log(`ID: ${row.id}`);
    console.log(`Name: ${row.name}`);
    console.log(`ImageURL: ${row.imageUrl}`);
    console.log('---');
  });
  
  // 统计imageUrl分布
  const urlCounts: Record<string, number> = {};
  rows.forEach((row: any) => {
    const url = row.imageUrl || 'NULL';
    urlCounts[url] = (urlCounts[url] || 0) + 1;
  });
  
  console.log('\n=== ImageURL统计 ===');
  Object.entries(urlCounts).forEach(([url, count]) => {
    console.log(`${url}: ${count}`);
  });
}

checkVialImages().then(() => process.exit(0)).catch(err => {
  console.error('错误:', err);
  process.exit(1);
});
