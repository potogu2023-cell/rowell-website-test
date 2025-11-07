import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { products } from './drizzle/schema.ts';
import fs from 'fs';

const db = drizzle(process.env.DATABASE_URL);

async function importAgilentSample() {
  console.log('=== 导入Agilent示例数据 ===\n');
  
  // 读取CSV文件
  const csvContent = fs.readFileSync('./agilent_sample_results.csv', 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  // 跳过表头和BOM
  const dataLines = lines.slice(1);
  
  console.log(`CSV文件行数: ${lines.length}`);
  console.log(`数据行数: ${dataLines.length}\n`);
  
  const results = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    details: []
  };
  
  for (const line of dataLines) {
    if (!line.trim()) continue;
    
    results.total++;
    
    try {
      // 解析CSV行（简单解析，假设没有复杂的引号嵌套）
      const match = line.match(/^([^,]+),([^,]+),([^,]+),"([^"]+)","?([^"]*)"?,("?\{[^}]+\}"?),([^,]+),?(.*)$/);
      
      if (!match) {
        console.error(`❌ 无法解析行: ${line.substring(0, 100)}...`);
        results.errors++;
        continue;
      }
      
      const [_, productId, partNumber, brand, name, description, specifications, descriptionQuality, detailedDescription] = match;
      
      // 查找产品
      const existingProducts = await db.select().from(products).where(eq(products.productId, productId.trim())).limit(1);
      
      if (existingProducts.length === 0) {
        console.log(`⚠️  产品不存在: ${productId}`);
        results.skipped++;
        continue;
      }
      
      const existingProduct = existingProducts[0];
      
      // 准备更新数据
      const updateData = {};
      
      // 更新产品名称（如果更完整）
      const newName = name.trim();
      if (newName && newName.length > (existingProduct.name || '').length) {
        updateData.name = newName;
      }
      
      // 更新描述
      if (description && description.trim()) {
        updateData.description = description.trim();
      }
      
      // 更新详细描述
      if (detailedDescription && detailedDescription.trim()) {
        updateData.detailedDescription = detailedDescription.trim();
      }
      
      // 更新技术规格
      if (specifications && specifications.trim()) {
        try {
          // 清理JSON字符串
          let cleanSpec = specifications.trim().replace(/^"/, '').replace(/"$/, '');
          const specObj = JSON.parse(cleanSpec);
          updateData.specifications = JSON.stringify(specObj);
        } catch (e) {
          console.error(`❌ 规格JSON解析失败 ${productId}: ${e.message}`);
        }
      }
      
      // 执行更新
      if (Object.keys(updateData).length > 0) {
        await db.update(products)
          .set(updateData)
          .where(eq(products.productId, productId.trim()));
        
        console.log(`✅ 更新产品: ${productId} - ${newName.substring(0, 50)}...`);
        console.log(`   描述质量: ${descriptionQuality}`);
        console.log(`   更新字段: ${Object.keys(updateData).join(', ')}`);
        
        results.updated++;
        results.details.push({
          productId,
          partNumber: partNumber.trim(),
          name: newName.substring(0, 60),
          descriptionQuality,
          updatedFields: Object.keys(updateData)
        });
      } else {
        console.log(`⏭️  无需更新: ${productId}`);
        results.skipped++;
      }
      
    } catch (error) {
      console.error(`❌ 处理产品失败: ${error.message}`);
      results.errors++;
    }
  }
  
  // 生成报告
  console.log('\n=== 导入结果 ===');
  console.log(`总数: ${results.total}`);
  console.log(`成功更新: ${results.updated}`);
  console.log(`跳过: ${results.skipped}`);
  console.log(`错误: ${results.errors}`);
  
  // 保存详细报告
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.total,
      updated: results.updated,
      skipped: results.skipped,
      errors: results.errors
    },
    details: results.details
  };
  
  fs.writeFileSync(
    `./import_agilent_sample_report_${Date.now()}.json`,
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n✅ 导入完成！报告已保存。');
}

importAgilentSample().catch(console.error);
