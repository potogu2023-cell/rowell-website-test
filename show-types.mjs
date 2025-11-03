import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

const result = await db.execute(sql`
  SELECT productType, COUNT(*) as count 
  FROM products 
  WHERE productType IS NOT NULL 
  GROUP BY productType 
  ORDER BY count DESC
`);

console.log("\n=== Product Types in Database ===\n");
result[0].forEach(row => {
  console.log(`${row.productType}: ${row.count} products`);
});

process.exit(0);
