import { getDb } from "./server/db";
import { products } from "./drizzle/schema";
import { sql } from "drizzle-orm";

async function checkProductIds() {
  const db = await getDb();
  if (!db) {
    console.error("Cannot connect to database");
    process.exit(1);
  }

  const result = await db
    .select({
      minId: sql`MIN(CAST(productId AS UNSIGNED))`,
      maxId: sql`MAX(CAST(productId AS UNSIGNED))`,
      count: sql`COUNT(*)`,
    })
    .from(products);

  console.log("Product ID range:", result[0]);

  // Check specific IDs
  const testIds = ["245011", "245050", "245088", "245228", "245270"];
  for (const id of testIds) {
    const rows = await db
      .select()
      .from(products)
      .where(sql`productId = ${id}`)
      .limit(1);
    console.log(`Product ${id}: ${rows.length > 0 ? "EXISTS" : "NOT FOUND"}`);
  }

  process.exit(0);
}

checkProductIds();
