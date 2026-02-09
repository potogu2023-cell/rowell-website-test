import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { products, categories } from "./drizzle/schema";
import { eq, or, sql } from "drizzle-orm";

async function main() {
  console.log("🔍 Starting product addition and data consistency check...\n");

  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);

  // Step 1: Get Sample Preparation category ID
  console.log("Step 1: Finding Sample Preparation category...");
  const samplePrepCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.nameEn, "Sample Preparation"));

  if (samplePrepCategories.length === 0) {
    console.error("❌ Sample Preparation category not found!");
    await connection.end();
    return;
  }

  const samplePrepCategoryId = samplePrepCategories[0].id;
  console.log(`✅ Found Sample Preparation category with ID: ${samplePrepCategoryId}\n`);

  // Step 2: Check if products already exist
  console.log("Step 2: Checking if products already exist...");
  const existingProducts = await db
    .select()
    .from(products)
    .where(
      or(
        eq(products.partNumber, "WATS-186007239"),
        eq(products.partNumber, "WATS-186007080")
      )
    );

  console.log(`Found ${existingProducts.length} existing products\n`);

  // Step 3: Add products if they don't exist
  const newProducts = [
    {
      partNumber: "WATS-186007239",
      name: "GlycoWorks HILIC 1 cc Flangeless Cartridge",
      brand: "Waters",
      categoryId: samplePrepCategoryId,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      partNumber: "WATS-186007080",
      name: "GlycoWorks HILIC 1 cc Cartridge, 20/pk",
      brand: "Waters",
      categoryId: samplePrepCategoryId,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  console.log("Step 3: Adding/updating products...");
  for (const product of newProducts) {
    const existing = existingProducts.find(p => p.partNumber === product.partNumber);
    
    if (existing) {
      // Update existing product
      await db
        .update(products)
        .set({
          name: product.name,
          categoryId: product.categoryId,
          updatedAt: new Date()
        })
        .where(eq(products.partNumber, product.partNumber));
      console.log(`✅ Updated product: ${product.partNumber}`);
    } else {
      // Insert new product
      await db.insert(products).values(product);
      console.log(`✅ Added new product: ${product.partNumber}`);
    }
  }

  // Step 4: Data consistency check
  console.log("\n" + "=".repeat(60));
  console.log("Step 4: Data Consistency Check");
  console.log("=".repeat(60) + "\n");

  // Check total products
  const totalProductsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(products);
  const totalProducts = totalProductsResult[0].count;
  console.log(`📊 Total products in database: ${totalProducts}`);

  // Check products by status
  const activeProductsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.status, "active"));
  const activeProducts = activeProductsResult[0].count;
  console.log(`✅ Active products: ${activeProducts}`);

  // Check products by category
  console.log("\n📁 Products by category:");
  const categoryStats = await db
    .select({
      categoryId: products.categoryId,
      categoryName: categories.nameEn,
      count: sql<number>`count(*)`
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .groupBy(products.categoryId, categories.nameEn)
    .orderBy(sql`count(*) DESC`);

  categoryStats.forEach(stat => {
    console.log(`  - ${stat.categoryName || 'NULL'} (ID: ${stat.categoryId}): ${stat.count} products`);
  });

  // Check for products with NULL category
  const nullCategoryResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(sql`${products.categoryId} IS NULL`);
  const nullCategoryCount = nullCategoryResult[0].count;
  
  if (nullCategoryCount > 0) {
    console.log(`\n⚠️  WARNING: ${nullCategoryCount} products have NULL category!`);
  }

  // Check for duplicate part numbers
  console.log("\n🔍 Checking for duplicate part numbers...");
  const duplicates = await db.execute(sql`
    SELECT part_number, COUNT(*) as count 
    FROM products 
    GROUP BY part_number 
    HAVING count > 1
  `);
  
  if (duplicates.rows.length > 0) {
    console.log(`⚠️  Found ${duplicates.rows.length} duplicate part numbers:`);
    duplicates.rows.forEach((row: any) => {
      console.log(`  - ${row.part_number}: ${row.count} occurrences`);
    });
  } else {
    console.log(`✅ No duplicate part numbers found`);
  }

  // Check Waters brand products
  console.log("\n🔍 Waters brand products summary:");
  const watersProductsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.brand, "Waters"));
  const watersProducts = watersProductsResult[0].count;
  console.log(`  Total Waters products: ${watersProducts}`);

  await connection.end();
  console.log("\n✅ All done!");
}

main().catch(console.error);
