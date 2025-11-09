/**
 * Import crawler data matching by partNumber instead of productId
 * For brands where CSV uses different productId format than database
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq, and } from "drizzle-orm";
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
  descriptionQuality?: string;
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
  const headers = parseCSVLine(lines[0].replace(/^\uFEFF/, ""));

  const products: CrawlerProduct[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const product: any = {};
    headers.forEach((header, index) => {
      product[header.trim()] = values[index]?.trim() || "";
    });
    
    // Skip invalid rows
    if (!product.partNumber || !product.brand) {
      continue;
    }
    
    products.push(product as CrawlerProduct);
  }
  return products;
}

async function importProducts(csvFile: string) {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`Importing: ${csvFile}`);
  console.log(`${"=".repeat(80)}\n`);

  const filePath = path.resolve(csvFile);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const crawlerProducts = parseCSV(content);

  console.log(`📊 Total products in CSV: ${crawlerProducts.length}\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const crawlerProduct of crawlerProducts) {
    try {
      // Match by brand + partNumber instead of productId
      const existing = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.brand, crawlerProduct.brand),
            eq(products.partNumber, crawlerProduct.partNumber)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        console.log(
          `⏭️  Skipped ${crawlerProduct.partNumber}: Product not found in database`
        );
        skipCount++;
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
          `⚠️  Failed to parse specifications for ${crawlerProduct.partNumber}`
        );
      }

      const specCount = Object.keys(specificationsObj).length;

      // Update product
      await db
        .update(products)
        .set({
          description: crawlerProduct.description || null,
          specifications: specCount > 0 ? JSON.stringify(specificationsObj) : null,
          imageUrl: crawlerProduct.imageUrl || existing[0].imageUrl,
          catalogUrl: crawlerProduct.catalogUrl || existing[0].catalogUrl,
          updatedAt: new Date(),
        })
        .where(eq(products.id, existing[0].id));

      console.log(
        `✅ Updated ${crawlerProduct.partNumber}: ${crawlerProduct.name.substring(0, 50)}... (${specCount} specs, ${crawlerProduct.description?.length || 0} chars)`
      );
      successCount++;
    } catch (error) {
      console.error(`❌ Error processing ${crawlerProduct.partNumber}:`, error);
      errorCount++;
    }
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log("Import Summary");
  console.log(`${"=".repeat(80)}\n`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total: ${crawlerProducts.length}`);
  console.log(`📈 Success Rate: ${((successCount / crawlerProducts.length) * 100).toFixed(1)}%\n`);

  if (successCount > 0) {
    const avgDescLength = Math.round(
      crawlerProducts
        .filter((p) => p.description)
        .reduce((sum, p) => sum + (p.description?.length || 0), 0) / successCount
    );
    
    console.log("=== Quality Statistics ===");
    console.log(`📝 Average Description Length: ${avgDescLength} chars`);
  }
}

const csvFile = process.argv[2];
if (!csvFile) {
  console.error("Usage: npx tsx import-by-partnumber.ts <csv-file>");
  process.exit(1);
}

importProducts(csvFile);
