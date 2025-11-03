import { drizzle } from "drizzle-orm/mysql2";
import { eq, and, inArray, sql } from "drizzle-orm";
import { products, categories, productCategories } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

console.log("\n🔧 Fixing Product-Category Associations (V2)...\n");

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
  "HPLC Column": "analytical-columns",  // Default HPLC to analytical
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
  id: products.id,  // Use numeric ID, not productId string!
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
      skippedCount++;
      continue;
    }
    
    // Find matching category slug
    const categorySlug = productTypeMapping[productType];
    
    if (!categorySlug) {
      skippedCount++;
      continue;
    }
    
    const category = categoryBySlug[categorySlug];
    
    if (!category) {
      console.log(`⚠️  Category "${categorySlug}" not found for productType "${productType}"`);
      skippedCount++;
      continue;
    }
    
    // Check if association already exists
    const existing = await db
      .select()
      .from(productCategories)
      .where(
        and(
          eq(productCategories.productId, product.id),  // Use numeric ID!
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
      productId: product.id,  // Use numeric ID!
      categoryId: category.id,
      isPrimary: 0,
    });
    
    successCount++;
    
    if (successCount % 100 === 0) {
      console.log(`✅ Processed ${successCount} products...`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing product ${product.productId}:`, error.message);
    errorCount++;
    
    // Stop if too many errors
    if (errorCount > 50) {
      console.error("\n❌ Too many errors, stopping...\n");
      break;
    }
  }
}

console.log("\n📊 Summary:");
console.log(`✅ Successfully associated: ${successCount} products`);
console.log(`⚠️  Skipped: ${skippedCount} products`);
console.log(`❌ Errors: ${errorCount} products`);

// Step 5: Verify results
console.log("\n🔍 Verifying results...\n");

const subcategoryCheck = await db.execute(sql`
  SELECT c.name, c.slug, COUNT(pc.productId) as count
  FROM categories c
  LEFT JOIN product_categories pc ON c.id = pc.categoryId
  WHERE c.slug IN ('analytical-columns', 'preparative-columns', 'uhplc-columns', 'chiral-columns', 'bio-columns', 'gc-columns', 'guard-columns')
  GROUP BY c.id, c.name, c.slug
  ORDER BY c.name
`);

console.log("Category Product Counts:");
subcategoryCheck.rows.forEach(cat => {
  console.log(`  ${cat.name}: ${cat.count} products`);
});

console.log("\n✅ Done!\n");

process.exit(0);
