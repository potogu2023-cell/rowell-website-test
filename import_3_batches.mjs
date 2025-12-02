/**
 * 导入3个批次的验证数据到数据库
 * 
 * 批次1: Shimadzu低质量重新验证 (246个产品)
 * 批次2: Thermo Fisher品牌验证 (366个产品)
 * 批次3: Daicel品牌验证 (277个产品)
 * 总计: 889个产品
 */

import mysql from 'mysql2/promise';
import fs from 'fs';

// Database connection
const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('=' + '='.repeat(79));
console.log('导入3个批次的验证数据');
console.log('=' + '='.repeat(79));

const batches = [
  {
    name: '批次1: Shimadzu',
    file: '/home/ubuntu/upload/BATCH1_OUTPUT_SHIMADZU_20251201.json',
    brand: 'Shimadzu'
  },
  {
    name: '批次2: Thermo Fisher',
    file: '/home/ubuntu/upload/BATCH2_OUTPUT_THERMO_FISHER_20251201.json',
    brand: 'Thermo Fisher Scientific'
  },
  {
    name: '批次3: Daicel',
    file: '/home/ubuntu/upload/BATCH3_OUTPUT_DAICEL_20251201.json',
    brand: 'Daicel'
  }
];

let totalUpdated = 0;
let totalSkipped = 0;
let totalFailed = 0;

for (const batch of batches) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(batch.name);
  console.log('='.repeat(80));
  
  // 读取验证数据
  const data = JSON.parse(fs.readFileSync(batch.file, 'utf8'));
  const results = data.results || [];
  
  console.log(`总产品数: ${results.length}`);
  
  let batchUpdated = 0;
  let batchSkipped = 0;
  let batchFailed = 0;
  
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const partNumber = result.input;
    const output = result.output;
    
    if (!output || output.verification_status !== 'verified') {
      batchSkipped++;
      continue;
    }
    
    const catalogUrl = output.catalog_url || '';
    const detailedDescription = output.detailed_description || '';
    
    // 只更新verified且描述长度≥300的产品
    if (detailedDescription.length < 300) {
      console.log(`  [${i + 1}/${results.length}] ${partNumber} - 跳过（描述<300字符）`);
      batchSkipped++;
      continue;
    }
    
    try {
      const [updateResult] = await connection.execute(
        `UPDATE products 
         SET detailedDescription = ?, 
             catalogUrl = ?,
             updatedAt = NOW()
         WHERE brand = ? AND partNumber = ?`,
        [detailedDescription, catalogUrl, batch.brand, partNumber]
      );
      
      if (updateResult.affectedRows > 0) {
        if ((i + 1) % 50 === 0 || i === results.length - 1) {
          console.log(`  [${i + 1}/${results.length}] 已处理 ${i + 1} 个产品...`);
        }
        batchUpdated++;
      } else {
        console.log(`  [${i + 1}/${results.length}] ${partNumber} - 未找到匹配的产品`);
        batchFailed++;
      }
    } catch (error) {
      console.log(`  [${i + 1}/${results.length}] ${partNumber} - 错误: ${error.message}`);
      batchFailed++;
    }
  }
  
  console.log(`\n${batch.name} 完成:`);
  console.log(`  更新成功: ${batchUpdated}`);
  console.log(`  跳过: ${batchSkipped}`);
  console.log(`  失败: ${batchFailed}`);
  
  totalUpdated += batchUpdated;
  totalSkipped += batchSkipped;
  totalFailed += batchFailed;
}

console.log('\n' + '='.repeat(80));
console.log('导入完成');
console.log('='.repeat(80));
console.log(`总更新: ${totalUpdated} 个产品`);
console.log(`总跳过: ${totalSkipped} 个产品`);
console.log(`总失败: ${totalFailed} 个产品`);
console.log(`总计: ${totalUpdated + totalSkipped + totalFailed} 个产品`);

await connection.end();
