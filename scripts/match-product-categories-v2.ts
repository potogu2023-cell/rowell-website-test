import { drizzle } from "drizzle-orm/mysql2";
import { eq, isNull } from "drizzle-orm";
import { products, productCategories } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

// Only use category IDs that actually exist in the database
// Based on query: SELECT id, name FROM categories WHERE id IN (5,6,7,11,12,13);
// Results: 5=C18反相色谱柱, 6=C8反相色谱柱, 7=Phenyl色谱柱, 
//          11=尺寸排阻色谱柱, 12=正相色谱柱, 13=混合模式色谱柱

const CATEGORY_C18 = 5;
const CATEGORY_C8 = 6;
const CATEGORY_PHENYL = 7;
const CATEGORY_SEC = 11;
const CATEGORY_NORMAL_PHASE = 12;
const CATEGORY_MIXED_MODE = 13;
const CATEGORY_HPLC_PARENT = 1;

// Fallback: if no specific match, use parent category
const FALLBACK_CATEGORY = CATEGORY_HPLC_PARENT;

function matchProductToCategory(product: any): number[] {
  const categories: number[] = [];
  const name = (product.name || "").toLowerCase();
  const productType = (product.productType || "").toLowerCase();
  
  // Only process HPLC columns for now
  if (!productType.includes("hplc")) {
    return []; // Skip non-HPLC products
  }

  let matched = false;

  // C18 detection
  if (name.includes("c18") || name.includes("ods") || name.includes("octadecyl")) {
    categories.push(CATEGORY_C18);
    matched = true;
  }
  
  // C8 detection
  else if (name.includes("c8") || name.includes("octyl")) {
    categories.push(CATEGORY_C8);
    matched = true;
  }
  
  // Phenyl detection
  else if (name.includes("phenyl") || name.includes("pfp") || name.includes("pentafluorophenyl")) {
    categories.push(CATEGORY_PHENYL);
    matched = true;
  }
  
  // Size Exclusion detection
  else if (name.includes("sec") || name.includes("size exclusion") || name.includes("gpc") || name.includes("gfc")) {
    categories.push(CATEGORY_SEC);
    matched = true;
  }
  
  // Normal Phase detection
  else if (name.includes("silica") || name.includes("nh2") || name.includes("amino") || name.includes("cn") || name.includes("cyano") || name.includes("diol")) {
    categories.push(CATEGORY_NORMAL_PHASE);
    matched = true;
  }
  
  // Mixed Mode detection
  else if (name.includes("mixed mode") || name.includes("mixed-mode")) {
    categories.push(CATEGORY_MIXED_MODE);
    matched = true;
  }

  // If no specific match, use parent category as fallback
  if (!matched) {
    categories.push(FALLBACK_CATEGORY);
  } else {
    // Also add parent category
    categories.push(CATEGORY_HPLC_PARENT);
  }

  return categories;
}

async function matchUncategorizedProducts() {
  console.log("🔍 Starting product category matching (v2 - only existing categories)...\n");

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

  let matched = 0;
  let skipped = 0;
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

        matched++;
        if (matched % 100 === 0) {
          console.log(`✅ Matched ${matched}/${uncategorizedProducts.length} products...`);
        }
      } else {
        skipped++;
        if (skipped <= 10) {
          console.log(`⏭️  Skipped ${product.productId}: ${product.productType} - ${product.name}`);
        }
      }
    } catch (error: any) {
      const errorMsg = `❌ Error matching ${product.productId}: ${error.message}`;
      errorLog.push(errorMsg);
      if (errorLog.length <= 10) {
        console.error(errorMsg);
      }
    }
  }

  console.log(`\n\n📊 Matching Results:`);
  console.log(`   ✅ Matched: ${matched} products`);
  console.log(`   ⏭️  Skipped: ${skipped} products (non-HPLC)`);
  console.log(`   ❌ Errors: ${errorLog.length} products`);
  console.log(`   📈 Success Rate: ${((matched / uncategorizedProducts.length) * 100).toFixed(1)}%`);

  console.log(`\n📊 Category Distribution:`);
  const categoryNames: Record<number, string> = {
    1: "HPLC色谱柱 (Parent)",
    5: "C18反相色谱柱",
    6: "C8反相色谱柱",
    7: "Phenyl色谱柱",
    11: "尺寸排阻色谱柱",
    12: "正相色谱柱",
    13: "混合模式色谱柱",
  };

  const sortedStats = Array.from(categoryStats.entries()).sort((a, b) => b[1] - a[1]);
  for (const [categoryId, count] of sortedStats) {
    console.log(`   ${categoryNames[categoryId] || `Category ${categoryId}`}: ${count} products`);
  }

  if (errorLog.length > 10) {
    console.log(`\n⚠️  ${errorLog.length - 10} more errors not shown`);
  }
}

// Run the matching
matchUncategorizedProducts()
  .then(() => {
    console.log("\n🎉 Category matching completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error during matching:", error);
    process.exit(1);
  });
