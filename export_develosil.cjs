const { drizzle } = require('drizzle-orm/mysql2');
const { eq } = require('drizzle-orm');
const mysql = require('mysql2/promise');
const fs = require('fs');
const { products } = require('./drizzle/schema.js');

async function exportDevelosilProducts() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  console.log('正在导出Develosil产品...');
  
  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.brandName, 'Develosil'));

  console.log(`📦 总产品数: ${allProducts.length}个`);
  
  // 统计验证状态
  const statusCount = {};
  allProducts.forEach(p => {
    const status = p.verificationStatus || 'pending';
    statusCount[status] = (statusCount[status] || 0) + 1;
  });
  
  console.log('📊 验证状态分布:');
  Object.entries(statusCount).forEach(([status, count]) => {
    const percent = (count / allProducts.length * 100).toFixed(1);
    console.log(`   ${status}: ${count}个 (${percent}%)`);
  });
  
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
  
  console.log('📊 字段完整性:');
  Object.entries(fieldStats).forEach(([field, count]) => {
    const percent = (count / allProducts.length * 100).toFixed(1);
    console.log(`   ${field}: ${count}个 (${percent}%)`);
  });
  
  // 导出待验证产品
  const unverifiedProducts = allProducts.filter(p => 
    !p.verificationStatus || p.verificationStatus === 'pending'
  );
  
  console.log(`📊 待验证产品缺失字段统计:`);
  console.log(`   总数: ${unverifiedProducts.length}个`);
  
  const missingFields = {
    description: 0,
    detailedDescription: 0,
    specifications: 0,
    catalogUrl: 0
  };
  
  unverifiedProducts.forEach(p => {
    if (!p.description) missingFields.description++;
    if (!p.detailedDescription) missingFields.detailedDescription++;
    if (!p.specifications) missingFields.specifications++;
    if (!p.catalogUrl) missingFields.catalogUrl++;
  });
  
  Object.entries(missingFields).forEach(([field, count]) => {
    const percent = (count / unverifiedProducts.length * 100).toFixed(1);
    console.log(`   缺少${field}: ${count}个 (${percent}%)`);
  });
  
  // 保存待验证产品清单
  const exportData = unverifiedProducts.map(p => ({
    partNumber: p.partNumber,
    brandName: p.brandName,
    description: p.description || '',
    detailedDescription: p.detailedDescription || '',
    specifications: p.specifications || '',
    catalogUrl: p.catalogUrl || '',
    verificationStatus: p.verificationStatus || 'pending'
  }));
  
  fs.writeFileSync(
    '/home/ubuntu/DEVELOSIL_PRODUCTS_FOR_VERIFICATION.json',
    JSON.stringify(exportData, null, 2)
  );
  
  console.log(`✅ 待验证产品已保存到: /home/ubuntu/DEVELOSIL_PRODUCTS_FOR_VERIFICATION.json`);
  console.log(`   产品数量: ${exportData.length}个`);
  
  // 保存导出摘要
  const summary = {
    totalProducts: allProducts.length,
    verifiedProducts: statusCount.verified || 0,
    unverifiedProducts: unverifiedProducts.length,
    verificationRate: ((statusCount.verified || 0) / allProducts.length * 100).toFixed(1),
    fieldCompleteness: fieldStats,
    missingFieldsInUnverified: missingFields,
    exportDate: new Date().toISOString()
  };
  
  fs.writeFileSync(
    '/home/ubuntu/DEVELOSIL_EXPORT_SUMMARY.json',
    JSON.stringify(summary, null, 2)
  );
  
  console.log(`✅ 导出摘要已保存到: /home/ubuntu/DEVELOSIL_EXPORT_SUMMARY.json`);
  
  await connection.end();
  console.log('✅ 导出完成！');
}

exportDevelosilProducts().catch(console.error);
