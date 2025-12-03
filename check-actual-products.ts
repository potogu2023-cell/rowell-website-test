import { getDb } from "./server/db";
import { products } from "./drizzle/schema";
import { sql } from "drizzle-orm";

async function checkActualProducts() {
  const db = await getDb();
  if (!db) {
    console.error("Cannot connect to database");
    process.exit(1);
  }

  // Get sample products
  console.log("\n=== Sample Products (first 10) ===");
  const sampleProducts = await db.select().from(products).limit(10);
  sampleProducts.forEach((p) => {
    console.log(`ID: ${p.productId}, Part#: ${p.partNumber}, Brand: ${p.brand}, Name: ${p.name?.substring(0, 50)}`);
  });

  // Check if productId contains "245" prefix
  console.log("\n=== Products with ID containing '245' ===");
  const products245 = await db
    .select()
    .from(products)
    .where(sql`productId LIKE '%245%'`)
    .limit(10);
  console.log(`Found ${products245.length} products with '245' in ID`);
  products245.forEach((p) => {
    console.log(`ID: ${p.productId}, Part#: ${p.partNumber}, Brand: ${p.brand}`);
  });

  // Check Thermo Fisher products (should be in batch 9)
  console.log("\n=== Thermo Fisher Scientific Products (first 10) ===");
  const thermoProducts = await db
    .select()
    .from(products)
    .where(sql`brand = 'Thermo Fisher Scientific'`)
    .limit(10);
  thermoProducts.forEach((p) => {
    console.log(`ID: ${p.productId}, Part#: ${p.partNumber}, Name: ${p.name?.substring(0, 50)}`);
  });

  // Check Daicel products (should be in batch 9)
  console.log("\n=== Daicel Products (first 10) ===");
  const daicelProducts = await db
    .select()
    .from(products)
    .where(sql`brand = 'Daicel'`)
    .limit(10);
  daicelProducts.forEach((p) => {
    console.log(`ID: ${p.productId}, Part#: ${p.partNumber}, Name: ${p.name?.substring(0, 50)}`);
  });

  process.exit(0);
}

checkActualProducts();
