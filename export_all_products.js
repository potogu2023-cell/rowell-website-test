const { drizzle } = require('drizzle-orm/mysql2');
const { products } = require('./drizzle/schema');
const fs = require('fs');

async function exportProducts() {
  const db = drizzle(process.env.DATABASE_URL);
  const allProducts = await db.select({
    productId: products.productId,
    partNumber: products.partNumber,
    brand: products.brand,
    name: products.name,
    description: products.description
  }).from(products);
  
  fs.writeFileSync('/home/ubuntu/all_products_for_collection.json', JSON.stringify(allProducts, null, 2));
  console.log(`Exported ${allProducts.length} products`);
}

exportProducts().catch(console.error);
