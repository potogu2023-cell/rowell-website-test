import { drizzle } from "drizzle-orm/mysql2";
import { eq, and, sql } from "drizzle-orm";
import { products } from "./drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function checkThermoFisherStatus() {
  console.log("🔍 Checking Thermo Fisher Scientific data status...\n");

  // Get total count
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.brand, "Thermo Fisher Scientific"));

  const total = totalResult[0]?.count || 0;
  console.log(`📊 Total Thermo Fisher products: ${total}`);

  // Get description coverage
  const descResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(
      and(
        eq(products.brand, "Thermo Fisher Scientific"),
        sql`${products.description} IS NOT NULL AND ${products.description} != ''`
      )
    );

  const withDesc = descResult[0]?.count || 0;
  console.log(`📝 With description: ${withDesc} (${((withDesc / total) * 100).toFixed(1)}%)`);

  // Get specifications coverage
  const specResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(
      and(
        eq(products.brand, "Thermo Fisher Scientific"),
        sql`${products.specifications} IS NOT NULL AND JSON_LENGTH(${products.specifications}) > 0`
      )
    );

  const withSpec = specResult[0]?.count || 0;
  console.log(`🔧 With specifications: ${withSpec} (${((withSpec / total) * 100).toFixed(1)}%)`);

  // Get catalogUrl coverage
  const urlResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(
      and(
        eq(products.brand, "Thermo Fisher Scientific"),
        sql`${products.catalogUrl} IS NOT NULL AND ${products.catalogUrl} != ''`
      )
    );

  const withUrl = urlResult[0]?.count || 0;
  console.log(`🔗 With catalogUrl: ${withUrl} (${((withUrl / total) * 100).toFixed(1)}%)`);

  // Sample some products
  console.log("\n📋 Sample products (first 3):");
  const samples = await db
    .select({
      productId: products.productId,
      partNumber: products.partNumber,
      name: products.name,
      hasDesc: sql<number>`CASE WHEN ${products.description} IS NOT NULL AND ${products.description} != '' THEN 1 ELSE 0 END`,
      hasSpec: sql<number>`CASE WHEN ${products.specifications} IS NOT NULL AND JSON_LENGTH(${products.specifications}) > 0 THEN 1 ELSE 0 END`,
      hasUrl: sql<number>`CASE WHEN ${products.catalogUrl} IS NOT NULL AND ${products.catalogUrl} != '' THEN 1 ELSE 0 END`,
    })
    .from(products)
    .where(eq(products.brand, "Thermo Fisher Scientific"))
    .limit(3);

  samples.forEach((p, i) => {
    console.log(`\n${i + 1}. ${p.productId} - ${p.partNumber}`);
    console.log(`   Name: ${p.name?.substring(0, 60)}...`);
    console.log(`   Has Desc: ${p.hasDesc ? '✅' : '❌'} | Has Spec: ${p.hasSpec ? '✅' : '❌'} | Has URL: ${p.hasUrl ? '✅' : '❌'}`);
  });

  console.log("\n✅ Check complete!");
  process.exit(0);
}

checkThermoFisherStatus().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
