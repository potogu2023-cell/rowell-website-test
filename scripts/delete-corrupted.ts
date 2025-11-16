import { drizzle } from "drizzle-orm/mysql2";
import { products } from "../drizzle/schema";
import { inArray } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function deleteCorrupted() {
  console.log("\n🗑️  删除损坏的产品数据\n");
  
  const corruptedIds = [510001, 510002, 510003];
  
  const result = await db
    .delete(products)
    .where(inArray(products.id, corruptedIds));
  
  console.log(`✅ 已删除 ${result[0].affectedRows} 个损坏的产品\n`);
  process.exit(0);
}

deleteCorrupted();
