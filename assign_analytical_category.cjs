const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  
  const { products, productCategories } = require('./drizzle/schema');
  
  // Get all products
  const allProducts = await db.select({ id: products.id }).from(products);
  console.log(`Total products: ${allProducts.length}`);
  
  let count = 0;
  for (const product of allProducts) {
    try {
      await db.insert(productCategories).values({
        productId: product.id,
        categoryId: 111, // Analytical Columns
        createdAt: new Date(),
      });
      count++;
      if (count % 100 === 0) {
        console.log(`Assigned ${count}/${allProducts.length} products...`);
      }
    } catch (error) {
      // Ignore duplicate key errors
      if (!error.message.includes('duplicate')) {
        console.error(`Error assigning category to product ${product.id}:`, error.message);
      }
    }
  }
  
  console.log(`\nCompleted! Assigned Analytical Columns category to ${count} products.`);
  await pool.end();
}

main().catch(console.error);
