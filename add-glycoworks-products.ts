import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { products, categories } from "./drizzle/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

async function addGlycoWorksProducts() {
  console.log("🔍 Adding GlycoWorks HILIC products...\n");

  // Create connection with SSL
  const connection = await mysql.createConnection({
    host: "gateway01.ap-southeast-1.prod.aws.tidbcloud.com",
    port: 4000,
    user: "2aXN65VaF6TF5Ks.root",
    password: "kfUhxoqKoVLbBQwU",
    database: "rowell_hplc_db",
    ssl: {
      rejectUnauthorized: true
    }
  });
  
  const db = drizzle(connection);

  // Get Sample Preparation category ID
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

  // Product data
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

  // Insert products
  for (const product of newProducts) {
    try {
      const result = await db.insert(products).values(product);
      console.log(`✅ Added product: ${product.partNumber} - ${product.name}`);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`⚠️  Product ${product.partNumber} already exists, skipping...`);
      } else {
        console.error(`❌ Error adding product ${product.partNumber}:`, error.message);
      }
    }
  }

  console.log("\n✅ Done!");
  await connection.end();
}

addGlycoWorksProducts().catch(console.error);
