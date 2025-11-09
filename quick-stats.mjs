import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

const total = await db.execute(sql`SELECT COUNT(*) as count FROM products`);
const byBrand = await db.execute(sql`SELECT brand, COUNT(*) as count FROM products GROUP BY brand ORDER BY count DESC LIMIT 15`);
const recentUpdates = await db.execute(sql`SELECT COUNT(*) as count FROM products WHERE updatedAt >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`);

console.log("\n=== Database Statistics ===\n");
console.log(`Total products: ${total[0][0].count}`);
console.log(`\nRecent updates (last hour): ${recentUpdates[0][0].count}`);
console.log("\nTop brands:");
byBrand[0].forEach(row => console.log(`  ${row.brand}: ${row.count}`));

process.exit(0);
