/**
 * Batch Import All Crawler Data
 * 
 * This script imports all CSV files from the crawler output directory
 * and updates the database with corrected Part Numbers and product information.
 * 
 * Usage:
 *   pnpm tsx scripts/import-all-crawler-data.ts <crawler_output_dir>
 * 
 * Expected directory structure:
 *   crawler_output/
 *   ├── Waters/
 *   │   ├── hplc_columns.csv
 *   │   ├── gc_columns.csv
 *   │   └── ...
 *   ├── Agilent/
 *   │   └── ...
 *   └── ...
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { products } from "../drizzle/schema";
import * as fs from "fs";
import * as path from "path";

interface CrawlerProduct {
  productId: string;
  partNumber: string;
  brand: string;
  prefix: string;
  name: string;
  description?: string;
  detailedDescription?: string;
  particleSize?: string;
  poreSize?: string;
  columnLength?: string;
  innerDiameter?: string;
  phaseType?: string;
  phRange?: string;
  phMin?: number;
  phMax?: number;
  maxPressure?: string;
  maxTemperature?: string;
  usp?: string;
  applications?: string;
  imageUrl?: string;
  catalogUrl?: string;
  technicalDocsUrl?: string;
  status?: string;
}

interface ImportStats {
  totalFiles: number;
  totalProducts: number;
  successCount: number;
  failCount: number;
  notFoundCount: number;
  byBrand: Map<string, { success: number; fail: number; notFound: number }>;
}

async function parseCSV(filePath: string): Promise<CrawlerProduct[]> {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter(line => line.trim());
  
  if (lines.length < 2) {
    console.log(`⚠️  Skipping empty file: ${filePath}`);
    return [];
  }

  const headers = lines[0].split(",").map(h => h.trim());
  const products: CrawlerProduct[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim());
    const product: any = {};

    headers.forEach((header, index) => {
      const value = values[index];
      if (value && value !== "") {
        // Convert numeric fields
        if (header === "phMin" || header === "phMax") {
          product[header] = parseFloat(value);
        } else {
          product[header] = value;
        }
      }
    });

    if (product.productId && product.partNumber) {
      products.push(product as CrawlerProduct);
    }
  }

  return products;
}

async function importCSVFile(
  db: any,
  csvFilePath: string,
  stats: ImportStats
): Promise<void> {
  console.log(`\n📂 Processing: ${csvFilePath}`);
  
  const crawlerProducts = await parseCSV(csvFilePath);
  
  if (crawlerProducts.length === 0) {
    return;
  }

  console.log(`   Found ${crawlerProducts.length} products`);

  for (const crawlerProduct of crawlerProducts) {
    try {
      // Find existing product by productId
      const existing = await db
        .select()
        .from(products)
        .where(eq(products.productId, crawlerProduct.productId))
        .limit(1);

      if (existing.length === 0) {
        stats.notFoundCount++;
        
        // Track by brand
        const brandStats = stats.byBrand.get(crawlerProduct.brand) || {
          success: 0,
          fail: 0,
          notFound: 0,
        };
        brandStats.notFound++;
        stats.byBrand.set(crawlerProduct.brand, brandStats);
        
        continue;
      }

      // Update product with corrected data
      const updateData: any = {
        partNumber: crawlerProduct.partNumber,
      };

      // Update optional fields if provided
      if (crawlerProduct.name) updateData.name = crawlerProduct.name;
      if (crawlerProduct.description) updateData.description = crawlerProduct.description;
      if (crawlerProduct.detailedDescription) updateData.detailedDescription = crawlerProduct.detailedDescription;
      if (crawlerProduct.particleSize) updateData.particleSize = crawlerProduct.particleSize;
      if (crawlerProduct.poreSize) updateData.poreSize = crawlerProduct.poreSize;
      if (crawlerProduct.columnLength) updateData.columnLength = crawlerProduct.columnLength;
      if (crawlerProduct.innerDiameter) updateData.innerDiameter = crawlerProduct.innerDiameter;
      if (crawlerProduct.phaseType) updateData.phaseType = crawlerProduct.phaseType;
      if (crawlerProduct.phRange) updateData.phRange = crawlerProduct.phRange;
      if (crawlerProduct.phMin !== undefined) updateData.phMin = crawlerProduct.phMin;
      if (crawlerProduct.phMax !== undefined) updateData.phMax = crawlerProduct.phMax;
      if (crawlerProduct.maxPressure) updateData.maxPressure = crawlerProduct.maxPressure;
      if (crawlerProduct.maxTemperature) updateData.maxTemperature = crawlerProduct.maxTemperature;
      if (crawlerProduct.usp) updateData.usp = crawlerProduct.usp;
      if (crawlerProduct.applications) updateData.applications = crawlerProduct.applications;
      if (crawlerProduct.imageUrl) updateData.imageUrl = crawlerProduct.imageUrl;
      if (crawlerProduct.catalogUrl) updateData.catalogUrl = crawlerProduct.catalogUrl;
      if (crawlerProduct.technicalDocsUrl) updateData.technicalDocsUrl = crawlerProduct.technicalDocsUrl;
      if (crawlerProduct.status) updateData.status = crawlerProduct.status;

      await db
        .update(products)
        .set(updateData)
        .where(eq(products.productId, crawlerProduct.productId));

      stats.successCount++;
      
      // Track by brand
      const brandStats = stats.byBrand.get(crawlerProduct.brand) || {
        success: 0,
        fail: 0,
        notFound: 0,
      };
      brandStats.success++;
      stats.byBrand.set(crawlerProduct.brand, brandStats);
      
    } catch (error) {
      stats.failCount++;
      
      // Track by brand
      const brandStats = stats.byBrand.get(crawlerProduct.brand) || {
        success: 0,
        fail: 0,
        notFound: 0,
      };
      brandStats.fail++;
      stats.byBrand.set(crawlerProduct.brand, brandStats);
    }
  }

  console.log(`   ✅ Processed ${crawlerProducts.length} products`);
}

async function findCSVFiles(dir: string): Promise<string[]> {
  const csvFiles: string[] = [];
  
  function scanDirectory(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".csv")) {
        csvFiles.push(fullPath);
      }
    }
  }
  
  scanDirectory(dir);
  return csvFiles;
}

async function importAllCrawlerData(crawlerOutputDir: string) {
  console.log(`📂 Scanning directory: ${crawlerOutputDir}`);
  
  if (!fs.existsSync(crawlerOutputDir)) {
    throw new Error(`Directory not found: ${crawlerOutputDir}`);
  }

  const csvFiles = await findCSVFiles(crawlerOutputDir);
  
  if (csvFiles.length === 0) {
    throw new Error(`No CSV files found in: ${crawlerOutputDir}`);
  }

  console.log(`✅ Found ${csvFiles.length} CSV files`);

  const db = drizzle(process.env.DATABASE_URL!);

  const stats: ImportStats = {
    totalFiles: csvFiles.length,
    totalProducts: 0,
    successCount: 0,
    failCount: 0,
    notFoundCount: 0,
    byBrand: new Map(),
  };

  console.log("\n🔄 Starting batch import...\n");

  for (const csvFile of csvFiles) {
    await importCSVFile(db, csvFile, stats);
  }

  stats.totalProducts = stats.successCount + stats.failCount + stats.notFoundCount;

  console.log("\n" + "=".repeat(80));
  console.log("📊 FINAL IMPORT SUMMARY");
  console.log("=".repeat(80));
  console.log(`\n📁 Files processed: ${stats.totalFiles}`);
  console.log(`📦 Total products: ${stats.totalProducts}`);
  console.log(`   ✅ Successfully imported: ${stats.successCount} (${((stats.successCount / stats.totalProducts) * 100).toFixed(2)}%)`);
  console.log(`   ❌ Failed: ${stats.failCount} (${((stats.failCount / stats.totalProducts) * 100).toFixed(2)}%)`);
  console.log(`   ⚠️  Not found in database: ${stats.notFoundCount} (${((stats.notFoundCount / stats.totalProducts) * 100).toFixed(2)}%)`);

  console.log("\n📊 By Brand:");
  console.log("=".repeat(80));
  
  const sortedBrands = Array.from(stats.byBrand.entries()).sort((a, b) => 
    (b[1].success + b[1].fail + b[1].notFound) - (a[1].success + a[1].fail + a[1].notFound)
  );

  for (const [brand, brandStats] of sortedBrands) {
    const total = brandStats.success + brandStats.fail + brandStats.notFound;
    console.log(`\n${brand}:`);
    console.log(`   Total: ${total}`);
    console.log(`   ✅ Success: ${brandStats.success} (${((brandStats.success / total) * 100).toFixed(2)}%)`);
    console.log(`   ❌ Failed: ${brandStats.fail} (${((brandStats.fail / total) * 100).toFixed(2)}%)`);
    console.log(`   ⚠️  Not found: ${brandStats.notFound} (${((brandStats.notFound / total) * 100).toFixed(2)}%)`);
  }

  console.log("\n" + "=".repeat(80));
}

// Main execution
const crawlerOutputDir = process.argv[2];

if (!crawlerOutputDir) {
  console.error("❌ Error: Crawler output directory is required");
  console.log("\nUsage:");
  console.log("  pnpm tsx scripts/import-all-crawler-data.ts <crawler_output_dir>");
  console.log("\nExample:");
  console.log("  pnpm tsx scripts/import-all-crawler-data.ts /path/to/crawler_output");
  console.log("\nExpected directory structure:");
  console.log("  crawler_output/");
  console.log("  ├── Waters/");
  console.log("  │   ├── hplc_columns.csv");
  console.log("  │   ├── gc_columns.csv");
  console.log("  │   └── ...");
  console.log("  ├── Agilent/");
  console.log("  │   └── ...");
  console.log("  └── ...");
  process.exit(1);
}

importAllCrawlerData(crawlerOutputDir)
  .then(() => {
    console.log("\n✅ Batch import completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Batch import failed:", error);
    process.exit(1);
  });

