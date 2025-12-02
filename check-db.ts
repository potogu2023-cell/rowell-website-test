import { drizzle } from 'drizzle-orm/mysql2';
import { count } from 'drizzle-orm';
import { products } from './drizzle/schema';

const db = drizzle(process.env.DATABASE_URL!);

async function checkDatabase() {
  // Get total product count
  const totalResult = await db.select({ count: count() }).from(products);
  console.log('Total products in database:', totalResult[0].count);

  // Get brand distribution
  const brandResult = await db.select({
    brand: products.brand,
    count: count()
  }).from(products).groupBy(products.brand).orderBy(products.brand);

  console.log('\nBrand distribution:');
  brandResult.forEach(row => {
    console.log(`  ${row.brand}: ${row.count}`);
  });
}

checkDatabase().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
