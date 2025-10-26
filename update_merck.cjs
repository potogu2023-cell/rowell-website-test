const fs = require('fs');
const mysql = require('mysql2/promise');

async function updateMerck() {
  console.log('开始更新Merck产品数据...\n');
  
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  const sqlContent = fs.readFileSync('/home/ubuntu/merck_fix_updates.sql', 'utf-8');
  const statements = sqlContent
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('--'))
    .filter(line => line.trim().startsWith('UPDATE'));
  
  console.log(`总共 ${statements.length} 条UPDATE语句\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const sql of statements) {
    try {
      await connection.execute(sql);
      successCount++;
      process.stdout.write(`\r进度: ${successCount}/${statements.length}`);
    } catch (error) {
      errorCount++;
      console.error(`\n错误: ${error.message}`);
    }
  }
  
  await connection.end();
  
  console.log(`\n\n✅ 更新完成!`);
  console.log(`   成功: ${successCount} 条`);
  console.log(`   失败: ${errorCount} 条`);
}

updateMerck().catch(error => {
  console.error('更新失败:', error);
  process.exit(1);
});
