import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { products } from "../drizzle/schema";
import fs from "fs";
import path from "path";

const db = drizzle(process.env.DATABASE_URL!);

interface CrawlerProduct {
  productId: string;
  partNumber: string;
  brand: string;
  name: string;
  description?: string;
  descriptionQuality?: string;
  specifications?: string;
  imageUrl?: string;
  catalogUrl?: string;
  technicalDocUrl?: string;
  url?: string;
  crawlStatus?: string;
  status?: string;
  matchType?: string;
  failureReason?: string;
}

interface BrandStats {
  brand: string;
  csvFile: string;
  csvCount: number;
  csvSuccessCount: number;
  csvFailureCount: number;
  dbCount: number;
  dbWithDescriptions: number;
  dbWithSpecs: number;
  avgSpecFields: number;
  descriptionCoverage: number;
  specCoverage: number;
  qualityDistribution: Record<string, number>;
}

async function parseCSV(filePath: string): Promise<CrawlerProduct[]> {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n");
  const headers = lines[0].replace(/^\uFEFF/, "").split(",");

  const products: CrawlerProduct[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);

    const product: any = {};
    headers.forEach((header, index) => {
      const value = values[index]?.replace(/^"|"$/g, "").trim();
      product[header.trim()] = value || undefined;
    });

    products.push(product as CrawlerProduct);
  }

  return products;
}

async function analyzeBrand(
  csvFile: string,
  brandName: string
): Promise<BrandStats> {
  const filePath = path.join("/home/ubuntu/upload", csvFile);
  const csvProducts = await parseCSV(filePath);

  // CSV statistics
  const csvCount = csvProducts.length;
  const csvSuccessCount = csvProducts.filter(
    (p) =>
      p.crawlStatus === "success" ||
      p.status === "success" ||
      p.matchType === "exact" ||
      (!p.crawlStatus && !p.status && !p.matchType)
  ).length;
  const csvFailureCount = csvCount - csvSuccessCount;

  // Quality distribution
  const qualityDistribution: Record<string, number> = {
    High: 0,
    Medium: 0,
    Low: 0,
    None: 0,
  };
  csvProducts.forEach((p) => {
    const quality = p.descriptionQuality || "None";
    qualityDistribution[quality] = (qualityDistribution[quality] || 0) + 1;
  });

  // Database statistics
  const dbProducts = await db
    .select()
    .from(products)
    .where(eq(products.brand, brandName));

  const dbCount = dbProducts.length;
  const dbWithDescriptions = dbProducts.filter(
    (p) => p.description && p.description.length >= 50
  ).length;
  const dbWithSpecs = dbProducts.filter((p) => {
    if (!p.specifications) return false;
    try {
      const specs = JSON.parse(p.specifications);
      return Object.keys(specs).length > 0;
    } catch {
      return false;
    }
  }).length;

  const totalSpecFields = dbProducts.reduce((sum, p) => {
    if (!p.specifications) return sum;
    try {
      const specs = JSON.parse(p.specifications);
      return sum + Object.keys(specs).length;
    } catch {
      return sum;
    }
  }, 0);

  const avgSpecFields =
    dbCount > 0 ? Math.round((totalSpecFields / dbCount) * 10) / 10 : 0;
  const descriptionCoverage =
    dbCount > 0 ? Math.round((dbWithDescriptions / dbCount) * 1000) / 10 : 0;
  const specCoverage =
    dbCount > 0 ? Math.round((dbWithSpecs / dbCount) * 1000) / 10 : 0;

  return {
    brand: brandName,
    csvFile,
    csvCount,
    csvSuccessCount,
    csvFailureCount,
    dbCount,
    dbWithDescriptions,
    dbWithSpecs,
    avgSpecFields,
    descriptionCoverage,
    specCoverage,
    qualityDistribution,
  };
}

async function main() {
  console.log("🔍 Verifying all crawler data...\n");

  const brands = [
    { csvFile: "1_agilent_results.csv", brandName: "Agilent" },
    { csvFile: "2_waters_results.csv", brandName: "Waters" },
    {
      csvFile: "3_thermo_fisher_results.csv",
      brandName: "Thermo Fisher Scientific",
    },
    { csvFile: "4_daicel_results.csv", brandName: "Daicel" },
    { csvFile: "5_phenomenex_results.csv", brandName: "Phenomenex" },
  ];

  const allStats: BrandStats[] = [];

  for (const { csvFile, brandName } of brands) {
    console.log(`📊 Analyzing ${brandName}...`);
    const stats = await analyzeBrand(csvFile, brandName);
    allStats.push(stats);
    console.log(`   CSV: ${stats.csvCount} products`);
    console.log(`   DB: ${stats.dbCount} products`);
    console.log(
      `   Description coverage: ${stats.descriptionCoverage}% (${stats.dbWithDescriptions}/${stats.dbCount})`
    );
    console.log(
      `   Spec coverage: ${stats.specCoverage}% (${stats.dbWithSpecs}/${stats.dbCount})`
    );
    console.log(`   Avg spec fields: ${stats.avgSpecFields}`);
    console.log("");
  }

  // Generate summary
  console.log("\n📋 SUMMARY\n");
  console.log("Brand                    | CSV Count | DB Count | Desc % | Spec % | Avg Fields");
  console.log("-------------------------|-----------|----------|--------|--------|------------");
  allStats.forEach((s) => {
    const brandPadded = s.brand.padEnd(24);
    const csvCount = s.csvCount.toString().padStart(9);
    const dbCount = s.dbCount.toString().padStart(8);
    const descPct = `${s.descriptionCoverage}%`.padStart(6);
    const specPct = `${s.specCoverage}%`.padStart(6);
    const avgFields = s.avgSpecFields.toString().padStart(11);
    console.log(
      `${brandPadded} | ${csvCount} | ${dbCount} | ${descPct} | ${specPct} | ${avgFields}`
    );
  });

  // Total statistics
  const totalCsvCount = allStats.reduce((sum, s) => sum + s.csvCount, 0);
  const totalDbCount = allStats.reduce((sum, s) => sum + s.dbCount, 0);
  const totalWithDesc = allStats.reduce(
    (sum, s) => sum + s.dbWithDescriptions,
    0
  );
  const totalWithSpecs = allStats.reduce((sum, s) => sum + s.dbWithSpecs, 0);
  const totalSpecFields = allStats.reduce(
    (sum, s) => sum + s.avgSpecFields * s.dbCount,
    0
  );
  const avgTotalSpecFields =
    totalDbCount > 0 ? Math.round((totalSpecFields / totalDbCount) * 10) / 10 : 0;
  const totalDescCoverage =
    totalDbCount > 0 ? Math.round((totalWithDesc / totalDbCount) * 1000) / 10 : 0;
  const totalSpecCoverage =
    totalDbCount > 0 ? Math.round((totalWithSpecs / totalDbCount) * 1000) / 10 : 0;

  console.log("-------------------------|-----------|----------|--------|--------|------------");
  console.log(
    `${"TOTAL".padEnd(24)} | ${totalCsvCount.toString().padStart(9)} | ${totalDbCount.toString().padStart(8)} | ${`${totalDescCoverage}%`.padStart(6)} | ${`${totalSpecCoverage}%`.padStart(6)} | ${avgTotalSpecFields.toString().padStart(11)}`
  );

  // Quality distribution
  console.log("\n📊 DESCRIPTION QUALITY DISTRIBUTION (CSV Data)\n");
  console.log("Brand                    | High | Medium | Low | None");
  console.log("-------------------------|------|--------|-----|------");
  allStats.forEach((s) => {
    const brandPadded = s.brand.padEnd(24);
    const high = s.qualityDistribution.High?.toString().padStart(4) || "0".padStart(4);
    const medium = s.qualityDistribution.Medium?.toString().padStart(6) || "0".padStart(6);
    const low = s.qualityDistribution.Low?.toString().padStart(3) || "0".padStart(3);
    const none = s.qualityDistribution.None?.toString().padStart(4) || "0".padStart(4);
    console.log(`${brandPadded} | ${high} | ${medium} | ${low} | ${none}`);
  });

  // Check for discrepancies
  console.log("\n⚠️  DISCREPANCIES\n");
  let hasDiscrepancies = false;
  allStats.forEach((s) => {
    if (s.csvCount !== s.dbCount) {
      console.log(
        `❌ ${s.brand}: CSV has ${s.csvCount} products, DB has ${s.dbCount} products (difference: ${s.csvCount - s.dbCount})`
      );
      hasDiscrepancies = true;
    }
  });
  if (!hasDiscrepancies) {
    console.log("✅ No count discrepancies found - all brands match!");
  }

  // Save detailed report
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalCsvCount,
      totalDbCount,
      totalDescCoverage,
      totalSpecCoverage,
      avgTotalSpecFields,
    },
    brands: allStats,
  };

  const reportPath = path.join(
    "/home/ubuntu/rowell-website-test",
    "CRAWLER_DATA_VERIFICATION_REPORT.json"
  );
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Detailed report saved to: ${reportPath}`);
}

main();
