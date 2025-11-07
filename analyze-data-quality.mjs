import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('\n=== 产品数据质量分析报告 ===\n');

// 1. 随机抽样检查
const brands = ['Agilent', 'Thermo Fisher Scientific', 'Waters', 'Phenomenex', 'Merck'];

for (const brand of brands) {
  const [products] = await connection.execute(
    'SELECT productId, name, partNumber, specifications, imageUrl FROM products WHERE brand = ? ORDER BY RAND() LIMIT 2',
    [brand]
  );
  
  console.log(`\n【${brand}】`);
  console.log('-'.repeat(80));
  
  products.forEach((p, i) => {
    console.log(`\n产品 ${i+1}:`);
    console.log(`  产品ID: ${p.productId || '❌ 缺失'}`);
    console.log(`  产品名称: ${p.name ? (p.name.length > 50 ? p.name.substring(0, 50) + '...' : p.name) : '❌ 缺失'}`);
    console.log(`  零件号: ${p.partNumber || '❌ 缺失'}`);
    const specs = p.specifications ? JSON.stringify(p.specifications).substring(0, 50) : null;
    console.log(`  规格: ${specs || '❌ 缺失'}`);
    console.log(`  图片: ${p.imageUrl ? '✓ 有' : '❌ 无'}`);
  });
}

// 2. 数据完整性统计
console.log('\n\n=== 数据完整性统计 ===\n');

const [stats] = await connection.execute(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN productId IS NULL OR productId = '' THEN 1 ELSE 0 END) as missing_productId,
    SUM(CASE WHEN name IS NULL OR name = '' THEN 1 ELSE 0 END) as missing_name,
    SUM(CASE WHEN partNumber IS NULL OR partNumber = '' THEN 1 ELSE 0 END) as missing_partNumber,
    SUM(CASE WHEN specifications IS NULL THEN 1 ELSE 0 END) as missing_specs,
    SUM(CASE WHEN imageUrl IS NULL OR imageUrl = '' THEN 1 ELSE 0 END) as missing_image,
    SUM(CASE WHEN description IS NULL OR description = '' THEN 1 ELSE 0 END) as missing_description
  FROM products
`);

const s = stats[0];
console.log(`总产品数: ${s.total}`);
console.log(`缺失产品ID: ${s.missing_productId} (${(s.missing_productId/s.total*100).toFixed(1)}%)`);
console.log(`缺失产品名称: ${s.missing_name} (${(s.missing_name/s.total*100).toFixed(1)}%)`);
console.log(`缺失零件号: ${s.missing_partNumber} (${(s.missing_partNumber/s.total*100).toFixed(1)}%)`);
console.log(`缺失规格: ${s.missing_specs} (${(s.missing_specs/s.total*100).toFixed(1)}%)`);
console.log(`缺失图片: ${s.missing_image} (${(s.missing_image/s.total*100).toFixed(1)}%)`);
console.log(`缺失描述: ${s.missing_description} (${(s.missing_description/s.total*100).toFixed(1)}%)`);

// 3. 品牌名称一致性检查
console.log('\n\n=== 品牌名称一致性检查 ===\n');

const [brandNames] = await connection.execute(`
  SELECT brand, COUNT(*) as count 
  FROM products 
  GROUP BY brand 
  ORDER BY brand
`);

console.log('发现的品牌名称变体:');
brandNames.forEach(b => {
  if (b.brand.includes('Thermo')) {
    console.log(`  ⚠️  ${b.brand}: ${b.count}个产品`);
  } else {
    console.log(`  ✓  ${b.brand}: ${b.count}个产品`);
  }
});

await connection.end();

console.log('\n\n=== 分析完成 ===\n');
