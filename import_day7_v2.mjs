import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { products } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';

async function importDay7V2() {
  console.log('🚀 开始导入Day 7 V2数据到数据库\n');

  // 读取数据
  const dataFile = '/home/ubuntu/day7_v2_simplified.json';
  const rawData = fs.readFileSync(dataFile, 'utf-8');
  const productData = JSON.parse(rawData);

  console.log(`✅ 加载了${productData.length}个产品\n`);

  // 连接数据库
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  console.log('✅ 数据库连接成功\n');

  let imported = 0;
  let updated = 0;
  let errors = 0;

  // 批量导入
  for (let i = 0; i < productData.length; i++) {
    const product = productData[i];
    
    try {
      const productId = `${product.brand}-${product.partNumber}`;
      
      // 构建specifications JSON
      const specifications = {
        columnLength: product.columnLength,
        innerDiameter: product.innerDiameter,
        filmThickness: product.filmThickness,
        temperatureRange: product.temperatureRange,
        stationaryPhase: product.stationaryPhase,
        polarity: product.polarity,
        seriesName: product.seriesName,
        crawlBatch: 'Phase1.3_Day7_V2',
        crawlDate: '2025-11-17',
        dataVersion: 'v2.0'
      };

      // 检查是否已存在
      const existing = await db
        .select()
        .from(products)
        .where(eq(products.partNumber, product.partNumber))
        .limit(1);

      if (existing.length > 0) {
        // 更新
        await db
          .update(products)
          .set({
            productId: productId,
            brand: product.brand,
            prefix: product.seriesName,
            name: product.productName,
            description: product.applications.substring(0, 500),
            detailedDescription: `${product.stationaryPhase}. ${product.applications}`,
            specifications: JSON.stringify(specifications),
            columnLength: product.columnLength,
            innerDiameter: product.innerDiameter,
            maxTemperature: product.temperatureRange,
            applications: product.applications,
            phaseType: product.stationaryPhase,
            productType: 'GC Column',
            status: 'active',
            descriptionQuality: 'high'
          })
          .where(eq(products.partNumber, product.partNumber));
        
        updated++;
      } else {
        // 插入
        await db.insert(products).values({
          productId: productId,
          partNumber: product.partNumber,
          brand: product.brand,
          prefix: product.seriesName,
          name: product.productName,
          description: product.applications.substring(0, 500),
          detailedDescription: `${product.stationaryPhase}. ${product.applications}`,
          specifications: JSON.stringify(specifications),
          columnLength: product.columnLength,
          innerDiameter: product.innerDiameter,
          maxTemperature: product.temperatureRange,
          applications: product.applications,
          phaseType: product.stationaryPhase,
          productType: 'GC Column',
          status: 'active',
          descriptionQuality: 'high'
        });
        
        imported++;
      }

      // 每50个输出进度
      if ((imported + updated) % 50 === 0) {
        console.log(`   进度: ${imported + updated}/${productData.length}`);
      }
    } catch (error) {
      console.error(`   错误 [${product.partNumber}]:`, error.message);
      errors++;
    }
  }

  await connection.end();

  console.log('\n📊 导入统计:');
  console.log(`   新增: ${imported}个`);
  console.log(`   更新: ${updated}个`);
  console.log(`   错误: ${errors}个`);
  console.log(`   总计: ${productData.length}个`);
  console.log('\n✅ Day 7 V2数据导入完成！');
}

importDay7V2().catch(console.error);
