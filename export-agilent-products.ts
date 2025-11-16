import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { products } from "./drizzle/schema";
import { writeFileSync } from "fs";

const db = drizzle(process.env.DATABASE_URL!);

async function exportAgilentProducts() {
  console.log("🔍 Exporting Agilent products...\n");

  const agilentProducts = await db
    .select({
      productId: products.productId,
      partNumber: products.partNumber,
      brand: products.brand,
      name: products.name,
      description: products.description,
      specifications: products.specifications,
      catalogUrl: products.catalogUrl,
    })
    .from(products)
    .where(eq(products.brand, "Agilent"));

  console.log(`📊 Found ${agilentProducts.length} Agilent products`);

  // Convert to CSV
  const csvHeader = "productId,partNumber,brand,name,catalogUrl,hasDescription,hasSpecifications\n";
  const csvRows = agilentProducts.map((p) => {
    const hasDesc = p.description && p.description.trim().length > 0 ? "Yes" : "No";
    const hasSpec = p.specifications && Object.keys(p.specifications).length > 0 ? "Yes" : "No";
    const url = p.catalogUrl || "";
    const name = (p.name || "").replace(/"/g, '""'); // Escape quotes
    return `"${p.productId}","${p.partNumber}","${p.brand}","${name}","${url}","${hasDesc}","${hasSpec}"`;
  }).join("\n");

  const csvContent = csvHeader + csvRows;
  
  writeFileSync("/home/ubuntu/agilent_product_list_for_crawler.csv", csvContent);
  console.log("✅ Exported to: /home/ubuntu/agilent_product_list_for_crawler.csv");

  // Statistics
  const withDesc = agilentProducts.filter(p => p.description && p.description.trim().length > 0).length;
  const withSpec = agilentProducts.filter(p => p.specifications && Object.keys(p.specifications).length > 0).length;
  const withUrl = agilentProducts.filter(p => p.catalogUrl && p.catalogUrl.trim().length > 0).length;

  console.log(`\n📊 Statistics:`);
  console.log(`   Total: ${agilentProducts.length}`);
  console.log(`   With description: ${withDesc} (${((withDesc / agilentProducts.length) * 100).toFixed(1)}%)`);
  console.log(`   With specifications: ${withSpec} (${((withSpec / agilentProducts.length) * 100).toFixed(1)}%)`);
  console.log(`   With catalogUrl: ${withUrl} (${((withUrl / agilentProducts.length) * 100).toFixed(1)}%)`);

  process.exit(0);
}

exportAgilentProducts().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
