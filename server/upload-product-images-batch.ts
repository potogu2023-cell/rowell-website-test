import { publicProcedure, router } from "./trpc";
import { storagePut } from "./storage";
import { getDb } from "./db";
import { products } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

/**
 * Batch upload product images from local directory to S3 and update database
 */
export const uploadProductImagesBatchRouter = router({
  uploadBatch: publicProcedure.mutation(async () => {
    const imageDir = "/home/ubuntu/batch_generation_output/incorrect_images_fix";
    const results: any[] = [];

    // Check if directory exists
    if (!fs.existsSync(imageDir)) {
      throw new Error(`Directory ${imageDir} does not exist`);
    }

    // Get all PNG files
    const files = fs.readdirSync(imageDir).filter((f) => f.endsWith(".png"));

    if (files.length === 0) {
      return { success: true, message: "No PNG files found", results: [] };
    }

    // Get database connection
    const db = await getDb();
    if (!db) {
      throw new Error("Cannot connect to database");
    }

    let successCount = 0;
    let failCount = 0;

    // Process each image
    for (const filename of files) {
      const productId = filename.replace(".png", "");
      const filePath = path.join(imageDir, filename);

      try {
        // Get product info from database
        const productRows = await db
          .select()
          .from(products)
          .where(eq(products.productId, productId))
          .limit(1);

        if (productRows.length === 0) {
          results.push({
            productId,
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

        results.push({
          productId,
          partNumber: product.partNumber,
          brand: product.brand,
          name: product.name,
          s3Url: uploadResult.url,
          success: true,
        });

        successCount++;
      } catch (error) {
        results.push({
          productId,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
        failCount++;
      }
    }

    return {
      success: failCount === 0,
      totalImages: files.length,
      successCount,
      failCount,
      successRate: ((successCount / files.length) * 100).toFixed(2) + "%",
      results,
    };
  }),
});
