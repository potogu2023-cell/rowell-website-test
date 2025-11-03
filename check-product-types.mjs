import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

const result = await db.execute(sql`
  SELECT productType, COUNT(*) as count
  FROM products
  GROUP BY productType
  ORDER BY count DESC
`);

console.log("\n=== Product Types Distribution ===\n");
result[0].forEach(row => {
  const type = row.productType || "(NULL)";
  console.log(`${type}: ${row.count} products`);
});

process.exit(0);
