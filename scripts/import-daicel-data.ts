import { drizzle } from "drizzle-orm/mysql2";
import { products } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";

const db = drizzle(process.env.DATABASE_URL!);

async function importDaicelData() {
  console.log('=== 导入Daicel验证数据 ===\n');
  
  // Read verified data
  const verifiedDataPath = '/home/ubuntu/upload/daicel_verified_data.json';
  const verifiedData = JSON.parse(
    fs.readFileSync(verifiedDataPath, 'utf-8')
  );
  
  console.log(`读取到 ${verifiedData.length} 条验证数据\n`);
  
  // Read issues
  const issuesPath = '/home/ubuntu/upload/daicel_issues.json';
  const issues = JSON.parse(fs.readFileSync(issuesPath, 'utf-8'));
  
  console.log(`读取到 ${issues.length} 个问题记录\n`);
  
  // Filter successful products
  const successfulProducts = verifiedData.filter((p: any) => 
    p.description || p.specifications
  );
  
  console.log('📊 数据分类:');
  console.log(`  ✅ 成功提取: ${successfulProducts.length}`);
  console.log(`  ⚠️ 提取失败: ${verifiedData.length - successfulProducts.length}`);
  
  // Import successful products
  let updatedCount = 0;
  let notFoundInDbCount = 0;
  let errorCount = 0;
  
  console.log('\n开始导入成功验证的产品...\n');
  
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
      
      // Update product
      await db
        .update(products)
        .set(updateData)
        .where(eq(products.partNumber, product.partNumber));
      
      updatedCount++;
      
      if (updatedCount % 10 === 0) {
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
  
  // Mark products with page_not_found as discontinued
  const pageNotFoundIssues = issues.filter((i: any) => i.issue === 'page_not_found');
  console.log('\n=== 处理页面未找到的产品 ===');
  console.log(`共 ${pageNotFoundIssues.length} 个产品页面未找到`);
  
  let discontinuedCount = 0;
  for (const issue of pageNotFoundIssues) {
    try {
      const result = await db
        .update(products)
        .set({
          status: 'discontinued',
          updatedAt: new Date(),
        })
        .where(eq(products.partNumber, issue.partNumber));
      
      if (result[0].affectedRows > 0) {
        discontinuedCount++;
      }
    } catch (error) {
      console.error(`❌ 标记失败: ${issue.partNumber}`, error);
    }
  }
  
  console.log(`✅ 已标记 ${discontinuedCount} 个产品为discontinued`);
  
  // Mark products with extraction failed as needs_review
  const extractionFailedIssues = issues.filter((i: any) => 
    i.issue !== 'page_not_found'
  );
  console.log('\n=== 处理提取失败的产品 ===');
  console.log(`共 ${extractionFailedIssues.length} 个产品提取失败`);
  
  let needsReviewCount = 0;
  for (const issue of extractionFailedIssues) {
    try {
      const result = await db
        .update(products)
        .set({
          status: 'needs_review',
          updatedAt: new Date(),
        })
        .where(eq(products.partNumber, issue.partNumber));
      
      if (result[0].affectedRows > 0) {
        needsReviewCount++;
      }
    } catch (error) {
      console.error(`❌ 标记失败: ${issue.partNumber}`, error);
    }
  }
  
  console.log(`✅ 已标记 ${needsReviewCount} 个产品为needs_review`);
  
  // Mark all Daicel products with existing data as verified
  console.log('\n=== 标记已有数据的产品为verified ===');
  const allDaicelProducts = await db
    .select()
    .from(products)
    .where(eq(products.brand, 'Daicel'));
  
  const alreadyHaveData = allDaicelProducts.filter(
    p => (p.description && p.description.length > 0) && 
         (p.specifications && p.specifications !== '{}') && 
         p.status !== 'verified' && 
         p.status !== 'discontinued' &&
         p.status !== 'needs_review'
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
  console.log(`⚠️ 页面未找到（标记discontinued）: ${discontinuedCount} 个产品`);
  console.log(`⚠️ 提取失败（标记needs_review）: ${needsReviewCount} 个产品`);
  console.log(`📊 Daicel总验证数: ${updatedCount + markedVerifiedCount} 个`);
  console.log(`📊 Daicel验证覆盖率: ${((updatedCount + markedVerifiedCount) / 277 * 100).toFixed(1)}%`);
  
  process.exit(0);
}

importDaicelData().catch(console.error);
