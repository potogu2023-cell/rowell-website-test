import { drizzle } from 'drizzle-orm/mysql2';
import { products } from './drizzle/schema.ts';
import { and, eq, or, isNull, sql } from 'drizzle-orm';
import fs from 'fs';

const db = drizzle(process.env.DATABASE_URL);

const unverifiedProducts = await db.select({
  productId: products.productId,
  partNumber: products.partNumber,
  name: products.name,
}).from(products).where(
  and(
    eq(products.brand, 'Avantor'),
    or(
      isNull(products.description),
      sql`LENGTH(${products.description}) <= 100`
    )
  )
).orderBy(products.partNumber);

console.log(`Found ${unverifiedProducts.length} unverified Avantor products`);

const csvContent = 'Product ID,Part Number,Product Name\n' + 
  unverifiedProducts.map(p => 
    `${p.productId},"${p.partNumber}","${p.name}"`
  ).join('\n');

fs.writeFileSync('batch1_avantor_unverified_products.csv', csvContent);
console.log('Exported to batch1_avantor_unverified_products.csv');
