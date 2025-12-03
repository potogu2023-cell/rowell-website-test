import { getDb } from "./server/db";
import { products } from "./drizzle/schema";
import { sql } from "drizzle-orm";

async function checkProductDetails() {
  const db = await getDb();
  if (!db) {
    console.error("Cannot connect to database");
    process.exit(1);
  }

  const productId = "THER-17126-102130";

  console.log(`\n=== Checking product: ${productId} ===\n`);

  const rows = await db
    .select()
    .from(products)
    .where(sql`productId = ${productId}`)
    .limit(1);

  if (rows.length === 0) {
    console.log(`❌ Product ${productId} not found in database`);
  } else {
    const product = rows[0];
    console.log("✅ Product found:");
    console.log(`  ID: ${product.id}`);
    console.log(`  Product ID: ${product.productId}`);
    console.log(`  Slug: ${product.slug}`);
    console.log(`  Part Number: ${product.partNumber}`);
    console.log(`  Brand: ${product.brand}`);
    console.log(`  Name: ${product.name?.substring(0, 80)}...`);
    console.log(`  Image URL: ${product.imageUrl || "NOT SET"}`);
    console.log(`  Category: ${product.category}`);
    console.log(`  Product Type: ${product.productType}`);
  }

  // Check a few more products from batch 9
  console.log(`\n=== Checking other batch 9 products ===\n`);
  const testIds = ["AGIL-699968-301", "DAIC-80511", "DAIC-88523"];
  for (const id of testIds) {
    const rows = await db
      .select()
      .from(products)
      .where(sql`productId = ${id}`)
      .limit(1);
    if (rows.length > 0) {
      console.log(
        `✅ ${id}: imageUrl = ${rows[0].imageUrl ? "SET" : "NOT SET"}`
      );
    } else {
      console.log(`❌ ${id}: NOT FOUND`);
    }
  }

  process.exit(0);
}

checkProductDetails();
