const mysql = require('mysql2/promise');

async function queryProducts() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    const [rows] = await connection.execute(
      "SELECT id, name, brand, particleSize, poreSize, size, phMin, phMax, description FROM products LIMIT 10"
    );
    
    console.log(JSON.stringify(rows, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

queryProducts();
