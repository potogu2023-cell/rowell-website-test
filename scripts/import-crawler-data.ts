/**
 * 导入爬虫数据脚本
 * 
 * 功能：
 * 1. 读取爬虫团队提供的CSV文件
 * 2. 清理和标准化数据
 * 3. 验证Part Number格式
 * 4. 导入到数据库（新增或更新）
 * 5. 生成导入报告
 * 
 * 使用方法：
 * pnpm tsx scripts/import-crawler-data.ts /path/to/products_complete_final.csv
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { getDb } from '../server/db';
import { products } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

// 品牌前缀映射
const BRAND_PREFIX_MAP: Record<string, string> = {
  'Waters': 'WATS',
  'Agilent': 'AGIL',
  'Phenomenex': 'PHEN',
  'Thermo Fisher Scientific': 'THER',
  'Thermo Fisher': 'THER',
  'Shimadzu': 'SHIM',
  'Merck': 'MERC',
  'Restek': 'REST',
  'ACE': 'ACE',
  'Avantor': 'AVAN',
  'Daicel': 'DAIC',
  'Develosil': 'DEVE',
};

// 产品类型映射
const PRODUCT_TYPE_MAP: Record<string, string> = {
  'HPLC Column': 'hplc-columns',
  'GC Column': 'gc-columns',
  'Guard Column': 'guard-columns',
  'SPE Cartridge': 'spe-cartridges',
  'Filtration': 'filtration',
  'Chromatography Supplies': 'chromatography-supplies',
};

interface CrawlerProduct {
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

interface ImportStats {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{ row: number; error: string; data: any }>;
}

/**
 * 清理和标准化CSV数据
 */
function cleanCsvData(rawData: any[]): CrawlerProduct[] {
  const cleanedData: CrawlerProduct[] = [];

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    
    try {
      // 提取核心字段（前12列）
      const productId = row.productId?.trim();
      const partNumber = row.partNumber?.trim();
      const name = row.name?.trim();
      const brand = row.brand?.trim();
      const productType = row.productType?.trim();
      const particleSize = row.particleSize?.trim() || null;
      const poreSize = row.poreSize?.trim() || null;
      const columnLength = row.columnLength?.trim() || null;
      const innerDiameter = row.innerDiameter?.trim() || null;
      const phaseType = row.phaseType?.trim() || null;
      const phRange = row.phRange?.trim() || null;
      const status = row.status?.trim() || 'active';

      // 验证必需字段
      if (!productId || !partNumber || !name || !brand || !productType) {
        console.warn(`⚠️  行 ${i + 2}: 缺少必需字段，跳过`);
        continue;
      }

      // 验证品牌
      if (!BRAND_PREFIX_MAP[brand]) {
        console.warn(`⚠️  行 ${i + 2}: 未知品牌 "${brand}"，跳过`);
        continue;
      }

      // 验证产品类型
      if (!PRODUCT_TYPE_MAP[productType]) {
        console.warn(`⚠️  行 ${i + 2}: 未知产品类型 "${productType}"，跳过`);
        continue;
      }

      cleanedData.push({
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
      });
    } catch (error) {
      console.error(`❌ 行 ${i + 2}: 处理失败`, error);
    }
  }

  return cleanedData;
}

/**
 * 验证Part Number格式
 */
function validatePartNumber(partNumber: string, brand: string): boolean {
  const patterns: Record<string, RegExp> = {
    'Waters': /^\d{6,9}$/,
    'Agilent': /^[\d-]+$/,
    'Phenomenex': /^[A-Z0-9-]+$/,
    'Thermo Fisher Scientific': /^\d{6,}$/,
    'Thermo Fisher': /^\d{6,}$/,
    'Shimadzu': /^\d{3}-\d{5}-\d{2}$/,
    'Merck': /^[\d.A-Z-]+$/,
    'Restek': /^\d{5,6}$/,
    'ACE': /^ACE-[\d-]+$/,
    'Avantor': /^[A-Z.]+[\d-]+$/,
    'Daicel': /^[A-Z]{2}-[\d-]+$/,
    'Develosil': /^[A-Z]{2}-[\d-]+$/,
  };

  const pattern = patterns[brand];
  if (!pattern) {
    console.warn(`⚠️  未找到品牌 "${brand}" 的Part Number格式规则`);
    return true; // 允许通过
  }

  return pattern.test(partNumber);
}

/**
 * 导入产品到数据库
 */
async function importProducts(products: CrawlerProduct[]): Promise<ImportStats> {
  const stats: ImportStats = {
    total: products.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    
    try {
      // 验证Part Number格式
      if (!validatePartNumber(product.partNumber, product.brand)) {
        console.warn(`⚠️  产品 ${product.productId}: Part Number格式不符合品牌规范，但仍导入`);
      }

      // 检查产品是否已存在
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      const existing = await db
        .select()
        .from(products)
        .where(eq(products.productId, product.productId))
        .limit(1);

      const prefix = BRAND_PREFIX_MAP[product.brand];
      const category = PRODUCT_TYPE_MAP[product.productType];

      // 解析pH范围
      let phMin: number | null = null;
      let phMax: number | null = null;
      if (product.phRange) {
        const match = product.phRange.match(/(\d+\.?\d*)-(\d+\.?\d*)/);
        if (match) {
          phMin = parseFloat(match[1]);
          phMax = parseFloat(match[2]);
        }
      }

      const productData = {
        productId: product.productId,
        partNumber: product.partNumber,
        name: product.name,
        brand: product.brand,
        prefix,
        category,
        description: product.name, // 使用name作为description
        detailedDescription: null,
        specifications: null,
        particleSize: product.particleSize,
        poreSize: product.poreSize,
        columnLength: product.columnLength,
        innerDiameter: product.innerDiameter,
        phaseType: product.phaseType,
        phRange: product.phRange,
        phMin,
        phMax,
        maxPressure: null,
        maxTemperature: null,
        usp: null,
        applications: null,
        imageUrl: null,
        catalogUrl: null,
        technicalDocsUrl: null,
        status: product.status,
        updatedAt: new Date(),
      };

      if (existing.length > 0) {
        // 更新现有产品
        await db
          .update(products)
          .set(productData)
          .where(eq(products.productId, product.productId));
        
        stats.updated++;
        console.log(`✅ 更新: ${product.productId} - ${product.name}`);
      } else {
        // 插入新产品
        await db.insert(products).values({
          ...productData,
          createdAt: new Date(),
        });
        
        stats.inserted++;
        console.log(`✅ 新增: ${product.productId} - ${product.name}`);
      }
    } catch (error) {
      stats.errors++;
      stats.errorDetails.push({
        row: i + 2,
        error: error instanceof Error ? error.message : String(error),
        data: product,
      });
      console.error(`❌ 导入失败: ${product.productId}`, error);
    }

    // 每100条显示进度
    if ((i + 1) % 100 === 0) {
      console.log(`📊 进度: ${i + 1}/${products.length} (${Math.round((i + 1) / products.length * 100)}%)`);
    }
  }

  return stats;
}

/**
 * 生成导入报告
 */
function generateReport(stats: ImportStats): string {
  const report = `
# 爬虫数据导入报告

## 📊 导入统计

- **总记录数**: ${stats.total}
- **新增产品**: ${stats.inserted}
- **更新产品**: ${stats.updated}
- **跳过记录**: ${stats.skipped}
- **错误记录**: ${stats.errors}

## ✅ 导入成功率

${Math.round((stats.inserted + stats.updated) / stats.total * 100)}% (${stats.inserted + stats.updated}/${stats.total})

## ❌ 错误详情

${stats.errors > 0 ? stats.errorDetails.map(e => `
### 行 ${e.row}
- **错误**: ${e.error}
- **数据**: ${JSON.stringify(e.data, null, 2)}
`).join('\n') : '无错误'}

---

**导入时间**: ${new Date().toISOString()}
`;

  return report;
}

/**
 * 主函数
 */
async function main() {
  const csvFilePath = process.argv[2];

  if (!csvFilePath) {
    console.error('❌ 请提供CSV文件路径');
    console.log('使用方法: pnpm tsx scripts/import-crawler-data.ts /path/to/products_complete_final.csv');
    process.exit(1);
  }

  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ 文件不存在: ${csvFilePath}`);
    process.exit(1);
  }

  console.log('🚀 开始导入爬虫数据...\n');
  console.log(`📁 CSV文件: ${csvFilePath}\n`);

  // 读取CSV文件
  console.log('📖 读取CSV文件...');
  const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
  const rawData = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  console.log(`✅ 读取完成，共 ${rawData.length} 条记录\n`);

  // 清理数据
  console.log('🧹 清理和标准化数据...');
  const cleanedData = cleanCsvData(rawData);
  console.log(`✅ 清理完成，有效记录 ${cleanedData.length} 条\n`);

  // 导入数据
  console.log('💾 开始导入数据到数据库...\n');
  const stats = await importProducts(cleanedData);

  // 生成报告
  console.log('\n📊 生成导入报告...');
  const report = generateReport(stats);
  const reportPath = path.join(process.cwd(), 'crawler-data-import-report.md');
  fs.writeFileSync(reportPath, report);
  console.log(`✅ 报告已保存: ${reportPath}\n`);

  // 显示摘要
  console.log('═══════════════════════════════════════');
  console.log('📊 导入完成摘要');
  console.log('═══════════════════════════════════════');
  console.log(`总记录数: ${stats.total}`);
  console.log(`新增产品: ${stats.inserted}`);
  console.log(`更新产品: ${stats.updated}`);
  console.log(`跳过记录: ${stats.skipped}`);
  console.log(`错误记录: ${stats.errors}`);
  console.log(`成功率: ${Math.round((stats.inserted + stats.updated) / stats.total * 100)}%`);
  console.log('═══════════════════════════════════════\n');

  if (stats.errors > 0) {
    console.log(`⚠️  有 ${stats.errors} 条记录导入失败，请查看报告了解详情`);
  } else {
    console.log('🎉 所有记录导入成功！');
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('❌ 导入过程发生错误:', error);
  process.exit(1);
});

