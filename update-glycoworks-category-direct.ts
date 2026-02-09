import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function updateCategories() {
  console.log('🔄 Updating GlycoWorks products category...');
  
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  try {
    // Update product 1
    const [result1] = await connection.execute(
      'UPDATE products SET category_id = ? WHERE partNumber = ?',
      [31, '186007239']
    );
    console.log('✅ Updated WATS-186007239:', result1);
    
    // Update product 2
    const [result2] = await connection.execute(
      'UPDATE products SET category_id = ? WHERE partNumber = ?',
      [31, '186007080']
    );
    console.log('✅ Updated WATS-186007080:', result2);
    
    // Verify updates
    const [rows] = await connection.execute(
      'SELECT id, partNumber, name, category_id FROM products WHERE partNumber IN (?, ?)',
      ['186007239', '186007080']
    );
    console.log('\n📋 Verification:');
    console.log(rows);
    
  } finally {
    await connection.end();
  }
}

updateCategories().catch(console.error);
