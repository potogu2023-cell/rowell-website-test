import { getDb } from "./server/db";
import { products } from "./drizzle/schema";
import { sql, isNotNull, isNull } from "drizzle-orm";
import * as fs from "fs";

async function generateProgressReport() {
  console.log("🚀 Generating comprehensive progress report...\n");

  const db = await getDb();
  if (!db) {
    console.error("❌ Cannot connect to database");
    process.exit(1);
  }

  // Get all products
  const allProducts = await db.select().from(products);
  const totalProducts = allProducts.length;

  // Count products with images
  const productsWithImages = allProducts.filter((p) => p.imageUrl);
  const productsWithoutImages = allProducts.filter((p) => !p.imageUrl);

  // Group by brand
  const brandStats: Record<
    string,
    { total: number; withImages: number; withoutImages: number }
  > = {};
  allProducts.forEach((p) => {
    if (!brandStats[p.brand]) {
      brandStats[p.brand] = { total: 0, withImages: 0, withoutImages: 0 };
    }
    brandStats[p.brand].total++;
    if (p.imageUrl) {
      brandStats[p.brand].withImages++;
    } else {
      brandStats[p.brand].withoutImages++;
    }
  });

  // Generate report
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalProducts,
      productsWithImages: productsWithImages.length,
      productsWithoutImages: productsWithoutImages.length,
      completionRate: (
        (productsWithImages.length / totalProducts) *
        100
      ).toFixed(2),
    },
    brandBreakdown: Object.entries(brandStats)
      .map(([brand, stats]) => ({
        brand,
        total: stats.total,
        withImages: stats.withImages,
        withoutImages: stats.withoutImages,
        completionRate: ((stats.withImages / stats.total) * 100).toFixed(2),
      }))
      .sort((a, b) => b.total - a.total),
  };

  // Save report to JSON
  fs.writeFileSync(
    "/home/ubuntu/ai_images_progress_report.json",
    JSON.stringify(report, null, 2)
  );

  // Print summary
  console.log("=" .repeat(80));
  console.log("📊 AI图片生成项目进度报告");
  console.log("=" .repeat(80));
  console.log(`生成时间: ${new Date().toLocaleString("zh-CN")}\n`);

  console.log("📈 总体进度");
  console.log("-".repeat(80));
  console.log(`总产品数: ${totalProducts}`);
  console.log(`✅ 已有图片: ${productsWithImages.length}`);
  console.log(`❌ 缺少图片: ${productsWithoutImages.length}`);
  console.log(
    `📊 完成率: ${report.summary.completionRate}%\n`
  );

  console.log("🏢 品牌分布");
  console.log("-".repeat(80));
  console.log(
    "品牌".padEnd(30) +
      "总数".padEnd(10) +
      "已有图片".padEnd(12) +
      "缺少图片".padEnd(12) +
      "完成率"
  );
  console.log("-".repeat(80));
  report.brandBreakdown.forEach((stat) => {
    console.log(
      stat.brand.padEnd(30) +
        stat.total.toString().padEnd(10) +
        stat.withImages.toString().padEnd(12) +
        stat.withoutImages.toString().padEnd(12) +
        `${stat.completionRate}%`
    );
  });

  console.log("\n" + "=".repeat(80));
  console.log("✅ 报告已保存到: /home/ubuntu/ai_images_progress_report.json");
  console.log("=".repeat(80) + "\n");

  process.exit(0);
}

generateProgressReport();
