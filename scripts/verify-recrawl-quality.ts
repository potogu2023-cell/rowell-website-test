import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { products } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  console.log("\n" + "=".repeat(80));
  console.log("Re-Crawl Quality Verification Report");
  console.log("=".repeat(80) + "\n");

  const brands = ["Shimadzu", "Develosil"];

  for (const brand of brands) {
    console.log(`### ${brand}\n`);

    const allProducts = await db
      .select()
      .from(products)
      .where(eq(products.brand, brand));

    const withGoodDesc = allProducts.filter(
      (p) => p.description && p.description.length >= 100
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

    const avgDescLength = withGoodDesc.length > 0
      ? Math.round(
          withGoodDesc.reduce((sum, p) => sum + (p.description?.length || 0), 0) /
            withGoodDesc.length
        )
      : 0;

    const avgSpecFields = withSpecs.length > 0
      ? (
          withSpecs.reduce((sum, p) => {
            try {
              const specs = JSON.parse(p.specifications as string);
              return sum + Object.keys(specs).length;
            } catch {
              return sum;
            }
          }, 0) / withSpecs.length
        ).toFixed(1)
      : "0";

    console.log(`Total products: ${allProducts.length}`);
    console.log(
      `With descriptions (≥100 chars): ${withGoodDesc.length} (${((withGoodDesc.length / allProducts.length) * 100).toFixed(1)}%)`
    );
    console.log(`Average description length: ${avgDescLength} chars`);
    console.log(
      `With specifications: ${withSpecs.length} (${((withSpecs.length / allProducts.length) * 100).toFixed(1)}%)`
    );
    console.log(`Average spec fields: ${avgSpecFields}\n`);

    // Quality score
    const descScore = (withGoodDesc.length / allProducts.length) * 50;
    const specScore = (withSpecs.length / allProducts.length) * 50;
    const totalScore = descScore + specScore;

    let rating = "❌ Poor";
    if (totalScore >= 90) rating = "✅ Excellent";
    else if (totalScore >= 70) rating = "✅ Good";
    else if (totalScore >= 50) rating = "⚠️ Acceptable";

    console.log(`Quality Score: ${totalScore.toFixed(1)}/100`);
    console.log(`Rating: ${rating}\n`);
    console.log("-".repeat(80) + "\n");
  }

  // Overall summary
  console.log("=".repeat(80));
  console.log("OVERALL SUMMARY");
  console.log("=".repeat(80) + "\n");

  const shimadzuProducts = await db
    .select()
    .from(products)
    .where(eq(products.brand, "Shimadzu"));

  const develosilProducts = await db
    .select()
    .from(products)
    .where(eq(products.brand, "Develosil"));

  console.log("Brand       | Total | Desc ≥100 | Desc % | With Specs | Spec %");
  console.log("------------|-------|-----------|--------|------------|--------");

  for (const [brand, brandProducts] of [
    ["Shimadzu", shimadzuProducts],
    ["Develosil", develosilProducts],
  ]) {
    const withGoodDesc = brandProducts.filter(
      (p: any) => p.description && p.description.length >= 100
    );

    const withSpecs = brandProducts.filter((p: any) => {
      if (!p.specifications) return false;
      try {
        const specs = JSON.parse(p.specifications as string);
        return Object.keys(specs).length > 0;
      } catch {
        return false;
      }
    });

    const brandPad = brand.padEnd(11);
    const total = brandProducts.length.toString().padStart(5);
    const descCount = withGoodDesc.length.toString().padStart(9);
    const descPct = `${((withGoodDesc.length / brandProducts.length) * 100).toFixed(1)}%`.padStart(6);
    const specCount = withSpecs.length.toString().padStart(10);
    const specPct = `${((withSpecs.length / brandProducts.length) * 100).toFixed(1)}%`.padStart(6);

    console.log(
      `${brandPad} | ${total} | ${descCount} | ${descPct} | ${specCount} | ${specPct}`
    );
  }

  console.log("\n✅ Verification complete\n");
}

main();
