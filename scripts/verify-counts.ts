import { drizzle } from "drizzle-orm/mysql2";
import { categories, productCategories } from "../drizzle/schema";
import { eq, countDistinct } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function verifyCounts() {
  console.log("\n📊 Verifying category product counts...\n");
  
  const targetCategories = ["HPLC Columns", "Vials & Caps", "SPE Cartridges"];
  
  for (const categoryName of targetCategories) {
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        productCount: countDistinct(productCategories.productId),
      })
      .from(categories)
      .leftJoin(productCategories, eq(categories.id, productCategories.categoryId))
      .where(eq(categories.name, categoryName))
      .groupBy(categories.id);
    
    if (result.length > 0) {
      console.log(`✅ ${result[0].name}: ${result[0].productCount} products`);
    } else {
      console.log(`❌ Category "${categoryName}" not found`);
    }
  }
  
  console.log("\n");
  process.exit(0);
}

verifyCounts();
