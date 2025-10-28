import { getDb } from './server/db';
import * as fs from 'fs';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // 转义的引号
        current += '"';
        i++;
      } else {
        // 切换引号状态
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // 字段分隔符
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

async function updateProductImageUrls() {
  console.log('=== 批量更新产品图片URL (v2) ===\n');
  
  const db = await getDb();
  if (!db) {
    console.error('无法连接数据库');
    process.exit(1);
  }

  // 读取优化后的CSV文件
  const csvPath = '/home/ubuntu/upload/product_inventory_optimized.csv';
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV文件不存在: ${csvPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  console.log(`读取CSV文件: ${lines.length - 1} 行数据\n`);

  // 解析CSV（跳过表头）
  const updates: Array<{ id: number, newImageUrl: string }> = [];
  
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    
    if (fields.length >= 8) {
      const id = parseInt(fields[0]);
      const newImageUrl = fields[7].trim();
      
      if (id && newImageUrl) {
        updates.push({ id, newImageUrl });
      }
    }
  }

  console.log(`解析完成: ${updates.length} 个产品需要更新\n`);

  // 统计每种图片URL的产品数量
  const urlStats: Record<string, number> = {};
  updates.forEach(({ newImageUrl }) => {
    urlStats[newImageUrl] = (urlStats[newImageUrl] || 0) + 1;
  });

  console.log('=== 图片URL统计 ===');
  const sortedStats = Object.entries(urlStats)
    .sort((a, b) => b[1] - a[1])
    .map(([url, count]) => ({ url, count }));
  
  sortedStats.forEach(({ url, count }) => {
    console.log(`  ${url}: ${count}`);
  });

  // 批量更新数据库
  console.log('\n开始更新数据库...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  // 分批更新（每批100个）
  const batchSize = 100;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    try {
      // 使用CASE WHEN构建批量UPDATE语句
      const ids = batch.map(u => u.id).join(',');
      const caseStatements = batch.map(u => 
        `WHEN ${u.id} THEN '${u.newImageUrl.replace(/'/g, "''")}'`
      ).join(' ');
      
      const updateQuery = `
        UPDATE products 
        SET imageUrl = CASE id 
          ${caseStatements}
        END
        WHERE id IN (${ids})
      `;
      
      const result: any = await db.execute(updateQuery);
      const affectedRows = result[0].affectedRows || 0;
      
      successCount += affectedRows;
      
      if (affectedRows !== batch.length) {
        console.warn(`批次 ${Math.floor(i / batchSize) + 1}: 预期更新 ${batch.length} 行，实际更新 ${affectedRows} 行`);
      }
      
      // 显示进度
      if ((i + batchSize) % 1000 === 0 || i + batchSize >= updates.length) {
        console.log(`进度: ${Math.min(i + batchSize, updates.length)}/${updates.length} (${Math.floor((i + batchSize) / updates.length * 100)}%)`);
      }
    } catch (error) {
      console.error(`批次 ${Math.floor(i / batchSize) + 1} 更新失败:`, error);
      errorCount += batch.length;
    }
  }

  console.log('\n=== 更新完成 ===');
  console.log(`✅ 成功更新: ${successCount} 个产品`);
  console.log(`❌ 更新失败: ${errorCount} 个产品`);
  console.log(`📊 更新率: ${(successCount / updates.length * 100).toFixed(2)}%`);

  // 验证更新结果
  console.log('\n=== 验证更新结果 ===');
  
  for (const [url, expectedCount] of Object.entries(urlStats)) {
    const verifyQuery = `SELECT COUNT(*) as count FROM products WHERE imageUrl = ?`;
    const result: any = await db.execute(verifyQuery, [url]);
    const actualCount = result[0][0].count;
    
    const status = actualCount === expectedCount ? '✅' : '⚠️';
    console.log(`${status} ${url}: ${actualCount}/${expectedCount}`);
  }
}

updateProductImageUrls().then(() => {
  console.log('\n✅ 完成！');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ 错误:', err);
  process.exit(1);
});
