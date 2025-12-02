import { drizzle } from 'drizzle-orm/mysql2';
import { eq, sql } from 'drizzle-orm';
import mysql from 'mysql2/promise';
import * as fs from 'fs';
import { products } from './drizzle/schema.js';

async function analyzeAllBrands() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);

  console.log('📊 正在分析所有品牌数据...\n');
  
  // 获取所有品牌列表
  const brandsResult = await db
    .select({ brand: products.brand })
    .from(products)
    .groupBy(products.brand);
  
  const brands = brandsResult.map(r => r.brand);
  console.log(`发现 ${brands.length} 个品牌\n`);
  
  const brandAnalysis: any[] = [];
  
  for (const brand of brands) {
    console.log(`分析品牌: ${brand}...`);
    
    const allProducts = await db
      .select()
      .from(products)
      .where(eq(products.brand, brand));
    
    const total = allProducts.length;
    
    // 统计验证状态
    const statusCount: Record<string, number> = {};
    allProducts.forEach(p => {
      const status = p.status || 'new';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    const verified = statusCount.verified || 0;
    const verificationRate = (verified / total * 100).toFixed(1);
    
    // 统计字段完整性
    const fieldStats = {
      description: 0,
      detailedDescription: 0,
      specifications: 0,
      catalogUrl: 0,
      imageUrl: 0
    };
    
    allProducts.forEach(p => {
      if (p.description) fieldStats.description++;
      if (p.detailedDescription) fieldStats.detailedDescription++;
      if (p.specifications) fieldStats.specifications++;
      if (p.catalogUrl) fieldStats.catalogUrl++;
      if (p.imageUrl) fieldStats.imageUrl++;
    });
    
    brandAnalysis.push({
      brand,
      totalProducts: total,
      verified: verified,
      verificationRate: parseFloat(verificationRate),
      statusDistribution: statusCount,
      fieldCompleteness: {
        description: ((fieldStats.description / total) * 100).toFixed(1),
        detailedDescription: ((fieldStats.detailedDescription / total) * 100).toFixed(1),
        specifications: ((fieldStats.specifications / total) * 100).toFixed(1),
        catalogUrl: ((fieldStats.catalogUrl / total) * 100).toFixed(1),
        imageUrl: ((fieldStats.imageUrl / total) * 100).toFixed(1)
      }
    });
    
    console.log(`  总产品: ${total}个`);
    console.log(`  已验证: ${verified}个 (${verificationRate}%)`);
    console.log('');
  }
  
  // 计算整体统计
  const totalProducts = brandAnalysis.reduce((sum, b) => sum + b.totalProducts, 0);
  const totalVerified = brandAnalysis.reduce((sum, b) => sum + b.verified, 0);
  const overallRate = ((totalVerified / totalProducts) * 100).toFixed(1);
  
  const summary = {
    totalBrands: brands.length,
    totalProducts,
    totalVerified,
    overallVerificationRate: parseFloat(overallRate),
    brands: brandAnalysis.sort((a, b) => b.totalProducts - a.totalProducts),
    analysisDate: new Date().toISOString()
  };
  
  fs.writeFileSync(
    '/home/ubuntu/ALL_BRANDS_ANALYSIS.json',
    JSON.stringify(summary, null, 2)
  );
  
  console.log('='.repeat(60));
  console.log('📊 整体统计');
  console.log('='.repeat(60));
  console.log(`总品牌数: ${brands.length}个`);
  console.log(`总产品数: ${totalProducts}个`);
  console.log(`已验证产品: ${totalVerified}个`);
  console.log(`整体验证覆盖率: ${overallRate}%`);
  console.log('');
  console.log('✅ 分析结果已保存到: /home/ubuntu/ALL_BRANDS_ANALYSIS.json');
  
  await connection.end();
}

analyzeAllBrands().catch(console.error);
