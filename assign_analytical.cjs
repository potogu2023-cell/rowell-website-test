const mysql = require('mysql2/promise');

async function assignAnalyticalCategory() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Get all products
    const [products] = await connection.execute("SELECT id FROM products");
    console.log(`Total products: ${products.length}`);
    
    // Insert product-category relationships for Analytical Columns (ID=111)
    let inserted = 0;
    for (const product of products) {
      try {
        await connection.execute(
          "INSERT IGNORE INTO product_categories (productId, categoryId, isPrimary, createdAt) VALUES (?, ?, 0, NOW())",
          [product.id, 111]
        );
        inserted++;
        if (inserted % 100 === 0) {
          console.log(`Assigned ${inserted} products...`);
        }
      } catch (err) {
        console.error(`Failed to assign product ${product.id}:`, err.message);
      }
    }
    
    console.log(`\n✅ Successfully assigned ${inserted} products to Analytical Columns category!`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

assignAnalyticalCategory();
