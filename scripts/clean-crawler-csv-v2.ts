/**
 * 清理爬虫CSV数据 V2
 * 
 * 改进：
 * 1. 使用更robust的CSV解析选项
 * 2. 处理多行字段和特殊字符
 * 3. 只保留前12列标准化字段
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

interface CleanProduct {
  productId: string;
  partNumber: string;
  name: string;
  brand: string;
  productType: string;
  particleSize: string;
  poreSize: string;
  columnLength: string;
  innerDiameter: string;
  phaseType: string;
  phRange: string;
  status: string;
}

function cleanBrandName(brand: string): string {
  if (!brand) return '';
  // 移除品牌名称中的管道符和多余内容
  if (brand.includes('|')) {
    return brand.split('|')[0].trim();
  }
  return brand.trim();
}

function isValidProduct(product: any): boolean {
  // 检查必需字段
  const required = ['productId', 'partNumber', 'name', 'brand', 'productType'];
  for (const field of required) {
    if (!product[field] || product[field].trim() === '') {
      return false;
    }
  }
  return true;
}

async function main() {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3] || inputFile.replace('.csv', '_cleaned_v2.csv');

  if (!inputFile) {
    console.error('❌ 请提供输入CSV文件路径');
    console.log('使用方法: pnpm tsx scripts/clean-crawler-csv-v2.ts input.csv [output.csv]');
    process.exit(1);
  }

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ 文件不存在: ${inputFile}`);
    process.exit(1);
  }

  console.log('🚀 开始清理CSV数据（V2）...\n');
  console.log(`📁 输入文件: ${inputFile}`);
  console.log(`📁 输出文件: ${outputFile}\n`);

  // 读取CSV文件 - 使用更robust的选项
  console.log('📖 读取CSV文件...');
  const csvContent = fs.readFileSync(inputFile, 'utf-8');
  
  let rawData: any[];
  try {
    rawData = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true, // 允许列数不一致
      relax_quotes: true, // 放宽引号规则
      escape: '\\', // 转义字符
      quote: '"', // 引号字符
      record_delimiter: '\n', // 记录分隔符
      bom: true, // 处理BOM
    });
  } catch (error) {
    console.error('❌ CSV解析失败:', error);
    process.exit(1);
  }
  
  console.log(`✅ 读取完成，共 ${rawData.length} 条记录\n`);

  // 清理数据
  console.log('🧹 清理数据...');
  const cleanedData: CleanProduct[] = [];
  const skippedReasons: Record<string, number> = {
    'missing_fields': 0,
    'invalid_brand': 0,
    'invalid_type': 0,
    'other': 0,
  };

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    
    try {
      // 验证必需字段
      if (!isValidProduct(row)) {
        skippedReasons['missing_fields']++;
        continue;
      }

      const brand = cleanBrandName(row.brand);
      if (!brand) {
        skippedReasons['invalid_brand']++;
        continue;
      }

      const productType = row.productType?.trim();
      if (!productType) {
        skippedReasons['invalid_type']++;
        continue;
      }

      // 清理名称中的换行符和多余空格
      const name = row.name?.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

      cleanedData.push({
        productId: row.productId.trim(),
        partNumber: row.partNumber.trim(),
        name: name || row.name.trim(),
        brand,
        productType,
        particleSize: row.particleSize?.trim() || '',
        poreSize: row.poreSize?.trim() || '',
        columnLength: row.columnLength?.trim() || '',
        innerDiameter: row.innerDiameter?.trim() || '',
        phaseType: row.phaseType?.trim() || '',
        phRange: row.phRange?.trim() || '',
        status: row.status?.trim() || 'active',
      });
    } catch (error) {
      console.error(`❌ 行 ${i + 2}: 处理失败`, error);
      skippedReasons['other']++;
    }
  }

  const totalSkipped = Object.values(skippedReasons).reduce((a, b) => a + b, 0);
  console.log(`✅ 清理完成，有效记录 ${cleanedData.length} 条，跳过 ${totalSkipped} 条\n`);
  console.log('跳过原因统计:');
  Object.entries(skippedReasons).forEach(([reason, count]) => {
    if (count > 0) {
      console.log(`  ${reason}: ${count}`);
    }
  });
  console.log();

  // 输出清理后的CSV
  console.log('💾 写入清理后的CSV文件...');
  const output = stringify(cleanedData, {
    header: true,
    quoted: true, // 所有字段都加引号，避免特殊字符问题
  });
  
  fs.writeFileSync(outputFile, output);
  console.log(`✅ 文件已保存: ${outputFile}\n`);

  // 统计信息
  const brandCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  
  cleanedData.forEach(p => {
    brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
    typeCounts[p.productType] = (typeCounts[p.productType] || 0) + 1;
  });

  console.log('═══════════════════════════════════════');
  console.log('📊 数据统计');
  console.log('═══════════════════════════════════════');
  console.log(`总记录数: ${cleanedData.length}`);
  console.log(`跳过记录: ${totalSkipped}`);
  console.log(`数据保留率: ${(cleanedData.length / rawData.length * 100).toFixed(1)}%`);
  console.log('\n品牌分布:');
  Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([brand, count]) => {
      console.log(`  ${brand}: ${count}`);
    });
  console.log('\n产品类型分布:');
  Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
  console.log('═══════════════════════════════════════\n');

  console.log('🎉 清理完成！');
  console.log(`\n下一步: 使用以下命令导入数据到数据库:`);
  console.log(`pnpm tsx scripts/import-crawler-data.ts ${outputFile}`);
  
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ 清理过程发生错误:', error);
  process.exit(1);
});

