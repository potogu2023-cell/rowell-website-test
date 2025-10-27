import { getDb } from "./server/db";
import { products } from "./drizzle/schema";

async function checkStatus() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Database not available");
    return;
  }

  const stats = await db.select().from(products);
  
  const totalProducts = stats.length;
  const withImages = stats.filter(p => p.imageUrl).length;
  const withCatalog = stats.filter(p => p.catalogUrl).length;
  const withDocs = stats.filter(p => p.technicalDocsUrl).length;

  console.log("📊 CURRENT DATABASE STATUS");
  console.log("=".repeat(60));
  console.log(`Total products: ${totalProducts}`);
  console.log(`Products with images: ${withImages} (${(withImages / totalProducts * 100).toFixed(1)}%)`);
  console.log(`Products with catalog URLs: ${withCatalog} (${(withCatalog / totalProducts * 100).toFixed(1)}%)`);
  console.log(`Products with technical docs: ${withDocs} (${(withDocs / totalProducts * 100).toFixed(1)}%)`);
  console.log("=".repeat(60));
}

checkStatus().then(() => process.exit(0));
