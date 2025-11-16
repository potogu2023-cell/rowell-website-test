import { drizzle } from "drizzle-orm/mysql2";
import { products, productCategories } from "../drizzle/schema";
import { sql, notInArray } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function findUnclassified() {
  console.log("\n🔍 查找未分类产品\n");
  
  // Get all classified product IDs
  const classifiedIds = await db
    .selectDistinct({ id: productCategories.productId })
    .from(productCategories);
  
  const classifiedIdList = classifiedIds.map(r => r.id);
  
  // Find unclassified products
  const unclassified = await db
    .select({
      id: products.id,
      productId: products.productId,
      partNumber: products.partNumber,
      brand: products.brand,
      name: products.name,
    })
    .from(products)
    .where(notInArray(products.id, classifiedIdList.length > 0 ? classifiedIdList : [0]))
    .limit(10);
  
  console.log(`找到 ${unclassified.length} 个未分类产品:\n`);
  
  unclassified.forEach((p, i) => {
    console.log(`${i + 1}. ID: ${p.id}`);
    console.log(`   Product ID: ${p.productId}`);
    console.log(`   Part Number: ${p.partNumber}`);
    console.log(`   Brand: ${p.brand}`);
    console.log(`   Name: ${p.name}`);
    console.log();
  });
  
  process.exit(0);
}

findUnclassified();
