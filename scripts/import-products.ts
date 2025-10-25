#!/usr/bin/env tsx
/**
 * 导入产品数据到数据库
 */
import { readFileSync } from 'fs';
import { getDb } from '../server/db';
import { products } from '../drizzle/schema';

interface ProductData {
  productId: string;
  originalProductId: string;
  name: string;
  brand: string;
  series: string | null;
  description: string | null;
  specifications: string | null;
  applications: string | null;
  category: string;
}

async function importProducts() {
  console.log('开始导入产品数据...\n');
  
  // 读取产品数据
  const productsData: ProductData[] = JSON.parse(
    readFileSync('/home/ubuntu/final_products.json', 'utf-8')
  );
  
  console.log(`共有 ${productsData.length} 个产品待导入\n`);
  
  const db = getDb();
  
  // 批量导入（每次 100 个）
  const batchSize = 100;
  let imported = 0;
  let failed = 0;
  const brandCounts: Record<string, number> = {};
  
  for (let i = 0; i < productsData.length; i += batchSize) {
    const batch = productsData.slice(i, i + batchSize);
    
    try {
      await db.insert(products).values(
        batch.map(p => ({
          productId: p.productId,
          name: p.name,
          brand: p.brand,
          series: p.series,
          description: p.description,
          specifications: p.specifications,
          applications: p.applications,
          category: p.category,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      );
      
      imported += batch.length;
      
      // 统计各品牌数量
      batch.forEach(p => {
        brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
      });
      
      console.log(`已导入 ${imported}/${productsData.length} 个产品...`);
    } catch (error) {
      console.error(`批次 ${i}-${i + batch.length} 导入失败:`, error);
      failed += batch.length;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('产品导入完成！');
  console.log('='.repeat(60));
  console.log(`\n成功导入: ${imported} 个产品`);
  console.log(`导入失败: ${failed} 个产品`);
  console.log('\n各品牌产品数:');
  
  Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([brand, count]) => {
      console.log(`  ${brand}: ${count}`);
    });
  
  process.exit(0);
}

importProducts().catch(error => {
  console.error('导入失败:', error);
  process.exit(1);
});

