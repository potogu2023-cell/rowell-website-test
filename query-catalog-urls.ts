import { db } from './server/db';
import { products } from './drizzle/schema';
import { isNotNull, ne } from 'drizzle-orm';

async function queryCatalogUrls() {
  const productsWithCatalog = await db
    .select({
      id: products.id,
      productId: products.productId,
      partNumber: products.partNumber,
      brand: products.brand,
      name: products.name,
      catalogUrl: products.catalogUrl,
    })
    .from(products)
    .where(isNotNull(products.catalogUrl))
    .limit(10);
  
  console.log('产品示例（带catalogUrl）:');
  productsWithCatalog.forEach((p, i) => {
    console.log(`\n${i + 1}. ${p.brand} - ${p.name}`);
    console.log(`   Product ID: ${p.productId}`);
    console.log(`   Part Number: ${p.partNumber}`);
    console.log(`   Catalog URL: ${p.catalogUrl}`);
  });
  
  process.exit(0);
}

queryCatalogUrls().catch(console.error);
