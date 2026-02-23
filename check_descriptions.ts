import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { products } from './drizzle/schema';
import { eq, or, like } from 'drizzle-orm';

const DATABASE_URL = "mysql://4JVvXdvPrv5tMqx.root:xqBTKMHZhYVpFvv4@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/rowell_hplc?ssl={\"rejectUnauthorized\":true}";

async function main() {
  const connection = await mysql.createPool(DATABASE_URL);
  const db = drizzle(connection);

  const partNumbers = ['81395', '260980620', '260980325'];

  for (const pn of partNumbers) {
    const result = await db.select({
      productId: products.productId,
      partNumber: products.partNumber,
      name: products.name,
      description: products.description,
      detailedDescription: products.detailedDescription
    })
    .from(products)
    .where(
      or(
        eq(products.partNumber, pn),
        like(products.productId, `%${pn}%`)
      )
    )
    .limit(1);

    if (result.length > 0) {
      const p = result[0];
      console.log(`\n产品: ${p.productId}`);
      console.log(`  Part Number: ${p.partNumber}`);
      console.log(`  Name: ${p.name}`);
      console.log(`  Description: '${p.description || ''}'`);
      console.log(`  Detailed Description: '${p.detailedDescription || ''}'`);
      console.log(`  Has Description: ${!!(p.description && p.description.trim())}`);
    } else {
      console.log(`\n未找到产品: ${pn}`);
    }
  }

  await connection.end();
}

main().catch(console.error);
