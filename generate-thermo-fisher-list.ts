import { drizzle } from 'drizzle-orm/mysql2';
import { products } from './drizzle/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';

const db = drizzle(process.env.DATABASE_URL!);

async function generateThermoFisherList() {
  // Query Thermo Fisher Scientific products
  const thermoProducts = await db
    .select({
      productId: products.productId,
      partNumber: products.partNumber,
      brand: products.brand,
      name: products.name
    })
    .from(products)
    .where(eq(products.brand, 'Thermo Fisher Scientific'));
  
  console.log('Found ' + thermoProducts.length + ' Thermo Fisher Scientific products');
  
  // Generate CSV
  const csvHeader = 'productId,partNumber,brand,name\n';
  const csvRows = thermoProducts.map(p => 
    `${p.productId},${p.partNumber},${p.brand},"${p.name.replace(/"/g, '""')}"`
  ).join('\n');
  
  const csvContent = csvHeader + csvRows;
  
  // Save to file
  fs.writeFileSync('thermo_fisher_product_list_for_crawler.csv', csvContent);
  
  console.log('CSV file generated: thermo_fisher_product_list_for_crawler.csv');
  console.log('Total products: ' + thermoProducts.length);
  
  // Show first 5 products as sample
  console.log('\nSample products:');
  thermoProducts.slice(0, 5).forEach(p => {
    console.log(`  - ${p.productId}: ${p.name}`);
  });
}

generateThermoFisherList().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
