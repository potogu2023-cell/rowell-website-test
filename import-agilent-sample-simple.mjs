import { createConnection } from 'mysql2/promise';
import fs from 'fs';

async function importAgilentSample() {
  console.log('=== 导入Agilent示例数据 ===\n');
  
  const connection = await createConnection(process.env.DATABASE_URL);
  
  try {
    // 读取CSV文件
    const csvContent = fs.readFileSync('./agilent_sample_results.csv', 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    // 跳过表头
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
        // 简单CSV解析
        const parts = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            parts.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        parts.push(current);
        
        if (parts.length < 7) {
          console.error(`❌ 字段数不足: ${parts.length}`);
          results.errors++;
          continue;
        }
        
        const productId = parts[0].trim().replace(/^\uFEFF/, ''); // 移除BOM
        const partNumber = parts[1].trim();
        const brand = parts[2].trim();
        const name = parts[3].trim();
        const description = parts[4].trim();
        const specifications = parts[5].trim();
        const descriptionQuality = parts[6].trim();
        const detailedDescription = parts[7] ? parts[7].trim() : '';
        
        // 查找产品
        const [rows] = await connection.execute(
          'SELECT * FROM products WHERE productId = ? LIMIT 1',
          [productId]
        );
        
        if (rows.length === 0) {
          console.log(`⚠️  产品不存在: ${productId}`);
          results.skipped++;
          continue;
        }
        
        const existingProduct = rows[0];
        
        // 准备更新数据
        const updates = [];
        const values = [];
        
        // 更新产品名称（如果更完整）
        if (name && name.length > (existingProduct.name || '').length) {
          updates.push('name = ?');
          values.push(name);
        }
        
        // 更新描述
        if (description) {
          updates.push('description = ?');
          values.push(description);
        }
        
        // 更新详细描述
        if (detailedDescription) {
          updates.push('detailedDescription = ?');
          values.push(detailedDescription);
        }
        
        // 更新技术规格
        if (specifications) {
          try {
            // 验证JSON格式
            JSON.parse(specifications);
            updates.push('specifications = ?');
            values.push(specifications);
          } catch (e) {
            console.error(`❌ 规格JSON解析失败 ${productId}: ${e.message}`);
          }
        }
        
        // 执行更新
        if (updates.length > 0) {
          values.push(productId);
          
          const sql = `UPDATE products SET ${updates.join(', ')} WHERE productId = ?`;
          await connection.execute(sql, values);
          
          console.log(`✅ 更新产品: ${productId}`);
          console.log(`   名称: ${name.substring(0, 60)}...`);
          console.log(`   描述质量: ${descriptionQuality}`);
          console.log(`   更新字段: ${updates.length}个`);
          
          results.updated++;
          results.details.push({
            productId,
            partNumber,
            name: name.substring(0, 60),
            descriptionQuality,
            updatedFields: updates.length
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
    
  } finally {
    await connection.end();
  }
}

importAgilentSample().catch(console.error);
