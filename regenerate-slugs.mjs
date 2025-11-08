import { drizzle } from "drizzle-orm/mysql2";
import { resources } from "./drizzle/schema.js";
import { generateSlug, ensureUniqueSlug } from "./server/db-resources.ts";
import { eq } from "drizzle-orm";

/**
 * Regenerate slugs for all existing articles
 * This script updates articles with invalid slugs (like "-7", "-8")
 * to use proper multilingual slugs
 */

async function regenerateSlugs() {
  console.log("🔄 Starting slug regeneration...\n");

  const db = drizzle(process.env.DATABASE_URL);

  // Get all articles
  const articles = await db.select().from(resources);

  console.log(`Found ${articles.length} articles\n`);

  let updated = 0;
  let skipped = 0;

  for (const article of articles) {
    const currentSlug = article.slug;
    const newBaseSlug = generateSlug(article.title);

    // Check if slug needs updating (invalid slugs like "-7", "-8", or empty)
    if (!currentSlug || currentSlug.match(/^-?\d+$/) || currentSlug.length < 3) {
      const newSlug = await ensureUniqueSlug(newBaseSlug, article.id);

      console.log(`📝 Updating article #${article.id}:`);
      console.log(`   Title: ${article.title.substring(0, 50)}...`);
      console.log(`   Old slug: "${currentSlug}"`);
      console.log(`   New slug: "${newSlug}"\n`);

      await db
        .update(resources)
        .set({ slug: newSlug })
        .where(eq(resources.id, article.id));

      updated++;
    } else {
      console.log(`✓ Skipping article #${article.id} (slug "${currentSlug}" is valid)`);
      skipped++;
    }
  }

  console.log(`\n✅ Slug regeneration complete!`);
  console.log(`   Updated: ${updated} articles`);
  console.log(`   Skipped: ${skipped} articles`);
}

regenerateSlugs()
  .then(() => {
    console.log("\n🎉 Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
