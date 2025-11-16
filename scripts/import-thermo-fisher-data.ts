import { drizzle } from "drizzle-orm/mysql2";
import { products } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";

const db = drizzle(process.env.DATABASE_URL!);

async function importThermoFisherData() {
  console.log('=== 导入Thermo Fisher验证数据 ===\n');
  
  // Read verified data
  const verifiedDataPath = '/home/ubuntu/upload/thermo_fisher_verified_data(1).json';
  const verifiedData = JSON.parse(
    fs.readFileSync(verifiedDataPath, 'utf-8')
  );
  
  console.log(`读取到 ${verifiedData.length} 条验证数据\n`);
  
  // All products should have data
  const successfulProducts = verifiedData.filter((p: any) => 
    p.description || p.specifications
  );
  
  console.log('📊 数据分类:');
  console.log(`  ✅ 有数据: ${successfulProducts.length}`);
  console.log(`  ⚠️ 无数据: ${verifiedData.length - successfulProducts.length}`);
  
  // Import successful products
  let updatedCount = 0;
  let notFoundInDbCount = 0;
  let errorCount = 0;
  
  console.log('\n开始导入验证数据...\n');
  
  for (const product of successfulProducts) {
    try {
      // Find product in database by partNumber
      const existingProduct = await db
        .select()
        .from(products)
        .where(eq(products.partNumber, product.partNumber))
        .limit(1);
      
      if (existingProduct.length === 0) {
        console.log(`⚠️ 产品不存在于数据库: ${product.partNumber}`);
        notFoundInDbCount++;
        continue;
      }
      
      // Prepare update data
      const updateData: any = {
        status: 'verified',
        updatedAt: new Date(),
      };
      
      if (product.description) {
        updateData.description = product.description;
      }
      
      if (product.specifications) {
        updateData.specifications = JSON.stringify(product.specifications);
      }
      
      if (product.catalogUrl) {
        updateData.catalogUrl = product.catalogUrl;
      }
      
      // Update product
      await db
        .update(products)
        .set(updateData)
        .where(eq(products.partNumber, product.partNumber));
      
      updatedCount++;
      
      if (updatedCount % 20 === 0) {
        console.log(`已更新 ${updatedCount} 个产品...`);
      }
    } catch (error) {
      console.error(`❌ 更新失败: ${product.partNumber}`, error);
      errorCount++;
    }
  }
  
  console.log('\n=== 导入完成 ===');
  console.log(`✅ 成功更新: ${updatedCount} 个产品`);
  console.log(`⚠️ 数据库中不存在: ${notFoundInDbCount} 个产品`);
  console.log(`❌ 更新失败: ${errorCount} 个产品`);
  
  // Mark all Thermo Fisher products with existing data as verified
  console.log('\n=== 标记已有数据的产品为verified ===');
  const allThermoProducts = await db
    .select()
    .from(products)
    .where(eq(products.brand, 'Thermo Fisher Scientific'));
  
  const alreadyHaveData = allThermoProducts.filter(
    p => (p.description && p.description.length > 0) && 
         (p.specifications && p.specifications !== '{}') && 
         p.status !== 'verified'
  );
  
  console.log(`找到 ${alreadyHaveData.length} 个已有数据但未标记为verified的产品`);
  
  let markedVerifiedCount = 0;
  for (const product of alreadyHaveData) {
    try {
      await db
        .update(products)
        .set({
          status: 'verified',
          updatedAt: new Date(),
        })
        .where(eq(products.id, product.id));
      
      markedVerifiedCount++;
    } catch (error) {
      console.error(`❌ 标记失败: ${product.partNumber}`, error);
    }
  }
  
  console.log(`✅ 已标记 ${markedVerifiedCount} 个产品为verified`);
  
  // Summary
  console.log('\n=== 总结 ===');
  console.log(`✅ 新补充数据并验证: ${updatedCount} 个产品`);
  console.log(`✅ 标记已有数据为verified: ${markedVerifiedCount} 个产品`);
  console.log(`📊 Thermo Fisher总验证数: ${updatedCount + markedVerifiedCount} 个`);
  console.log(`📊 Thermo Fisher验证覆盖率: ${((updatedCount + markedVerifiedCount) / 366 * 100).toFixed(1)}%`);
  
  process.exit(0);
}

importThermoFisherData().catch(console.error);
