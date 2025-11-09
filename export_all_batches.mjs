import { drizzle } from 'drizzle-orm/mysql2';
import { products } from './drizzle/schema.ts';
import { and, eq, or, isNull, sql } from 'drizzle-orm';
import fs from 'fs';

const db = drizzle(process.env.DATABASE_URL);

const batches = [
  { id: 1, brand: 'Avantor', name: 'Avantor补充' },
  { id: 2, brand: 'Waters', name: 'Waters补充' },
  { id: 3, brand: 'Thermo Fisher Scientific', name: 'Thermo Fisher补充' },
  { id: 4, brand: 'Daicel', name: 'Daicel补充' },
  { id: 5, brand: 'ACE', name: 'ACE全品类' },
  { id: 6, brand: 'Merck', name: 'Merck全品类' },
  { id: 7, brand: 'YMC', name: 'YMC全品类' },
  { id: 8, brand: 'Restek', name: 'Restek全品类' },
  { id: 9, brand: 'Shimadzu', name: 'Shimadzu全品类' },
];

for (const batch of batches) {
  const unverifiedProducts = await db.select({
    productId: products.productId,
    partNumber: products.partNumber,
    name: products.name,
  }).from(products).where(
    and(
      eq(products.brand, batch.brand),
      or(
        isNull(products.description),
        sql`LENGTH(${products.description}) <= 100`
      )
    )
  ).orderBy(products.partNumber);

  console.log(`Batch ${batch.id} (${batch.name}): ${unverifiedProducts.length} products`);

  const csvContent = 'Product ID,Part Number,Product Name\n' + 
    unverifiedProducts.map(p => 
      `${p.productId},"${p.partNumber}","${p.name}"`
    ).join('\n');

  fs.writeFileSync(`batch${batch.id}_${batch.brand.toLowerCase().replace(/ /g, '_')}_products.csv`, csvContent);
}

console.log('\nAll batch product lists exported successfully!');
