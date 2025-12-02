#!/usr/bin/env node
/**
 * 导入Develosil和Shimadzu爬虫验证数据到数据库
 * 
 * 数据来源：
 * - Develosil: 24条记录
 * - Shimadzu: 514条记录（去重后）
 * 
 * 导入策略：
 * - 根据partNumber匹配现有产品
 * - 更新detailedDescription和catalogUrl字段
 * - 不创建新产品，只更新现有产品
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { eq } from 'drizzle-orm';
import fs from 'fs';

// Database connection
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

async function importVerificationData() {
  console.log('='.repeat(80));
  console.log('开始导入Develosil和Shimadzu爬虫验证数据');
  console.log('='.repeat(80));
  
  // 读取Develosil数据
  const develosilData = JSON.parse(
    fs.readFileSync('/home/ubuntu/upload/develosil_verification_success_20251127.json', 'utf-8')
  );
  
  // 读取Shimadzu数据（去重后）
  const shimadzuData = JSON.parse(
    fs.readFileSync('/home/ubuntu/shimadzu_verification_deduplicated_20251127.json', 'utf-8')
  );
  
  console.log(`\nDevelosil 数据: ${develosilData.length} 条`);
  console.log(`Shimadzu 数据: ${shimadzuData.length} 条`);
  console.log(`总计: ${develosilData.length + shimadzuData.length} 条`);
  
  let totalUpdated = 0;
  let totalNotFound = 0;
  let totalSkipped = 0;
  
  // 导入Develosil数据
  console.log('\n' + '='.repeat(80));
  console.log('【1/2】导入Develosil数据...');
  console.log('='.repeat(80));
  
  for (let i = 0; i < develosilData.length; i++) {
    const record = develosilData[i];
    const partNumber = record.part_number;
    
    // 查找数据库中的产品
    const [existingProducts] = await connection.execute(
      'SELECT * FROM products WHERE partNumber = ? LIMIT 1',
      [partNumber]
    );
    
    if (existingProducts.length === 0) {
      console.log(`  [${i+1}/${develosilData.length}] ⚠️  未找到: ${partNumber}`);
      totalNotFound++;
      continue;
    }
    
    const existingProduct = existingProducts[0];
    
    // 检查是否需要更新
    const needsUpdate = 
      record.detailed_description && record.detailed_description.length > 0 &&
      (!existingProduct.detailedDescription || existingProduct.detailedDescription.length < record.detailed_description.length);
    
    if (!needsUpdate) {
      console.log(`  [${i+1}/${develosilData.length}] ⏭️  跳过: ${partNumber} (已有更好的描述)`);
      totalSkipped++;
      continue;
    }
    
    // 更新产品
    await connection.execute(
      'UPDATE products SET detailedDescription = ?, catalogUrl = ?, updatedAt = NOW() WHERE id = ?',
      [
        record.detailed_description,
        record.catalog_url || existingProduct.catalogUrl,
        existingProduct.id
      ]
    );
    
    console.log(`  [${i+1}/${develosilData.length}] ✅ 更新: ${partNumber} (${record.detailed_description.length} 字符)`);
    totalUpdated++;
  }
  
  // 导入Shimadzu数据
  console.log('\n' + '='.repeat(80));
  console.log('【2/2】导入Shimadzu数据...');
  console.log('='.repeat(80));
  
  for (let i = 0; i < shimadzuData.length; i++) {
    const record = shimadzuData[i];
    const partNumber = record.part_number;
    
    // 查找数据库中的产品
    const [existingProducts] = await connection.execute(
      'SELECT * FROM products WHERE partNumber = ? LIMIT 1',
      [partNumber]
    );
    
    if (existingProducts.length === 0) {
      console.log(`  [${i+1}/${shimadzuData.length}] ⚠️  未找到: ${partNumber}`);
      totalNotFound++;
      continue;
    }
    
    const existingProduct = existingProducts[0];
    
    // 检查是否需要更新
    const needsUpdate = 
      record.detailed_description && record.detailed_description.length > 0 &&
      (!existingProduct.detailedDescription || existingProduct.detailedDescription.length < record.detailed_description.length);
    
    if (!needsUpdate) {
      console.log(`  [${i+1}/${shimadzuData.length}] ⏭️  跳过: ${partNumber} (已有更好的描述)`);
      totalSkipped++;
      continue;
    }
    
    // 更新产品
    await connection.execute(
      'UPDATE products SET detailedDescription = ?, catalogUrl = ?, updatedAt = NOW() WHERE id = ?',
      [
        record.detailed_description,
        record.catalog_url || existingProduct.catalogUrl,
        existingProduct.id
      ]
    );
    
    console.log(`  [${i+1}/${shimadzuData.length}] ✅ 更新: ${partNumber} (${record.detailed_description.length} 字符)`);
    totalUpdated++;
  }
  
  // 汇总统计
  console.log('\n' + '='.repeat(80));
  console.log('导入完成！');
  console.log('='.repeat(80));
  console.log(`\n总记录数: ${develosilData.length + shimadzuData.length}`);
  console.log(`✅ 成功更新: ${totalUpdated}`);
  console.log(`⏭️  跳过（已有更好描述）: ${totalSkipped}`);
  console.log(`⚠️  未找到（数据库中不存在）: ${totalNotFound}`);
  console.log(`\n成功率: ${((totalUpdated / (develosilData.length + shimadzuData.length)) * 100).toFixed(1)}%`);
  
  // 验证导入结果
  console.log('\n' + '='.repeat(80));
  console.log('验证导入结果...');
  console.log('='.repeat(80));
  
  const [develosilProducts] = await connection.execute(
    'SELECT * FROM products WHERE brand = ?',
    ['Develosil']
  );
  
  const [shimadzuProducts] = await connection.execute(
    'SELECT * FROM products WHERE brand = ?',
    ['Shimadzu']
  );
  
  const develosilWithDesc = develosilProducts.filter(p => p.detailedDescription && p.detailedDescription.length > 0);
  const shimadzuWithDesc = shimadzuProducts.filter(p => p.detailedDescription && p.detailedDescription.length > 0);
  
  console.log(`\nDevelosil:`);
  console.log(`  总产品数: ${develosilProducts.length}`);
  console.log(`  有描述: ${develosilWithDesc.length} (${((develosilWithDesc.length / develosilProducts.length) * 100).toFixed(1)}%)`);
  if (develosilWithDesc.length > 0) {
    console.log(`  平均描述长度: ${Math.round(develosilWithDesc.reduce((sum, p) => sum + p.detailedDescription.length, 0) / develosilWithDesc.length)} 字符`);
  }
  
  console.log(`\nShimadzu:`);
  console.log(`  总产品数: ${shimadzuProducts.length}`);
  console.log(`  有描述: ${shimadzuWithDesc.length} (${((shimadzuWithDesc.length / shimadzuProducts.length) * 100).toFixed(1)}%)`);
  if (shimadzuWithDesc.length > 0) {
    console.log(`  平均描述长度: ${Math.round(shimadzuWithDesc.reduce((sum, p) => sum + p.detailedDescription.length, 0) / shimadzuWithDesc.length)} 字符`);
  }
  
  console.log('\n✅ 导入验证完成！');
  
  await connection.end();
  process.exit(0);
}

importVerificationData().catch(err => {
  console.error('❌ 导入失败:', err);
  connection.end();
  process.exit(1);
});
