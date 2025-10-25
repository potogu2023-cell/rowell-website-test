import { getDb } from './server/db';
import fs from 'fs';

async function main() {
  console.log('导出产品数据...');
  
  const db = await getDb();
  
  const products = await db.execute('SELECT id, productId, partNumber, brand, prefix, name, description, status FROM products ORDER BY brand, productId');
  
  console.log(`✓ 导出 ${products.rows.length} 个产品`);
  
  fs.writeFileSync('/home/ubuntu/all_products_final.json', JSON.stringify(products.rows, null, 2));
  
  console.log('✓ 保存到: /home/ubuntu/all_products_final.json');
  console.log('✅ 导出完成！');
  
  process.exit(0);
}

main().catch(console.error);
