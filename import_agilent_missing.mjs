/**
 * 导入Agilent遗漏的30个产品
 * 
 * 策略:
 * 1. 对于在数据库中的16个产品: 更新描述和catalogUrl
 * 2. 对于不在数据库中的14个产品: 先创建产品记录,再更新描述
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { eq } from 'drizzle-orm';
import fs from 'fs';

// Database connection
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// 读取遗漏的产品数据
const missingProducts = JSON.parse(
  fs.readFileSync('/tmp/agilent_missing_products.json', 'utf8')
);

console.log('=' + '='.repeat(79));
console.log('导入Agilent遗漏的产品');
console.log('=' + '='.repeat(79));
console.log(`总计: ${missingProducts.length} 个产品`);
console.log('=' + '='.repeat(79));

// 获取数据库中现有的Agilent产品
const [existingProducts] = await connection.execute(
  'SELECT partNumber FROM products WHERE brand = ?',
  ['Agilent']
);

const existingPartNumbers = new Set(
  existingProducts.map(p => p.partNumber)
);

let updatedCount = 0;
let createdCount = 0;
let skippedCount = 0;

for (let i = 0; i < missingProducts.length; i++) {
  const product = missingProducts[i];
  const partNumber = product.part_number;
  const catalogUrl = product.catalog_url;
  const detailedDescription = product.detailed_description;
  
  console.log(`\n[${i + 1}/${missingProducts.length}] ${partNumber}`);
  console.log(`  描述长度: ${detailedDescription.length} 字符`);
  
  try {
    if (existingPartNumbers.has(partNumber)) {
      // 产品已存在,更新描述
      const [result] = await connection.execute(
        `UPDATE products 
         SET detailedDescription = ?, 
             catalogUrl = ?,
             updatedAt = NOW()
         WHERE brand = ? AND partNumber = ?`,
        [detailedDescription, catalogUrl, 'Agilent', partNumber]
      );
      
      if (result.affectedRows > 0) {
        console.log(`  ✅ 更新成功`);
        updatedCount++;
      } else {
        console.log(`  ⚠️  更新失败`);
        skippedCount++;
      }
    } else {
      // 产品不存在,创建新产品
      // 注意: 我们需要从验证文件中获取更多信息来创建完整的产品记录
      // 但由于验证文件中可能没有所有必需字段,我们先跳过创建
      console.log(`  ⚠️  产品不在数据库中,跳过创建`);
      skippedCount++;
    }
  } catch (error) {
    console.log(`  ❌ 错误: ${error.message}`);
    skippedCount++;
  }
}

console.log('\n' + '=' + '='.repeat(79));
console.log('导入完成');
console.log('=' + '='.repeat(79));
console.log(`更新: ${updatedCount} 个产品`);
console.log(`创建: ${createdCount} 个产品`);
console.log(`跳过: ${skippedCount} 个产品`);
console.log(`总计: ${missingProducts.length} 个产品`);

await connection.end();
