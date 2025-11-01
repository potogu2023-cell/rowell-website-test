import { drizzle } from "drizzle-orm/mysql2";
import { products, categories, productCategories } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { fileURLToPath } from "url";
import * as path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

// 产品类型到分类slug的映射
const productTypeToCategoryMap: Record<string, string> = {
  "HPLC Column": "hplc-columns",
  "GC Column": "gc-columns",
  "Guard Column": "guard-columns",
  "SPE Cartridge": "spe-cartridges",
  "Sample Vials": "vials-caps",
  "Septa & Closures": "vials-caps",
  "Tubing & Fittings": "fittings-tubing",
  "Syringes & Needles": "syringes-needles",
  "Membrane Filters": "membrane-filters",
  "Filtration": "syringe-filters",
  "Chromatography Consumables": "chromatography-supplies",
  "Centrifuge Tubes": "centrifuge-tubes",
};

async function createProductCategories() {
  console.log("=".repeat(80));
  console.log("创建产品分类关联");
  console.log("=".repeat(80));

  // 1. 获取所有分类
  console.log("\n[1/5] 获取所有分类...");
  const allCategories = await db.select().from(categories);
  console.log(`   找到 ${allCategories.length} 个分类`);

  // 创建slug到ID的映射
  const slugToIdMap: Record<string, number> = {};
  allCategories.forEach(cat => {
    slugToIdMap[cat.slug] = cat.id;
  });

  // 2. 获取所有产品
  console.log("\n[2/5] 获取所有产品...");
  const allProducts = await db.select().from(products);
  console.log(`   找到 ${allProducts.length} 个产品`);

  // 3. 清空现有关联
  console.log("\n[3/5] 清空现有产品分类关联...");
  await db.delete(productCategories);
  console.log("   清空完成");

  // 4. 创建新的关联
  console.log("\n[4/5] 创建产品分类关联...");
  const associations: Array<{ productId: number; categoryId: number }> = [];
  const unmappedProducts: Array<{ id: number; productType: string }> = [];

  for (const product of allProducts) {
    const categorySlug = productTypeToCategoryMap[product.productType];
    
    if (categorySlug && slugToIdMap[categorySlug]) {
      associations.push({
        productId: product.id,
        categoryId: slugToIdMap[categorySlug],
      });
    } else {
      unmappedProducts.push({
        id: product.id,
        productType: product.productType,
      });
    }
  }

  console.log(`   创建 ${associations.length} 个关联`);
  console.log(`   未映射产品: ${unmappedProducts.length}`);

  if (unmappedProducts.length > 0) {
    console.log("\n   未映射产品类型:");
    const typeCount: Record<string, number> = {};
    unmappedProducts.forEach(p => {
      typeCount[p.productType] = (typeCount[p.productType] || 0) + 1;
    });
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`     ${type}: ${count}`);
    });
  }

  // 批量插入关联
  if (associations.length > 0) {
    const batchSize = 500;
    let inserted = 0;

    for (let i = 0; i < associations.length; i += batchSize) {
      const batch = associations.slice(i, i + batchSize);
      await db.insert(productCategories).values(batch);
      inserted += batch.length;
      process.stdout.write(`\r   进度: ${inserted}/${associations.length} (${Math.round(inserted/associations.length*100)}%)`);
    }
    console.log("\n");
  }

  // 5. 统计每个分类的产品数量
  console.log("\n[5/5] 统计每个分类的产品数量...");
  
  for (const [productType, categorySlug] of Object.entries(productTypeToCategoryMap)) {
    const categoryId = slugToIdMap[categorySlug];
    if (categoryId) {
      const count = associations.filter(a => a.categoryId === categoryId).length;
      if (count > 0) {
        console.log(`   ${productType} (${categorySlug}): ${count} 个产品`);
      }
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log(`✅ 产品分类关联创建完成：${associations.length} 个关联`);
  console.log("=".repeat(80));
}

createProductCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 创建失败:", error);
    process.exit(1);
  });
