import { getDb } from "./server/db";
import { products } from "./drizzle/schema";
import { sql } from "drizzle-orm";
import * as fs from "fs";

async function verifyMappedIds() {
  const db = await getDb();
  if (!db) {
    console.error("Cannot connect to database");
    process.exit(1);
  }

  // Read mapping table
  const mappingData = JSON.parse(
    fs.readFileSync("/home/ubuntu/upload/id_mapping_table.json", "utf-8")
  );

  console.log(`\n=== Verifying ${mappingData.length} mapped product IDs ===\n`);

  // Test first 10 mappings
  let foundCount = 0;
  let notFoundCount = 0;

  for (let i = 0; i < Math.min(10, mappingData.length); i++) {
    const mapping = mappingData[i];
    const expectedId = mapping.expected_productId;
    const partNumber = mapping.partNumber;

    // Try to find by expected productId
    const byId = await db
      .select()
      .from(products)
      .where(sql`productId = ${expectedId}`)
      .limit(1);

    // Try to find by partNumber
    const byPartNumber = await db
      .select()
      .from(products)
      .where(sql`partNumber = ${partNumber}`)
      .limit(1);

    if (byId.length > 0) {
      console.log(`✅ Found by ID: ${expectedId}`);
      foundCount++;
    } else if (byPartNumber.length > 0) {
      console.log(
        `⚠️  Not found by ID (${expectedId}), but found by partNumber: ${partNumber}`
      );
      console.log(`   Database productId: ${byPartNumber[0].productId}`);
      notFoundCount++;
    } else {
      console.log(`❌ Not found: ${expectedId} (partNumber: ${partNumber})`);
      notFoundCount++;
    }
  }

  console.log(`\n=== Summary (first 10) ===`);
  console.log(`Found by expected ID: ${foundCount}`);
  console.log(`Not found or mismatch: ${notFoundCount}`);

  // Check if we should use partNumber instead
  console.log(`\n=== Recommendation ===`);
  if (foundCount === 0) {
    console.log(
      "❌ Expected productIds do not exist in database. Need to use partNumber matching."
    );
  } else if (foundCount < notFoundCount) {
    console.log(
      "⚠️  Some expected productIds exist, but not all. Need to verify mapping."
    );
  } else {
    console.log("✅ Expected productIds exist in database. Can proceed with renaming.");
  }

  process.exit(0);
}

verifyMappedIds();
