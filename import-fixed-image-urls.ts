import { drizzle } from 'drizzle-orm/mysql2';
import { products } from './drizzle/schema.js';
import { eq, sql } from 'drizzle-orm';
import * as fs from 'fs';
import csv from 'csv-parser';

/**
 * 导入修复后的产品图片URL到数据库
 */

interface ProductUpdate {
  productId: string;
  imageUrl: string;
  catalogUrl: string;
  technicalDocUrl: string;
  specifications: string;
}

async function main() {
  const csvFile = '/home/ubuntu/product_details_update_fixed.csv';
  
  console.log('开始导入修复后的图片URL...');
  console.log(`CSV文件: ${csvFile}`);

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const db = drizzle(process.env.DATABASE_URL);

  const updates: ProductUpdate[] = [];

  // 读取CSV文件
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFile)
      .pipe(csv())
      .on('data', (row) => {
        updates.push({
          productId: row.productId,
          imageUrl: row.imageUrl,
          catalogUrl: row.catalogUrl,
          technicalDocUrl: row.technicalDocUrl,
          specifications: row.specifications,
        });
      })
      .on('end', () => {
        console.log(`CSV文件读取完成，共 ${updates.length} 条记录`);
        resolve();
      })
      .on('error', reject);
  });

  console.log('\n开始更新数据库...');
  
  let successCount = 0;
  let failCount = 0;
  let notFoundCount = 0;

  for (let i = 0; i < updates.length; i++) {
    const update = updates[i];
    
    if ((i + 1) % 500 === 0) {
      console.log(`进度: ${i + 1}/${updates.length} (${((i + 1) / updates.length * 100).toFixed(1)}%)`);
    }

    try {
      // 通过productId匹配（productId格式：BRAND-PARTNUMBER）
      // 从productId中提取partNumber
      const partNumber = update.productId.split('-').slice(1).join('-');
      
      // 更新产品
      const result = await db
        .update(products)
        .set({
          imageUrl: update.imageUrl,
          catalogUrl: update.catalogUrl,
          technicalDocUrl: update.technicalDocUrl,
        })
        .where(eq(products.partNumber, partNumber));

      successCount++;
    } catch (error) {
      failCount++;
      if (failCount <= 10) {
        console.error(`错误: 更新失败 - ${update.productId}`, error);
      }
    }
  }

  console.log('\n导入完成！');
  console.log(`成功: ${successCount}`);
  console.log(`失败: ${failCount}`);
  console.log(`总计: ${updates.length}`);

  // 验证导入结果
  console.log('\n验证导入结果...');
  
  const allProducts = await db.select().from(products);
  console.log(`数据库中总产品数: ${allProducts.length}`);

  const productsWithImages = allProducts.filter(p => p.imageUrl && p.imageUrl.trim() !== '');
  const withImages = productsWithImages.length;
  const withoutImages = allProducts.length - withImages;
  
  console.log(`有图片的产品: ${withImages} (${(withImages / allProducts.length * 100).toFixed(1)}%)`);
  console.log(`无图片的产品: ${withoutImages} (${(withoutImages / allProducts.length * 100).toFixed(1)}%)`);

  // 统计不同图片URL的使用情况
  console.log('\n图片URL分布（前10个）:');
  const urlCounts: Record<string, number> = {};
  for (const product of productsWithImages) {
    if (product.imageUrl) {
      urlCounts[product.imageUrl] = (urlCounts[product.imageUrl] || 0) + 1;
    }
  }

  const sortedUrls = Object.entries(urlCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  for (const [url, count] of sortedUrls) {
    const percentage = (count / allProducts.length * 100).toFixed(1);
    const shortUrl = url.length > 80 ? url.substring(0, 77) + '...' : url;
    console.log(`  ${count} (${percentage}%) - ${shortUrl}`);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('导入失败:', error);
  process.exit(1);
});

