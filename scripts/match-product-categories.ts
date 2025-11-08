import { drizzle } from "drizzle-orm/mysql2";
import { eq, isNull, and, or } from "drizzle-orm";
import { products, productCategories, categories } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

interface CategoryRule {
  categoryId: number;
  categoryName: string;
  parentId: number | null;
  priority: number;
  matchRules: {
    productType?: string[];
    nameKeywords?: string[];
    specKeywords?: string[];
    brandSpecific?: {
      brand: string;
      condition: (product: any) => boolean;
    };
  };
}

// Define matching rules for all 34 categories
const categoryRules: CategoryRule[] = [
  // HPLC Columns (Parent ID: 1)
  {
    categoryId: 5,
    categoryName: "C18反相色谱柱",
    parentId: 1,
    priority: 10,
    matchRules: {
      productType: ["HPLC Column"],
      nameKeywords: ["C18", "ODS", "Octadecyl"],
      specKeywords: ["C18", "ODS"],
    },
  },
  {
    categoryId: 6,
    categoryName: "C8反相色谱柱",
    parentId: 1,
    priority: 10,
    matchRules: {
      productType: ["HPLC Column"],
      nameKeywords: ["C8", "Octyl"],
      specKeywords: ["C8"],
    },
  },
  {
    categoryId: 7,
    categoryName: "Phenyl色谱柱",
    parentId: 1,
    priority: 10,
    matchRules: {
      productType: ["HPLC Column"],
      nameKeywords: ["Phenyl", "PFP", "Pentafluorophenyl"],
      specKeywords: ["Phenyl", "PFP"],
    },
  },
  {
    categoryId: 8,
    categoryName: "HILIC色谱柱",
    parentId: 1,
    priority: 10,
    matchRules: {
      productType: ["HPLC Column"],
      nameKeywords: ["HILIC", "Hydrophilic"],
      specKeywords: ["HILIC"],
    },
  },
  {
    categoryId: 9,
    categoryName: "手性色谱柱",
    parentId: 1,
    priority: 15, // Higher priority for chiral
    matchRules: {
      productType: ["HPLC Column"],
      nameKeywords: ["Chiral", "CHIRALPAK", "CHIRALCEL", "Lux"],
      specKeywords: ["Chiral"],
      brandSpecific: {
        brand: "Daicel",
        condition: (product) => true, // All Daicel products are chiral
      },
    },
  },
  {
    categoryId: 10,
    categoryName: "离子交换色谱柱",
    parentId: 1,
    priority: 10,
    matchRules: {
      productType: ["HPLC Column"],
      nameKeywords: ["Ion Exchange", "IEX", "SCX", "SAX", "WCX", "WAX"],
      specKeywords: ["Ion Exchange", "IEX"],
    },
  },
  {
    categoryId: 11,
    categoryName: "尺寸排阻色谱柱",
    parentId: 1,
    priority: 10,
    matchRules: {
      productType: ["HPLC Column"],
      nameKeywords: ["SEC", "Size Exclusion", "GPC", "GFC"],
      specKeywords: ["SEC", "GPC"],
    },
  },
  {
    categoryId: 12,
    categoryName: "正相色谱柱",
    parentId: 1,
    priority: 8,
    matchRules: {
      productType: ["HPLC Column"],
      nameKeywords: ["Silica", "NH2", "Amino", "CN", "Cyano", "Diol"],
      specKeywords: ["Silica", "NH2", "CN"],
    },
  },
  {
    categoryId: 13,
    categoryName: "混合模式色谱柱",
    parentId: 1,
    priority: 10,
    matchRules: {
      productType: ["HPLC Column"],
      nameKeywords: ["Mixed Mode", "Mixed-Mode"],
      specKeywords: ["Mixed Mode"],
    },
  },
  {
    categoryId: 14,
    categoryName: "其他HPLC色谱柱",
    parentId: 1,
    priority: 1, // Lowest priority - catch-all
    matchRules: {
      productType: ["HPLC Column"],
    },
  },

  // GC Columns (Parent ID: 2)
  {
    categoryId: 15,
    categoryName: "非极性GC柱",
    parentId: 2,
    priority: 10,
    matchRules: {
      productType: ["GC Column"],
      nameKeywords: ["ZB-1", "DB-1", "HP-1", "Rxi-1", "VF-1", "BP-1"],
    },
  },
  {
    categoryId: 16,
    categoryName: "中极性GC柱",
    parentId: 2,
    priority: 10,
    matchRules: {
      productType: ["GC Column"],
      nameKeywords: ["ZB-5", "DB-5", "HP-5", "Rxi-5", "VF-5", "BP-5"],
    },
  },
  {
    categoryId: 17,
    categoryName: "极性GC柱",
    parentId: 2,
    priority: 10,
    matchRules: {
      productType: ["GC Column"],
      nameKeywords: ["WAX", "FFAP", "Carbowax", "Polyethylene Glycol"],
    },
  },
  // Note: GC chiral columns category ID needs to be verified
  // Skipping for now until we confirm the correct category IDs

  // SPE Cartridges (Parent ID: 3)
  // Note: SPE and Sample Preparation category IDs need to be verified
  // Skipping for now - focusing on HPLC columns first
];

function matchProduct(product: any): number[] {
  const matchedCategories: number[] = [];
  const scores: Map<number, number> = new Map();

  for (const rule of categoryRules) {
    let score = 0;

    // Check product type
    if (rule.matchRules.productType) {
      const productType = product.productType || "";
      for (const type of rule.matchRules.productType) {
        if (productType.includes(type)) {
          score += 10;
          break;
        }
      }
    }

    // Check name keywords
    if (rule.matchRules.nameKeywords) {
      const name = (product.name || "").toLowerCase();
      for (const keyword of rule.matchRules.nameKeywords) {
        if (name.includes(keyword.toLowerCase())) {
          score += 5;
          break;
        }
      }
    }

    // Check specifications
    if (rule.matchRules.specKeywords && product.specifications) {
      const specs = JSON.stringify(product.specifications).toLowerCase();
      for (const keyword of rule.matchRules.specKeywords) {
        if (specs.includes(keyword.toLowerCase())) {
          score += 5;
          break;
        }
      }
    }

    // Check brand-specific rules
    if (rule.matchRules.brandSpecific) {
      const { brand, condition } = rule.matchRules.brandSpecific;
      if (product.brand === brand && condition(product)) {
        score += 20; // High score for brand-specific matches
      }
    }

    // Apply priority
    score *= rule.priority;

    if (score > 0) {
      scores.set(rule.categoryId, score);
    }
  }

  // Sort by score and return top matches
  const sortedCategories = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([categoryId]) => categoryId);

  // Return primary category (highest score) and secondary categories if applicable
  if (sortedCategories.length > 0) {
    matchedCategories.push(sortedCategories[0]); // Primary category

    // Add parent category if not already included
    const primaryRule = categoryRules.find((r) => r.categoryId === sortedCategories[0]);
    if (primaryRule?.parentId && !matchedCategories.includes(primaryRule.parentId)) {
      matchedCategories.push(primaryRule.parentId);
    }
  }

  return matchedCategories;
}

async function matchUncategorizedProducts() {
  console.log("🔍 Starting product category matching...\n");

  // Get all uncategorized products
  const uncategorizedProducts = await db
    .select({
      id: products.id,
      productId: products.productId,
      name: products.name,
      brand: products.brand,
      productType: products.productType,
      phaseType: products.phaseType,
      specifications: products.specifications,
    })
    .from(products)
    .leftJoin(productCategories, eq(products.id, productCategories.productId))
    .where(isNull(productCategories.productId));

  console.log(`Found ${uncategorizedProducts.length} uncategorized products\n`);

  let matched = 0;
  let unmatched = 0;
  const categoryStats: Map<number, number> = new Map();

  for (const product of uncategorizedProducts) {
    try {
      const categoryIds = matchProduct(product);

      if (categoryIds.length > 0) {
        // Insert category mappings
        for (let i = 0; i < categoryIds.length; i++) {
          const categoryId = categoryIds[i];
          const isPrimary = i === 0 ? 1 : 0;

          await db.insert(productCategories).values({
            productId: product.id,
            categoryId: categoryId,
            isPrimary: isPrimary,
          });

          // Update stats
          categoryStats.set(categoryId, (categoryStats.get(categoryId) || 0) + 1);
        }

        matched++;
        if (matched % 100 === 0) {
          console.log(`✅ Matched ${matched}/${uncategorizedProducts.length} products...`);
        }
      } else {
        unmatched++;
        console.log(`⚠️  No match for ${product.productId}: ${product.name}`);
      }
    } catch (error) {
      console.error(`❌ Error matching ${product.productId}:`, error);
      unmatched++;
    }
  }

  console.log(`\n\n📊 Matching Results:`);
  console.log(`   ✅ Matched: ${matched} products`);
  console.log(`   ⚠️  Unmatched: ${unmatched} products`);
  console.log(`   📈 Success Rate: ${((matched / uncategorizedProducts.length) * 100).toFixed(1)}%`);

  console.log(`\n📊 Category Distribution:`);
  const sortedStats = Array.from(categoryStats.entries()).sort((a, b) => b[1] - a[1]);
  for (const [categoryId, count] of sortedStats) {
    const rule = categoryRules.find((r) => r.categoryId === categoryId);
    console.log(`   ${rule?.categoryName || `Category ${categoryId}`}: ${count} products`);
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
