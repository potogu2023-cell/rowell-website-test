import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { products } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

const phenomenexProducts = await db.select().from(products).where(eq(products.brand, 'Phenomenex'));

console.log('Total Phenomenex products:', phenomenexProducts.length);
console.log('\nSample products (first 10):');
phenomenexProducts.slice(0, 10).forEach(p => {
  console.log(`- ${p.productId}: ${p.name}`);
});

console.log('\n=== Product Type Analysis ===');
const typeCount = {};
phenomenexProducts.forEach(p => {
  const name = p.name.toLowerCase();
  let type = 'Other';
  if (name.includes('hplc') || name.includes('column')) type = 'HPLC Column';
  else if (name.includes('gc')) type = 'GC Column';
  else if (name.includes('guard')) type = 'Guard Column';
  else if (name.includes('spe') || name.includes('cartridge')) type = 'SPE Cartridge';
  else if (name.includes('vial')) type = 'Vial';
  else if (name.includes('filter')) type = 'Filter';
  
  typeCount[type] = (typeCount[type] || 0) + 1;
});

console.log(JSON.stringify(typeCount, null, 2));

process.exit(0);
