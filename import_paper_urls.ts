/**
 * 导入论文原文链接到数据库
 * 从子任务1的CSV文件导入original_paper_url到literature表
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

const CSV_FILE = '/home/ubuntu/original_paper_urls.csv';

interface CSVRecord {
  slug: string;
  original_paper_url: string;
  verification_status: string;
  notes: string;
}

function parseCSV(content: string): CSVRecord[] {
  const lines = content.trim().split('\n');
  const records: CSVRecord[] = [];
  
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(',');
    
    if (parts.length >= 4) {
      records.push({
        slug: parts[0],
        original_paper_url: parts[1],
        verification_status: parts[2],
        notes: parts.slice(3).join(','), // Handle notes with commas
      });
    }
  }
  
  return records;
}

async function main() {
  console.log('📊 开始导入论文原文链接...');
  console.log(`📁 CSV文件：${CSV_FILE}`);
  console.log();
  
  // 读取CSV文件
  console.log('📖 读取CSV文件...');
  const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const records = parseCSV(csvContent);
  console.log(`✅ 读取了 ${records.length} 条记录`);
  console.log();
  
  // 连接数据库
  console.log('🔌 连接数据库...');
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }
  
  // Parse connection string and handle SSL properly
  const connection = await mysql.createConnection({
    uri: connectionString.replace('?ssl=true', ''),
    ssl: { rejectUnauthorized: true }
  });
  const db = drizzle(connection, { schema, mode: 'default' });
  console.log('✅ 数据库连接成功');
  console.log();
  
  // 统计变量
  let updatedCount = 0;
  let notFoundCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  
  // 逐条更新
  console.log('🔄 开始更新数据库...');
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const { slug, original_paper_url, verification_status } = record;
    
    // 跳过失败的记录
    if (verification_status === 'failed' || !original_paper_url || original_paper_url === '') {
      console.log(`⏭️  [${i + 1}/${records.length}] 跳过失败记录：${slug}`);
      skippedCount++;
      continue;
    }
    
    try {
      // 更新URL - 使用原始SQL因为字段名是snake_case
      const [result] = await connection.query(
        'UPDATE literature SET original_paper_url = ?, updated_at = NOW() WHERE slug = ?',
        [original_paper_url, slug]
      );
      
      // @ts-ignore - result has affectedRows
      if (result && result.affectedRows > 0) {
        console.log(`✅ [${i + 1}/${records.length}] 更新成功：${slug}`);
        updatedCount++;
      } else {
        console.log(`⚠️  [${i + 1}/${records.length}] 未找到记录：${slug}`);
        notFoundCount++;
      }
    } catch (error) {
      console.log(`❌ [${i + 1}/${records.length}] 更新失败：${slug} - ${error}`);
      failedCount++;
    }
  }
  
  // 打印统计结果
  console.log();
  console.log('='.repeat(60));
  console.log('📊 导入完成统计');
  console.log('='.repeat(60));
  console.log(`✅ 更新成功：${updatedCount} 条`);
  console.log(`⚠️  未找到记录：${notFoundCount} 条`);
  console.log(`⏭️  跳过失败记录：${skippedCount} 条`);
  console.log(`❌ 更新失败：${failedCount} 条`);
  console.log(`📝 总计处理：${records.length} 条`);
  console.log('='.repeat(60));
  
  // 验证结果
  console.log();
  console.log('🔍 验证导入结果...');
  const [result] = await connection.query(
    "SELECT COUNT(*) as count FROM literature WHERE original_paper_url IS NOT NULL AND original_paper_url != ''"
  );
  // @ts-ignore
  const count = result[0]?.count || 0;
  console.log(`✅ 数据库中有URL的文献数量：${count}`);
  console.log();
  
  if (updatedCount > 0) {
    console.log('🎉 导入成功！');
  } else {
    console.log('⚠️  没有记录被更新，请检查数据');
  }
  
  await connection.end();
}

main().catch((error) => {
  console.error('❌ 导入失败：', error);
  process.exit(1);
});
