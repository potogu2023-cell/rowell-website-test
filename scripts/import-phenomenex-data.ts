import { drizzle } from "drizzle-orm/mysql2";
import { products } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";

const db = drizzle(process.env.DATABASE_URL!);

interface VerifiedProduct {
  partNumber: string;
  name: string;
  description?: string;
  specifications: Record<string, any>;
  features?: string[];
  applications?: string;
  catalogUrl?: string;
  dataSource: string;
  extractedAt: string;
  extractionMethod: string;
  status: string;
}

async function importPhenomenexData() {
  console.log('=== 导入Phenomenex验证数据 ===\n');
  
  // Read verified data
  const verifiedDataPath = '/home/ubuntu/upload/phenomenex_verified_data.json';
  const verifiedData: VerifiedProduct[] = JSON.parse(
    fs.readFileSync(verifiedDataPath, 'utf-8')
  );
  
  console.log(`读取到 ${verifiedData.length} 条验证数据\n`);
  
  // Read issues
  const issuesPath = '/home/ubuntu/upload/phenomenex_issues.json';
  const issues = JSON.parse(fs.readFileSync(issuesPath, 'utf-8'));
  
  console.log(`读取到 ${issues.length} 个问题记录\n`);
  
  // Filter by status
  const successfulProducts = verifiedData.filter(p => p.status === 'verified');
  
  console.log('📊 数据分类:');
  console.log(`  ✅ 成功验证: ${successfulProducts.length}`);
  
  // Analyze issues
  const issueTypes: Record<string, number> = {};
  issues.forEach((issue: any) => {
    const type = issue.issue || 'unknown';
    issueTypes[type] = (issueTypes[type] || 0) + 1;
  });
  
  console.log('\n⚠️ 问题分类:');
  Object.entries(issueTypes).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  
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
      
      // Update product with verified data
      await db
        .update(products)
        .set({
          specifications: JSON.stringify(product.specifications),
          status: 'verified',
          updatedAt: new Date(),
        })
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
  
  // Handle extraction failed products
  const extractionFailedIssues = issues.filter((i: any) => i.issue === 'extraction_failed');
  console.log('\n=== 处理提取失败的产品 ===');
  console.log(`共 ${extractionFailedIssues.length} 个产品提取失败`);
  console.log('建议: 这些产品需要重试或人工处理');
  
  // Mark as needs_review
  let failedMarkedCount = 0;
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
        failedMarkedCount++;
      }
    } catch (error) {
      console.error(`❌ 标记失败: ${issue.partNumber}`, error);
    }
  }
  
  console.log(`✅ 已标记 ${failedMarkedCount} 个产品为needs_review`);
  
  // Also mark the 162 products that already have specs as verified
  console.log('\n=== 标记已有规格的产品为verified ===');
  const allPhenomenexProducts = await db
    .select()
    .from(products)
    .where(eq(products.brand, 'Phenomenex'));
  
  const alreadyHaveSpecs = allPhenomenexProducts.filter(
    p => p.specifications && p.specifications !== '{}' && p.status !== 'verified'
  );
  
  console.log(`找到 ${alreadyHaveSpecs.length} 个已有规格但未标记为verified的产品`);
  
  let markedVerifiedCount = 0;
  for (const product of alreadyHaveSpecs) {
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
  console.log(`✅ 新补充规格并验证: ${updatedCount} 个产品`);
  console.log(`✅ 标记已有规格为verified: ${markedVerifiedCount} 个产品`);
  console.log(`⚠️ 提取失败（标记needs_review）: ${failedMarkedCount} 个产品`);
  console.log(`📊 Phenomenex总验证数: ${updatedCount + markedVerifiedCount} 个`);
  console.log(`📊 Phenomenex验证覆盖率: ${((updatedCount + markedVerifiedCount) / 247 * 100).toFixed(1)}%`);
  
  process.exit(0);
}

importPhenomenexData().catch(console.error);
