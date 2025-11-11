import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import { products } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  console.log("\n" + "=".repeat(80));
  console.log("DATABASE INVENTORY REPORT");
  console.log("=".repeat(80) + "\n");

  // Get all brands
  const allProducts = await db.select().from(products);
  
  const brandStats: Record<string, {
    total: number;
    withGoodDesc: number;
    withSpecs: number;
    verified: boolean;
    notes: string;
  }> = {};

  // Group by brand
  for (const product of allProducts) {
    const brand = product.brand;
    if (!brandStats[brand]) {
      brandStats[brand] = {
        total: 0,
        withGoodDesc: 0,
        withSpecs: 0,
        verified: false,
        notes: ""
      };
    }

    brandStats[brand].total++;

    // Check description quality
    if (product.description && product.description.length >= 100) {
      brandStats[brand].withGoodDesc++;
    }

    // Check specifications
    if (product.specifications) {
      try {
        const specs = JSON.parse(product.specifications as string);
        if (Object.keys(specs).length > 0) {
          brandStats[brand].withSpecs++;
        }
      } catch (e) {
        // Invalid JSON
      }
    }
  }

  // Mark verified brands and add notes
  const verifiedBrands = {
    "Agilent": "✅ Verified - First batch import",
    "Phenomenex": "✅ Verified - AI description generated",
    "Daicel": "✅ Verified - First batch import",
    "Waters": "✅ Verified - First batch import",
    "Thermo Fisher": "✅ Verified - First batch import (as Thermo)",
    "Merck": "✅ Verified - Second batch import",
    "Shimadzu": "✅ Verified - Re-crawled with quality improvement",
    "Develosil": "✅ Verified - Re-crawled, old data cleaned"
  };

  for (const brand in brandStats) {
    if (verifiedBrands[brand]) {
      brandStats[brand].verified = true;
      brandStats[brand].notes = verifiedBrands[brand];
    } else {
      brandStats[brand].verified = false;
      brandStats[brand].notes = "⚠️ Unverified - Needs quality check";
    }
  }

  // Sort brands by total products
  const sortedBrands = Object.entries(brandStats).sort((a, b) => b[1].total - a[1].total);

  console.log("BRAND SUMMARY");
  console.log("=".repeat(80) + "\n");

  let totalProducts = 0;
  let totalVerified = 0;
  let totalUnverified = 0;
  let totalWithGoodDesc = 0;
  let totalWithSpecs = 0;

  console.log("Brand            | Total | Desc≥100 | Specs | Status");
  console.log("-----------------|-------|----------|-------|--------");

  for (const [brand, stats] of sortedBrands) {
    const brandPad = brand.padEnd(16);
    const total = stats.total.toString().padStart(5);
    const descPct = `${((stats.withGoodDesc / stats.total) * 100).toFixed(0)}%`.padStart(8);
    const specPct = `${((stats.withSpecs / stats.total) * 100).toFixed(0)}%`.padStart(5);
    const status = stats.verified ? "✅ Yes" : "⚠️ No";

    console.log(`${brandPad} | ${total} | ${descPct} | ${specPct} | ${status}`);

    totalProducts += stats.total;
    if (stats.verified) {
      totalVerified += stats.total;
    } else {
      totalUnverified += stats.total;
    }
    totalWithGoodDesc += stats.withGoodDesc;
    totalWithSpecs += stats.withSpecs;
  }

  console.log("-".repeat(80));
  console.log(`${"TOTAL".padEnd(16)} | ${totalProducts.toString().padStart(5)} | ${((totalWithGoodDesc / totalProducts) * 100).toFixed(0)}%`.padStart(8) + ` | ${((totalWithSpecs / totalProducts) * 100).toFixed(0)}%`.padStart(5) + " |");

  console.log("\n" + "=".repeat(80));
  console.log("VERIFICATION STATUS");
  console.log("=".repeat(80) + "\n");

  console.log(`Total Brands: ${sortedBrands.length}`);
  console.log(`Verified Brands: ${sortedBrands.filter(([_, s]) => s.verified).length}`);
  console.log(`Unverified Brands: ${sortedBrands.filter(([_, s]) => !s.verified).length}\n`);

  console.log(`Total Products: ${totalProducts}`);
  console.log(`Verified Products: ${totalVerified} (${((totalVerified / totalProducts) * 100).toFixed(1)}%)`);
  console.log(`Unverified Products: ${totalUnverified} (${((totalUnverified / totalProducts) * 100).toFixed(1)}%)\n`);

  console.log(`Products with Good Descriptions (≥100 chars): ${totalWithGoodDesc} (${((totalWithGoodDesc / totalProducts) * 100).toFixed(1)}%)`);
  console.log(`Products with Specifications: ${totalWithSpecs} (${((totalWithSpecs / totalProducts) * 100).toFixed(1)}%)\n`);

  console.log("=".repeat(80));
  console.log("BRAND DETAILS");
  console.log("=".repeat(80) + "\n");

  for (const [brand, stats] of sortedBrands) {
    console.log(`### ${brand}`);
    console.log(`Total Products: ${stats.total}`);
    console.log(`Good Descriptions: ${stats.withGoodDesc} (${((stats.withGoodDesc / stats.total) * 100).toFixed(1)}%)`);
    console.log(`With Specifications: ${stats.withSpecs} (${((stats.withSpecs / stats.total) * 100).toFixed(1)}%)`);
    console.log(`Status: ${stats.notes}`);
    console.log("");
  }

  console.log("=".repeat(80));
  console.log("QUALITY RATING");
  console.log("=".repeat(80) + "\n");

  for (const [brand, stats] of sortedBrands) {
    const descScore = (stats.withGoodDesc / stats.total) * 50;
    const specScore = (stats.withSpecs / stats.total) * 50;
    const totalScore = descScore + specScore;

    let rating = "❌ Poor";
    if (totalScore >= 90) rating = "✅ Excellent";
    else if (totalScore >= 70) rating = "✅ Good";
    else if (totalScore >= 50) rating = "⚠️ Acceptable";

    console.log(`${brand.padEnd(20)} ${totalScore.toFixed(1).padStart(5)}/100  ${rating}`);
  }

  console.log("\n✅ Inventory report complete\n");
}

main();
