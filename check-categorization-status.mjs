import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

console.log("\n=== Product Categorization Status ===\n");

// Total products
const totalResult = await db.execute(sql`SELECT COUNT(*) as count FROM products`);
const totalProducts = totalResult[0][0].count;
console.log(`📦 Total products in database: ${totalProducts}`);

// Products with subcategory associations
const categorizedResult = await db.execute(sql`
  SELECT COUNT(DISTINCT pc.productId) as count
  FROM product_categories pc
  JOIN categories c ON pc.categoryId = c.id
  WHERE c.slug IN ('analytical-columns', 'preparative-columns', 'uhplc-columns', 'chiral-columns', 'bio-columns', 'gc-columns', 'guard-columns')
`);
const categorizedCount = categorizedResult[0][0].count;
console.log(`✅ Products with subcategory: ${categorizedCount}`);
console.log(`❌ Products without subcategory: ${totalProducts - categorizedCount}`);
console.log(`📊 Coverage: ${((categorizedCount / totalProducts) * 100).toFixed(1)}%\n`);

// Breakdown by subcategory
console.log("=== Breakdown by Subcategory ===\n");
const breakdownResult = await db.execute(sql`
  SELECT c.name, c.slug, COUNT(pc.productId) as count
  FROM categories c
  LEFT JOIN product_categories pc ON c.id = pc.categoryId
  WHERE c.slug IN ('analytical-columns', 'preparative-columns', 'uhplc-columns', 'chiral-columns', 'bio-columns', 'gc-columns', 'guard-columns')
  GROUP BY c.id, c.name, c.slug
  ORDER BY count DESC
`);

breakdownResult[0].forEach(row => {
  console.log(`${row.name}: ${row.count} products`);
});

// Product types that were skipped
console.log("\n=== Product Types Distribution ===\n");
const typesResult = await db.execute(sql`
  SELECT 
    COALESCE(productType, '(NULL)') as type,
    COUNT(*) as count
  FROM products
  GROUP BY productType
  ORDER BY count DESC
`);

typesResult[0].forEach(row => {
  console.log(`${row.type}: ${row.count} products`);
});

process.exit(0);
