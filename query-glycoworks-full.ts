import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: true }
  });
  
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM products WHERE part_number IN (?, ?)',
      ['186007239', '186007080']
    );
    
    console.log(JSON.stringify(rows, null, 2));
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
