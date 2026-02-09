import { storagePut } from "./storage";
import { getDb } from "./db";
import { products } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

/**
 * Upload AI-generated product images (incorrect images fix) to S3 and update database
 * 
 * This script:
 * 1. Reads all PNG files from /home/ubuntu/batch_generation_output/incorrect_images_fix/
 * 2. Uploads each image to S3 storage
 * 3. Updates the corresponding product's imageUrl in the database
 * 4. Generates a report of all uploads
 */

interface UploadResult {
  productId: string;
  partNumber: string;
  brand: string;
  name: string;
  s3Url: string;
  success: boolean;
  error?: string;
}

async function uploadAIImages() {
  console.log("🚀 Starting AI image upload process (incorrect images fix)...\n");

  const imageDir = "/home/ubuntu/batch_generation_output/incorrect_images_fix";
  const results: UploadResult[] = [];

  // Check if directory exists
  if (!fs.existsSync(imageDir)) {
    console.error(`❌ Error: Directory ${imageDir} does not exist`);
    process.exit(1);
  }

  // Get all PNG files
  const files = fs.readdirSync(imageDir).filter((f) => f.endsWith(".png"));
  console.log(`📁 Found ${files.length} PNG files in ${imageDir}\n`);

  if (files.length === 0) {
    console.log("⚠️  No PNG files found. Exiting.");
    process.exit(0);
  }

  // Get database connection
  const db = await getDb();
  if (!db) {
    console.error("❌ Error: Cannot connect to database");
    process.exit(1);
  }

  let successCount = 0;
  let failCount = 0;

  // Process each image
  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const productId = filename.replace(".png", "");
    const filePath = path.join(imageDir, filename);

    console.log(`[${i + 1}/${files.length}] Processing ${filename}...`);

    try {
      // Get product info from database
      const productRows = await db
        .select()
        .from(products)
        .where(eq(products.productId, productId))
        .limit(1);

      if (productRows.length === 0) {
        console.log(`  ⚠️  Product ${productId} not found in database, skipping`);
        results.push({
          productId,
          partNumber: "N/A",
          brand: "N/A",
          name: "N/A",
          s3Url: "",
          success: false,
          error: "Product not found in database",
        });
        failCount++;
        continue;
      }

      const product = productRows[0];

      // Read image file
      const imageBuffer = fs.readFileSync(filePath);

      // Upload to S3
      const timestamp = Date.now();
      const s3Key = `products/${productId}-${timestamp}.png`;
      const uploadResult = await storagePut(s3Key, imageBuffer, "image/png");

      // Update database
      await db
        .update(products)
        .set({ imageUrl: uploadResult.url })
        .where(eq(products.productId, productId));

      console.log(`  ✅ Uploaded to S3: ${uploadResult.url}`);
      console.log(`  ✅ Updated database for product ${productId}\n`);

      results.push({
        productId,
        partNumber: product.partNumber || "N/A",
        brand: product.brand || "N/A",
        name: product.name || "N/A",
        s3Url: uploadResult.url,
        success: true,
      });

      successCount++;
    } catch (error) {
      console.error(`  ❌ Error processing ${filename}:`, error);
      results.push({
        productId,
        partNumber: "N/A",
        brand: "N/A",
        name: "N/A",
        s3Url: "",
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      failCount++;
    }
  }

  // Generate report
  const reportPath = "/home/ubuntu/incorrect_images_fix_upload_report.json";
  const report = {
    timestamp: new Date().toISOString(),
    totalImages: files.length,
    successCount,
    failCount,
    successRate: ((successCount / files.length) * 100).toFixed(2) + "%",
    results,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log("\n" + "=".repeat(60));
  console.log("📊 Upload Summary");
  console.log("=".repeat(60));
  console.log(`Total images: ${files.length}`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`Success rate: ${report.successRate}`);
  console.log(`\n📄 Report saved to: ${reportPath}`);
  console.log("=".repeat(60) + "\n");

  if (failCount > 0) {
    console.log("⚠️  Some images failed to upload. Check the report for details.");
    process.exit(1);
  } else {
    console.log("🎉 All images uploaded successfully!");
    process.exit(0);
  }
}

// Run the upload process
uploadAIImages().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
