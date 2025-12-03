import * as fs from "fs";
import * as path from "path";

interface Mapping {
  ai_generated_filename: string;
  database_productId: number;
  expected_productId: string;
  partNumber: string;
  brand: string;
  name: string;
  productType: string;
}

async function renameImages() {
  console.log("🚀 Starting image renaming process...\n");

  const imageDir = "/home/ubuntu/batch_generation_output/hplc_column";
  const mappingFile = "/home/ubuntu/upload/id_mapping_table.json";

  // Read mapping table
  const mappingData: Mapping[] = JSON.parse(fs.readFileSync(mappingFile, "utf-8"));
  console.log(`📋 Loaded ${mappingData.length} mappings from ${mappingFile}\n`);

  // Get list of existing PNG files
  const existingFiles = fs.readdirSync(imageDir).filter((f) => f.endsWith(".png"));
  console.log(`📁 Found ${existingFiles.length} PNG files in ${imageDir}\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  // Process each mapping
  for (let i = 0; i < mappingData.length; i++) {
    const mapping = mappingData[i];
    const oldFilename = mapping.ai_generated_filename;
    const newFilename = `${mapping.expected_productId}.png`;
    const oldPath = path.join(imageDir, oldFilename);
    const newPath = path.join(imageDir, newFilename);

    // Check if old file exists
    if (!fs.existsSync(oldPath)) {
      // Skip if file doesn't exist (not in current batch)
      skipCount++;
      continue;
    }

    try {
      // Rename file
      fs.renameSync(oldPath, newPath);
      console.log(
        `[${successCount + 1}] ✅ ${oldFilename} → ${newFilename}`
      );
      successCount++;
    } catch (error) {
      console.error(`❌ Error renaming ${oldFilename}:`, error);
      errorCount++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 Renaming Summary");
  console.log("=".repeat(60));
  console.log(`Total mappings: ${mappingData.length}`);
  console.log(`✅ Successfully renamed: ${successCount}`);
  console.log(`⏭️  Skipped (file not found): ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log("=".repeat(60) + "\n");

  if (errorCount > 0) {
    console.log("⚠️  Some files failed to rename. Check errors above.");
    process.exit(1);
  } else {
    console.log("🎉 All files renamed successfully!");
    console.log(`\n📁 Renamed files are in: ${imageDir}\n`);
    process.exit(0);
  }
}

renameImages();
