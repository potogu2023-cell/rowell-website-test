const mysql = require('mysql2/promise');
const fs = require('fs');

async function exportAgilentProducts() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('导出Agilent产品清单...');
  console.log();
  
  // Query all Agilent products
  const [products] = await connection.query(`
    SELECT 
      id,
      productId,
      partNumber,
      brand,
      name,
      description,
      detailedDescription,
      specifications,
      particleSize,
      poreSize,
      columnLength,
      innerDiameter,
      phRange,
      maxTemperature,
      applications,
      catalogUrl,
      status
    FROM products 
    WHERE brand = 'Agilent'
    ORDER BY partNumber
  `);
  
  console.log(`✅ 查询到 ${products.length} 个Agilent产品`);
  console.log();
  
  // Analyze data quality
  let missingDescription = 0;
  let missingDetailedDescription = 0;
  let missingSpecifications = 0;
  let missingCatalogUrl = 0;
  
  products.forEach(p => {
    if (!p.description || p.description.trim() === '') missingDescription++;
    if (!p.detailedDescription || p.detailedDescription.trim() === '') missingDetailedDescription++;
    if (!p.specifications || p.specifications === null) missingSpecifications++;
    if (!p.catalogUrl || p.catalogUrl.trim() === '') missingCatalogUrl++;
  });
  
  console.log('📊 数据质量分析:');
  console.log(`   缺少description: ${missingDescription} (${(missingDescription/products.length*100).toFixed(1)}%)`);
  console.log(`   缺少detailedDescription: ${missingDetailedDescription} (${(missingDetailedDescription/products.length*100).toFixed(1)}%)`);
  console.log(`   缺少specifications: ${missingSpecifications} (${(missingSpecifications/products.length*100).toFixed(1)}%)`);
  console.log(`   缺少catalogUrl: ${missingCatalogUrl} (${(missingCatalogUrl/products.length*100).toFixed(1)}%)`);
  console.log();
  
  // Save to JSON
  const outputFile = '/home/ubuntu/AGILENT_PRODUCTS_FOR_VERIFICATION.json';
  fs.writeFileSync(outputFile, JSON.stringify(products, null, 2));
  console.log(`✅ 产品清单已保存到: ${outputFile}`);
  console.log();
  
  // Save summary
  const summary = {
    brand: 'Agilent',
    totalProducts: products.length,
    exportDate: new Date().toISOString(),
    dataQuality: {
      missingDescription: missingDescription,
      missingDetailedDescription: missingDetailedDescription,
      missingSpecifications: missingSpecifications,
      missingCatalogUrl: missingCatalogUrl
    },
    sampleProducts: products.slice(0, 5).map(p => ({
      partNumber: p.partNumber,
      name: p.name,
      hasDescription: p.description ? true : false,
      hasSpecifications: p.specifications ? true : false,
      hasCatalogUrl: p.catalogUrl ? true : false
    }))
  };
  
  fs.writeFileSync('/home/ubuntu/AGILENT_EXPORT_SUMMARY.json', JSON.stringify(summary, null, 2));
  
  await connection.end();
}

exportAgilentProducts().catch(console.error);
