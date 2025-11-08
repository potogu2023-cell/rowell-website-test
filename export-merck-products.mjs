import { drizzle } from 'drizzle-orm/mysql2';
import { products } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';
import { writeFileSync } from 'fs';

const db = drizzle(process.env.DATABASE_URL);

const merckProducts = await db.select({
  id: products.id,
  productId: products.productId,
  partNumber: products.partNumber,
  name: products.name,
  productUrl: products.productUrl
}).from(products).where(eq(products.brand, 'Merck'));

console.log(`✅ Found ${merckProducts.length} Merck products`);

// Convert to CSV
const csvHeader = 'productId,partNumber,brand,name,catalogUrl\n';
const csvRows = merckProducts.map(p => 
  `"${p.productId}","${p.partNumber}","Merck","${(p.name || '').replace(/"/g, '""')}","${p.productUrl || ''}"`
).join('\n');

writeFileSync('merck_product_list_for_crawler.csv', csvHeader + csvRows);
console.log('✅ CSV file created: merck_product_list_for_crawler.csv');
console.log(`Total products: ${merckProducts.length}`);
