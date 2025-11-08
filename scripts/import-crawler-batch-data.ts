/**
 * Import crawler batch data (Daicel, Waters, Phenomenex)
 * Supports CSV format with specifications field
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { products } from "../drizzle/schema";
import * as fs from "fs";
import * as path from "path";

const db = drizzle(process.env.DATABASE_URL!);

interface CrawlerProduct {
  productId: string;
  partNumber: string;
  brand: string;
  name: string;
  description: string;
  descriptionQuality: string;
  specifications: string;
  imageUrl?: string;
  catalogUrl?: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function parseCSV(content: string): CrawlerProduct[] {
  const lines = content.split("\n").filter((line) => line.trim());
  const headers = parseCSVLine(lines[0]);

  const products: CrawlerProduct[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const product: any = {};

    headers.forEach((header, index) => {
      product[header.trim()] = values[index]?.trim() || "";
    });

    if (product.productId && product.partNumber) {
      products.push(product as CrawlerProduct);
    }
  }

  return products;
}

async function importProducts(csvFile: string) {
  console.log(`\n=== Importing ${csvFile} ===\n`);

  const filePath = path.resolve(process.cwd(), csvFile);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const crawlerProducts = parseCSV(content);

  console.log(`📊 Total products in CSV: ${crawlerProducts.length}`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  const results: Array<{
    productId: string;
    partNumber: string;
    status: "success" | "skipped" | "error";
    message: string;
  }> = [];

  for (const crawlerProduct of crawlerProducts) {
    try {
      // Check if product exists
      const existing = await db
        .select()
        .from(products)
        .where(eq(products.productId, crawlerProduct.productId))
        .limit(1);

      if (existing.length === 0) {
        console.log(
          `⏭️  Skipped ${crawlerProduct.productId}: Product not found in database`
        );
        skipCount++;
        results.push({
          productId: crawlerProduct.productId,
          partNumber: crawlerProduct.partNumber,
          status: "skipped",
          message: "Product not found in database",
        });
        continue;
      }

      // Parse specifications
      let specificationsObj: Record<string, string> = {};
      try {
        if (crawlerProduct.specifications) {
          specificationsObj = JSON.parse(crawlerProduct.specifications);
        }
      } catch (e) {
        console.warn(
          `⚠️  Failed to parse specifications for ${crawlerProduct.productId}`
        );
      }

      // Count specification fields
      const specCount = Object.keys(specificationsObj).length;

      // Update product
      await db
        .update(products)
        .set({
          description: crawlerProduct.description || null,
          specifications: specificationsObj,
          imageUrl: crawlerProduct.imageUrl || existing[0].imageUrl,
          catalogUrl: crawlerProduct.catalogUrl || existing[0].catalogUrl,
          updatedAt: new Date(),
        })
        .where(eq(products.productId, crawlerProduct.productId));

      console.log(
        `✅ Updated ${crawlerProduct.productId}: ${crawlerProduct.name.substring(0, 50)}... (${specCount} specs, ${crawlerProduct.description.length} chars)`
      );

      successCount++;
      results.push({
        productId: crawlerProduct.productId,
        partNumber: crawlerProduct.partNumber,
        status: "success",
        message: `Updated with ${specCount} specs, ${crawlerProduct.description.length} chars description`,
      });
    } catch (error: any) {
      console.error(
        `❌ Error updating ${crawlerProduct.productId}: ${error.message}`
      );
      errorCount++;
      results.push({
        productId: crawlerProduct.productId,
        partNumber: crawlerProduct.partNumber,
        status: "error",
        message: error.message,
      });
    }
  }

  console.log(`\n=== Import Summary ===`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total: ${crawlerProducts.length}`);
  console.log(`📈 Success Rate: ${((successCount / crawlerProducts.length) * 100).toFixed(1)}%`);

  // Calculate quality statistics
  const successProducts = crawlerProducts.filter((p, i) =>
    results[i]?.status === "success"
  );

  if (successProducts.length > 0) {
    const avgDescLength =
      successProducts.reduce((sum, p) => sum + (p.description?.length || 0), 0) /
      successProducts.length;

    const avgSpecCount =
      successProducts.reduce((sum, p) => {
        try {
          return sum + Object.keys(JSON.parse(p.specifications || "{}")).length;
        } catch {
          return sum;
        }
      }, 0) / successProducts.length;

    console.log(`\n=== Quality Statistics ===`);
    console.log(`📝 Average Description Length: ${avgDescLength.toFixed(0)} chars`);
    console.log(`🔧 Average Specification Count: ${avgSpecCount.toFixed(1)} fields`);
  }

  // Save results to log file
  const logFile = csvFile.replace(".csv", "_import_log.json");
  fs.writeFileSync(logFile, JSON.stringify(results, null, 2));
  console.log(`\n📄 Import log saved to: ${logFile}`);

  process.exit(0);
}

// Get CSV file from command line argument
const csvFile = process.argv[2];

if (!csvFile) {
  console.error("Usage: pnpm exec tsx scripts/import-crawler-batch-data.ts <csv_file>");
  console.error("Example: pnpm exec tsx scripts/import-crawler-batch-data.ts daicel_277_final_unique.csv");
  process.exit(1);
}

importProducts(csvFile);
