import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { products } from './drizzle/schema';
import * as fs from 'fs';

const db = drizzle(process.env.DATABASE_URL!);

async function generateWatersProductList() {
  console.log('Querying Waters products from database...');
  
  const watersProducts = await db
    .select({
      productId: products.productId,
      partNumber: products.partNumber,
      brand: products.brand,
      name: products.name,
    })
    .from(products)
    .where(eq(products.brand, 'Waters'));
  
  console.log(`Found ${watersProducts.length} Waters products`);
  
  // Generate CSV
  const csvHeader = 'productId,partNumber,brand,name\n';
  const csvRows = watersProducts.map(p => 
    `${p.productId},"${p.partNumber}","${p.brand}","${p.name?.replace(/"/g, '""') || ''}"`
  ).join('\n');
  
  const csvContent = csvHeader + csvRows;
  
  // Save to file
  const filename = 'waters_product_list_for_crawler.csv';
  fs.writeFileSync(filename, csvContent, 'utf-8');
  
  console.log(`✅ Generated ${filename} with ${watersProducts.length} products`);
  
  // Show first 5 products as examples
  console.log('\nFirst 5 products:');
  watersProducts.slice(0, 5).forEach(p => {
    console.log(`  - ${p.productId}: ${p.name}`);
  });
}

generateWatersProductList().catch(console.error);
