import { drizzle } from 'drizzle-orm/mysql2';
import { products, productCategories, categories } from '../drizzle/schema';
import { eq, notInArray, inArray } from 'drizzle-orm';

async function findProductsToReclassify() {
  const db = drizzle(process.env.DATABASE_URL!);
  
  console.log('=== 查找需要重新分类的产品 ===\n');
  
  // 1. 查找Consumables分类中的产品
  console.log('1. Consumables分类中的产品:');
  const consumablesProducts = await db.select({
    id: products.id,
    productId: products.productId,
    name: products.name,
    brand: products.brand
  })
  .from(products)
  .innerJoin(productCategories, eq(products.id, productCategories.productId))
  .where(eq(productCategories.categoryId, 60007))
  .limit(100);
  
  console.log(`   找到 ${consumablesProducts.length} 个产品`);
  if (consumablesProducts.length > 0) {
    console.log('   示例产品:');
    consumablesProducts.slice(0, 5).forEach(p => {
      console.log(`   - ${p.productId}: ${p.name?.substring(0, 60)}...`);
    });
  }
  console.log('');
  
  // 2. 查找完全没有分类的产品
  console.log('2. 完全没有分类的产品:');
  const allProductIds = await db.select({ id: products.id }).from(products);
  const categorizedProductIds = await db.select({ productId: productCategories.productId })
    .from(productCategories);
  
  const categorizedIds = new Set(categorizedProductIds.map(p => p.productId));
  const uncategorizedProducts = allProductIds.filter(p => !categorizedIds.has(p.id));
  
  console.log(`   找到 ${uncategorizedProducts.length} 个完全没有分类的产品`);
  
  if (uncategorizedProducts.length > 0) {
    const samples = await db.select({
      id: products.id,
      productId: products.productId,
      name: products.name,
      brand: products.brand
    })
    .from(products)
    .where(inArray(products.id, uncategorizedProducts.slice(0, 5).map(p => p.id)));
    
    console.log('   示例产品:');
    samples.forEach(p => {
      console.log(`   - ${p.productId}: ${p.name?.substring(0, 60)}...`);
    });
  }
  console.log('');
  
  // 3. 统计各品牌需要重新分类的产品数量
  console.log('3. 按品牌统计需要重新分类的产品:');
  const consumablesByBrand = consumablesProducts.reduce((acc, p) => {
    acc[p.brand] = (acc[p.brand] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(consumablesByBrand).forEach(([brand, count]) => {
    console.log(`   ${brand}: ${count}个`);
  });
  console.log('');
  
  console.log('=== 总结 ===');
  console.log(`需要重新分类的产品总数: ${consumablesProducts.length + uncategorizedProducts.length}`);
  console.log(`- Consumables分类: ${consumablesProducts.length}个`);
  console.log(`- 完全未分类: ${uncategorizedProducts.length}个`);
  
  process.exit(0);
}

findProductsToReclassify().catch(console.error);
