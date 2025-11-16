import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import { products } from "./drizzle/schema";
import { writeFileSync } from "fs";

const db = drizzle(process.env.DATABASE_URL!);

interface BrandStats {
  brand: string;
  total: number;
  withDescription: number;
  withSpecifications: number;
  withCatalogUrl: number;
  descriptionRate: number;
  specificationRate: number;
  catalogUrlRate: number;
  qualityScore: number;
  verificationStatus: 'verified' | 'unverified' | 'unverifiable';
  notes: string;
}

async function analyzeAllProducts() {
  console.log("🔍 Analyzing all products verification status...\n");

  // Get all brands
  const brandsResult = await db
    .select({ brand: products.brand })
    .from(products)
    .groupBy(products.brand);

  const brands = brandsResult.map(b => b.brand);
  console.log(`📊 Found ${brands.length} brands\n`);

  const brandStats: BrandStats[] = [];

  for (const brand of brands) {
    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(sql`${products.brand} = ${brand}`);
    const total = totalResult[0]?.count || 0;

    // Get description count
    const descResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(sql`${products.brand} = ${brand} AND ${products.description} IS NOT NULL AND ${products.description} != ''`);
    const withDescription = descResult[0]?.count || 0;

    // Get specifications count
    const specResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(sql`${products.brand} = ${brand} AND ${products.specifications} IS NOT NULL AND JSON_LENGTH(${products.specifications}) > 0`);
    const withSpecifications = specResult[0]?.count || 0;

    // Get catalogUrl count
    const urlResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(sql`${products.brand} = ${brand} AND ${products.catalogUrl} IS NOT NULL AND ${products.catalogUrl} != ''`);
    const withCatalogUrl = urlResult[0]?.count || 0;

    const descriptionRate = (withDescription / total) * 100;
    const specificationRate = (withSpecifications / total) * 100;
    const catalogUrlRate = (withCatalogUrl / total) * 100;

    // Calculate quality score
    const qualityScore = (descriptionRate * 0.4 + specificationRate * 0.4 + catalogUrlRate * 0.2);

    // Determine verification status
    let verificationStatus: 'verified' | 'unverified' | 'unverifiable';
    let notes = '';

    if (descriptionRate >= 90 && specificationRate >= 80) {
      verificationStatus = 'verified';
      notes = 'High quality data, considered verified';
    } else if (descriptionRate >= 60 && specificationRate >= 50) {
      verificationStatus = 'unverified';
      notes = 'Medium quality data, needs verification';
    } else {
      verificationStatus = 'unverifiable';
      notes = 'Low quality data, consider removing';
    }

    brandStats.push({
      brand,
      total,
      withDescription,
      withSpecifications,
      withCatalogUrl,
      descriptionRate,
      specificationRate,
      catalogUrlRate,
      qualityScore,
      verificationStatus,
      notes
    });

    console.log(`${brand}:`);
    console.log(`  Total: ${total}`);
    console.log(`  Description: ${withDescription} (${descriptionRate.toFixed(1)}%)`);
    console.log(`  Specifications: ${withSpecifications} (${specificationRate.toFixed(1)}%)`);
    console.log(`  CatalogUrl: ${withCatalogUrl} (${catalogUrlRate.toFixed(1)}%)`);
    console.log(`  Quality Score: ${qualityScore.toFixed(1)}`);
    console.log(`  Status: ${verificationStatus}`);
    console.log(`  Notes: ${notes}\n`);
  }

  // Sort by quality score
  brandStats.sort((a, b) => b.qualityScore - a.qualityScore);

  // Calculate overall statistics
  const totalProducts = brandStats.reduce((sum, b) => sum + b.total, 0);
  const verifiedProducts = brandStats.filter(b => b.verificationStatus === 'verified').reduce((sum, b) => sum + b.total, 0);
  const unverifiedProducts = brandStats.filter(b => b.verificationStatus === 'unverified').reduce((sum, b) => sum + b.total, 0);
  const unverifiableProducts = brandStats.filter(b => b.verificationStatus === 'unverifiable').reduce((sum, b) => sum + b.total, 0);

  console.log(`\n📊 Overall Statistics:`);
  console.log(`  Total Products: ${totalProducts}`);
  console.log(`  Verified: ${verifiedProducts} (${((verifiedProducts / totalProducts) * 100).toFixed(1)}%)`);
  console.log(`  Unverified: ${unverifiedProducts} (${((unverifiedProducts / totalProducts) * 100).toFixed(1)}%)`);
  console.log(`  Unverifiable: ${unverifiableProducts} (${((unverifiableProducts / totalProducts) * 100).toFixed(1)}%)`);

  // Save to JSON
  const report = {
    generatedAt: new Date().toISOString(),
    totalProducts,
    verifiedProducts,
    unverifiedProducts,
    unverifiableProducts,
    verifiedRate: (verifiedProducts / totalProducts) * 100,
    unverifiedRate: (unverifiedProducts / totalProducts) * 100,
    unverifiableRate: (unverifiableProducts / totalProducts) * 100,
    brands: brandStats
  };

  writeFileSync('/home/ubuntu/PRODUCT_VERIFICATION_STATUS_REPORT.json', JSON.stringify(report, null, 2));
  console.log(`\n✅ Report saved to: /home/ubuntu/PRODUCT_VERIFICATION_STATUS_REPORT.json`);

  // Generate CSV for easy viewing
  const csvHeader = "Brand,Total,Description,Specifications,CatalogUrl,DescRate,SpecRate,UrlRate,QualityScore,Status,Notes\n";
  const csvRows = brandStats.map(b => 
    `"${b.brand}",${b.total},${b.withDescription},${b.withSpecifications},${b.withCatalogUrl},${b.descriptionRate.toFixed(1)}%,${b.specificationRate.toFixed(1)}%,${b.catalogUrlRate.toFixed(1)}%,${b.qualityScore.toFixed(1)},${b.verificationStatus},"${b.notes}"`
  ).join("\n");

  writeFileSync('/home/ubuntu/PRODUCT_VERIFICATION_STATUS_REPORT.csv', csvHeader + csvRows);
  console.log(`✅ CSV saved to: /home/ubuntu/PRODUCT_VERIFICATION_STATUS_REPORT.csv`);

  process.exit(0);
}

analyzeAllProducts().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
