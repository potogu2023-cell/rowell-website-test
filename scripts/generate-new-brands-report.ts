import { drizzle } from "drizzle-orm/mysql2";
import { eq, sql } from "drizzle-orm";
import { products } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  console.log("📊 New Brands Import Report\n");
  console.log("=".repeat(80));
  console.log("Generated:", new Date().toISOString());
  console.log("=".repeat(80));

  const brands = ["Shimadzu", "Merck", "Develosil"];

  for (const brand of brands) {
    console.log(`\n### ${brand}\n`);

    const allProducts = await db
      .select()
      .from(products)
      .where(eq(products.brand, brand));

    const withDescriptions = allProducts.filter(
      (p) => p.description && p.description.length >= 50
    );

    const withSpecs = allProducts.filter((p) => {
      if (!p.specifications) return false;
      try {
        const specs = JSON.parse(p.specifications as string);
        return Object.keys(specs).length > 0;
      } catch {
        return false;
      }
    });

    console.log(`Total products: ${allProducts.length}`);
    console.log(
      `With descriptions (≥50 chars): ${withDescriptions.length} (${((withDescriptions.length / allProducts.length) * 100).toFixed(1)}%)`
    );
    console.log(
      `With specifications: ${withSpecs.length} (${((withSpecs.length / allProducts.length) * 100).toFixed(1)}%)`
    );

    if (withSpecs.length > 0) {
      const avgSpecFields =
        withSpecs.reduce((sum, p) => {
          try {
            const specs = JSON.parse(p.specifications as string);
            return sum + Object.keys(specs).length;
          } catch {
            return sum;
          }
        }, 0) / withSpecs.length;
      console.log(`Average spec fields: ${avgSpecFields.toFixed(1)}`);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("SUMMARY TABLE");
  console.log("=".repeat(80) + "\n");

  console.log(
    "Brand       | Total | Desc ≥50 | Desc % | With Specs | Spec %"
  );
  console.log(
    "------------|-------|----------|--------|------------|--------"
  );

  for (const brand of brands) {
    const allProducts = await db
      .select()
      .from(products)
      .where(eq(products.brand, brand));

    const withDescriptions = allProducts.filter(
      (p) => p.description && p.description.length >= 50
    );

    const withSpecs = allProducts.filter((p) => {
      if (!p.specifications) return false;
      try {
        const specs = JSON.parse(p.specifications as string);
        return Object.keys(specs).length > 0;
      } catch {
        return false;
      }
    });

    const brandPad = brand.padEnd(11);
    const total = allProducts.length.toString().padStart(5);
    const descCount = withDescriptions.length.toString().padStart(8);
    const descPct = `${((withDescriptions.length / allProducts.length) * 100).toFixed(1)}%`.padStart(6);
    const specCount = withSpecs.length.toString().padStart(10);
    const specPct = `${((withSpecs.length / allProducts.length) * 100).toFixed(1)}%`.padStart(6);

    console.log(
      `${brandPad} | ${total} | ${descCount} | ${descPct} | ${specCount} | ${specPct}`
    );
  }

  console.log("\n✅ Report generation complete\n");
}

main();
