import { getDb } from '../server/db';
import { products } from '../drizzle/schema';
import { sql } from 'drizzle-orm';

/**
 * 数据质量改进脚本
 * 从产品名称和描述中提取缺失的尺寸、孔径和pH范围数据
 */

// 尺寸解析正则表达式
const dimensionPatterns = [
  // Pattern 1: "30 x 2 mm" or "30 x 2mm" or "30x2 mm"
  /(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*mm/i,
  // Pattern 2: "100mmL.×6mmI.D." (Shimadzu format)
  /(\d+(?:\.\d+)?)mmL\.?[×x]\s*(\d+(?:\.\d+)?)mmI\.?D\.?/i,
  // Pattern 3: "Length: 100mm, ID: 4.6mm"
  /Length:\s*(\d+(?:\.\d+)?)\s*mm.*?I\.?D\.?:?\s*(\d+(?:\.\d+)?)\s*mm/i,
];

// 孔径解析正则表达式
const poreSizePatterns = [
  // Pattern 1: "100 Å" or "100Å" or "100 A"
  /(\d+(?:\.\d+)?)\s*[ÅA]\b/,
  // Pattern 2: "Pore Size: 100Å"
  /Pore\s*Size:\s*(\d+(?:\.\d+)?)\s*[ÅA]/i,
];

// pH范围解析正则表达式
const phRangePatterns = [
  // Pattern 1: "pH 2-8" or "pH 2.0-8.0" or "pH: 2-8"
  /pH:?\s*(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/i,
  // Pattern 2: "pH Range: 2-8"
  /pH\s*Range:\s*(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/i,
];

interface ParsedData {
  columnLength?: number;
  innerDiameter?: number;
  poreSize?: number;
  phMin?: number;
  phMax?: number;
}

function parseDimensions(text: string): { length?: number; diameter?: number } {
  for (const pattern of dimensionPatterns) {
    const match = text.match(pattern);
    if (match) {
      const length = parseFloat(match[1]);
      const diameter = parseFloat(match[2]);
      if (length > 0 && diameter > 0 && length >= diameter) {
        return { length, diameter };
      }
    }
  }
  return {};
}

function parsePoreSize(text: string): number | undefined {
  for (const pattern of poreSizePatterns) {
    const match = text.match(pattern);
    if (match) {
      const poreSize = parseFloat(match[1]);
      if (poreSize > 0 && poreSize <= 1000) {
        return poreSize;
      }
    }
  }
  return undefined;
}

function parsePhRange(text: string): { min?: number; max?: number } {
  for (const pattern of phRangePatterns) {
    const match = text.match(pattern);
    if (match) {
      const min = parseFloat(match[1]);
      const max = parseFloat(match[2]);
      if (min >= 0 && max <= 14 && min < max) {
        return { min, max };
      }
    }
  }
  return {};
}

function parseProductData(name: string, description: string): ParsedData {
  const combinedText = `${name} ${description}`;
  const parsed: ParsedData = {};

  // 解析尺寸
  const dimensions = parseDimensions(combinedText);
  if (dimensions.length) parsed.columnLength = dimensions.length;
  if (dimensions.diameter) parsed.innerDiameter = dimensions.diameter;

  // 解析孔径
  const poreSize = parsePoreSize(combinedText);
  if (poreSize) parsed.poreSize = poreSize;

  // 解析pH范围
  const phRange = parsePhRange(combinedText);
  if (phRange.min !== undefined) parsed.phMin = phRange.min;
  if (phRange.max !== undefined) parsed.phMax = phRange.max;

  return parsed;
}

async function improveDataQuality() {
  console.log('开始数据质量改进...\n');

  // 获取数据库连接
  const db = await getDb();
  if (!db) {
    throw new Error('数据库连接失败');
  }

  // 1. 获取所有活跃产品
  const allProducts = await db.select().from(products).where(sql`status = 'active'`);
  console.log(`总产品数: ${allProducts.length}`);

  // 2. 统计当前数据完整度
  const initialStats = {
    totalProducts: allProducts.length,
    hasDimensions: allProducts.filter(p => p.columnLength && p.innerDiameter).length,
    hasPoreSize: allProducts.filter(p => p.poreSize).length,
    hasPhRange: allProducts.filter(p => p.phMin !== null && p.phMax !== null).length,
  };

  console.log('\n当前数据完整度:');
  console.log(`- 尺寸: ${initialStats.hasDimensions} / ${initialStats.totalProducts} (${(initialStats.hasDimensions / initialStats.totalProducts * 100).toFixed(1)}%)`);
  console.log(`- 孔径: ${initialStats.hasPoreSize} / ${initialStats.totalProducts} (${(initialStats.hasPoreSize / initialStats.totalProducts * 100).toFixed(1)}%)`);
  console.log(`- pH范围: ${initialStats.hasPhRange} / ${initialStats.totalProducts} (${(initialStats.hasPhRange / initialStats.totalProducts * 100).toFixed(1)}%)`);

  // 3. 解析并更新缺失数据
  let updatedCount = 0;
  let dimensionsUpdated = 0;
  let poreSizeUpdated = 0;
  let phRangeUpdated = 0;

  for (const product of allProducts) {
    const parsed = parseProductData(product.name, product.description);
    const updates: any = {};

    // 只更新缺失的字段
    if (!product.columnLength && parsed.columnLength) {
      updates.columnLength = parsed.columnLength;
      dimensionsUpdated++;
    }
    if (!product.innerDiameter && parsed.innerDiameter) {
      updates.innerDiameter = parsed.innerDiameter;
    }
    if (!product.poreSize && parsed.poreSize) {
      updates.poreSize = parsed.poreSize;
      poreSizeUpdated++;
    }
    if (product.phMin === null && parsed.phMin !== undefined) {
      updates.phMin = parsed.phMin;
      phRangeUpdated++;
    }
    if (product.phMax === null && parsed.phMax !== undefined) {
      updates.phMax = parsed.phMax;
    }

    // 如果有更新，执行数据库更新
    if (Object.keys(updates).length > 0) {
      await db.update(products)
        .set(updates)
        .where(sql`productId = ${product.productId}`);
      updatedCount++;

      if (updatedCount <= 5) {
        console.log(`\n示例更新 #${updatedCount}:`);
        console.log(`- 产品: ${product.productId} (${product.brand})`);
        console.log(`- 名称: ${product.name}`);
        console.log(`- 更新字段: ${Object.keys(updates).join(', ')}`);
        console.log(`- 新值: ${JSON.stringify(updates)}`);
      }
    }
  }

  // 4. 重新统计数据完整度
  const updatedProducts = await db.select().from(products).where(sql`status = 'active'`);
  const finalStats = {
    totalProducts: updatedProducts.length,
    hasDimensions: updatedProducts.filter(p => p.columnLength && p.innerDiameter).length,
    hasPoreSize: updatedProducts.filter(p => p.poreSize).length,
    hasPhRange: updatedProducts.filter(p => p.phMin !== null && p.phMax !== null).length,
  };

  console.log(`\n\n数据质量改进完成！`);
  console.log(`\n更新统计:`);
  console.log(`- 总更新产品数: ${updatedCount}`);
  console.log(`- 尺寸数据更新: ${dimensionsUpdated}`);
  console.log(`- 孔径数据更新: ${poreSizeUpdated}`);
  console.log(`- pH范围更新: ${phRangeUpdated}`);

  console.log(`\n改进后数据完整度:`);
  console.log(`- 尺寸: ${finalStats.hasDimensions} / ${finalStats.totalProducts} (${(finalStats.hasDimensions / finalStats.totalProducts * 100).toFixed(1)}%) [+${finalStats.hasDimensions - initialStats.hasDimensions}]`);
  console.log(`- 孔径: ${finalStats.hasPoreSize} / ${finalStats.totalProducts} (${(finalStats.hasPoreSize / finalStats.totalProducts * 100).toFixed(1)}%) [+${finalStats.hasPoreSize - initialStats.hasPoreSize}]`);
  console.log(`- pH范围: ${finalStats.hasPhRange} / ${finalStats.totalProducts} (${(finalStats.hasPhRange / finalStats.totalProducts * 100).toFixed(1)}%) [+${finalStats.hasPhRange - initialStats.hasPhRange}]`);
}

// 运行脚本
improveDataQuality()
  .then(() => {
    console.log('\n✅ 数据质量改进成功完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 数据质量改进失败:', error);
    process.exit(1);
  });

