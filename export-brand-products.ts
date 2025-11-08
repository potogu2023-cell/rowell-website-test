import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { products } from "./drizzle/schema";
import * as fs from "fs";

const db = drizzle(process.env.DATABASE_URL!);

async function exportBrandProducts(brand: string, filename: string) {
  const brandProducts = await db
    .select({
      productId: products.productId,
      partNumber: products.partNumber,
      brand: products.brand,
      name: products.name,
      catalogUrl: products.catalogUrl,
    })
    .from(products)
    .where(eq(products.brand, brand));

  // Generate CSV
  const csvLines = [
    "productId,partNumber,brand,name,catalogUrl"
  ];

  for (const product of brandProducts) {
    const line = [
      product.productId,
      product.partNumber || "",
      product.brand,
      `"${(product.name || "").replace(/"/g, '""')}"`,
      product.catalogUrl || ""
    ].join(",");
    csvLines.push(line);
  }

  fs.writeFileSync(filename, csvLines.join("\n"), "utf-8");
  console.log(`✅ Exported ${brandProducts.length} ${brand} products to ${filename}`);
}

async function main() {
  await exportBrandProducts("Restek", "restek_215_product_list.csv");
  await exportBrandProducts("Supelco", "supelco_199_product_list.csv");
  await exportBrandProducts("Avantor", "avantor_83_product_list.csv");
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
