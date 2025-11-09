import { drizzle } from "drizzle-orm/mysql2";
import { eq, and, or, isNull, sql } from "drizzle-orm";
import { products } from "../drizzle/schema";
import { invokeLLM } from "../server/_core/llm";

const db = drizzle(process.env.DATABASE_URL!);

async function generateDescription(product: any): Promise<string | null> {
  try {
    const prompt = `You are a technical writer for chromatography products. Generate a professional product description (150-300 characters) for the following HPLC column:

Product Name: ${product.name}
Part Number: ${product.partNumber}
Brand: ${product.brand}

${product.specifications ? `Technical Specifications:\n${JSON.stringify(JSON.parse(product.specifications), null, 2)}` : ""}

Requirements:
1. Write in professional, technical English
2. Focus on key features and applications
3. Length: 150-300 characters
4. Do not include price or availability information
5. Use technical terminology appropriate for chromatography professionals

Generate ONLY the description text, no additional commentary.`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a technical writer specializing in chromatography products." },
        { role: "user", content: prompt },
      ],
    });

    const description = response.choices[0]?.message?.content?.trim();
    
    if (!description || description.length < 50) {
      console.warn(`⚠️  Generated description too short for ${product.productId}`);
      return null;
    }

    return description;
  } catch (error) {
    console.error(`❌ Failed to generate description for ${product.productId}:`, error);
    return null;
  }
}

async function main() {
  console.log("🤖 Generating AI Descriptions for Phenomenex Products\n");

  // Find Phenomenex products with no description or very short descriptions
  const phenomenexProducts = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.brand, "Phenomenex"),
        or(
          isNull(products.description),
          sql`CHAR_LENGTH(${products.description}) < 50`
        )
      )
    );

  console.log(`Found ${phenomenexProducts.length} Phenomenex products needing descriptions\n`);

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (let i = 0; i < phenomenexProducts.length; i++) {
    const product = phenomenexProducts[i];
    
    console.log(`[${i + 1}/${phenomenexProducts.length}] Processing ${product.productId}...`);

    const description = await generateDescription(product);

    if (description) {
      await db
        .update(products)
        .set({
          description,
          updatedAt: new Date(),
        })
        .where(eq(products.productId, product.productId));

      console.log(`  ✅ Generated (${description.length} chars): ${description.substring(0, 80)}...`);
      successCount++;
    } else {
      console.log(`  ❌ Failed to generate description`);
      failCount++;
    }

    // Rate limiting: wait 1 second between requests
    if (i < phenomenexProducts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log("SUMMARY");
  console.log(`${"=".repeat(80)}\n`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`📊 Total: ${phenomenexProducts.length}`);
  console.log(`📈 Success Rate: ${((successCount / phenomenexProducts.length) * 100).toFixed(1)}%\n`);

  // Verify final coverage
  const allPhenomenex = await db
    .select()
    .from(products)
    .where(eq(products.brand, "Phenomenex"));

  const withDescriptions = allPhenomenex.filter(
    (p) => p.description && p.description.length >= 50
  );

  console.log(`\n📊 Final Phenomenex Description Coverage:`);
  console.log(`   Total products: ${allPhenomenex.length}`);
  console.log(`   With descriptions (≥50 chars): ${withDescriptions.length}`);
  console.log(`   Coverage: ${((withDescriptions.length / allPhenomenex.length) * 100).toFixed(1)}%\n`);
}

main();
