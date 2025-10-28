/**
 * Import Corrected Part Numbers from Crawler Output
 * 
 * This script imports the corrected Part Numbers and product information
 * from the crawler team's CSV files into the database.
 * 
 * Usage:
 *   pnpm tsx scripts/import-corrected-part-numbers.ts <csv_file_path>
 * 
 * CSV Format:
 *   productId,partNumber,brand,prefix,name,description,detailedDescription,
 *   particleSize,poreSize,columnLength,innerDiameter,phaseType,phRange,
 *   phMin,phMax,maxPressure,maxTemperature,usp,applications,imageUrl,
 *   catalogUrl,technicalDocsUrl,status
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

async function parseCSV(filePath: string): Promise<CrawlerProduct[]> {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error("CSV file is empty or has no data rows");
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

async function importProducts(csvFilePath: string) {
  console.log(`📂 Reading CSV file: ${csvFilePath}`);
  
  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`CSV file not found: ${csvFilePath}`);
  }

  const crawlerProducts = await parseCSV(csvFilePath);
  console.log(`✅ Parsed ${crawlerProducts.length} products from CSV`);

  const db = drizzle(process.env.DATABASE_URL!);

  let successCount = 0;
  let failCount = 0;
  let notFoundCount = 0;

  console.log("\n🔄 Starting import...\n");

  for (const crawlerProduct of crawlerProducts) {
    try {
      // Find existing product by productId
      const existing = await db
        .select()
        .from(products)
        .where(eq(products.productId, crawlerProduct.productId))
        .limit(1);

      if (existing.length === 0) {
        console.log(`⚠️  Product not found: ${crawlerProduct.productId}`);
        notFoundCount++;
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

      successCount++;
      
      if (successCount % 100 === 0) {
        console.log(`✅ Imported ${successCount} products...`);
      }
    } catch (error) {
      console.error(`❌ Failed to import ${crawlerProduct.productId}:`, error);
      failCount++;
    }
  }

  console.log("\n📊 Import Summary:");
  console.log(`   Total products in CSV: ${crawlerProducts.length}`);
  console.log(`   ✅ Successfully imported: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   ⚠️  Not found in database: ${notFoundCount}`);
  console.log(`   Success rate: ${((successCount / crawlerProducts.length) * 100).toFixed(2)}%`);
}

// Main execution
const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.error("❌ Error: CSV file path is required");
  console.log("\nUsage:");
  console.log("  pnpm tsx scripts/import-corrected-part-numbers.ts <csv_file_path>");
  console.log("\nExample:");
  console.log("  pnpm tsx scripts/import-corrected-part-numbers.ts /path/to/crawler_output/Waters/hplc_columns.csv");
  process.exit(1);
}

importProducts(csvFilePath)
  .then(() => {
    console.log("\n✅ Import completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Import failed:", error);
    process.exit(1);
  });

