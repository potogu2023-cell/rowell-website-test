import { db } from './server/db';
import { products } from './drizzle/schema';
import { isNotNull } from 'drizzle-orm';
import { writeFileSync } from 'fs';

async function generateProductList() {
  console.log('正在查询数据库...');
  
  const allProducts = await db
    .select({
      id: products.id,
      productId: products.productId,
      partNumber: products.partNumber,
      brand: products.brand,
      name: products.name,
      catalogUrl: products.catalogUrl,
    })
    .from(products)
    .where(isNotNull(products.catalogUrl));
  
  console.log(`找到 ${allProducts.length} 个产品（有catalogUrl）`);
  
  // 生成CSV文件
  const csvHeader = 'id,productId,currentPartNumber,brand,name,catalogUrl,manufacturerPartNumber\n';
  const csvRows = allProducts.map(p => {
    const catalogUrl = p.catalogUrl || '';
    return `${p.id},"${p.productId}","${p.partNumber}","${p.brand}","${p.name?.replace(/"/g, '""') || ''}","${catalogUrl}",""`;
  }).join('\n');
  
  const csvContent = csvHeader + csvRows;
  writeFileSync('/home/ubuntu/products-for-crawler.csv', csvContent, 'utf-8');
  
  console.log('\n✅ CSV文件已生成: /home/ubuntu/products-for-crawler.csv');
  console.log(`   总产品数: ${allProducts.length}`);
  
  // 按品牌统计
  const brandCounts = allProducts.reduce((acc, p) => {
    acc[p.brand] = (acc[p.brand] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('\n品牌分布:');
  Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([brand, count]) => {
      console.log(`  ${brand}: ${count}个产品`);
    });
  
  console.log('\n说明:');
  console.log('- currentPartNumber: 当前数据库中的描述性Part Number');
  console.log('- manufacturerPartNumber: 需要爬虫填写的原厂Part Number（目前为空）');
  console.log('- 请使用爬虫访问catalogUrl，提取真实的原厂Part Number');
  console.log('- 将结果填入manufacturerPartNumber列，然后返回CSV文件');
  
  process.exit(0);
}

generateProductList().catch(console.error);
