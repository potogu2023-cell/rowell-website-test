import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { products } from './drizzle/schema.ts';
import fs from 'fs';

const db = drizzle(process.env.DATABASE_URL);

console.log('Querying Phenomenex products...');
const phenomenexProducts = await db.select().from(products).where(eq(products.brand, 'Phenomenex'));

console.log(`Total Phenomenex products: ${phenomenexProducts.length}`);

// Create CSV content
const csvHeaders = 'productId,partNumber,brand,name\n';
const csvRows = phenomenexProducts.map(p => 
  `"${p.productId}","${p.partNumber}","${p.brand}","${p.name.replace(/"/g, '""')}"`
).join('\n');

const csvContent = csvHeaders + csvRows;

// Save to file
fs.writeFileSync('phenomenex_product_list_for_crawler.csv', csvContent, 'utf8');

console.log('\n✅ CSV file created: phenomenex_product_list_for_crawler.csv');
console.log(`   Total products: ${phenomenexProducts.length}`);

// Show sample
console.log('\nSample products (first 5):');
phenomenexProducts.slice(0, 5).forEach(p => {
  console.log(`- ${p.productId}: ${p.name}`);
});

process.exit(0);
