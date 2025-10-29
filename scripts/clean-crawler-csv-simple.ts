/**
 * 简单直接的CSV清理脚本
 * 
 * 策略：
 * 1. 逐行读取文件
 * 2. 手动分割前12个字段
 * 3. 忽略后面的原始数据列
 * 4. 处理引号和转义字符
 */

import fs from 'fs';
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

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // 转义的引号
        current += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
      i++;
      continue;
    }

    if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
      i++;
      continue;
    }

    current += char;
    i++;
  }

  // 添加最后一个字段
  fields.push(current.trim());
  
  return fields;
}

function cleanBrandName(brand: string): string {
  if (!brand) return '';
  if (brand.includes('|')) {
    return brand.split('|')[0].trim();
  }
  return brand.trim();
}

async function main() {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3] || inputFile.replace('.csv', '_cleaned_simple.csv');

  if (!inputFile) {
    console.error('❌ 请提供输入CSV文件路径');
    process.exit(1);
  }

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ 文件不存在: ${inputFile}`);
    process.exit(1);
  }

  console.log('🚀 开始清理CSV数据（Simple）...\n');
  console.log(`📁 输入文件: ${inputFile}`);
  console.log(`📁 输出文件: ${outputFile}\n`);

  // 逐行读取文件
  console.log('📖 读取CSV文件...');
  const lines = fs.readFileSync(inputFile, 'utf-8').split('\n');
  console.log(`✅ 读取完成，共 ${lines.length - 1} 行数据\n`);

  // 跳过表头
  const header = lines[0];
  console.log('📋 表头:', header.substring(0, 100) + '...\n');

  // 清理数据
  console.log('🧹 清理数据...');
  const cleanedData: CleanProduct[] = [];
  const skippedReasons: Record<string, number> = {
    'empty_line': 0,
    'missing_fields': 0,
    'invalid_brand': 0,
    'parse_error': 0,
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      skippedReasons['empty_line']++;
      continue;
    }

    try {
      const fields = parseCSVLine(line);
      
      // 只取前12个字段
      if (fields.length < 12) {
        skippedReasons['missing_fields']++;
        continue;
      }

      const [
        productId,
        partNumber,
        name,
        brand,
        productType,
        particleSize,
        poreSize,
        columnLength,
        innerDiameter,
        phaseType,
        phRange,
        status,
      ] = fields;

      // 验证必需字段
      if (!productId || !partNumber || !name || !brand || !productType) {
        skippedReasons['missing_fields']++;
        continue;
      }

      const cleanedBrand = cleanBrandName(brand);
      if (!cleanedBrand) {
        skippedReasons['invalid_brand']++;
        continue;
      }

      // 清理名称中的换行符
      const cleanedName = name.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

      cleanedData.push({
        productId: productId.trim(),
        partNumber: partNumber.trim(),
        name: cleanedName,
        brand: cleanedBrand,
        productType: productType.trim(),
        particleSize: particleSize?.trim() || '',
        poreSize: poreSize?.trim() || '',
        columnLength: columnLength?.trim() || '',
        innerDiameter: innerDiameter?.trim() || '',
        phaseType: phaseType?.trim() || '',
        phRange: phRange?.trim() || '',
        status: status?.trim() || 'active',
      });
    } catch (error) {
      console.error(`❌ 行 ${i + 1}: 解析失败`, error);
      skippedReasons['parse_error']++;
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
    quoted: true,
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
  console.log(`数据保留率: ${(cleanedData.length / (lines.length - 1) * 100).toFixed(1)}%`);
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

