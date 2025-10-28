import { drizzle } from 'drizzle-orm/mysql2';
import { products, productCategories, categories } from './drizzle/schema';
import { eq, sql, count } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL!);

async function checkProductDistribution() {
  console.log('=== 检查产品分布情况 ===\n');
  
  // 1. 总产品数
  const totalProducts = await db.select({ count: count() }).from(products);
  console.log(`总产品数: ${totalProducts[0].count}\n`);
  
  // 2. 按productType分组统计
  console.log('=== 按productType字段统计 ===');
  const productTypeStats = await db
    .select({
      productType: products.productType,
      count: count()
    })
    .from(products)
    .groupBy(products.productType);
  
  productTypeStats.sort((a, b) => Number(b.count) - Number(a.count));
  productTypeStats.forEach(stat => {
    console.log(`${stat.productType || 'NULL'}: ${stat.count}个产品`);
  });
  
  // 3. 检查product_categories表中的映射
  console.log('\n=== 检查product_categories映射表 ===');
  const mappingCount = await db.select({ count: count() }).from(productCategories);
  console.log(`映射关系总数: ${mappingCount[0].count}\n`);
  
  // 4. 按分类统计已映射的产品数
  console.log('=== 按分类统计已映射的产品数 ===');
  const categoryStats = await db
    .select({
      categoryId: productCategories.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      count: count()
    })
    .from(productCategories)
    .leftJoin(categories, eq(productCategories.categoryId, categories.id))
    .groupBy(productCategories.categoryId, categories.name, categories.slug);
  
  categoryStats.sort((a, b) => Number(b.count) - Number(a.count));
  categoryStats.forEach(stat => {
    console.log(`${stat.categoryName} (${stat.categorySlug}): ${stat.count}个产品`);
  });
  
  // 5. 检查未映射的产品
  console.log('\n=== 检查未映射到任何分类的产品 ===');
  const unmappedProducts = await db
    .select({
      id: products.id,
      partNumber: products.partNumber,
      name: products.name,
      productType: products.productType,
      brand: products.brand
    })
    .from(products)
    .leftJoin(productCategories, eq(products.id, productCategories.productId))
    .where(sql`${productCategories.productId} IS NULL`)
    .limit(20);
  
  console.log(`未映射产品数量: ${unmappedProducts.length > 0 ? '至少' + unmappedProducts.length : 0}个`);
  if (unmappedProducts.length > 0) {
    console.log('\n前20个未映射产品示例:');
    unmappedProducts.forEach(p => {
      console.log(`- ID: ${p.id}, Type: ${p.productType}, Brand: ${p.brand}, Part: ${p.partNumber}`);
    });
  }
  
  // 6. 检查所有分类
  console.log('\n=== 所有分类列表 ===');
  const allCategories = await db.select().from(categories).orderBy(categories.id);
  allCategories.forEach(cat => {
    console.log(`ID: ${cat.id}, Name: ${cat.name}, Slug: ${cat.slug}, Parent: ${cat.parentId || 'NULL'}`);
  });
}

checkProductDistribution().then(() => {
  console.log('\n检查完成！');
  process.exit(0);
}).catch(err => {
  console.error('错误:', err);
  process.exit(1);
});
