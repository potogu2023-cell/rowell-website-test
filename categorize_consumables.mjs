import { drizzle } from 'drizzle-orm/mysql2';
import { products, categories, productCategories } from './drizzle/schema.ts';
import { eq, and, inArray } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

console.log('=== Consumables Product Categorization Script ===\n');

// Category mapping rules
const categoryRules = {
  'SPE Cartridges': {
    keywords: ['vanguard cartridge', 'spe cartridge', 'solid phase extraction'],
    categoryId: 18
  },
  'Autosampler Vials': {
    keywords: ['autosampler vial', 'sample vial'],
    categoryId: 15
  },
  'Syringe Filters': {
    keywords: ['syringe filter', 'phenex-'],
    categoryId: 16
  },
  'Septa and Caps': {
    keywords: ['screw cap', 'septa', 'closure'],
    categoryId: 17
  }
};

// Note: Lab Supplies category not found in database, will need to check

async function main() {
  try {
    // Get all products from Waters and Phenomenex
    console.log('Step 1: Fetching products from Waters and Phenomenex...');
    const allProducts = await db.select()
      .from(products)
      .where(inArray(products.brand, ['Waters', 'Phenomenex']));
    
    console.log(`Found ${allProducts.length} products from Waters and Phenomenex\n`);

    // Categorize products
    const categorizations = [];
    const stats = {};

    for (const product of allProducts) {
      const nameLower = product.name?.toLowerCase() || '';
      
      for (const [categoryName, rule] of Object.entries(categoryRules)) {
        const matches = rule.keywords.some(kw => nameLower.includes(kw));
        
        if (matches) {
          categorizations.push({
            productId: product.id,
            categoryId: rule.categoryId,
            productName: product.name,
            categoryName: categoryName
          });
          
          stats[categoryName] = (stats[categoryName] || 0) + 1;
          break; // Only assign to first matching category
        }
      }
    }

    console.log('Step 2: Categorization Results:');
    for (const [category, count] of Object.entries(stats)) {
      console.log(`  ${category}: ${count} products`);
    }
    console.log(`  Total: ${categorizations.length} products to categorize\n`);

    // Check existing associations
    console.log('Step 3: Checking existing associations...');
    const productIds = categorizations.map(c => c.productId);
    const existingAssociations = await db.select()
      .from(productCategories)
      .where(inArray(productCategories.productId, productIds));
    
    console.log(`Found ${existingAssociations.length} existing associations\n`);

    // Insert new associations
    console.log('Step 4: Inserting new product-category associations...');
    let inserted = 0;
    let skipped = 0;

    for (const cat of categorizations) {
      // Check if association already exists
      const exists = existingAssociations.some(
        ea => ea.productId === cat.productId && ea.categoryId === cat.categoryId
      );

      if (!exists) {
        try {
          await db.insert(productCategories).values({
            productId: cat.productId,
            categoryId: cat.categoryId
          });
          inserted++;
          
          if (inserted % 50 === 0) {
            console.log(`  Inserted ${inserted} associations...`);
          }
        } catch (error) {
          console.error(`  Error inserting ${cat.productName}: ${error.message}`);
        }
      } else {
        skipped++;
      }
    }

    console.log(`\nStep 5: Summary`);
    console.log(`  Total products categorized: ${categorizations.length}`);
    console.log(`  New associations inserted: ${inserted}`);
    console.log(`  Skipped (already exists): ${skipped}`);

    // Verify results
    console.log('\nStep 6: Verifying results...');
    for (const [categoryName, rule] of Object.entries(categoryRules)) {
      const count = await db.select({ count: products.id })
        .from(products)
        .innerJoin(productCategories, eq(products.id, productCategories.productId))
        .where(eq(productCategories.categoryId, rule.categoryId));
      
      console.log(`  ${categoryName} (ID: ${rule.categoryId}): ${count.length} products`);
    }

    console.log('\n✅ Categorization complete!');
    process.exit(0);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
