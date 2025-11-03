import { drizzle } from "drizzle-orm/mysql2";
import { eq, and, sql } from "drizzle-orm";
import { products, categories, productCategories } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

console.log("\n🔧 Complete Product Categorization Script\n");
console.log("This will:");
console.log("1. Create missing subcategories");
console.log("2. Associate ALL products to subcategories");
console.log("3. Achieve 100% categorization\n");

// Step 1: Get existing categories
const existingCategories = await db.select().from(categories);
const categoryBySlug = {};
existingCategories.forEach(cat => {
  categoryBySlug[cat.slug] = cat;
});

console.log(`Found ${existingCategories.length} existing categories\n`);

// Step 2: Define complete category structure
// Map: productType → { parentSlug, subcategorySlug, subcategoryName }
const categoryStructure = {
  // HPLC Columns (parent: hplc-columns)
  "HPLC Column": { parent: "hplc-columns", slug: "analytical-columns", name: "Analytical Columns" },
  "Analytical Column": { parent: "hplc-columns", slug: "analytical-columns", name: "Analytical Columns" },
  "Preparative Column": { parent: "hplc-columns", slug: "preparative-columns", name: "Preparative Columns" },
  "UHPLC Column": { parent: "hplc-columns", slug: "uhplc-columns", name: "UHPLC Columns" },
  "Chiral Column": { parent: "hplc-columns", slug: "chiral-columns", name: "Chiral Columns" },
  "Bio Column": { parent: "hplc-columns", slug: "bio-columns", name: "Bio Columns" },
  
  // GC Columns (parent: gc-columns)
  "GC Column": { parent: "chromatography-columns", slug: "gc-columns", name: "GC Columns" },
  
  // Guard Columns (parent: chromatography-columns)
  "Guard Column": { parent: "chromatography-columns", slug: "guard-columns", name: "Guard Columns" },
  
  // Sample Preparation (parent: sample-preparation)
  "SPE Cartridge": { parent: "sample-preparation", slug: "spe-cartridges", name: "SPE Cartridges" },
  "Sample Vials": { parent: "sample-preparation", slug: "sample-vials", name: "Sample Vials" },
  "Septa & Closures": { parent: "sample-preparation", slug: "septa-closures", name: "Septa & Closures" },
  "Syringes & Needles": { parent: "sample-preparation", slug: "syringes-needles", name: "Syringes & Needles" },
  "Centrifuge Tubes": { parent: "sample-preparation", slug: "centrifuge-tubes", name: "Centrifuge Tubes" },
  
  // Filtration (parent: filtration)
  "Filtration": { parent: "filtration", slug: "filtration-products", name: "Filtration Products" },
  
  // Chromatography Supplies (parent: chromatography-supplies)
  "Tubing & Fittings": { parent: "chromatography-supplies", slug: "tubing-fittings", name: "Tubing & Fittings" },
  "Chromatography Consumables": { parent: "chromatography-supplies", slug: "consumables", name: "Consumables" },
};

// Step 3: Create missing subcategories
console.log("📁 Creating missing subcategories...\n");

const newCategories = [];

for (const [productType, catInfo] of Object.entries(categoryStructure)) {
  // Check if subcategory already exists
  if (categoryBySlug[catInfo.slug]) {
    console.log(`  ✓ ${catInfo.name} already exists`);
    continue;
  }
  
  // Find parent category
  const parentCat = categoryBySlug[catInfo.parent];
  if (!parentCat) {
    console.log(`  ⚠️  Parent category "${catInfo.parent}" not found for ${catInfo.name}`);
    continue;
  }
  
  // Create new subcategory
  try {
    const result = await db.insert(categories).values({
      name: catInfo.name,
      slug: catInfo.slug,
      parentId: parentCat.id,
      description: `${catInfo.name} for chromatography applications`,
    });
    
    // Get the inserted category
    const newCat = await db.select().from(categories).where(eq(categories.slug, catInfo.slug)).limit(1);
    
    if (newCat.length > 0) {
      categoryBySlug[catInfo.slug] = newCat[0];
      newCategories.push(catInfo.name);
      console.log(`  ✅ Created: ${catInfo.name}`);
    }
  } catch (error) {
    console.error(`  ❌ Error creating ${catInfo.name}:`, error.message);
  }
}

console.log(`\n✅ Created ${newCategories.length} new subcategories\n`);

// Step 4: Associate ALL products to subcategories
console.log("🔗 Associating products to subcategories...\n");

const allProducts = await db.select({
  id: products.id,
  productId: products.productId,
  productType: products.productType,
}).from(products);

console.log(`Found ${allProducts.length} products to process\n`);

let successCount = 0;
let skippedCount = 0;
let errorCount = 0;
let alreadyExistsCount = 0;

for (const product of allProducts) {
  try {
    const productType = product.productType;
    
    if (!productType) {
      skippedCount++;
      continue;
    }
    
    // Find category info
    const catInfo = categoryStructure[productType];
    
    if (!catInfo) {
      console.log(`  ⚠️  No category mapping for productType: "${productType}"`);
      skippedCount++;
      continue;
    }
    
    const category = categoryBySlug[catInfo.slug];
    
    if (!category) {
      console.log(`  ⚠️  Category "${catInfo.slug}" not found`);
      skippedCount++;
      continue;
    }
    
    // Check if association already exists
    const existing = await db
      .select()
      .from(productCategories)
      .where(
        and(
          eq(productCategories.productId, product.id),
          eq(productCategories.categoryId, category.id)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      alreadyExistsCount++;
      continue;
    }
    
    // Create new association
    await db.insert(productCategories).values({
      productId: product.id,
      categoryId: category.id,
      isPrimary: 0,
    });
    
    successCount++;
    
    if (successCount % 100 === 0) {
      console.log(`  ✅ Processed ${successCount} products...`);
    }
    
  } catch (error) {
    console.error(`  ❌ Error processing product ${product.productId}:`, error.message);
    errorCount++;
    
    if (errorCount > 50) {
      console.error("\n❌ Too many errors, stopping...\n");
      break;
    }
  }
}

console.log("\n📊 Summary:");
console.log(`✅ Successfully associated: ${successCount} products`);
console.log(`ℹ️  Already existed: ${alreadyExistsCount} products`);
console.log(`⚠️  Skipped: ${skippedCount} products`);
console.log(`❌ Errors: ${errorCount} products`);

// Step 5: Final verification
console.log("\n🔍 Final Verification...\n");

const totalProductsResult = await db.execute(sql`SELECT COUNT(*) as count FROM products`);
const totalProducts = totalProductsResult[0][0].count;

const categorizedResult = await db.execute(sql`
  SELECT COUNT(DISTINCT pc.productId) as count
  FROM product_categories pc
`);
const categorizedCount = categorizedResult[0][0].count;

console.log(`📦 Total products: ${totalProducts}`);
console.log(`✅ Categorized products: ${categorizedCount}`);
console.log(`📊 Coverage: ${((categorizedCount / totalProducts) * 100).toFixed(1)}%\n`);

// Show breakdown by category
const breakdownResult = await db.execute(sql`
  SELECT c.name, COUNT(pc.productId) as count
  FROM categories c
  LEFT JOIN product_categories pc ON c.id = pc.categoryId
  WHERE c.parentId IS NOT NULL
  GROUP BY c.id, c.name
  HAVING count > 0
  ORDER BY count DESC
`);

console.log("=== Products per Subcategory ===\n");
breakdownResult[0].forEach(row => {
  console.log(`  ${row.name}: ${row.count} products`);
});

console.log("\n✅ Complete!\n");

process.exit(0);
