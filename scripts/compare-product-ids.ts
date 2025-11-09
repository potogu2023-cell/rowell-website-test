import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { products } from "../drizzle/schema";
import * as fs from "fs";

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  // Read CSV productIds
  const shimadzuCsv = fs.readFileSync("/home/ubuntu/upload/8_shimadzu_results.csv", "utf-8");
  const lines = shimadzuCsv.split("\n").slice(1, 6); // Skip header, get first 5
  
  console.log("=== CSV productIds (Shimadzu) ===");
  lines.forEach((line) => {
    const productId = line.split(",")[0];
    if (productId) console.log(productId);
  });
  
  console.log("\n=== DB productIds (Shimadzu) ===");
  const dbProducts = await db
    .select()
    .from(products)
    .where(eq(products.brand, "Shimadzu"))
    .limit(5);
  
  dbProducts.forEach((p) => console.log(p.productId));
  
  console.log("\n=== Comparison ===");
  console.log("CSV format: numeric IDs (e.g., 246028)");
  console.log("DB format: prefixed IDs (e.g., SHIM-xxx)");
  console.log("\n⚠️  ProductId mismatch! CSV uses numeric IDs, DB uses prefixed format.");
}

main();
