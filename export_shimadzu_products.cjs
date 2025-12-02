const mysql = require('mysql2/promise');
const fs = require('fs');

async function exportShimadzuProducts() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('=' .repeat(80));
  console.log('Shimadzu产品导出');
  console.log('=' .repeat(80));
  console.log();
  
  // Query all Shimadzu products
  const [products] = await connection.query(
    `SELECT 
      id as productId,
      partNumber,
      brand,
      name,
      description,
      detailedDescription,
      specifications,
      catalogUrl,
      imageUrl,
      status,
      createdAt,
      updatedAt
    FROM products 
    WHERE brand = 'Shimadzu'
    ORDER BY partNumber`,
    []
  );
  
  console.log(`📦 总产品数: ${products.length}个`);
  console.log();
  
  // Analyze data quality
  const stats = {
    total: products.length,
    verified: 0,
    pending: 0,
    not_found: 0,
    discontinued: 0,
    hasDescription: 0,
    hasDetailedDescription: 0,
    hasSpecifications: 0,
    hasCatalogUrl: 0,
    hasImageUrl: 0
  };
  
  const unverifiedProducts = [];
  
  products.forEach(product => {
    // Count by status
    if (product.status === 'verified') {
      stats.verified++;
    } else if (product.status === 'not_found') {
      stats.not_found++;
    } else if (product.status === 'discontinued') {
      stats.discontinued++;
    } else {
      stats.pending++;
      unverifiedProducts.push(product);
    }
    
    // Count field completeness
    if (product.description) stats.hasDescription++;
    if (product.detailedDescription) stats.hasDetailedDescription++;
    if (product.specifications) stats.hasSpecifications++;
    if (product.catalogUrl) stats.hasCatalogUrl++;
    if (product.imageUrl) stats.hasImageUrl++;
  });
  
  console.log('📊 验证状态分布:');
  console.log(`   verified: ${stats.verified}个 (${(stats.verified/stats.total*100).toFixed(1)}%)`);
  console.log(`   pending: ${stats.pending}个 (${(stats.pending/stats.total*100).toFixed(1)}%)`);
  console.log(`   not_found: ${stats.not_found}个 (${(stats.not_found/stats.total*100).toFixed(1)}%)`);
  console.log(`   discontinued: ${stats.discontinued}个 (${(stats.discontinued/stats.total*100).toFixed(1)}%)`);
  console.log();
  
  console.log('📊 字段完整性:');
  console.log(`   description: ${stats.hasDescription}个 (${(stats.hasDescription/stats.total*100).toFixed(1)}%)`);
  console.log(`   detailedDescription: ${stats.hasDetailedDescription}个 (${(stats.hasDetailedDescription/stats.total*100).toFixed(1)}%)`);
  console.log(`   specifications: ${stats.hasSpecifications}个 (${(stats.hasSpecifications/stats.total*100).toFixed(1)}%)`);
  console.log(`   catalogUrl: ${stats.hasCatalogUrl}个 (${(stats.hasCatalogUrl/stats.total*100).toFixed(1)}%)`);
  console.log(`   imageUrl: ${stats.hasImageUrl}个 (${(stats.hasImageUrl/stats.total*100).toFixed(1)}%)`);
  console.log();
  
  // Calculate missing fields for unverified products
  const unverifiedStats = {
    total: unverifiedProducts.length,
    missingDescription: 0,
    missingDetailedDescription: 0,
    missingSpecifications: 0,
    missingCatalogUrl: 0
  };
  
  unverifiedProducts.forEach(product => {
    if (!product.description) unverifiedStats.missingDescription++;
    if (!product.detailedDescription) unverifiedStats.missingDetailedDescription++;
    if (!product.specifications) unverifiedStats.missingSpecifications++;
    if (!product.catalogUrl) unverifiedStats.missingCatalogUrl++;
  });
  
  console.log('📊 待验证产品缺失字段统计:');
  console.log(`   总数: ${unverifiedStats.total}个`);
  console.log(`   缺少description: ${unverifiedStats.missingDescription}个 (${(unverifiedStats.missingDescription/unverifiedStats.total*100).toFixed(1)}%)`);
  console.log(`   缺少detailedDescription: ${unverifiedStats.missingDetailedDescription}个 (${(unverifiedStats.missingDetailedDescription/unverifiedStats.total*100).toFixed(1)}%)`);
  console.log(`   缺少specifications: ${unverifiedStats.missingSpecifications}个 (${(unverifiedStats.missingSpecifications/unverifiedStats.total*100).toFixed(1)}%)`);
  console.log(`   缺少catalogUrl: ${unverifiedStats.missingCatalogUrl}个 (${(unverifiedStats.missingCatalogUrl/unverifiedStats.total*100).toFixed(1)}%)`);
  console.log();
  
  // Save unverified products to JSON
  fs.writeFileSync(
    '/home/ubuntu/SHIMADZU_PRODUCTS_FOR_VERIFICATION.json',
    JSON.stringify(unverifiedProducts, null, 2)
  );
  
  console.log(`✅ 待验证产品已保存到: /home/ubuntu/SHIMADZU_PRODUCTS_FOR_VERIFICATION.json`);
  console.log(`   产品数量: ${unverifiedProducts.length}个`);
  console.log();
  
  // Save summary
  const summary = {
    exportDate: new Date().toISOString(),
    brand: 'Shimadzu',
    totalProducts: stats.total,
    verifiedProducts: stats.verified,
    unverifiedProducts: unverifiedStats.total,
    statusDistribution: {
      verified: stats.verified,
      pending: stats.pending,
      not_found: stats.not_found,
      discontinued: stats.discontinued
    },
    fieldCompleteness: {
      description: stats.hasDescription,
      detailedDescription: stats.hasDetailedDescription,
      specifications: stats.hasSpecifications,
      catalogUrl: stats.hasCatalogUrl,
      imageUrl: stats.hasImageUrl
    },
    unverifiedMissingFields: {
      description: unverifiedStats.missingDescription,
      detailedDescription: unverifiedStats.missingDetailedDescription,
      specifications: unverifiedStats.missingSpecifications,
      catalogUrl: unverifiedStats.missingCatalogUrl
    }
  };
  
  fs.writeFileSync(
    '/home/ubuntu/SHIMADZU_EXPORT_SUMMARY.json',
    JSON.stringify(summary, null, 2)
  );
  
  console.log(`✅ 导出摘要已保存到: /home/ubuntu/SHIMADZU_EXPORT_SUMMARY.json`);
  console.log();
  
  await connection.end();
  
  return summary;
}

exportShimadzuProducts()
  .then(summary => {
    console.log('✅ 导出完成！');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 导出失败:', error);
    process.exit(1);
  });
