const fs = require('fs');
const { drizzle } = require('drizzle-orm/mysql2');

async function executeSQLFile() {
  const db = drizzle(process.env.DATABASE_URL);
  const sqlContent = fs.readFileSync('/home/ubuntu/update_products_hybrid.sql', 'utf-8');
  
  // 分割SQL语句
  const statements = sqlContent
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('--'))
    .filter(line => line.trim().startsWith('UPDATE'));
  
  console.log(`总共 ${statements.length} 条UPDATE语句`);
  
  let successCount = 0;
  let errorCount = 0;
  
  // 批量执行
  const batchSize = 50;
  for (let i = 0; i < statements.length; i += batchSize) {
    const batch = statements.slice(i, Math.min(i + batchSize, statements.length));
    console.log(`执行批次 ${Math.floor(i/batchSize) + 1}/${Math.ceil(statements.length/batchSize)} (${batch.length} 条)...`);
    
    for (const sql of batch) {
      try {
        await db.execute(sql);
        successCount++;
      } catch (error) {
        console.error(`错误: ${error.message}`);
        errorCount++;
      }
    }
  }
  
  console.log(`\n✅ 完成! 成功: ${successCount}, 失败: ${errorCount}`);
}

executeSQLFile().catch(console.error);
