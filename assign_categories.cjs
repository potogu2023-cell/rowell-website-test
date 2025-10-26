const mysql = require('mysql2/promise');

async function assignCategories() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Get HPLC Columns category ID
    const [categories] = await connection.execute(
      "SELECT id FROM categories WHERE slug = 'hplc-columns' LIMIT 1"
    );
    
    if (categories.length === 0) {
      console.error('HPLC Columns category not found!');
      return;
    }
    
    const categoryId = categories[0].id;
    console.log(`HPLC Columns category ID: ${categoryId}`);
    
    // Get all products
    const [products] = await connection.execute(
      "SELECT id FROM products"
    );
    
    console.log(`Total products: ${products.length}`);
    
    // Insert product-category relationships
    let inserted = 0;
    for (const product of products) {
      try {
        await connection.execute(
          "INSERT IGNORE INTO product_categories (productId, categoryId, isPrimary) VALUES (?, ?, 1)",
          [product.id, categoryId]
        );
        inserted++;
        if (inserted % 100 === 0) {
          console.log(`Assigned ${inserted} products...`);
        }
      } catch (err) {
        console.error(`Failed to assign product ${product.id}:`, err.message);
      }
    }
    
    console.log(`\n✅ Successfully assigned ${inserted} products to HPLC Columns category!`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

assignCategories();
