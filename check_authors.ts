import { getDb } from "./server/db";
import { authors } from "./drizzle/schema";

async function checkAuthors() {
  const db = await getDb();
  const result = await db.select().from(authors).limit(5);
  console.log("Authors in database:", result.length);
  if (result.length > 0) {
    console.log("Sample author:", JSON.stringify(result[0], null, 2));
  }
}

checkAuthors().catch(console.error);
