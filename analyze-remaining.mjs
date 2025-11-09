import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Get all brands with product counts
const [brands] = await connection.execute(`
  SELECT 
    brand,
    COUNT(*) as total_products,
    SUM(CASE WHEN description IS NOT NULL AND description != '' THEN 1 ELSE 0 END) as with_description,
    SUM(CASE WHEN specifications IS NOT NULL AND specifications != '{}' THEN 1 ELSE 0 END) as with_specs,
    SUM(CASE WHEN imageUrl IS NOT NULL AND imageUrl != '' THEN 1 ELSE 0 END) as with_image,
    SUM(CASE WHEN catalogUrl IS NOT NULL AND catalogUrl != '' THEN 1 ELSE 0 END) as with_catalog,
    SUM(CASE WHEN updatedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as updated_last_week
  FROM products
  GROUP BY brand
  ORDER BY total_products DESC
`);

console.log('='.repeat(120));
console.log('REMAINING PRODUCTS ANALYSIS');
console.log('='.repeat(120));
console.log('\nBrand Statistics:\n');

let totalProducts = 0;
let crawledProducts = 0;
let remainingProducts = 0;

const crawledBrands = ['Agilent', 'Waters', 'Thermo Fisher Scientific', 'Daicel'];

brands.forEach(row => {
  const isCrawled = crawledBrands.includes(row.brand);
  const descCoverage = ((row.with_description / row.total_products) * 100).toFixed(1);
  const specsCoverage = ((row.with_specs / row.total_products) * 100).toFixed(1);
  const imageCoverage = ((row.with_image / row.total_products) * 100).toFixed(1);
  
  console.log(`${isCrawled ? '✅' : '⚠️ '} ${row.brand}`);
  console.log(`   Total: ${row.total_products} products`);
  console.log(`   Description: ${row.with_description}/${row.total_products} (${descCoverage}%)`);
  console.log(`   Specifications: ${row.with_specs}/${row.total_products} (${specsCoverage}%)`);
  console.log(`   Images: ${row.with_image}/${row.total_products} (${imageCoverage}%)`);
  console.log(`   Catalog URLs: ${row.with_catalog}/${row.total_products}`);
  console.log(`   Updated last week: ${row.updated_last_week}`);
  console.log();
  
  totalProducts += row.total_products;
  if (isCrawled) {
    crawledProducts += row.total_products;
  } else {
    remainingProducts += row.total_products;
  }
});

console.log('='.repeat(120));
console.log('\nSUMMARY:\n');
console.log(`Total products in database: ${totalProducts}`);
console.log(`Crawled brands (4): ${crawledProducts} products (${((crawledProducts/totalProducts)*100).toFixed(1)}%)`);
console.log(`Remaining brands (7): ${remainingProducts} products (${((remainingProducts/totalProducts)*100).toFixed(1)}%)`);
console.log(`\nCrawled brands: ${crawledBrands.join(', ')}`);console.log(`Remaining brands: ${brands.filter(b => !crawledBrands.includes(b.brand)).map(b => b.brand).join(', ')}`);
console.log('='.repeat(120));

await connection.end();
