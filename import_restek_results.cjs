const mysql = require('mysql2/promise');
const fs = require('fs');

async function importRestekResults() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('=' .repeat(80));
  console.log('Restek验证结果导入');
  console.log('=' .repeat(80));
  console.log();
  
  // Load verification data
  const verificationDataPath = process.argv[2] || '/home/ubuntu/upload/restek_all_results.json';
  
  if (!fs.existsSync(verificationDataPath)) {
    console.error(`❌ 验证数据文件不存在: ${verificationDataPath}`);
    process.exit(1);
  }
  
  const verificationData = JSON.parse(
    fs.readFileSync(verificationDataPath, 'utf-8')
  );
  
  const results = verificationData.results || [];
  console.log(`📦 加载验证数据: ${results.length}个产品`);
  console.log();
  
  let successCount = 0;
  let updateCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  const errors = [];
  const statusCounts = {
    verified: 0,
    not_found: 0,
    discontinued: 0,
    extraction_failed: 0
  };
  
  for (const result of results) {
    const input = result.input;
    const output = result.output || {};
    const status = output.verification_status || 'unknown';
    
    // Count by status
    if (statusCounts[status] !== undefined) {
      statusCounts[status]++;
    }
    
    // Skip non-verified products for now, but log them
    if (status !== 'verified') {
      console.log(`⚠️  跳过产品 ${input}: ${status}`);
      skipCount++;
      
      // Still try to update status in database
      try {
        const [existingProducts] = await connection.query(
          'SELECT id FROM products WHERE partNumber = ? AND brand = ?',
          [output.part_number || input, 'Restek']
        );
        
        if (existingProducts.length > 0) {
          await connection.query(
            'UPDATE products SET status = ?, updatedAt = ? WHERE id = ?',
            [status, new Date(), existingProducts[0].id]
          );
          console.log(`   ✅ 更新状态: ${input} → ${status}`);
        }
      } catch (error) {
        // Ignore errors for non-verified products
      }
      
      continue;
    }
    
    try {
      // Find product by partNumber
      const [existingProducts] = await connection.query(
        'SELECT id, partNumber, name, description, detailedDescription, catalogUrl, status FROM products WHERE partNumber = ? AND brand = ?',
        [output.part_number, 'Restek']
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
  console.log(`📊 验证状态分布:`);
  console.log(`   verified: ${statusCounts.verified}个`);
  console.log(`   not_found: ${statusCounts.not_found}个`);
  console.log(`   discontinued: ${statusCounts.discontinued}个`);
  console.log(`   extraction_failed: ${statusCounts.extraction_failed}个`);
  console.log();
  console.log(`✅ 成功: ${successCount}个`);
  console.log(`   - 更新: ${updateCount}个`);
  console.log(`⚠️  跳过: ${skipCount}个`);
  console.log(`❌ 失败: ${errorCount}个`);
  console.log();
  
  if (errors.length > 0) {
    console.log('❌ 错误详情:');
    errors.slice(0, 10).forEach(err => {
      console.log(`   ${err.partNumber}: ${err.error}`);
    });
    if (errors.length > 10) {
      console.log(`   ... 还有 ${errors.length - 10} 个错误`);
    }
    console.log();
  }
  
  // Save import report
  const report = {
    importDate: new Date().toISOString(),
    totalProducts: results.length,
    statusCounts,
    successCount,
    updateCount,
    skipCount,
    errorCount,
    errors
  };
  
  fs.writeFileSync(
    '/home/ubuntu/RESTEK_IMPORT_REPORT.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log('📄 导入报告已保存到: /home/ubuntu/RESTEK_IMPORT_REPORT.json');
  console.log();
  
  await connection.end();
  
  return report;
}

importRestekResults()
  .then(report => {
    console.log('✅ 导入完成！');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 导入失败:', error);
    process.exit(1);
  });
