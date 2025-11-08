/**
 * Generate meta descriptions and excerpts for articles
 * Automatically extracts first 150-160 characters from content
 */

import { drizzle } from "drizzle-orm/mysql2";
import { resources } from "../drizzle/schema";
import { eq, or, isNull } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

/**
 * Strip markdown and HTML tags, extract plain text
 */
function stripMarkdown(markdown: string): string {
  return markdown
    // Remove HTML tags
    .replace(/<[^>]*>/g, "")
    // Remove markdown links [text](url)
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    // Remove markdown images ![alt](url)
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, "")
    // Remove markdown headers
    .replace(/^#+\s+/gm, "")
    // Remove markdown bold/italic
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    // Remove markdown code blocks
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    // Remove markdown lists
    .replace(/^[\*\-\+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    // Remove extra whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generate meta description (150-160 characters)
 */
function generateMetaDescription(content: string): string {
  const plainText = stripMarkdown(content);
  
  // Find first complete sentence within 150-160 chars
  const sentences = plainText.split(/[.!?]+\s+/);
  let description = "";
  
  for (const sentence of sentences) {
    const testDesc = description + (description ? ". " : "") + sentence;
    if (testDesc.length > 160) {
      break;
    }
    description = testDesc;
  }
  
  // If no complete sentence found, just truncate
  if (!description) {
    description = plainText.substring(0, 157) + "...";
  } else if (description.length < 150) {
    // Try to add more content if too short
    description = plainText.substring(0, 157) + "...";
  }
  
  return description.trim();
}

/**
 * Generate excerpt (300-500 characters)
 */
function generateExcerpt(content: string): string {
  const plainText = stripMarkdown(content);
  
  // Find first 2-3 sentences
  const sentences = plainText.split(/[.!?]+\s+/);
  let excerpt = "";
  
  for (let i = 0; i < Math.min(3, sentences.length); i++) {
    const testExcerpt = excerpt + (excerpt ? ". " : "") + sentences[i];
    if (testExcerpt.length > 500) {
      break;
    }
    excerpt = testExcerpt;
  }
  
  // If no complete sentences found, just truncate
  if (!excerpt) {
    excerpt = plainText.substring(0, 497) + "...";
  }
  
  return excerpt.trim();
}

async function main() {
  console.log("🔍 Finding articles without meta descriptions...\n");
  
  // Find all published articles without metaDescription or excerpt
  const articlesWithoutMeta = await db
    .select()
    .from(resources)
    .where(
      or(
        isNull(resources.metaDescription),
        eq(resources.metaDescription, ""),
        isNull(resources.excerpt),
        eq(resources.excerpt, "")
      )
    );
  
  console.log(`📊 Found ${articlesWithoutMeta.length} articles to process\n`);
  
  let updated = 0;
  let failed = 0;
  
  for (const article of articlesWithoutMeta) {
    try {
      const needsMetaDesc = !article.metaDescription || article.metaDescription === "";
      const needsExcerpt = !article.excerpt || article.excerpt === "";
      
      if (!needsMetaDesc && !needsExcerpt) {
        continue;
      }
      
      console.log(`📝 Processing: ${article.title}`);
      console.log(`   Slug: ${article.slug}`);
      
      const updates: Partial<typeof article> = {};
      
      if (needsMetaDesc) {
        const metaDesc = generateMetaDescription(article.content);
        updates.metaDescription = metaDesc;
        console.log(`   ✅ Meta Description (${metaDesc.length} chars): ${metaDesc.substring(0, 80)}...`);
      }
      
      if (needsExcerpt) {
        const excerpt = generateExcerpt(article.content);
        updates.excerpt = excerpt;
        console.log(`   ✅ Excerpt (${excerpt.length} chars): ${excerpt.substring(0, 80)}...`);
      }
      
      // Update database
      await db
        .update(resources)
        .set(updates)
        .where(eq(resources.id, article.id));
      
      updated++;
      console.log(`   ✅ Updated successfully\n`);
      
    } catch (error) {
      console.error(`   ❌ Error processing ${article.title}:`, error);
      failed++;
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("📊 Summary:");
  console.log(`   Total articles: ${articlesWithoutMeta.length}`);
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log("=".repeat(60));
  
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
