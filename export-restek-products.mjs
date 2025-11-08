import { drizzle } from 'drizzle-orm/mysql2';
import { products } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';
import { createWriteStream } from 'fs';

const db = drizzle(process.env.DATABASE_URL);

async function exportRestekProducts() {
  console.log('Querying Restek products from database...');
  
  const restekProducts = await db
    .select({
      productId: products.productId,
      partNumber: products.partNumber,
      name: products.name,
      brand: products.brand,
      catalogUrl: products.catalogUrl
    })
    .from(products)
    .where(eq(products.brand, 'Restek'));
  
  console.log(`Found ${restekProducts.length} Restek products`);
  
  // Create CSV
  const csvStream = createWriteStream('restek_product_list_for_crawler.csv');
  
  // Write header
  csvStream.write('productId,partNumber,brand,name,catalogUrl\n');
  
  // Write data
  for (const product of restekProducts) {
    const row = [
      product.productId,
      product.partNumber,
      product.brand,
      `"${(product.name || '').replace(/"/g, '""')}"`,
      product.catalogUrl || ''
    ].join(',');
    csvStream.write(row + '\n');
  }
  
  csvStream.end();
  
  console.log('✅ CSV file created: restek_product_list_for_crawler.csv');
  console.log(`Total products: ${restekProducts.length}`);
}

exportRestekProducts().catch(console.error);
