const mysql = require('mysql2/promise');

async function exportMerck() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  const [rows] = await connection.execute(
    "SELECT productId, name, description, specifications FROM products WHERE brand = 'Merck'"
  );
  
  console.log(JSON.stringify(rows, null, 2));
  
  await connection.end();
}

exportMerck().catch(console.error);
