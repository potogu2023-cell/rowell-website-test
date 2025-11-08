import { drizzle } from "drizzle-orm/mysql2";
import { eq, isNull } from "drizzle-orm";
import { products, productCategories } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

// Category IDs from database (only use IDs that actually exist!)
const CATEGORY_SAMPLE_PREP_PARENT = 4; // 样品前处理产品
const CATEGORY_SYRINGES = 31; // 进样针 (only this subcategory exists)
const CATEGORY_HPLC_PARENT = 1; // HPLC色谱柱 (for remaining HPLC columns)

// Note: Categories 29, 30, 34 don't exist in database
// Use parent category (4) as fallback for all sample prep products

function matchProductToCategory(product: any): number[] {
  const categories: number[] = [];
  const productType = (product.productType || "").toLowerCase();
  const name = (product.name || "").toLowerCase();

  // Vials and Caps - use parent category since subcategory doesn't exist
  if (productType.includes("vial") || name.includes("vial") || name.includes("bottle") ||
      productType.includes("cap") || name.includes("cap") || name.includes("closure") || name.includes("septa")) {
    categories.push(CATEGORY_SAMPLE_PREP_PARENT);
    return categories;
  }

  // Syringes
  if (productType.includes("syringe") || name.includes("syringe") || name.includes("needle")) {
    categories.push(CATEGORY_SYRINGES);
    categories.push(CATEGORY_SAMPLE_PREP_PARENT);
    return categories;
  }

  // Filters, Ferrules, Accessories, Guard Columns - use parent category
  if (productType.includes("filter") || name.includes("filter") || name.includes("membrane") ||
      productType.includes("ferrule") || name.includes("ferrule") ||
      productType.includes("accessories") || productType.includes("accessory") ||
      productType.includes("guard")) {
    categories.push(CATEGORY_SAMPLE_PREP_PARENT);
    return categories;
  }

  // HPLC Columns (remaining ones that weren't caught before)
  if (productType.includes("hplc")) {
    categories.push(CATEGORY_HPLC_PARENT);
    return categories;
  }

  // GC Columns and Default - use sample prep parent category
  if (productType.includes("gc")) {
    categories.push(CATEGORY_SAMPLE_PREP_PARENT);
    return categories;
  }

  // Default: sample prep parent category
  categories.push(CATEGORY_SAMPLE_PREP_PARENT);
  return categories;
}

async function categorizeRemainingProducts() {
  console.log("🔧 Starting categorization of remaining products...\n");

  // Get all uncategorized products
  const uncategorizedProducts = await db
    .select({
      id: products.id,
      productId: products.productId,
      name: products.name,
      brand: products.brand,
      productType: products.productType,
    })
    .from(products)
    .leftJoin(productCategories, eq(products.id, productCategories.productId))
    .where(isNull(productCategories.productId));

  console.log(`Found ${uncategorizedProducts.length} uncategorized products\n`);

  let categorized = 0;
  const categoryStats: Map<number, number> = new Map();
  const errorLog: string[] = [];

  for (const product of uncategorizedProducts) {
    try {
      const categoryIds = matchProductToCategory(product);

      if (categoryIds.length > 0) {
        // Insert category mappings
        for (let i = 0; i < categoryIds.length; i++) {
          const categoryId = categoryIds[i];
          const isPrimary = i === 0 ? 1 : 0;

          try {
            await db.insert(productCategories).values({
              productId: product.id,
              categoryId: categoryId,
              isPrimary: isPrimary,
            });

            // Update stats
            categoryStats.set(categoryId, (categoryStats.get(categoryId) || 0) + 1);
          } catch (insertError: any) {
            if (insertError.cause?.code === 'ER_DUP_ENTRY') {
              // Duplicate entry, skip silently
              continue;
            } else {
              throw insertError;
            }
          }
        }

        categorized++;
        console.log(`✅ [${categorized}/${uncategorizedProducts.length}] ${product.productId}: ${product.productType} → Category ${categoryIds[0]}`);
      }
    } catch (error: any) {
      const errorMsg = `❌ Error categorizing ${product.productId}: ${error.message}`;
      errorLog.push(errorMsg);
      console.error(errorMsg);
    }
  }

  console.log(`\n\n📊 Categorization Results:`);
  console.log(`   ✅ Categorized: ${categorized} products`);
  console.log(`   ❌ Errors: ${errorLog.length} products`);
  console.log(`   📈 Success Rate: ${((categorized / uncategorizedProducts.length) * 100).toFixed(1)}%`);

  console.log(`\n📊 Category Distribution:`);
  const categoryNames: Record<number, string> = {
    1: "HPLC色谱柱 (Parent)",
    4: "样品前处理产品 (Parent)",
    31: "进样针",
  };

  const sortedStats = Array.from(categoryStats.entries()).sort((a, b) => b[1] - a[1]);
  for (const [categoryId, count] of sortedStats) {
    console.log(`   ${categoryNames[categoryId] || `Category ${categoryId}`}: ${count} products`);
  }
}

// Run the categorization
categorizeRemainingProducts()
  .then(() => {
    console.log("\n🎉 Categorization completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error during categorization:", error);
    process.exit(1);
  });
