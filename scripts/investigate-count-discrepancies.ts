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
    if (product.productId && product.partNumber) {
      products.push(product as CrawlerProduct);
    }
  }
  return products;
}

async function investigateBrand(csvFile: string, brandName: string) {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`Investigating: ${brandName}`);
  console.log(`${"=".repeat(80)}\n`);

  const filePath = path.join("/home/ubuntu/upload", csvFile);
  const content = fs.readFileSync(filePath, "utf-8");
  const csvProducts = parseCSV(content);

  const dbProducts = await db
    .select()
    .from(products)
    .where(eq(products.brand, brandName));

  console.log(`CSV Count: ${csvProducts.length}`);
  console.log(`DB Count: ${dbProducts.length}`);
  console.log(`Difference: ${csvProducts.length - dbProducts.length}\n`);

  // Find products in CSV but not in DB
  const csvProductIds = new Set(csvProducts.map((p) => p.productId));
  const dbProductIds = new Set(dbProducts.map((p) => p.productId));

  const inCsvNotInDb = csvProducts.filter((p) => !dbProductIds.has(p.productId));
  const inDbNotInCsv = dbProducts.filter((p) => !csvProductIds.has(p.productId));

  if (inCsvNotInDb.length > 0) {
    console.log(`\n📋 Products in CSV but NOT in DB: ${inCsvNotInDb.length}`);
    console.log("Sample (first 10):");
    inCsvNotInDb.slice(0, 10).forEach((p) => {
      console.log(`  - ${p.productId}: ${p.partNumber} - ${p.name.substring(0, 60)}...`);
    });
  }

  if (inDbNotInCsv.length > 0) {
    console.log(`\n📋 Products in DB but NOT in CSV: ${inDbNotInCsv.length}`);
    console.log("Sample (first 10):");
    inDbNotInCsv.slice(0, 10).forEach((p) => {
      console.log(`  - ${p.productId}: ${p.partNumber} - ${p.name?.substring(0, 60) || "N/A"}...`);
    });
    
    // Analyze patterns
    const prefixes = inDbNotInCsv.map((p) => p.productId.split("-")[0]);
    const prefixCounts: Record<string, number> = {};
    prefixes.forEach((prefix) => {
      prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1;
    });
    
    console.log("\nPrefix distribution:");
    Object.entries(prefixCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([prefix, count]) => {
        console.log(`  ${prefix}: ${count} products`);
      });
  }

  return {
    brand: brandName,
    csvCount: csvProducts.length,
    dbCount: dbProducts.length,
    inCsvNotInDb: inCsvNotInDb.length,
    inDbNotInCsv: inDbNotInCsv.length,
  };
}

async function main() {
  console.log("🔍 Investigating Count Discrepancies\n");

  const investigations = [
    { csvFile: "1_agilent_results.csv", brandName: "Agilent" },
    { csvFile: "2_waters_results.csv", brandName: "Waters" },
    { csvFile: "4_daicel_results.csv", brandName: "Daicel" },
  ];

  const results = [];

  for (const { csvFile, brandName } of investigations) {
    const result = await investigateBrand(csvFile, brandName);
    results.push(result);
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log("SUMMARY");
  console.log(`${"=".repeat(80)}\n`);

  console.log("Brand                    | CSV   | DB    | Diff  | CSV-only | DB-only");
  console.log("-------------------------|-------|-------|-------|----------|--------");
  results.forEach((r) => {
    const brand = r.brand.padEnd(24);
    const csv = r.csvCount.toString().padStart(5);
    const db = r.dbCount.toString().padStart(5);
    const diff = (r.csvCount - r.dbCount).toString().padStart(5);
    const csvOnly = r.inCsvNotInDb.toString().padStart(8);
    const dbOnly = r.inDbNotInCsv.toString().padStart(7);
    console.log(`${brand} | ${csv} | ${db} | ${diff} | ${csvOnly} | ${dbOnly}`);
  });

  console.log("\n✅ Investigation complete\n");
}

main();
