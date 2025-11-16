import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { products } from "./drizzle/schema";
import { writeFileSync } from "fs";

const db = drizzle(process.env.DATABASE_URL!);

async function exportDevelosilProducts() {
  console.log("🔍 Exporting Develosil products...\n");

  const develosilProducts = await db
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
    .where(eq(products.brand, "Develosil"));

  console.log(`📊 Found ${develosilProducts.length} Develosil products`);

  // Convert to CSV
  const csvHeader = "productId,partNumber,brand,name,catalogUrl,hasDescription,hasSpecifications\n";
  const csvRows = develosilProducts.map((p) => {
    const hasDesc = p.description && p.description.trim().length > 0 ? "Yes" : "No";
    const hasSpec = p.specifications && Object.keys(p.specifications).length > 0 ? "Yes" : "No";
    const url = p.catalogUrl || "";
    const name = (p.name || "").replace(/"/g, '""'); // Escape quotes
    return `"${p.productId}","${p.partNumber}","${p.brand}","${name}","${url}","${hasDesc}","${hasSpec}"`;
  }).join("\n");

  const csvContent = csvHeader + csvRows;
  
  writeFileSync("/home/ubuntu/develosil_product_list_for_crawler.csv", csvContent);
  console.log("✅ Exported to: /home/ubuntu/develosil_product_list_for_crawler.csv");

  // Statistics
  const withDesc = develosilProducts.filter(p => p.description && p.description.trim().length > 0).length;
  const withSpec = develosilProducts.filter(p => p.specifications && Object.keys(p.specifications).length > 0).length;
  const withUrl = develosilProducts.filter(p => p.catalogUrl && p.catalogUrl.trim().length > 0).length;

  console.log(`\n📊 Statistics:`);
  console.log(`   Total: ${develosilProducts.length}`);
  console.log(`   With description: ${withDesc} (${((withDesc / develosilProducts.length) * 100).toFixed(1)}%)`);
  console.log(`   With specifications: ${withSpec} (${((withSpec / develosilProducts.length) * 100).toFixed(1)}%)`);
  console.log(`   With catalogUrl: ${withUrl} (${((withUrl / develosilProducts.length) * 100).toFixed(1)}%)`);

  process.exit(0);
}

exportDevelosilProducts().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
