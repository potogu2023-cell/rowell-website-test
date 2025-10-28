import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { products } from './drizzle/schema';
import { eq } from 'drizzle-orm';

const sqlite = new Database(process.env.DATABASE_URL!.replace('file:', ''));
const db = drizzle(sqlite);

const csvFilePath = '/home/ubuntu/upload/product_image_urls_update.csv';

interface ProductImageUpdate {
  productId: string;
  partNumber: string;
  brand: string;
  productType: string;
  currentImageUrl: string;
  newImageUrl: string;
  imageDescription: string;
  imageSource: string;
  updatedAt: string;
}

async function main() {
  console.log('开始导入产品图片URL更新...');
  
  // 读取CSV文件
  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
  const records: ProductImageUpdate[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`读取到 ${records.length} 条记录`);

  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    
    if ((i + 1) % 100 === 0) {
      console.log(`进度: ${i + 1}/${records.length} (${((i + 1) / records.length * 100).toFixed(1)}%)`);
    }

    try {
      // 跳过newImageUrl为空的记录
      if (!record.newImageUrl || record.newImageUrl.trim() === '') {
        skippedCount++;
        continue;
      }

      // 跳过newImageUrl与currentImageUrl相同的记录（无需更新）
      if (record.newImageUrl === record.currentImageUrl) {
        skippedCount++;
        continue;
      }

      // 使用partNumber匹配产品
      const result = await db
        .update(products)
        .set({ 
          imageUrl: record.newImageUrl,
        })
        .where(eq(products.partNumber, record.partNumber))
        .execute();

      if (result.rowsAffected > 0) {
        successCount++;
      } else {
        console.warn(`未找到产品: ${record.partNumber}`);
        failCount++;
      }
    } catch (error) {
      console.error(`更新失败 (${record.partNumber}):`, error);
      failCount++;
    }
  }

  console.log('\n导入完成！');
  console.log(`总记录数: ${records.length}`);
  console.log(`成功更新: ${successCount}`);
  console.log(`跳过: ${skippedCount}`);
  console.log(`失败: ${failCount}`);
  
  // 统计各产品类型的图片URL分布
  console.log('\n验证各产品类型的图片URL分布...');
  const stats = await db.execute(`
    SELECT 
      CASE 
        WHEN imageUrl LIKE '%zebron-gc-column%' THEN 'GC Column (橙色毛细管柱)'
        WHEN imageUrl LIKE '%strata-cartridge%' THEN 'SPE Cartridge (白色注射器状)'
        WHEN imageUrl LIKE '%guard-column%' THEN 'Guard Column (短小保护柱)'
        WHEN imageUrl LIKE '%filter-membrane%' THEN 'Filtration (圆形滤膜)'
        WHEN imageUrl LIKE '%vial-cap%' THEN 'Chromatography Supply (样品瓶/耗材)'
        WHEN imageUrl LIKE '%Premium_horiz%' THEN 'HPLC Column (标准色谱柱)'
        ELSE '其他'
      END as imageType,
      COUNT(*) as count
    FROM products
    GROUP BY imageType
    ORDER BY count DESC
  `);
  
  console.log('\n图片类型分布:');
  console.table(stats.rows);
}

main().catch(console.error);

