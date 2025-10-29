/**
 * 清理爬虫CSV数据
 * 
 * 功能：
 * 1. 读取原始CSV文件
 * 2. 只保留前12列核心字段
 * 3. 修复品牌名称中的错误数据
 * 4. 输出清理后的CSV文件
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

interface RawProduct {
  productId: string;
  partNumber: string;
  name: string;
  brand: string;
  productType: string;
  particleSize?: string;
  poreSize?: string;
  columnLength?: string;
  innerDiameter?: string;
  phaseType?: string;
  phRange?: string;
  status: string;
}

function cleanBrandName(brand: string): string {
  // 修复品牌名称中的错误格式
  if (brand.includes('|')) {
    return brand.split('|')[0].trim();
  }
  return brand.trim();
}

function cleanProductType(productType: string): string {
  // 标准化产品类型名称
  const typeMap: Record<string, string> = {
    'HPLC Column': 'HPLC Column',
    'GC Column': 'GC Column',
    'Guard Column': 'Guard Column',
    'SPE Cartridge': 'SPE Cartridge',
    'Filtration': 'Filtration',
    'Chromatography Supplies': 'Chromatography Supplies',
  };
  
  return typeMap[productType] || productType;
}

async function main() {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3] || inputFile.replace('.csv', '_cleaned.csv');

  if (!inputFile) {
    console.error('❌ 请提供输入CSV文件路径');
    console.log('使用方法: pnpm tsx scripts/clean-crawler-csv.ts input.csv [output.csv]');
    process.exit(1);
  }

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ 文件不存在: ${inputFile}`);
    process.exit(1);
  }

  console.log('🚀 开始清理CSV数据...\n');
  console.log(`📁 输入文件: ${inputFile}`);
  console.log(`📁 输出文件: ${outputFile}\n`);

  // 读取CSV文件
  console.log('📖 读取CSV文件...');
  const csvContent = fs.readFileSync(inputFile, 'utf-8');
  const rawData = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true, // 允许列数不一致
  });
  console.log(`✅ 读取完成，共 ${rawData.length} 条记录\n`);

  // 清理数据
  console.log('🧹 清理数据...');
  const cleanedData: RawProduct[] = [];
  let skipped = 0;

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    
    try {
      const productId = row.productId?.trim();
      const partNumber = row.partNumber?.trim();
      const name = row.name?.trim();
      let brand = row.brand?.trim();
      let productType = row.productType?.trim();
      
      // 验证必需字段
      if (!productId || !partNumber || !name || !brand || !productType) {
        skipped++;
        continue;
      }

      // 清理品牌名称
      brand = cleanBrandName(brand);
      
      // 清理产品类型
      productType = cleanProductType(productType);

      cleanedData.push({
        productId,
        partNumber,
        name,
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
      skipped++;
    }
  }

  console.log(`✅ 清理完成，有效记录 ${cleanedData.length} 条，跳过 ${skipped} 条\n`);

  // 输出清理后的CSV
  console.log('💾 写入清理后的CSV文件...');
  const output = stringify(cleanedData, {
    header: true,
    columns: [
      'productId',
      'partNumber',
      'name',
      'brand',
      'productType',
      'particleSize',
      'poreSize',
      'columnLength',
      'innerDiameter',
      'phaseType',
      'phRange',
      'status',
    ],
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
  console.log(`跳过记录: ${skipped}`);
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
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ 清理过程发生错误:', error);
  process.exit(1);
});

