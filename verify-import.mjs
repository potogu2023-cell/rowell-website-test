import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Count total products
const [totalResult] = await connection.execute('SELECT COUNT(*) as count FROM products');
console.log(`Total products: ${totalResult[0].count}`);

// Count by brand
const [brandCounts] = await connection.execute(`
  SELECT brand, COUNT(*) as count 
  FROM products 
  GROUP BY brand 
  ORDER BY count DESC
`);

console.log('\nProducts by brand:');
brandCounts.forEach(row => {
  console.log(`  ${row.brand}: ${row.count}`);
});

// Count newly updated products (last 2 hours)
const [recentUpdates] = await connection.execute(`
  SELECT brand, COUNT(*) as count
  FROM products
  WHERE updatedAt >= DATE_SUB(NOW(), INTERVAL 2 HOUR)
  GROUP BY brand
  ORDER BY count DESC
`);

console.log('\nRecently updated products (last 2 hours):');
recentUpdates.forEach(row => {
  console.log(`  ${row.brand}: ${row.count}`);
});

await connection.end();
