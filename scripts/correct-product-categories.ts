import { drizzle } from "drizzle-orm/mysql2";
import { eq, and, inArray } from "drizzle-orm";
import { products, productCategories, categories } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

interface CategoryMapping {
  brand: string;
  fromCategoryId: number;
  toCategoryId: number;
  reason: string;
}

// Category corrections based on verification
const corrections: CategoryMapping[] = [
  {
    brand: "Daicel",
    fromCategoryId: 5, // C18反相色谱柱 (wrong)
    toCategoryId: 9,   // 手性色谱柱 (correct)
    reason: "Daicel products are chiral columns (CHIRALPAK, CHIRALCEL series)",
  },
  {
    brand: "Phenomenex",
    fromCategoryId: 9, // 手性色谱柱 (wrong)
    toCategoryId: 5,   // C18反相色谱柱 (correct)
    reason: "Phenomenex products are C18 reversed phase columns (Luna, Kinetex series)",
  },
];

async function correctProductCategories() {
  console.log("🔧 Starting product category correction...\n");

  for (const correction of corrections) {
    console.log(`\n📋 Processing ${correction.brand}...`);
    console.log(`   Reason: ${correction.reason}`);

    // Get all products for this brand with the wrong category
    const productsToCorrect = await db
      .select({
        productId: products.id,
        productName: products.name,
        categoryMappingId: productCategories.id,
      })
      .from(products)
      .innerJoin(productCategories, eq(products.id, productCategories.productId))
      .where(
        and(
          eq(products.brand, correction.brand),
          eq(productCategories.categoryId, correction.fromCategoryId)
        )
      );

    console.log(`   Found ${productsToCorrect.length} products to correct`);

    if (productsToCorrect.length === 0) {
      console.log(`   ⚠️  No products found with wrong category`);
      continue;
    }

    // Update category mappings
    let corrected = 0;
    for (const product of productsToCorrect) {
      try {
        await db
          .update(productCategories)
          .set({ categoryId: correction.toCategoryId })
          .where(eq(productCategories.id, product.categoryMappingId));
        corrected++;
      } catch (error) {
        console.error(`   ❌ Error correcting product ${product.productId}:`, error);
      }
    }

    console.log(`   ✅ Corrected ${corrected}/${productsToCorrect.length} products`);
  }

  // Now handle Waters products - they need individual analysis
  console.log(`\n\n📋 Processing Waters products (requires individual analysis)...`);
  await correctWatersProducts();

  console.log("\n\n✅ Category correction completed!");
}

async function correctWatersProducts() {
  // Get all Waters products with their specifications
  const watersProducts = await db
    .select({
      id: products.id,
      productId: products.productId,
      name: products.name,
      phaseType: products.phaseType,
      specifications: products.specifications,
      categoryMappingId: productCategories.id,
      currentCategoryId: productCategories.categoryId,
    })
    .from(products)
    .innerJoin(productCategories, eq(products.id, productCategories.productId))
    .where(eq(products.brand, "Waters"));

  console.log(`   Found ${watersProducts.length} Waters products`);

  const categoryMap: Record<string, number> = {
    "C18": 5,    // C18反相色谱柱
    "C8": 6,     // C8反相色谱柱
    "Phenyl": 7, // Phenyl色谱柱
    "HILIC": 8,  // HILIC色谱柱
  };

  let corrected = 0;
  let skipped = 0;

  for (const product of watersProducts) {
    try {
      // Determine correct category based on product name and specifications
      let correctCategoryId: number | null = null;

      // Parse specifications if available
      const specs = product.specifications as any;
      let chemistry: string | null = null;

      if (specs && typeof specs === "object") {
        chemistry = specs.Chemistry || specs.Phase || null;
      }

      // Fallback to product name analysis
      if (!chemistry) {
        const name = product.name || "";
        if (name.includes("C18") || name.includes("ODS")) {
          chemistry = "C18";
        } else if (name.includes("C8")) {
          chemistry = "C8";
        } else if (name.includes("Phenyl")) {
          chemistry = "Phenyl";
        } else if (name.includes("HILIC")) {
          chemistry = "HILIC";
        }
      }

      // Map chemistry to category
      if (chemistry) {
        for (const [key, categoryId] of Object.entries(categoryMap)) {
          if (chemistry.includes(key)) {
            correctCategoryId = categoryId;
            break;
          }
        }
      }

      if (correctCategoryId && correctCategoryId !== product.currentCategoryId) {
        await db
          .update(productCategories)
          .set({ categoryId: correctCategoryId })
          .where(eq(productCategories.id, product.categoryMappingId));
        corrected++;
        console.log(`   ✅ ${product.productId}: ${chemistry} → Category ${correctCategoryId}`);
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${product.productId}:`, error);
    }
  }

  console.log(`   ✅ Corrected ${corrected} Waters products`);
  console.log(`   ⏭️  Skipped ${skipped} products (already correct or unknown chemistry)`);
}

// Run the correction
correctProductCategories()
  .then(() => {
    console.log("\n🎉 All corrections completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error during correction:", error);
    process.exit(1);
  });
