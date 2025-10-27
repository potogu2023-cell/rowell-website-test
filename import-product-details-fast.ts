import { getDb } from "./server/db";
import { products } from "./drizzle/schema";
import { eq, sql } from "drizzle-orm";
import * as fs from "fs";
import csv from "csv-parser";

interface ProductUpdate {
  productId: string;
  imageUrl: string;
  catalogUrl: string;
  technicalDocsUrl: string;
  description: string;
  specifications: string;
}

async function importProductDetailsFast() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Database not available");
    return;
  }

  const csvFilePath = "/home/ubuntu/upload/product_details_update.csv";
  const updates: ProductUpdate[] = [];

  console.log("📖 Reading CSV file...");

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (row) => {
        updates.push({
          productId: row.productId,
          imageUrl: row.imageUrl || null,
          catalogUrl: row.catalogUrl || null,
          technicalDocsUrl: row.technicalDocsUrl || null,
          description: row.description || null,
          specifications: row.specifications || null,
        });
      })
      .on("end", async () => {
        console.log(`\n📊 Total updates to process: ${updates.length}`);
        
        let successCount = 0;
        let failCount = 0;
        let imageUpdateCount = 0;
        let catalogUpdateCount = 0;
        let docsUpdateCount = 0;

        console.log("\n🔄 Processing updates in batches...\n");

        const BATCH_SIZE = 50;
        
        for (let i = 0; i < updates.length; i += BATCH_SIZE) {
          const batch = updates.slice(i, i + BATCH_SIZE);
          
          try {
            // Process batch in parallel
            await Promise.all(batch.map(async (update) => {
              try {
                // Prepare update data
                const updateData: any = {};
                
                if (update.imageUrl) {
                  updateData.imageUrl = update.imageUrl;
                  imageUpdateCount++;
                }
                
                if (update.catalogUrl) {
                  updateData.catalogUrl = update.catalogUrl;
                  catalogUpdateCount++;
                }
                
                if (update.technicalDocsUrl) {
                  updateData.technicalDocsUrl = update.technicalDocsUrl;
                  docsUpdateCount++;
                }
                
                if (update.description) {
                  updateData.description = update.description;
                }

                // Parse specifications JSON and update individual fields
                if (update.specifications) {
                  try {
                    const specs = JSON.parse(update.specifications);
                    if (specs.particleSize) updateData.particleSize = specs.particleSize;
                    if (specs.poreSize) updateData.poreSize = specs.poreSize;
                    if (specs.columnLength) updateData.columnLength = specs.columnLength;
                    if (specs.innerDiameter) updateData.innerDiameter = specs.innerDiameter;
                    if (specs.phaseType) updateData.phaseType = specs.phaseType;
                    if (specs.phMin) updateData.phMin = parseFloat(specs.phMin);
                    if (specs.phMax) updateData.phMax = parseFloat(specs.phMax);
                  } catch (e) {
                    // Ignore JSON parse errors
                  }
                }

                // Update product
                if (Object.keys(updateData).length > 0) {
                  await db
                    .update(products)
                    .set(updateData)
                    .where(eq(products.productId, update.productId));
                  
                  successCount++;
                }
              } catch (error) {
                failCount++;
              }
            }));

            // Progress indicator
            console.log(`✅ Processed ${Math.min(i + BATCH_SIZE, updates.length)}/${updates.length} updates...`);
          } catch (error) {
            console.error(`❌ Error processing batch ${i}-${i + BATCH_SIZE}:`, error);
          }
        }

        console.log("\n" + "=".repeat(60));
        console.log("📊 IMPORT SUMMARY");
        console.log("=".repeat(60));
        console.log(`Total updates processed: ${updates.length}`);
        console.log(`✅ Successful updates: ${successCount}`);
        console.log(`❌ Failed updates: ${failCount}`);
        console.log("");
        console.log("📈 Update Statistics:");
        console.log(`   - Images updated: ${imageUpdateCount}`);
        console.log(`   - Catalog URLs updated: ${catalogUpdateCount}`);
        console.log(`   - Technical docs updated: ${docsUpdateCount}`);
        console.log("=".repeat(60));

        // Verify updates
        console.log("\n🔍 Verifying updates...\n");

        const stats = await db
          .select()
          .from(products);

        const totalProducts = stats.length;
        const withImages = stats.filter(p => p.imageUrl).length;
        const withCatalog = stats.filter(p => p.catalogUrl).length;
        const withDocs = stats.filter(p => p.technicalDocsUrl).length;

        console.log("📊 DATABASE STATISTICS");
        console.log("=".repeat(60));
        console.log(`Total products: ${totalProducts}`);
        console.log(`Products with images: ${withImages} (${(withImages / totalProducts * 100).toFixed(1)}%)`);
        console.log(`Products with catalog URLs: ${withCatalog} (${(withCatalog / totalProducts * 100).toFixed(1)}%)`);
        console.log(`Products with technical docs: ${withDocs} (${(withDocs / totalProducts * 100).toFixed(1)}%)`);
        console.log("=".repeat(60));

        // Brand-wise statistics
        console.log("\n📊 BRAND-WISE IMAGE COVERAGE");
        console.log("=".repeat(60));

        const brands = [...new Set(stats.map(p => p.brand))].sort();
        for (const brand of brands) {
          const brandProducts = stats.filter(p => p.brand === brand);
          const brandWithImages = brandProducts.filter(p => p.imageUrl).length;
          const coverage = (brandWithImages / brandProducts.length * 100).toFixed(1);
          console.log(`${brand.padEnd(30)} ${brandProducts.length.toString().padStart(4)} products | ${coverage.padStart(5)}% images`);
        }
        console.log("=".repeat(60));

        console.log("\n✅ Import completed successfully!");
        resolve();
      })
      .on("error", (error) => {
        console.error("❌ Error reading CSV file:", error);
        reject(error);
      });
  });
}

// Run the import
importProductDetailsFast()
  .then(() => {
    console.log("\n🎉 All done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Import failed:", error);
    process.exit(1);
  });

