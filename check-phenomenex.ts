import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema';
import { sql } from 'drizzle-orm';

async function checkPhenomenex() {
  const dbUrl = process.env.DATABASE_URL!;
  const connection = await mysql.createConnection({
    uri: dbUrl.replace('?ssl=true', ''),
    ssl: { rejectUnauthorized: true }
  });
  
  const db = drizzle(connection, { schema, mode: 'default' });

  // Check Phenomenex products
  const phenomenexProducts = await db.execute(sql`
    SELECT partNumber, name 
    FROM products 
    WHERE brand = 'Phenomenex' 
    LIMIT 10
  `);
  
  console.log('Phenomenex products in database:');
  console.log(phenomenexProducts[0]);
  
  await connection.end();
}

checkPhenomenex().catch(console.error);
