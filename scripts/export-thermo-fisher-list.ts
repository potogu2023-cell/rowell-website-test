import { drizzle } from "drizzle-orm/mysql2";
import { products } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";

const db = drizzle(process.env.DATABASE_URL!);

async function exportThermoFisher() {
  console.log('=== 导出Thermo Fisher产品清单 ===\n');
  
  const thermoProducts = await db
    .select()
    .from(products)
    .where(eq(products.brand, 'Thermo Fisher Scientific'));
  
  console.log(`找到 ${thermoProducts.length} 个Thermo Fisher产品\n`);
  
  // Analyze current status
  const withDescription = thermoProducts.filter(p => p.description && p.description.length > 0).length;
  const withSpecs = thermoProducts.filter(p => p.specifications && p.specifications !== '{}').length;
  const noDescription = thermoProducts.filter(p => !p.description || p.description.length === 0);
  const noSpecs = thermoProducts.filter(p => !p.specifications || p.specifications === '{}');
  
  console.log('📊 当前状态:');
  console.log(`  有描述: ${withDescription}/${thermoProducts.length} (${(withDescription/thermoProducts.length*100).toFixed(1)}%)`);
  console.log(`  有规格: ${withSpecs}/${thermoProducts.length} (${(withSpecs/thermoProducts.length*100).toFixed(1)}%)`);
  console.log(`  缺描述: ${noDescription.length}`);
  console.log(`  缺规格: ${noSpecs.length}\n`);
  
  // Export all products
  const jsonData = thermoProducts.map(p => ({
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
  
  fs.writeFileSync('/home/ubuntu/thermo_fisher_products_list.json', JSON.stringify(jsonData, null, 2), 'utf-8');
  console.log('✅ JSON文件已生成: /home/ubuntu/thermo_fisher_products_list.json');
  
  // Export products that need data
  const needsData = jsonData.filter(p => p.needsDescription || p.needsSpecs);
  fs.writeFileSync(
    '/home/ubuntu/thermo_fisher_needs_data.json',
    JSON.stringify(needsData, null, 2),
    'utf-8'
  );
  console.log(`✅ 缺数据产品清单已生成: /home/ubuntu/thermo_fisher_needs_data.json (${needsData.length}个)`);
  
  process.exit(0);
}

exportThermoFisher().catch(console.error);
