import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { products } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  const brands = ["Shimadzu", "Merck", "Develosil"];
  
  console.log("Checking brand existence in database:\n");
  
  for (const brand of brands) {
    const count = await db
      .select()
      .from(products)
      .where(eq(products.brand, brand));
    
    console.log(`${brand}: ${count.length} products`);
  }
}

main();
