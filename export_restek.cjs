const mysql = require('mysql2/promise');
const fs = require('fs');

async function exportRestek() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('导出Restek产品清单...');
  
  const [products] = await connection.query(
    'SELECT * FROM products WHERE brand = "Restek" ORDER BY partNumber'
  );
  
  console.log(`✅ 导出 ${products.length} 个Restek产品`);
  
  // Save to JSON
  fs.writeFileSync(
    '/home/ubuntu/RESTEK_PRODUCTS_FOR_VERIFICATION.json',
    JSON.stringify(products, null, 2)
  );
  
  // Analyze data quality
  const missingDescription = products.filter(p => !p.description || p.description === '').length;
  const missingDetailedDesc = products.filter(p => !p.detailedDescription || p.detailedDescription === '').length;
  const missingSpecs = products.filter(p => !p.specifications || p.specifications === '').length;
  const missingCatalogUrl = products.filter(p => !p.catalogUrl || p.catalogUrl === '').length;
  
  const verified = products.filter(p => p.status === 'verified').length;
  const unverified = products.filter(p => !p.status || p.status === '').length;
  const other = products.filter(p => p.status && p.status !== 'verified' && p.status !== '').length;
  
  const analysis = {
    totalProducts: products.length,
    missingFields: {
      description: missingDescription,
      detailedDescription: missingDetailedDesc,
      specifications: missingSpecs,
      catalogUrl: missingCatalogUrl,
    },
    verificationStatus: {
      verified: verified,
      unverified: unverified,
      other: other,
    },
    sampleProducts: products.slice(0, 5).map(p => ({
      partNumber: p.partNumber,
      name: p.name,
      description: p.description ? 'Yes' : 'No',
      detailedDescription: p.detailedDescription ? 'Yes' : 'No',
      catalogUrl: p.catalogUrl ? 'Yes' : 'No',
      status: p.status || 'unverified'
    }))
  };
  
  fs.writeFileSync(
    '/home/ubuntu/RESTEK_EXPORT_SUMMARY.json',
    JSON.stringify(analysis, null, 2)
  );
  
  console.log('');
  console.log('数据质量分析:');
  console.log(`  缺少description: ${missingDescription}个 (${(missingDescription/products.length*100).toFixed(1)}%)`);
  console.log(`  缺少detailedDescription: ${missingDetailedDesc}个 (${(missingDetailedDesc/products.length*100).toFixed(1)}%)`);
  console.log(`  缺少specifications: ${missingSpecs}个 (${(missingSpecs/products.length*100).toFixed(1)}%)`);
  console.log(`  缺少catalogUrl: ${missingCatalogUrl}个 (${(missingCatalogUrl/products.length*100).toFixed(1)}%)`);
  console.log('');
  console.log('验证状态:');
  console.log(`  verified: ${verified}个`);
  console.log(`  unverified: ${unverified}个`);
  console.log(`  other: ${other}个`);
  console.log('');
  console.log('✅ 导出完成！');
  console.log('   产品清单: /home/ubuntu/RESTEK_PRODUCTS_FOR_VERIFICATION.json');
  console.log('   分析摘要: /home/ubuntu/RESTEK_EXPORT_SUMMARY.json');
  
  await connection.end();
}

exportRestek().catch(console.error);
