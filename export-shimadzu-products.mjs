import { drizzle } from "drizzle-orm/mysql2";
import { products } from "./drizzle/schema.js";
import { eq } from "drizzle-orm";
import { writeFileSync } from "fs";

/**
 * Export Shimadzu products for crawler
 */

async function exportShimadzuProducts() {
  console.log("🔄 Exporting Shimadzu products...\n");

  const db = drizzle(process.env.DATABASE_URL);

  // Query Shimadzu products
  const shimadzuProducts = await db
    .select({
      productId: products.id,
      partNumber: products.partNumber,
      brand: products.brand,
      name: products.name,
      catalogUrl: products.catalogUrl,
    })
    .from(products)
    .where(eq(products.brand, "Shimadzu"));

  console.log(`Found ${shimadzuProducts.length} Shimadzu products\n`);

  // Generate CSV
  const csvHeader = "productId,partNumber,brand,name,catalogUrl\n";
  const csvRows = shimadzuProducts
    .map((p) => {
      const escapeCsv = (str) => {
        if (!str) return "";
        // Escape quotes and wrap in quotes if contains comma/quote/newline
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      return [
        p.productId,
        escapeCsv(p.partNumber),
        escapeCsv(p.brand),
        escapeCsv(p.name),
        escapeCsv(p.catalogUrl),
      ].join(",");
    })
    .join("\n");

  const csvContent = csvHeader + csvRows;

  // Write to file
  const filename = "shimadzu_product_list_for_crawler.csv";
  writeFileSync(filename, csvContent, "utf8");

  console.log(`✅ Exported to ${filename}`);
  console.log(`   Total products: ${shimadzuProducts.length}`);
  console.log(`   File size: ${(csvContent.length / 1024).toFixed(2)} KB`);
}

exportShimadzuProducts()
  .then(() => {
    console.log("\n🎉 Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
