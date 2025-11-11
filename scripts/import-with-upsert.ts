/**
 * Import crawler data with UPSERT (INSERT new + UPDATE existing)
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
  console.log(`Importing with UPSERT: ${csvFile}`);
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
        if (crawlerProduct.specifications) {
          specificationsObj = JSON.parse(crawlerProduct.specifications);
        }
      } catch (e) {
        console.warn(
          `⚠️  Failed to parse specifications for ${crawlerProduct.productId}`
        );
      }

      const specCount = Object.keys(specificationsObj).length;

      if (existing.length === 0) {
        // INSERT new product
        // Extract prefix from productId (e.g., SHIM-xxx -> SHIM)
        const prefix = crawlerProduct.productId.split("-")[0];
        
        await db.insert(products).values({
          productId: crawlerProduct.productId,
          partNumber: crawlerProduct.partNumber,
          brand: crawlerProduct.brand,
          prefix: prefix,
          name: crawlerProduct.name,
          description: crawlerProduct.description || null,
          specifications:
            specCount > 0 ? JSON.stringify(specificationsObj) : null,
          imageUrl: crawlerProduct.imageUrl || null,
          catalogUrl: crawlerProduct.catalogUrl || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log(
          `➕ Inserted ${crawlerProduct.productId}: ${crawlerProduct.name.substring(0, 50)}... (${specCount} specs, ${crawlerProduct.description?.length || 0} chars)`
        );
        insertCount++;
      } else {
        // UPDATE existing product
        await db
          .update(products)
          .set({
            description: crawlerProduct.description || null,
            specifications:
              specCount > 0 ? JSON.stringify(specificationsObj) : null,
            imageUrl: crawlerProduct.imageUrl || existing[0].imageUrl,
            catalogUrl: crawlerProduct.catalogUrl || existing[0].catalogUrl,
            updatedAt: new Date(),
          })
          .where(eq(products.id, existing[0].id));

        console.log(
          `✏️  Updated ${crawlerProduct.productId}: ${crawlerProduct.name.substring(0, 50)}... (${specCount} specs, ${crawlerProduct.description?.length || 0} chars)`
        );
        updateCount++;
      }
    } catch (error) {
      console.error(
        `❌ Error processing ${crawlerProduct.productId}:`,
        error
      );
      errorCount++;
    }
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log("Import Summary");
  console.log(`${"=".repeat(80)}\n`);
  console.log(`➕ Inserted: ${insertCount}`);
  console.log(`✏️  Updated: ${updateCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total: ${crawlerProducts.length}`);
  console.log(
    `📈 Success Rate: ${(((insertCount + updateCount) / crawlerProducts.length) * 100).toFixed(1)}%\n`
  );

  if (insertCount + updateCount > 0) {
    const avgDescLength = Math.round(
      crawlerProducts
        .filter((p) => p.description)
        .reduce((sum, p) => sum + (p.description?.length || 0), 0) /
        (insertCount + updateCount)
    );

    const avgSpecCount =
      crawlerProducts
        .filter((p) => p.specifications)
        .reduce((sum, p) => {
          try {
            const specs = JSON.parse(p.specifications);
            return sum + Object.keys(specs).length;
          } catch {
            return sum;
          }
        }, 0) / (insertCount + updateCount);

    console.log("=== Quality Statistics ===");
    console.log(`📝 Average Description Length: ${avgDescLength} chars`);
    console.log(
      `🔧 Average Specification Count: ${avgSpecCount.toFixed(1)} fields\n`
    );
  }
}

const csvFile = process.argv[2];
if (!csvFile) {
  console.error("Usage: npx tsx import-with-upsert.ts <csv-file>");
  process.exit(1);
}

importProducts(csvFile);
