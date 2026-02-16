/**
 * 导入增强学习内容到数据库
 * 从JSON文件读取并更新literature表的增强字段
 */

import mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';

const ENHANCED_CONTENT_DIR = '/home/ubuntu/enhanced_content';

interface EnhancedContent {
  slug: string;
  expanded_analysis: string;
  methodology_details: {
    hplc_system: string;
    column: {
      type: string;
      dimensions: string;
      particle_size: string;
      temperature: string;
    };
    mobile_phase: {
      composition: string;
      flow_rate: string;
      gradient: string;
      ph: string;
    };
    detection: {
      type: string;
      wavelength: string;
    };
    sample_preparation: string;
    run_time: string;
    retention_time: string;
    calibration: {
      concentration_range: string;
      linearity: string;
    };
    validation: string[];
  };
  practical_guide: string;
}

async function main() {
  console.log('📊 开始导入增强学习内容...');
  console.log(`📁 内容目录：${ENHANCED_CONTENT_DIR}`);
  console.log();
  
  // 读取所有JSON文件
  console.log('📖 读取JSON文件...');
  const files = fs.readdirSync(ENHANCED_CONTENT_DIR)
    .filter(f => f.endsWith('.json') && f !== 'generation_report.json');
  
  console.log(`✅ 找到 ${files.length} 个增强内容文件`);
  console.log();
  
  // 连接数据库
  console.log('🔌 连接数据库...');
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }
  
  const connection = await mysql.createConnection({
    uri: connectionString.replace('?ssl=true', ''),
    ssl: { rejectUnauthorized: true }
  });
  console.log('✅ 数据库连接成功');
  console.log();
  
  // 统计变量
  let successCount = 0;
  let notFoundCount = 0;
  let failedCount = 0;
  
  // 逐个导入
  console.log('🔄 开始导入增强内容...');
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(ENHANCED_CONTENT_DIR, file);
    
    try {
      // 读取JSON文件
      const content = fs.readFileSync(filePath, 'utf-8');
      const data: EnhancedContent = JSON.parse(content);
      
      // 从文件名提取slug（移除.json后缀）
      const slug = file.replace('.json', '');
      
      // 检查文献是否存在
      const [checkResult] = await connection.query(
        'SELECT id FROM literature WHERE slug = ? LIMIT 1',
        [slug]
      );
      
      // @ts-ignore
      if (!checkResult || checkResult.length === 0) {
        console.log(`⚠️  [${i + 1}/${files.length}] 未找到文献：${slug.substring(0, 60)}...`);
        notFoundCount++;
        continue;
      }
      
      // 更新数据库
      await connection.query(
        `UPDATE literature 
         SET expanded_analysis = ?,
             methodology_details = ?,
             practical_guide = ?,
             content_enhanced = 1,
             enhanced_at = NOW()
         WHERE slug = ?`,
        [
          data.expanded_analysis,
          JSON.stringify(data.methodology_details),
          data.practical_guide,
          slug
        ]
      );
      
      console.log(`✅ [${i + 1}/${files.length}] 更新成功：${slug.substring(0, 60)}...`);
      successCount++;
    } catch (error: any) {
      console.log(`❌ [${i + 1}/${files.length}] 导入失败：${file} - ${error.message}`);
      failedCount++;
    }
  }
  
  // 打印统计结果
  console.log();
  console.log('='.repeat(60));
  console.log('📊 导入完成统计');
  console.log('='.repeat(60));
  console.log(`✅ 更新成功：${successCount} 条`);
  console.log(`⚠️  未找到记录：${notFoundCount} 条`);
  console.log(`❌ 更新失败：${failedCount} 条`);
  console.log(`📝 总计处理：${files.length} 个文件`);
  console.log('='.repeat(60));
  
  // 验证结果
  console.log();
  console.log('🔍 验证导入结果...');
  const [result] = await connection.query(
    'SELECT COUNT(*) as count FROM literature WHERE content_enhanced = 1'
  );
  // @ts-ignore
  const count = result[0]?.count || 0;
  console.log(`✅ 数据库中已增强的文献数量：${count}`);
  console.log();
  
  if (successCount > 0) {
    console.log('🎉 导入成功！');
  } else {
    console.log('⚠️  没有新记录被导入');
  }
  
  await connection.end();
}

main().catch((error) => {
  console.error('❌ 导入失败：', error);
  process.exit(1);
});
