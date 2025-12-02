const mysql = require('mysql2/promise');
const fs = require('fs');

async function importAgilentTestBatch() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('=' .repeat(80));
  console.log('Agilent测试批次导入');
  console.log('=' .repeat(80));
  console.log();
  
  // Load verification data
  const verificationData = JSON.parse(
    fs.readFileSync('/home/ubuntu/upload/verify_agilent_products.json', 'utf-8')
  );
  
  const results = verificationData.results || [];
  console.log(`📦 加载验证数据: ${results.length}个产品`);
  console.log();
  
  let successCount = 0;
  let updateCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  const errors = [];
  
  for (const result of results) {
    const input = result.input;
    const output = result.output || {};
    
    if (!output.part_number || output.verification_status !== 'verified') {
      console.log(`⚠️  跳过产品 ${input}: 验证状态不是verified`);
      skipCount++;
      continue;
    }
    
    try {
      // Find product by partNumber
      const [existingProducts] = await connection.query(
        'SELECT id, partNumber, name, description, detailedDescription, catalogUrl, status FROM products WHERE partNumber = ? AND brand = ?',
        [output.part_number, 'Agilent']
      );
      
      if (existingProducts.length === 0) {
        console.log(`❌ 产品不存在: ${output.part_number}`);
        errorCount++;
        errors.push({
          partNumber: output.part_number,
          error: 'Product not found in database'
        });
        continue;
      }
      
      const product = existingProducts[0];
      
      // Prepare update data
      const updateData = {
        catalogUrl: output.catalog_url || product.catalogUrl,
        detailedDescription: output.detailed_description || product.detailedDescription,
        status: 'verified',
        updatedAt: new Date()
      };
      
      // Update product
      await connection.query(
        `UPDATE products 
         SET catalogUrl = ?, 
             detailedDescription = ?, 
             status = ?,
             updatedAt = ?
         WHERE id = ?`,
        [
          updateData.catalogUrl,
          updateData.detailedDescription,
          updateData.status,
          updateData.updatedAt,
          product.id
        ]
      );
      
      console.log(`✅ 更新产品: ${output.part_number}`);
      updateCount++;
      successCount++;
      
    } catch (error) {
      console.error(`❌ 导入失败 ${output.part_number}:`, error.message);
      errorCount++;
      errors.push({
        partNumber: output.part_number,
        error: error.message
      });
    }
  }
  
  console.log();
  console.log('=' .repeat(80));
  console.log('导入结果统计');
  console.log('=' .repeat(80));
  console.log(`✅ 成功: ${successCount}个`);
  console.log(`   - 更新: ${updateCount}个`);
  console.log(`⚠️  跳过: ${skipCount}个`);
  console.log(`❌ 失败: ${errorCount}个`);
  console.log();
  
  if (errors.length > 0) {
    console.log('❌ 错误详情:');
    errors.forEach(err => {
      console.log(`   ${err.partNumber}: ${err.error}`);
    });
    console.log();
  }
  
  // Save import report
  const report = {
    importDate: new Date().toISOString(),
    totalProducts: results.length,
    successCount,
    updateCount,
    skipCount,
    errorCount,
    errors
  };
  
  fs.writeFileSync(
    '/home/ubuntu/AGILENT_TEST_BATCH_IMPORT_REPORT.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log('📄 导入报告已保存到: /home/ubuntu/AGILENT_TEST_BATCH_IMPORT_REPORT.json');
  console.log();
  
  await connection.end();
  
  return report;
}

importAgilentTestBatch()
  .then(report => {
    console.log('✅ 导入完成！');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 导入失败:', error);
    process.exit(1);
  });
