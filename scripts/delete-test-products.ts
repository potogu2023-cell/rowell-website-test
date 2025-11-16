import { drizzle } from "drizzle-orm/mysql2";
import { products } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function deleteTestProducts() {
  console.log('=== 删除测试产品 ===\n');
  
  try {
    // Delete TestBrand products
    const testBrandResult = await db.delete(products).where(eq(products.brand, 'TestBrand'));
    console.log(`✅ 删除TestBrand产品: ${testBrandResult[0].affectedRows}个`);
    
    // Delete duplicate Thermo Fisher products
    const thermoResult = await db.delete(products).where(eq(products.brand, 'Thermo Fisher'));
    console.log(`✅ 删除Thermo Fisher重复产品: ${thermoResult[0].affectedRows}个`);
    
    const totalDeleted = testBrandResult[0].affectedRows + thermoResult[0].affectedRows;
    
    console.log('\n=== 删除完成 ===');
    console.log(`总共删除: ${totalDeleted}个产品`);
    
    if (totalDeleted > 0) {
      console.log('\n建议: 运行 check-db-status.ts 验证删除结果');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 删除失败:', error);
    process.exit(1);
  }
}

deleteTestProducts().catch(console.error);
