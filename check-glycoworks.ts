import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { products, categories } from "./drizzle/schema";
import { eq, or } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

async function checkGlycoWorksProducts() {
  console.log("🔍 Checking GlycoWorks products...\n");
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not set");

  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);

  // Query the two products
  const glycoWorksProducts = await db
    .select()
    .from(products)
    .where(
      or(
        eq(products.partNumber, "WATS-186007239"),
        eq(products.partNumber, "WATS-186007080")
      )
    );

  console.log("Found products:", glycoWorksProducts.length);
  glycoWorksProducts.forEach(p => {
    console.log(`\nID: ${p.id}`);
    console.log(`Part Number: ${p.partNumber}`);
    console.log(`Name: ${p.name}`);
    console.log(`Brand: ${p.brand}`);
    console.log(`Category ID: ${p.categoryId}`);
  });

  // Get Sample Preparation category
  const samplePrepCategory = await db
    .select()
    .from(categories)
    .where(eq(categories.nameEn, "Sample Preparation"));

  console.log("\n\nSample Preparation category:");
  console.log(samplePrepCategory);

  await connection.end();
}

checkGlycoWorksProducts().catch(console.error);
