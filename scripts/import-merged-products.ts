import { drizzle } from "drizzle-orm/mysql2";
import { products } from "../drizzle/schema";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

// 生成品牌前缀
function generatePrefix(brand: string): string {
  const prefixMap: Record<string, string> = {
    "Waters": "WATS",
    "Agilent": "AGIL",
    "Phenomenex": "PHEN",
    "Shimadzu": "SHIM",
    "ACE": "ACE",
    "Daicel": "DAIC",
    "Develosil": "DEVE",
    "Merck": "MERC",
    "Thermo Fisher Scientific": "THER",
    "Thermo Fisher": "THER",
    "Restek": "REST",
    "Avantor": "AVAN",
    "Merck/Sigma-Aldrich": "MERC",
  };

  return prefixMap[brand] || brand.substring(0, 4).toUpperCase();
}

async function importProducts() {
  console.log("=".repeat(80));
  console.log("导入产品数据到数据库");
  console.log("=".repeat(80));

  // 读取CSV文件
  const csvPath = path.join(__dirname, "../../upload/merged_products.csv");
  console.log(`\n[1/5] 读取CSV文件: ${csvPath}`);
  
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`   读取 ${records.length} 条记录`);

  // 清空现有产品数据
  console.log("\n[2/5] 清空现有产品数据...");
  await db.delete(products);
  console.log("   清空完成");

  // 数据转换和验证
  console.log("\n[3/5] 数据转换和验证...");
  const validRecords = [];
  const invalidRecords = [];

  for (const record of records) {
    if (!record.brand || !record.partNumber || !record.name) {
      invalidRecords.push(record);
      continue;
    }

    const prefix = generatePrefix(record.brand);
    
    validRecords.push({
      productId: record.productId || `${prefix}-${record.partNumber}`,
      partNumber: record.partNumber,
      brand: record.brand,
      prefix: prefix,
      productType: record.productType || null,
      name: record.name,
      description: record.description || null,
      detailedDescription: null,
      specifications: null,
      particleSize: record.particleSize || null,
      poreSize: record.poreSize || null,
      columnLength: record.columnLength || null,
      innerDiameter: record.innerDiameter || null,
      phRange: record.phRange || null,
      maxPressure: null,
      maxTemperature: null,
      usp: null,
      phaseType: record.phaseType || null,
      particleSizeNum: null,
      poreSizeNum: null,
      columnLengthNum: null,
      innerDiameterNum: null,
      phMin: null,
      phMax: null,
      applications: null,
      imageUrl: null,
      catalogUrl: null,
      technicalDocsUrl: null,
      status: "active",
    });
  }

  console.log(`   有效记录: ${validRecords.length}`);
  console.log(`   无效记录: ${invalidRecords.length}`);

  if (invalidRecords.length > 0) {
    console.log("\n   前5条无效记录:");
    invalidRecords.slice(0, 5).forEach((r, i) => {
      console.log(`     ${i+1}. ${r.brand || 'N/A'} | ${r.partNumber || 'N/A'} | ${r.name || 'N/A'}`);
    });
  }

  // 批量导入
  console.log("\n[4/5] 批量导入产品...");
  const batchSize = 100;
  let imported = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < validRecords.length; i += batchSize) {
    const batch = validRecords.slice(i, i + batchSize);

    try {
      await db.insert(products).values(batch);
      imported += batch.length;
      process.stdout.write(`\r   进度: ${imported}/${validRecords.length} (${Math.round(imported/validRecords.length*100)}%)`);
    } catch (error: any) {
      failed += batch.length;
      errors.push(`Batch ${i}-${i+batch.length}: ${error.message}`);
    }
  }

  console.log("\n");

  // 统计
  console.log("\n[5/5] 导入统计");
  console.log(`   成功: ${imported}`);
  console.log(`   失败: ${failed}`);
  console.log(`   成功率: ${Math.round(imported/(imported+failed)*100)}%`);

  if (errors.length > 0) {
    console.log("\n错误详情:");
    errors.slice(0, 5).forEach(err => console.log(`   ${err}`));
  }

  console.log("\n" + "=".repeat(80));
  console.log(`✅ 产品导入完成：${imported} 个产品`);
  console.log("=".repeat(80));
}

importProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 导入失败:", error);
    process.exit(1);
  });
