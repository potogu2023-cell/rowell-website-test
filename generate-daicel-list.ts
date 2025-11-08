import { drizzle } from 'drizzle-orm/mysql2';
import { products } from './drizzle/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';

const db = drizzle(process.env.DATABASE_URL!);

async function generateDaicelList() {
  console.log('\n=== 生成Daicel产品清单 ===\n');

  const daicelProducts = await db
    .select({
      productId: products.productId,
      partNumber: products.partNumber,
      brand: products.brand,
      name: products.name
    })
    .from(products)
    .where(eq(products.brand, 'Daicel'));

  console.log(`找到 ${daicelProducts.length} 个Daicel产品`);

  // Generate CSV
  const csvHeader = 'productId,partNumber,brand,name\n';
  const csvRows = daicelProducts.map(p => 
    `"${p.productId}","${p.partNumber}","${p.brand}","${p.name || ''}"`
  ).join('\n');

  const csvContent = csvHeader + csvRows;

  fs.writeFileSync('daicel_product_list_for_crawler.csv', csvContent, 'utf-8');

  console.log('\n✅ 产品清单已生成: daicel_product_list_for_crawler.csv');
  console.log(`   包含 ${daicelProducts.length} 个产品`);

  // Show sample products
  console.log('\n示例产品（前5个）:');
  daicelProducts.slice(0, 5).forEach(p => {
    console.log(`  - ${p.productId}: ${p.name || p.partNumber}`);
  });
}

generateDaicelList().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
