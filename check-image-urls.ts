import { getDb } from "./server/db";
import { products } from "./drizzle/schema";

async function checkImageUrls() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Database not available");
    return;
  }

  const sampleProducts = await db
    .select()
    .from(products)
    .limit(10);

  console.log("📊 Sample Product Image URLs:");
  console.log("=".repeat(80));
  
  for (const product of sampleProducts) {
    console.log(`Product ID: ${product.productId}`);
    console.log(`Name: ${product.name}`);
    console.log(`Image URL: ${product.imageUrl || 'NULL'}`);
    console.log(`Catalog URL: ${product.catalogUrl || 'NULL'}`);
    console.log("-".repeat(80));
  }
}

checkImageUrls().then(() => process.exit(0));
