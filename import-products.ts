import { drizzle } from "drizzle-orm/mysql2";
import { products } from "./drizzle/schema";
import * as fs from "fs";

// 读取处理后的产品数据
const productsData = JSON.parse(
  fs.readFileSync("/home/ubuntu/processed_products_unique.json", "utf-8")
);

async function importProducts() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  console.log(`准备导入 ${productsData.length} 个产品...`);

  // 批量插入产品
  const insertData = productsData.map((p: any) => ({
    productId: p.id,
    partNumber: p.partNumber,
    brand: p.brand,
    prefix: p.prefix,
    status: p.status || "new",
    name: null,
    description: null,
  }));

  try {
    await db.insert(products).values(insertData);
    console.log(`✓ 成功导入 ${productsData.length} 个产品`);
  } catch (error) {
    console.error("导入失败:", error);
    process.exit(1);
  }

  process.exit(0);
}

importProducts();
