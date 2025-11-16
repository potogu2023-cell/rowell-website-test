import { drizzle } from "drizzle-orm/mysql2";
import { products } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function analyzeOverallStatus() {
  console.log('=== 整体数据库状态分析 ===\n');
  
  // Get all products
  const allProducts = await db.select().from(products);
  const totalProducts = allProducts.length;
  
  console.log(`📊 总产品数: ${totalProducts}\n`);
  
  // Overall coverage
  const withDescription = allProducts.filter(p => p.description && p.description.length > 0).length;
  const withSpecs = allProducts.filter(p => p.specifications && p.specifications !== '{}').length;
  const verified = allProducts.filter(p => p.status === 'verified').length;
  
  console.log('📈 整体覆盖率:');
  console.log(`  描述覆盖率: ${withDescription}/${totalProducts} (${(withDescription/totalProducts*100).toFixed(1)}%)`);
  console.log(`  规格覆盖率: ${withSpecs}/${totalProducts} (${(withSpecs/totalProducts*100).toFixed(1)}%)`);
  console.log(`  验证覆盖率: ${verified}/${totalProducts} (${(verified/totalProducts*100).toFixed(1)}%)`);
  
  // By brand
  console.log('\n📊 按品牌统计:\n');
  
  const brands = [...new Set(allProducts.map(p => p.brand))].filter(b => b);
  
  for (const brand of brands.sort()) {
    const brandProducts = allProducts.filter(p => p.brand === brand);
    const brandWithDesc = brandProducts.filter(p => p.description && p.description.length > 0).length;
    const brandWithSpecs = brandProducts.filter(p => p.specifications && p.specifications !== '{}').length;
    const brandVerified = brandProducts.filter(p => p.status === 'verified').length;
    
    console.log(`${brand}:`);
    console.log(`  总数: ${brandProducts.length}`);
    console.log(`  描述: ${brandWithDesc}/${brandProducts.length} (${(brandWithDesc/brandProducts.length*100).toFixed(1)}%)`);
    console.log(`  规格: ${brandWithSpecs}/${brandProducts.length} (${(brandWithSpecs/brandProducts.length*100).toFixed(1)}%)`);
    console.log(`  验证: ${brandVerified}/${brandProducts.length} (${(brandVerified/brandProducts.length*100).toFixed(1)}%)`);
    console.log('');
  }
  
  // By status
  console.log('📊 按状态统计:\n');
  const statusCounts: Record<string, number> = {};
  allProducts.forEach(p => {
    const status = p.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  
  Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
    const percentage = (count / totalProducts * 100).toFixed(1);
    console.log(`  ${status}: ${count} (${percentage}%)`);
  });
  
  // Progress summary
  console.log('\n=== 进度总结 ===\n');
  console.log(`✅ 已验证品牌: Shimadzu (76.9%), Waters (14.1%)`);
  console.log(`⏳ 待验证品牌: Merck, Thermo Fisher, Daicel, Phenomenex, Restek, Agilent, 等`);
  console.log(`📊 整体验证进度: ${(verified/totalProducts*100).toFixed(1)}%`);
  console.log(`🎯 目标: 100%验证覆盖率`);
  
  process.exit(0);
}

analyzeOverallStatus().catch(console.error);
