const { drizzle } = require('drizzle-orm/mysql2');
const { eq } = require('drizzle-orm');
const mysql = require('mysql2/promise');
const fs = require('fs');
const { products } = require('./drizzle/schema.js');

async function importDevelosilResults(jsonFilePath) {
  console.log('🚀 开始导入Develosil验证结果...\n');
  
  // 读取验证结果
  const results = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
  console.log(`📦 读取到 ${results.length} 个产品验证结果\n`);
  
  // 连接数据库
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);
  
  // 统计
  const stats = {
    total: results.length,
    success: 0,
    failed: 0,
    verified: 0,
    not_found: 0,
    extraction_failed: 0,
    errors: []
  };
  
  // 逐个更新产品
  for (const result of results) {
    try {
      const updateData = {};
      
      // 根据verification_status更新status字段
      if (result.verification_status === 'verified') {
        updateData.status = 'verified';
        stats.verified++;
      } else if (result.verification_status === 'not_found') {
        updateData.status = 'not_found';
        stats.not_found++;
      } else if (result.verification_status === 'extraction_failed') {
        updateData.status = 'extraction_failed';
        stats.extraction_failed++;
      }
      
      // 更新detailedDescription
      if (result.detailed_description) {
        updateData.detailedDescription = result.detailed_description;
      }
      
      // 更新catalogUrl（如果提供了新的）
      if (result.catalog_url) {
        updateData.catalogUrl = result.catalog_url;
      }
      
      // 更新imageUrl（如果提供了）
      if (result.image_url) {
        updateData.imageUrl = result.image_url;
      }
      
      // 更新数据库
      await db
        .update(products)
        .set(updateData)
        .where(eq(products.partNumber, result.part_number));
      
      stats.success++;
      console.log(`✓ ${result.part_number}: ${result.verification_status}`);
      
    } catch (error) {
      stats.failed++;
      stats.errors.push({
        partNumber: result.part_number,
        error: error.message
      });
      console.error(`✗ ${result.part_number}: ${error.message}`);
    }
  }
  
  await connection.end();
  
  // 输出统计结果
  console.log('\n' + '='.repeat(50));
  console.log('📊 导入统计结果');
  console.log('='.repeat(50));
  console.log(`总产品数: ${stats.total}个`);
  console.log(`成功导入: ${stats.success}个`);
  console.log(`导入失败: ${stats.failed}个`);
  console.log('');
  console.log('验证状态分布:');
  console.log(`  ✅ verified: ${stats.verified}个`);
  console.log(`  ❌ not_found: ${stats.not_found}个`);
  console.log(`  ⚠️  extraction_failed: ${stats.extraction_failed}个`);
  
  if (stats.errors.length > 0) {
    console.log('\n❌ 导入失败的产品:');
    stats.errors.forEach(err => {
      console.log(`  - ${err.partNumber}: ${err.error}`);
    });
  }
  
  // 保存导入报告
  const report = {
    importDate: new Date().toISOString(),
    sourceFile: jsonFilePath,
    statistics: stats,
    timestamp: Date.now()
  };
  
  const reportPath = '/home/ubuntu/DEVELOSIL_IMPORT_REPORT.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ 导入报告已保存到: ${reportPath}`);
  
  console.log('\n🎉 Develosil验证结果导入完成！');
}

// 获取命令行参数
const jsonFilePath = process.argv[2];

if (!jsonFilePath) {
  console.error('❌ 错误: 请提供JSON文件路径');
  console.log('用法: node import_develosil_results.cjs <json_file_path>');
  console.log('示例: node import_develosil_results.cjs develosil_verification_success_20251120.json');
  process.exit(1);
}

if (!fs.existsSync(jsonFilePath)) {
  console.error(`❌ 错误: 文件不存在: ${jsonFilePath}`);
  process.exit(1);
}

importDevelosilResults(jsonFilePath).catch(error => {
  console.error('❌ 导入过程中发生错误:', error);
  process.exit(1);
});
