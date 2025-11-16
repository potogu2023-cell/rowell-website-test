import { drizzle } from "drizzle-orm/mysql2";
import { sql, eq, inArray } from "drizzle-orm";
import { products, productCategories } from "./drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function deleteUnverifiableProducts() {
  console.log("🗑️  Starting deletion of unverifiable products...\n");

  const brandsToDelete = ['Merck', 'Waters'];

  for (const brand of brandsToDelete) {
    console.log(`\n📊 Processing brand: ${brand}`);

    // Get product count before deletion
    const countBefore = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.brand, brand));

    const total = countBefore[0]?.count || 0;
    console.log(`  Products to delete: ${total}`);

    if (total === 0) {
      console.log(`  ⚠️  No products found for ${brand}`);
      continue;
    }

    // Get product IDs
    const productIds = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.brand, brand));

    const ids = productIds.map(p => p.id);

    // Delete product_categories associations first (foreign key constraint)
    console.log(`  Deleting product_categories associations...`);
    const deletedCategories = await db
      .delete(productCategories)
      .where(inArray(productCategories.productId, ids));

    console.log(`  ✅ Deleted ${deletedCategories.rowsAffected || 0} product_categories associations`);

    // Delete products
    console.log(`  Deleting products...`);
    const deletedProducts = await db
      .delete(products)
      .where(eq(products.brand, brand));

    console.log(`  ✅ Deleted ${deletedProducts.rowsAffected || 0} products`);

    // Verify deletion
    const countAfter = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.brand, brand));

    const remaining = countAfter[0]?.count || 0;

    if (remaining === 0) {
      console.log(`  ✅ ${brand} successfully deleted (${total} products removed)`);
    } else {
      console.log(`  ⚠️  Warning: ${remaining} products still remain for ${brand}`);
    }
  }

  // Get final statistics
  console.log(`\n\n📊 Final Statistics:`);

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(products);

  const totalProducts = totalResult[0]?.count || 0;
  console.log(`  Total products remaining: ${totalProducts}`);

  const brandsResult = await db
    .select({ 
      brand: products.brand,
      count: sql<number>`count(*)` 
    })
    .from(products)
    .groupBy(products.brand);

  console.log(`\n  Brands remaining:`);
  brandsResult.forEach(b => {
    console.log(`    ${b.brand}: ${b.count} products`);
  });

  console.log(`\n✅ Deletion complete!`);
  process.exit(0);
}

deleteUnverifiableProducts().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
