import { drizzle } from "drizzle-orm/mysql2";
import { products, productCategories } from "../drizzle/schema";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function checkClassification() {
  console.log("\n📊 产品分类覆盖情况检查\n");
  
  // Total products
  const totalResult = await db.select({ count: sql<number>`count(*)` }).from(products);
  const total = Number(totalResult[0].count);
  
  // Classified products (have at least one category)
  const classifiedResult = await db
    .select({ count: sql<number>`count(distinct ${productCategories.productId})` })
    .from(productCategories);
  const classified = Number(classifiedResult[0].count);
  
  // Unclassified products
  const unclassified = total - classified;
  const coverage = ((classified / total) * 100).toFixed(1);
  
  console.log(`总产品数: ${total}`);
  console.log(`已分类产品: ${classified} (${coverage}%)`);
  console.log(`未分类产品: ${unclassified} (${(100 - Number(coverage)).toFixed(1)}%)`);
  
  if (unclassified > 0) {
    console.log(`\n⚠️  发现 ${unclassified} 个未分类产品`);
  } else {
    console.log(`\n✅ 所有产品都已分类！`);
  }
  
  console.log("\n");
  process.exit(0);
}

checkClassification();
