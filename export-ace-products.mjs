import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { products } from './drizzle/schema.ts';
import { createWriteStream } from 'fs';

const db = drizzle(process.env.DATABASE_URL);

async function exportACEProducts() {
  console.log('Querying ACE products...');
  
  const aceProducts = await db
    .select({
      productId: products.id,
      partNumber: products.partNumber,
      brand: products.brand,
      name: products.name,
      catalogUrl: products.catalogUrl,
    })
    .from(products)
    .where(eq(products.brand, 'ACE'));

  console.log(`Found ${aceProducts.length} ACE products`);

  // Write to CSV
  const csvStream = createWriteStream('ace_product_list_for_crawler.csv');
  
  // Write header
  csvStream.write('productId,partNumber,brand,name,catalogUrl\n');
  
  // Write data
  for (const product of aceProducts) {
    const row = [
      product.productId,
      `"${(product.partNumber || '').replace(/"/g, '""')}"`,
      `"${(product.brand || '').replace(/"/g, '""')}"`,
      `"${(product.name || '').replace(/"/g, '""')}"`,
      `"${(product.catalogUrl || '').replace(/"/g, '""')}"`
    ].join(',');
    csvStream.write(row + '\n');
  }
  
  csvStream.end();
  
  console.log('✅ Export completed: ace_product_list_for_crawler.csv');
  console.log(`Total products: ${aceProducts.length}`);
}

exportACEProducts().catch(console.error);
