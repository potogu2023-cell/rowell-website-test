import { drizzle } from 'drizzle-orm/mysql2';
import { products } from './drizzle/schema';
import { sql, count } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL!);

async function queryBrandStats() {
  // Get brand statistics
  const brandStats = await db
    .select({
      brand: products.brand,
      count: count()
    })
    .from(products)
    .groupBy(products.brand)
    .orderBy(sql`count(*) DESC`);
  
  console.log('\n=== Brand Statistics ===\n');
  console.log('Brand'.padEnd(30) + 'Product Count');
  console.log('='.repeat(50));
  
  let total = 0;
  brandStats.forEach(stat => {
    console.log(stat.brand.padEnd(30) + stat.count);
    total += stat.count;
  });
  
  console.log('='.repeat(50));
  console.log('Total'.padEnd(30) + total);
  console.log('\nTotal brands: ' + brandStats.length);
  
  return brandStats;
}

queryBrandStats().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
