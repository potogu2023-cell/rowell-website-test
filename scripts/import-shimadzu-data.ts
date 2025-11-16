import { drizzle } from "drizzle-orm/mysql2";
import { products } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";

const db = drizzle(process.env.DATABASE_URL!);

interface VerifiedProduct {
  partNumber: string;
  name: string;
  seriesName?: string;
  description: string;
  features?: string[];
  specifications: Record<string, any>;
  catalogUrl?: string;
  dataSource: string;
  extractedAt: string;
  extractionMethod: string;
  status: string;
}

async function importShimadzuData() {
  console.log('=== 导入Shimadzu验证数据 ===\n');
  
  // Read verified data
  const verifiedDataPath = '/home/ubuntu/upload/shimadzu_verified_data.json';
  const verifiedData: VerifiedProduct[] = JSON.parse(
    fs.readFileSync(verifiedDataPath, 'utf-8')
  );
  
  console.log(`读取到 ${verifiedData.length} 条验证数据\n`);
  
  // Filter by status
  const successfulProducts = verifiedData.filter(p => p.status === 'verified');
  const notFoundProducts = verifiedData.filter(p => p.status === 'not_found');
  const specsNotMatchedProducts = verifiedData.filter(p => p.status === 'specs_not_matched');
  const failedProducts = verifiedData.filter(p => ['series_not_found', 'failed'].includes(p.status));
  
  console.log('📊 数据分类:');
  console.log(`  ✅ 成功验证: ${successfulProducts.length}`);
  console.log(`  ❌ 页面未找到: ${notFoundProducts.length}`);
  console.log(`  ⚠️ 规格不匹配: ${specsNotMatchedProducts.length}`);
  console.log(`  ❌ 提取失败: ${failedProducts.length}\n`);
  
  // Import successful products
  let updatedCount = 0;
  let notFoundInDbCount = 0;
  let errorCount = 0;
  
  console.log('开始导入成功验证的产品...\n');
  
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
      
      // Update product with verified data
      await db
        .update(products)
        .set({
          description: product.description,
          specifications: JSON.stringify(product.specifications),
          status: 'verified',
          updatedAt: new Date(),
        })
        .where(eq(products.partNumber, product.partNumber));
      
      updatedCount++;
      
      if (updatedCount % 50 === 0) {
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
  
  // Handle not found products
  console.log('\n=== 处理未找到的产品 ===');
  console.log(`共 ${notFoundProducts.length} 个产品在官网未找到`);
  console.log('建议: 标记为discontinued或删除');
  
  // Mark not found products as discontinued
  let markedCount = 0;
  for (const product of notFoundProducts) {
    try {
      const result = await db
        .update(products)
        .set({
          status: 'discontinued',
          updatedAt: new Date(),
        })
        .where(eq(products.partNumber, product.partNumber));
      
      if (result[0].affectedRows > 0) {
        markedCount++;
      }
    } catch (error) {
      console.error(`❌ 标记失败: ${product.partNumber}`, error);
    }
  }
  
  console.log(`✅ 已标记 ${markedCount} 个产品为discontinued`);
  
  // Handle specs not matched products
  console.log('\n=== 处理规格不匹配的产品 ===');
  console.log(`共 ${specsNotMatchedProducts.length} 个产品规格不匹配`);
  console.log('这些产品有描述但规格表中找不到对应型号');
  
  // Still import description for specs not matched products
  let specsNotMatchedUpdated = 0;
  for (const product of specsNotMatchedProducts) {
    try {
      await db
        .update(products)
        .set({
          description: product.description,
          status: 'needs_review',
          updatedAt: new Date(),
        })
        .where(eq(products.partNumber, product.partNumber));
      
      specsNotMatchedUpdated++;
    } catch (error) {
      console.error(`❌ 更新失败: ${product.partNumber}`, error);
    }
  }
  
  console.log(`✅ 已更新 ${specsNotMatchedUpdated} 个产品的描述（标记为needs_review）`);
  
  // Summary
  console.log('\n=== 总结 ===');
  console.log(`✅ 验证并更新: ${updatedCount} 个产品`);
  console.log(`✅ 标记为discontinued: ${markedCount} 个产品`);
  console.log(`✅ 更新描述（需审核）: ${specsNotMatchedUpdated} 个产品`);
  console.log(`⚠️ 提取失败: ${failedProducts.length} 个产品（需人工处理）`);
  
  process.exit(0);
}

importShimadzuData().catch(console.error);
