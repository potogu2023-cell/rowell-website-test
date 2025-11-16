import { drizzle } from "drizzle-orm/mysql2";
import { products } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";

const db = drizzle(process.env.DATABASE_URL!);

async function exportShimadzuProducts() {
  console.log('=== 导出Shimadzu产品清单 ===\n');
  
  const shimadzuProducts = await db
    .select({
      id: products.id,
      productId: products.productId,
      partNumber: products.partNumber,
      name: products.name,
      brand: products.brand,
      hasDescription: products.description,
      hasSpecs: products.specifications,
      catalogUrl: products.catalogUrl,
      imageUrl: products.imageUrl,
    })
    .from(products)
    .where(eq(products.brand, 'Shimadzu'));
  
  console.log(`找到 ${shimadzuProducts.length} 个Shimadzu产品\n`);
  
  // Count stats
  const withDesc = shimadzuProducts.filter(p => p.hasDescription && p.hasDescription.length > 0).length;
  const withSpecs = shimadzuProducts.filter(p => p.hasSpecs && p.hasSpecs !== '{}').length;
  
  console.log(`描述覆盖率: ${withDesc}/${shimadzuProducts.length} (${(withDesc/shimadzuProducts.length*100).toFixed(1)}%)`);
  console.log(`规格覆盖率: ${withSpecs}/${shimadzuProducts.length} (${(withSpecs/shimadzuProducts.length*100).toFixed(1)}%)\n`);
  
  // Export to CSV
  const csvHeader = 'id,productId,partNumber,name,hasDescription,hasSpecs,catalogUrl,imageUrl\n';
  const csvRows = shimadzuProducts.map(p => 
    `${p.id},"${p.productId}","${p.partNumber}","${p.name?.replace(/"/g, '""') || ''}",${p.hasDescription ? 'YES' : 'NO'},${p.hasSpecs && p.hasSpecs !== '{}' ? 'YES' : 'NO'},"${p.catalogUrl || ''}","${p.imageUrl || ''}"`
  ).join('\n');
  
  const csvContent = csvHeader + csvRows;
  fs.writeFileSync('/home/ubuntu/shimadzu_products_list.csv', csvContent, 'utf-8');
  
  console.log('✅ CSV文件已生成: /home/ubuntu/shimadzu_products_list.csv');
  
  // Export to JSON for easier processing
  const jsonData = shimadzuProducts.map(p => ({
    id: p.id,
    productId: p.productId,
    partNumber: p.partNumber,
    name: p.name,
    hasDescription: !!p.hasDescription && p.hasDescription.length > 0,
    hasSpecs: !!p.hasSpecs && p.hasSpecs !== '{}',
    catalogUrl: p.catalogUrl,
    imageUrl: p.imageUrl,
  }));
  
  fs.writeFileSync('/home/ubuntu/shimadzu_products_list.json', JSON.stringify(jsonData, null, 2), 'utf-8');
  
  console.log('✅ JSON文件已生成: /home/ubuntu/shimadzu_products_list.json');
  
  process.exit(0);
}

exportShimadzuProducts().catch(console.error);
