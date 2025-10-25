const fs = require('fs');
const mysql = require('mysql2/promise');

async function batchUpdateProducts() {
  console.log('开始批量更新产品数据...\n');
  
  // 创建数据库连接
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  // 读取SQL文件
  const sqlContent = fs.readFileSync('/home/ubuntu/update_products_hybrid.sql', 'utf-8');
  
  // 提取UPDATE语句
  const statements = sqlContent
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('--'))
    .filter(line => line.trim().startsWith('UPDATE'));
  
  console.log(`总共 ${statements.length} 条UPDATE语句\n`);
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  // 批量执行
  const batchSize = 100;
  const totalBatches = Math.ceil(statements.length / batchSize);
  
  for (let i = 0; i < statements.length; i += batchSize) {
    const batch = statements.slice(i, Math.min(i + batchSize, statements.length));
    const currentBatch = Math.floor(i / batchSize) + 1;
    
    process.stdout.write(`\r执行批次 ${currentBatch}/${totalBatches} (${batch.length} 条)...`);
    
    for (const sql of batch) {
      try {
        await connection.execute(sql);
        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({ sql: sql.substring(0, 100) + '...', error: error.message });
      }
    }
  }
  
  await connection.end();
  
  console.log(`\n\n✅ 批量更新完成!`);
  console.log(`   成功: ${successCount} 条`);
  console.log(`   失败: ${errorCount} 条`);
  
  if (errors.length > 0 && errors.length <= 10) {
    console.log('\n错误详情:');
    errors.forEach((err, idx) => {
      console.log(`${idx + 1}. ${err.error}`);
      console.log(`   SQL: ${err.sql}\n`);
    });
  }
}

batchUpdateProducts().catch(error => {
  console.error('批量更新失败:', error);
  process.exit(1);
});
