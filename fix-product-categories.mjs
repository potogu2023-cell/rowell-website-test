import { drizzle } from "drizzle-orm/mysql2";
import { eq, and, inArray } from "drizzle-orm";
import { products, categories, productCategories } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

console.log("\n🔧 Fixing Product-Category Associations...\n");

// Step 1: Get all categories
const allCategories = await db.select().from(categories);
console.log(`Found ${allCategories.length} categories`);

// Create category lookup maps
const categoryBySlug = {};
allCategories.forEach(cat => {
  categoryBySlug[cat.slug] = cat;
});

// Step 2: Define product type to category slug mapping
const productTypeMapping = {
  // HPLC Columns subcategories
  "HPLC Column": "analytical-columns",
  "Analytical Column": "analytical-columns",
  "Preparative Column": "preparative-columns",
  "UHPLC Column": "uhplc-columns",
  "Chiral Column": "chiral-columns",
  "Bio Column": "bio-columns",
  
  // GC Columns
  "GC Column": "gc-columns",
  
  // Guard Columns
  "Guard Column": "guard-columns",
  
  // Other categories (if needed)
  "SPE Cartridge": "spe-cartridges",
  "Filter": "filters",
  "Vial": "vials",
};

// Step 3: Get all products with their types
const allProducts = await db.select({
  id: products.id,
  productId: products.productId,
  productType: products.productType,
  name: products.name,
}).from(products);

console.log(`Found ${allProducts.length} products`);

// Step 4: Process each product and create associations
let successCount = 0;
let skippedCount = 0;
let errorCount = 0;

for (const product of allProducts) {
  try {
    const productType = product.productType;
    
    if (!productType) {
      console.log(`⚠️  Skipping product ${product.productId}: No productType`);
      skippedCount++;
      continue;
    }
    
    // Find matching category slug
    const categorySlug = productTypeMapping[productType];
    
    if (!categorySlug) {
      console.log(`⚠️  Skipping product ${product.productId}: Unknown productType "${productType}"`);
      skippedCount++;
      continue;
    }
    
    const category = categoryBySlug[categorySlug];
    
    if (!category) {
      console.log(`⚠️  Skipping product ${product.productId}: Category "${categorySlug}" not found`);
      skippedCount++;
      continue;
    }
    
    // Check if association already exists
    const existing = await db
      .select()
      .from(productCategories)
      .where(
        and(
          eq(productCategories.productId, product.productId),
          eq(productCategories.categoryId, category.id)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      // Already exists, skip
      continue;
    }
    
    // Create new association
    await db.insert(productCategories).values({
      productId: product.productId,
      categoryId: category.id,
    });
    
    successCount++;
    
    if (successCount % 100 === 0) {
      console.log(`✅ Processed ${successCount} products...`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing product ${product.productId}:`, error.message);
    errorCount++;
  }
}

console.log("\n📊 Summary:");
console.log(`✅ Successfully associated: ${successCount} products`);
console.log(`⚠️  Skipped: ${skippedCount} products`);
console.log(`❌ Errors: ${errorCount} products`);

// Step 5: Verify results
console.log("\n🔍 Verifying results...\n");

const subcategoryCheck = await db
  .select({
    name: categories.name,
    slug: categories.slug,
    count: db.raw(`COUNT(${productCategories.productId})`),
  })
  .from(categories)
  .leftJoin(productCategories, eq(categories.id, productCategories.categoryId))
  .where(
    inArray(categories.slug, [
      "analytical-columns",
      "preparative-columns",
      "uhplc-columns",
      "chiral-columns",
      "bio-columns",
      "gc-columns",
      "guard-columns",
    ])
  )
  .groupBy(categories.id)
  .orderBy(categories.name);

console.log("Category Product Counts:");
subcategoryCheck.forEach(cat => {
  console.log(`  ${cat.name}: ${cat.count} products`);
});

console.log("\n✅ Done!\n");

process.exit(0);
