import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { products } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  console.log("Checking database for specifications data...\n");

  const agilentProducts = await db
    .select()
    .from(products)
    .where(eq(products.brand, "Agilent"))
    .limit(5);

  agilentProducts.forEach((p) => {
    console.log(`Product: ${p.partNumber}`);
    console.log(`  Has description: ${!!p.description} (${p.description?.length || 0} chars)`);
    console.log(`  Has specifications: ${!!p.specifications}`);
    if (p.specifications) {
      try {
        const specs = JSON.parse(p.specifications);
        console.log(`  Spec fields: ${Object.keys(specs).length}`);
        console.log(`  Sample: ${JSON.stringify(specs).substring(0, 100)}...`);
      } catch (e) {
        console.log(`  Error parsing specs: ${e}`);
      }
    }
    console.log("");
  });

  // Check total counts
  const brands = ["Agilent", "Waters", "Thermo Fisher Scientific", "Daicel", "Phenomenex"];
  console.log("\n=== Database Totals ===\n");
  for (const brand of brands) {
    const allProducts = await db
      .select()
      .from(products)
      .where(eq(products.brand, brand));

    const withSpecs = allProducts.filter((p) => {
      if (!p.specifications) return false;
      try {
        const specs = JSON.parse(p.specifications);
        return Object.keys(specs).length > 0;
      } catch {
        return false;
      }
    });

    console.log(`${brand}: ${allProducts.length} products, ${withSpecs.length} with specs (${Math.round((withSpecs.length / allProducts.length) * 100)}%)`);
  }
}

main();
