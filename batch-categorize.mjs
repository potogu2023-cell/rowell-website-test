import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

console.log("\n🚀 Fast Batch Categorization Script\n");

// Product type to category slug mapping
const mapping = {
  'HPLC Column': 'analytical-columns',
  'Analytical Column': 'analytical-columns',
  'Preparative Column': 'preparative-columns',
  'UHPLC Column': 'uhplc-columns',
  'Chiral Column': 'chiral-columns',
  'Bio Column': 'bio-columns',
  'GC Column': 'gc-columns',
  'Guard Column': 'guard-columns',
  'SPE Cartridge': 'spe-cartridges',
  'Sample Vials': 'sample-vials',
  'Septa & Closures': 'septa-closures',
  'Syringes & Needles': 'syringes-needles',
  'Centrifuge Tubes': 'centrifuge-tubes',
  'Filtration': 'filtration-products',
  'Tubing & Fittings': 'tubing-fittings',
  'Chromatography Consumables': 'consumables',
};

console.log("Processing each product type with batch SQL...\n");

let totalInserted = 0;

for (const [productType, categorySlug] of Object.entries(mapping)) {
  try {
    // Use INSERT IGNORE to skip duplicates automatically
    const result = await db.execute(sql`
      INSERT IGNORE INTO product_categories (productId, categoryId, isPrimary)
      SELECT p.id, c.id, 0
      FROM products p
      CROSS JOIN categories c
      WHERE p.productType = ${productType}
        AND c.slug = ${categorySlug}
    `);
    
    const inserted = result[0].affectedRows || 0;
    totalInserted += inserted;
    
    console.log(`✅ ${productType} → ${categorySlug}: ${inserted} products`);
    
  } catch (error) {
    console.error(`❌ Error processing ${productType}:`, error.message);
  }
}

console.log(`\n✅ Total inserted: ${totalInserted} associations\n`);

// Verification
console.log("🔍 Verification...\n");

const stats = await db.execute(sql`
  SELECT 
    (SELECT COUNT(*) FROM products) as total_products,
    (SELECT COUNT(DISTINCT productId) FROM product_categories) as categorized_products
`);

const total = stats[0][0].total_products;
const categorized = stats[0][0].categorized_products;
const coverage = ((categorized / total) * 100).toFixed(1);

console.log(`📦 Total products: ${total}`);
console.log(`✅ Categorized: ${categorized}`);
console.log(`📊 Coverage: ${coverage}%\n`);

// Show breakdown
const breakdown = await db.execute(sql`
  SELECT c.name, COUNT(pc.productId) as count
  FROM categories c
  LEFT JOIN product_categories pc ON c.id = pc.categoryId
  WHERE c.parentId IS NOT NULL
  GROUP BY c.id, c.name
  HAVING count > 0
  ORDER BY count DESC
`);

console.log("=== Products per Subcategory ===\n");
breakdown[0].forEach(row => {
  console.log(`  ${row.name}: ${row.count} products`);
});

console.log("\n✅ Done!\n");

process.exit(0);
