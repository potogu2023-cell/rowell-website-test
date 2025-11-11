import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { products } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  const develosilProducts = await db
    .select()
    .from(products)
    .where(eq(products.brand, "Develosil"));

  console.log(`\nTotal Develosil products: ${develosilProducts.length}\n`);

  const goodDesc = develosilProducts.filter(
    (p) => p.description && p.description.length >= 100
  );

  const badDesc = develosilProducts.filter(
    (p) => !p.description || p.description.length < 100
  );

  console.log(`Good descriptions (≥100 chars): ${goodDesc.length}`);
  console.log(`Bad descriptions (<100 chars): ${badDesc.length}\n`);

  console.log("Sample bad description products:\n");
  badDesc.slice(0, 10).forEach((p) => {
    console.log(`- ${p.productId} (${p.partNumber}): "${p.description?.substring(0, 50)}..."`);
  });

  console.log(`\n\nChecking if bad products are from old crawl...`);
  const oldCrawlPattern = /Your connection is not private|Develosil Guard Column/i;
  const oldCrawlProducts = badDesc.filter((p) =>
    oldCrawlPattern.test(p.description || "")
  );

  console.log(`\nOld crawl products: ${oldCrawlProducts.length}`);
  console.log(`Other bad products: ${badDesc.length - oldCrawlProducts.length}\n`);
}

main();
