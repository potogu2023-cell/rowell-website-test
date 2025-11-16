import { drizzle } from "drizzle-orm/mysql2";
import { products } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";

const db = drizzle(process.env.DATABASE_URL!);

async function exportDaicelProducts() {
  console.log('=== 导出Daicel产品清单 ===\n');
  
  const daicelProducts = await db
    .select({
      id: products.id,
      productId: products.productId,
      partNumber: products.partNumber,
      name: products.name,
      brand: products.brand,
      description: products.description,
      specifications: products.specifications,
      catalogUrl: products.catalogUrl,
      imageUrl: products.imageUrl,
      status: products.status,
    })
    .from(products)
    .where(eq(products.brand, 'Daicel'));
  
  console.log(`找到 ${daicelProducts.length} 个Daicel产品\n`);
  
  // Analyze current status
  const withDescription = daicelProducts.filter(p => p.description && p.description.length > 0).length;
  const withSpecs = daicelProducts.filter(p => p.specifications && p.specifications !== '{}').length;
  const noDescription = daicelProducts.filter(p => !p.description || p.description.length === 0);
  const noSpecs = daicelProducts.filter(p => !p.specifications || p.specifications === '{}');
  
  console.log('📊 当前状态:');
  console.log(`  有描述: ${withDescription}/${daicelProducts.length} (${(withDescription/daicelProducts.length*100).toFixed(1)}%)`);
  console.log(`  有规格: ${withSpecs}/${daicelProducts.length} (${(withSpecs/daicelProducts.length*100).toFixed(1)}%)`);
  console.log(`  缺描述: ${noDescription.length}`);
  console.log(`  缺规格: ${noSpecs.length}\n`);
  
  // Export all products to JSON
  const jsonData = daicelProducts.map(p => ({
    id: p.id,
    productId: p.productId,
    partNumber: p.partNumber,
    name: p.name,
    hasDescription: !!p.description && p.description.length > 0,
    hasSpecs: !!p.specifications && p.specifications !== '{}',
    catalogUrl: p.catalogUrl,
    imageUrl: p.imageUrl,
    status: p.status,
    needsDescription: !p.description || p.description.length === 0,
    needsSpecs: !p.specifications || p.specifications === '{}',
  }));
  
  fs.writeFileSync('/home/ubuntu/daicel_products_list.json', JSON.stringify(jsonData, null, 2), 'utf-8');
  console.log('✅ JSON文件已生成: /home/ubuntu/daicel_products_list.json');
  
  // Export to CSV
  const csvHeader = 'id,productId,partNumber,name,hasDescription,hasSpecs,needsDescription,needsSpecs,catalogUrl,imageUrl\n';
  const csvRows = jsonData.map(p => 
    `${p.id},"${p.productId}","${p.partNumber}","${p.name?.replace(/"/g, '""') || ''}",${p.hasDescription ? 'YES' : 'NO'},${p.hasSpecs ? 'YES' : 'NO'},${p.needsDescription ? 'YES' : 'NO'},${p.needsSpecs ? 'YES' : 'NO'},"${p.catalogUrl || ''}","${p.imageUrl || ''}"`
  ).join('\n');
  
  const csvContent = csvHeader + csvRows;
  fs.writeFileSync('/home/ubuntu/daicel_products_list.csv', csvContent, 'utf-8');
  console.log('✅ CSV文件已生成: /home/ubuntu/daicel_products_list.csv');
  
  // Export products that need description/specs
  const needsData = jsonData.filter(p => p.needsDescription || p.needsSpecs);
  fs.writeFileSync(
    '/home/ubuntu/daicel_needs_data.json',
    JSON.stringify(needsData, null, 2),
    'utf-8'
  );
  console.log(`✅ 缺数据产品清单已生成: /home/ubuntu/daicel_needs_data.json (${needsData.length}个)`);
  
  process.exit(0);
}

exportDaicelProducts().catch(console.error);
