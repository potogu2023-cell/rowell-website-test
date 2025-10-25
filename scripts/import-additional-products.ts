import { getDb } from '../server/db';
import * as schema from '../drizzle/schema';
import fs from 'fs';
import path from 'path';

async function importAdditionalProducts() {
  const db = await getDb();
  
  // 读取补充产品数据
  const productsPath = path.join('/home/ubuntu', 'additional_products.json');
  const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
  
  console.log(`📦 准备导入 ${productsData.length} 个补充产品...`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const product of productsData) {
    try {
      // 生成 partNumber
      let partNumber = product.originalProductId || 'N/A';
      if (!partNumber || partNumber === 'N/A') {
        partNumber = `${product.brand}-${product.name.substring(0, 20)}`;
      }
      
      // 准备描述信息
      const description = `Series: ${product.series || ''} | ${product.description || ''} | Specifications: ${product.specifications || ''} | Applications: ${product.applications || ''}`;
      
      // 插入产品
      await db.insert(schema.products).values({
        productId: product.productId,
        partNumber: partNumber,
        brand: product.brand,
        prefix: '', // 留空避免长度问题
        name: product.name,
        description: description,
        status: 'active',
      });
      
      successCount++;
      
      if (successCount % 10 === 0) {
        console.log(`✅ 已导入 ${successCount} 个产品...`);
      }
    } catch (error: any) {
      if (error.message && error.message.includes('Duplicate entry')) {
        // 忽略重复错误
        failCount++;
      } else {
        console.error(`❌ 导入失败: ${product.productId} - ${error.message}`);
        failCount++;
      }
    }
  }
  
  console.log(`\n🎉 导入完成!`);
  console.log(`   成功: ${successCount} 个`);
  console.log(`   失败: ${failCount} 个`);
  console.log(`   总计: ${productsData.length} 个`);
}

importAdditionalProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('导入失败:', error);
    process.exit(1);
  });

