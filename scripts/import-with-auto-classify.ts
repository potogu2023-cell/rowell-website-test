/**
 * Import crawler data with UPSERT and AUTO-CLASSIFICATION
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { products } from "../drizzle/schema";
import { autoClassifyProduct } from "./utils/auto-classify";
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

    if (product.productId && product.partNumber && product.brand) {
      products.push(product as CrawlerProduct);
    }
  }
  return products;
}

async function importProducts(csvFile: string) {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`Importing with UPSERT + AUTO-CLASSIFICATION: ${csvFile}`);
  console.log(`${"=".repeat(80)}\n`);

  const filePath = path.resolve(csvFile);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const crawlerProducts = parseCSV(content);

  console.log(`📊 Total products in CSV: ${crawlerProducts.length}\n`);

  let insertCount = 0;
  let updateCount = 0;
  let errorCount = 0;
  let classifiedCount = 0;
  let unclassifiedCount = 0;

  for (const crawlerProduct of crawlerProducts) {
    try {
      // Check if product exists
      const existing = await db
        .select()
        .from(products)
        .where(eq(products.productId, crawlerProduct.productId))
        .limit(1);

      // Parse specifications
      let specificationsObj: Record<string, string> = {};
      try {
        specificationsObj = JSON.parse(crawlerProduct.specifications || "{}");
      } catch {
        // If not valid JSON, try to parse as key-value pairs
        const specs = crawlerProduct.specifications || "";
        if (specs) {
          const pairs = specs.split(";").filter((p) => p.trim());
          pairs.forEach((pair) => {
            const [key, value] = pair.split(":").map((s) => s.trim());
            if (key && value) {
              specificationsObj[key] = value;
            }
          });
        }
      }

      const productData: any = {
        productId: crawlerProduct.productId,
        partNumber: crawlerProduct.partNumber,
        brand: crawlerProduct.brand,
        prefix: '', // Required field, default to empty string
        name: crawlerProduct.name,
      };
      
      // Only add optional fields if they have values
      if (crawlerProduct.description) {
        productData.description = crawlerProduct.description;
      }
      if (Object.keys(specificationsObj).length > 0) {
        productData.specifications = specificationsObj;
      }
      if (crawlerProduct.imageUrl) {
        productData.imageUrl = crawlerProduct.imageUrl;
      }
      if (crawlerProduct.catalogUrl) {
        productData.catalogUrl = crawlerProduct.catalogUrl;
      }

      let dbProductId: number;

      if (existing.length > 0) {
        // Update existing product
        await db
          .update(products)
          .set(productData)
          .where(eq(products.productId, crawlerProduct.productId));
        updateCount++;
        dbProductId = existing[0].id;
        console.log(`✅ Updated: ${crawlerProduct.partNumber} (${crawlerProduct.brand})`);
      } else {
        // Insert new product
        const result = await db.insert(products).values(productData);
        insertCount++;
        dbProductId = Number(result[0].insertId);
        console.log(`✅ Inserted: ${crawlerProduct.partNumber} (${crawlerProduct.brand})`);
      }

      // Auto-classify the product
      const assignedCategories = await autoClassifyProduct(
        db,
        dbProductId,
        crawlerProduct.name
      );

      if (assignedCategories.length > 0) {
        classifiedCount++;
        console.log(`   📂 Auto-classified to: ${assignedCategories.join(", ")}`);
      } else {
        unclassifiedCount++;
        console.log(`   ⚠️  No category match found`);
      }

    } catch (error: any) {
      errorCount++;
      console.error(
        `❌ Error processing ${crawlerProduct.partNumber}:`,
        error.message
      );
    }
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log(`Import Summary:`);
  console.log(`  ✅ Inserted: ${insertCount}`);
  console.log(`  ✅ Updated: ${updateCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log(`\nAuto-Classification Summary:`);
  console.log(`  📂 Classified: ${classifiedCount}`);
  console.log(`  ⚠️  Unclassified: ${unclassifiedCount}`);
  console.log(`${"=".repeat(80)}\n`);

  process.exit(0);
}

const csvFile = process.argv[2];
if (!csvFile) {
  console.error("Usage: tsx import-with-auto-classify.ts <csv-file>");
  process.exit(1);
}

importProducts(csvFile);
