import { drizzle } from "drizzle-orm/mysql2";
import { products } from "../drizzle/schema";
import { eq, or } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

// 品牌合并映射
const brandMergeMap: Record<string, { target: string; prefix: string }> = {
  "Merck/Sigma-Aldrich": {
    target: "Merck",
    prefix: "MERC",
  },
  "Thermo Fisher": {
    target: "Thermo Fisher Scientific",
    prefix: "THER",
  },
};

async function mergeBrands() {
  console.log("=".repeat(80));
  console.log("品牌合并操作");
  console.log("=".repeat(80));

  // 1. 查询当前品牌分布
  console.log("\n[1/4] 查询当前品牌分布...");
  const allProducts = await db.select().from(products);
  const brandCount: Record<string, number> = {};
  allProducts.forEach(p => {
    brandCount[p.brand] = (brandCount[p.brand] || 0) + 1;
  });

  console.log("\n   合并前品牌分布:");
  Object.entries(brandCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([brand, count]) => {
      console.log(`     ${brand}: ${count}`);
    });
  console.log(`   总品牌数: ${Object.keys(brandCount).length}`);

  // 2. 执行品牌合并
  console.log("\n[2/4] 执行品牌合并...");
  let totalUpdated = 0;

  for (const [oldBrand, { target, prefix }] of Object.entries(brandMergeMap)) {
    const productsToUpdate = await db
      .select()
      .from(products)
      .where(eq(products.brand, oldBrand));

    if (productsToUpdate.length === 0) {
      console.log(`   ${oldBrand} → ${target}: 0个产品（跳过）`);
      continue;
    }

    // 更新brand和prefix字段
    for (const product of productsToUpdate) {
      // 更新productId（如果使用旧的prefix）
      let newProductId = product.productId;
      if (product.prefix && product.productId.startsWith(product.prefix)) {
        newProductId = product.productId.replace(product.prefix, prefix);
      }

      await db
        .update(products)
        .set({
          brand: target,
          prefix: prefix,
          productId: newProductId,
        })
        .where(eq(products.id, product.id));

      totalUpdated++;
    }

    console.log(`   ${oldBrand} → ${target}: ${productsToUpdate.length}个产品`);
  }

  console.log(`\n   总更新数: ${totalUpdated}`);

  // 3. 验证合并结果
  console.log("\n[3/4] 验证合并结果...");
  const updatedProducts = await db.select().from(products);
  const newBrandCount: Record<string, number> = {};
  updatedProducts.forEach(p => {
    newBrandCount[p.brand] = (newBrandCount[p.brand] || 0) + 1;
  });

  console.log("\n   合并后品牌分布:");
  Object.entries(newBrandCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([brand, count]) => {
      console.log(`     ${brand}: ${count}`);
    });
  console.log(`   总品牌数: ${Object.keys(newBrandCount).length}`);
  console.log(`   总产品数: ${updatedProducts.length}`);

  // 4. 统计
  console.log("\n[4/4] 合并统计");
  console.log(`   品牌数变化: ${Object.keys(brandCount).length} → ${Object.keys(newBrandCount).length}`);
  console.log(`   产品数保持: ${allProducts.length} → ${updatedProducts.length}`);

  // 验证是否还有旧品牌名
  const remainingOldBrands = Object.keys(brandMergeMap).filter(
    oldBrand => newBrandCount[oldBrand] > 0
  );

  if (remainingOldBrands.length > 0) {
    console.log("\n   ⚠️ 警告：以下旧品牌名仍然存在:");
    remainingOldBrands.forEach(brand => {
      console.log(`     ${brand}: ${newBrandCount[brand]}`);
    });
  } else {
    console.log("\n   ✅ 所有旧品牌名已成功合并");
  }

  console.log("\n" + "=".repeat(80));
  console.log(`✅ 品牌合并完成：更新了 ${totalUpdated} 个产品`);
  console.log("=".repeat(80));
}

mergeBrands()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 合并失败:", error);
    process.exit(1);
  });
