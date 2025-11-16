import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { products } from "./drizzle/schema";
import { readFileSync } from "fs";

const db = drizzle(process.env.DATABASE_URL!);

interface VerifiedProduct {
  productId: string;
  partNumber: string;
  verificationStatus: string;
  dataAccuracy: {
    descriptionMatch: boolean;
    specificationsMatch: boolean;
    nameMatch: boolean;
  };
  extractedData?: {
    productName?: string;
    description?: string;
    specificationsCount?: number;
  };
  catalogUrl?: string;
  verificationMethod: string;
  verificationDate: string;
  notes: string;
}

async function importVerifiedData() {
  console.log("🚀 Starting import of Agilent + Develosil verified data...\n");

  // Read JSON files
  const agilentData: VerifiedProduct[] = JSON.parse(
    readFileSync("/home/ubuntu/upload/agilent_verified_data.json", "utf-8")
  );
  
  const develosilData: VerifiedProduct[] = JSON.parse(
    readFileSync("/home/ubuntu/upload/develosil_verified_data.json", "utf-8")
  );

  console.log(`📊 Loaded data:`);
  console.log(`  Agilent: ${agilentData.length} products`);
  console.log(`  Develosil: ${develosilData.length} products\n`);

  // Statistics
  let stats = {
    agilent: {
      total: agilentData.length,
      verified: 0,
      notFound: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    },
    develosil: {
      total: develosilData.length,
      verified: 0,
      notFound: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    }
  };

  // Process Agilent products
  console.log("📦 Processing Agilent products...");
  for (const item of agilentData) {
    try {
      if (item.verificationStatus === "verified") {
        stats.agilent.verified++;
        
        // Get existing product
        const existing = await db
          .select()
          .from(products)
          .where(eq(products.productId, item.productId))
          .limit(1);

        if (existing.length === 0) {
          console.log(`  ⚠️  Product not found: ${item.productId}`);
          stats.agilent.skipped++;
          continue;
        }

        // Prepare update data
        const updateData: any = {};
        let hasUpdates = false;

        // Update description if extracted
        if (item.extractedData?.description) {
          updateData.description = item.extractedData.description;
          hasUpdates = true;
        }

        // Update catalogUrl if provided
        if (item.catalogUrl && item.catalogUrl !== existing[0].catalogUrl) {
          updateData.catalogUrl = item.catalogUrl;
          hasUpdates = true;
        }

        // Update product if there are changes
        if (hasUpdates) {
          await db
            .update(products)
            .set(updateData)
            .where(eq(products.productId, item.productId));
          
          stats.agilent.updated++;
          console.log(`  ✅ Updated: ${item.productId}`);
        } else {
          stats.agilent.skipped++;
        }
      } else if (item.verificationStatus === "not_found") {
        stats.agilent.notFound++;
        console.log(`  ❌ Not found on website: ${item.productId}`);
      }
    } catch (error) {
      stats.agilent.errors++;
      console.error(`  ❌ Error processing ${item.productId}:`, error);
    }
  }

  console.log("\n📦 Processing Develosil products...");
  for (const item of develosilData) {
    try {
      if (item.verificationStatus === "verified") {
        stats.develosil.verified++;
        
        // Get existing product
        const existing = await db
          .select()
          .from(products)
          .where(eq(products.productId, item.productId))
          .limit(1);

        if (existing.length === 0) {
          console.log(`  ⚠️  Product not found: ${item.productId}`);
          stats.develosil.skipped++;
          continue;
        }

        // Prepare update data
        const updateData: any = {};
        let hasUpdates = false;

        // Update description if extracted
        if (item.extractedData?.description) {
          updateData.description = item.extractedData.description;
          hasUpdates = true;
        }

        // Update catalogUrl if provided
        if (item.catalogUrl && item.catalogUrl !== existing[0].catalogUrl) {
          updateData.catalogUrl = item.catalogUrl;
          hasUpdates = true;
        }

        // Update product if there are changes
        if (hasUpdates) {
          await db
            .update(products)
            .set(updateData)
            .where(eq(products.productId, item.productId));
          
          stats.develosil.updated++;
          console.log(`  ✅ Updated: ${item.productId}`);
        } else {
          stats.develosil.skipped++;
        }
      } else if (item.verificationStatus === "not_found") {
        stats.develosil.notFound++;
        console.log(`  ❌ Not found on website: ${item.productId}`);
      }
    } catch (error) {
      stats.develosil.errors++;
      console.error(`  ❌ Error processing ${item.productId}:`, error);
    }
  }

  // Print summary
  console.log("\n\n📊 Import Summary:");
  console.log("\n=== Agilent ===");
  console.log(`  Total products: ${stats.agilent.total}`);
  console.log(`  Verified: ${stats.agilent.verified}`);
  console.log(`  Not found: ${stats.agilent.notFound}`);
  console.log(`  Updated: ${stats.agilent.updated}`);
  console.log(`  Skipped (no changes): ${stats.agilent.skipped}`);
  console.log(`  Errors: ${stats.agilent.errors}`);

  console.log("\n=== Develosil ===");
  console.log(`  Total products: ${stats.develosil.total}`);
  console.log(`  Verified: ${stats.develosil.verified}`);
  console.log(`  Not found: ${stats.develosil.notFound}`);
  console.log(`  Updated: ${stats.develosil.updated}`);
  console.log(`  Skipped (no changes): ${stats.develosil.skipped}`);
  console.log(`  Errors: ${stats.develosil.errors}`);

  console.log("\n=== Overall ===");
  console.log(`  Total verified: ${stats.agilent.verified + stats.develosil.verified}`);
  console.log(`  Total updated: ${stats.agilent.updated + stats.develosil.updated}`);
  console.log(`  Total not found: ${stats.agilent.notFound + stats.develosil.notFound}`);
  console.log(`  Success rate: ${((stats.agilent.verified + stats.develosil.verified) / (stats.agilent.total + stats.develosil.total) * 100).toFixed(1)}%`);

  console.log("\n✅ Import complete!");

  // Save stats to file
  const reportData = {
    importDate: new Date().toISOString(),
    agilent: stats.agilent,
    develosil: stats.develosil,
    overall: {
      totalProducts: stats.agilent.total + stats.develosil.total,
      totalVerified: stats.agilent.verified + stats.develosil.verified,
      totalUpdated: stats.agilent.updated + stats.develosil.updated,
      totalNotFound: stats.agilent.notFound + stats.develosil.notFound,
      successRate: ((stats.agilent.verified + stats.develosil.verified) / (stats.agilent.total + stats.develosil.total) * 100).toFixed(1) + "%"
    }
  };

  const { writeFileSync } = require("fs");
  writeFileSync(
    "/home/ubuntu/agilent_develosil_import_report.json",
    JSON.stringify(reportData, null, 2)
  );

  console.log("\n📄 Report saved to: /home/ubuntu/agilent_develosil_import_report.json");

  process.exit(0);
}

importVerifiedData().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
