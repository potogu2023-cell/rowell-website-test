import { drizzle } from "drizzle-orm/mysql2";
import { products } from "../drizzle/schema";
import { sql, ne } from "drizzle-orm";
import * as fs from "fs";

const db = drizzle(process.env.DATABASE_URL!);

async function analyzeUnverified() {
  console.log("\n📊 分析未验证产品\n");
  
  // 统计各状态产品数量
  const statusStats = await db
    .select({
      status: products.status,
      count: sql<number>`count(*)`,
    })
    .from(products)
    .groupBy(products.status);
  
  console.log("产品状态分布:");
  statusStats.forEach(s => {
    console.log(`  ${s.status}: ${s.count} 个`);
  });
  
  // 统计各品牌未验证产品数量
  const unverifiedByBrand = await db
    .select({
      brand: products.brand,
      count: sql<number>`count(*)`,
    })
    .from(products)
    .where(ne(products.status, 'verified'))
    .groupBy(products.brand)
    .orderBy(sql`count(*) DESC`);
  
  console.log("\n未验证产品按品牌分布:");
  unverifiedByBrand.forEach(b => {
    console.log(`  ${b.brand}: ${b.count} 个`);
  });
  
  // 统计描述质量分布
  const descQualityStats = await db
    .select({
      quality: products.descriptionQuality,
      count: sql<number>`count(*)`,
    })
    .from(products)
    .groupBy(products.descriptionQuality);
  
  console.log("\n描述质量分布:");
  descQualityStats.forEach(q => {
    console.log(`  ${q.quality}: ${q.count} 个`);
  });
  
  // 获取所有未验证产品的详细信息
  const unverifiedProducts = await db
    .select({
      id: products.id,
      productId: products.productId,
      partNumber: products.partNumber,
      brand: products.brand,
      name: products.name,
      status: products.status,
      descriptionQuality: products.descriptionQuality,
      hasDescription: sql<boolean>`CASE WHEN description IS NOT NULL AND description != '' THEN 1 ELSE 0 END`,
      hasSpecs: sql<boolean>`CASE WHEN specifications IS NOT NULL THEN 1 ELSE 0 END`,
      hasImage: sql<boolean>`CASE WHEN imageUrl IS NOT NULL AND imageUrl != '' THEN 1 ELSE 0 END`,
    })
    .from(products)
    .where(ne(products.status, 'verified'));
  
  // 保存未验证产品清单
  fs.writeFileSync(
    '/home/ubuntu/UNVERIFIED_PRODUCTS.json',
    JSON.stringify(unverifiedProducts, null, 2)
  );
  
  console.log(`\n📄 未验证产品清单已保存: /home/ubuntu/UNVERIFIED_PRODUCTS.json`);
  console.log(`   共 ${unverifiedProducts.length} 个未验证产品\n`);
  
  process.exit(0);
}

analyzeUnverified();
