import { drizzle } from "drizzle-orm/mysql2";
import { products } from "./drizzle/schema.js";
import { eq, inArray } from "drizzle-orm";
import { writeFileSync } from "fs";

/**
 * Export remaining simple brands (Develosil, Avantor, Thermo Fisher supplement)
 */

const brands = [
  { name: "Develosil", count: 118 },
  { name: "Avantor", count: 83 },
  { name: "Thermo Fisher Scientific", count: 3, note: "supplement only" }
];

async function exportBrand(db, brandName) {
  console.log(`\n🔄 Exporting ${brandName} products...`);

  const brandProducts = await db
    .select({
      productId: products.id,
      partNumber: products.partNumber,
      brand: products.brand,
      name: products.name,
      catalogUrl: products.catalogUrl,
    })
    .from(products)
    .where(eq(products.brand, brandName));

  console.log(`   Found ${brandProducts.length} products`);

  const csvHeader = "productId,partNumber,brand,name,catalogUrl\n";
  const csvRows = brandProducts
    .map((p) => {
      const escapeCsv = (str) => {
        if (!str) return "";
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
  const filename = `${brandName.toLowerCase().replace(/\s+/g, '_')}_product_list_for_crawler.csv`;
  writeFileSync(filename, csvContent, "utf8");

  console.log(`   ✅ Exported to ${filename}`);
  console.log(`   File size: ${(csvContent.length / 1024).toFixed(2)} KB`);
  
  return brandProducts.length;
}

async function main() {
  console.log("📦 Exporting remaining simple brands...\n");

  const db = drizzle(process.env.DATABASE_URL);

  let totalProducts = 0;
  
  for (const brand of brands) {
    const count = await exportBrand(db, brand.name);
    totalProducts += count;
  }

  console.log(`\n🎉 All exports completed!`);
  console.log(`   Total products: ${totalProducts}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
