import { getDb } from "./server/db";
import { products } from "./drizzle/schema";
import { sql, eq } from "drizzle-orm";

/**
 * Generate slug from productId
 * Simply use productId as slug since it's already unique and URL-friendly
 */
function generateSlug(productId: string): string {
  return productId;
}

async function generateProductSlugs() {
  console.log("🚀 Starting slug generation for all products...\n");

  const db = await getDb();
  if (!db) {
    console.error("❌ Cannot connect to database");
    process.exit(1);
  }

  // Get all products
  const allProducts = await db.select().from(products);
  console.log(`📊 Found ${allProducts.length} products in database\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < allProducts.length; i++) {
    const product = allProducts[i];

    if (product.slug) {
      // Skip if slug already exists
      skippedCount++;
      continue;
    }

    // Generate slug from productId
    const slug = generateSlug(product.productId);

    try {
      // Update product
      await db
        .update(products)
        .set({ slug })
        .where(eq(products.id, product.id));

      updatedCount++;

      if (updatedCount % 100 === 0) {
        console.log(`  Processed ${updatedCount} products...`);
      }
    } catch (error) {
      console.error(`Error updating product ${product.productId}:`, error);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 Slug Generation Summary");
  console.log("=".repeat(60));
  console.log(`Total products: ${allProducts.length}`);
  console.log(`✅ Updated: ${updatedCount}`);
  console.log(`⏭️  Skipped (already have slug): ${skippedCount}`);
  console.log("=".repeat(60) + "\n");

  // Verify a few products
  console.log("=== Verification (batch 9 products) ===\n");
  const testIds = [
    "THER-17126-102130",
    "AGIL-699968-301",
    "DAIC-80511",
    "DAIC-88523",
  ];
  for (const id of testIds) {
    const rows = await db
      .select()
      .from(products)
      .where(sql`productId = ${id}`)
      .limit(1);
    if (rows.length > 0) {
      console.log(`✅ ${id}: slug = "${rows[0].slug}"`);
    }
  }

  console.log("\n🎉 Slug generation completed!\n");
  process.exit(0);
}

generateProductSlugs();
