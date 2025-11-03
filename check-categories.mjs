import { drizzle } from "drizzle-orm/mysql2";
import { eq, and, sql } from "drizzle-orm";
import { categories, productCategories } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

// Get all categories with product counts
const result = await db
  .select({
    id: categories.id,
    name: categories.name,
    slug: categories.slug,
    parentId: categories.parentId,
    productCount: sql`COUNT(${productCategories.productId})`,
  })
  .from(categories)
  .leftJoin(productCategories, eq(categories.id, productCategories.categoryId))
  .groupBy(categories.id)
  .orderBy(categories.name);

console.log("\n=== Category Product Counts ===\n");
result.forEach(cat => {
  const indent = cat.parentId ? "  " : "";
  console.log(`${indent}${cat.name} (${cat.slug}): ${cat.productCount} products`);
});

// Check HPLC Columns specifically
console.log("\n=== HPLC Columns Subcategories ===\n");
const hplcCat = result.find(c => c.slug === "hplc-columns");
if (hplcCat) {
  console.log(`HPLC Columns (ID: ${hplcCat.id}): ${hplcCat.productCount} products`);
  
  const subcats = result.filter(c => c.parentId === hplcCat.id);
  subcats.forEach(sub => {
    console.log(`  - ${sub.name}: ${sub.productCount} products`);
  });
}

process.exit(0);
