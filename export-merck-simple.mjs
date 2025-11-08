import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await connection.execute(
  'SELECT id, productId, partNumber, name, catalogUrl FROM products WHERE brand = ?',
  ['Merck']
);

console.log(`✅ Found ${rows.length} Merck products`);

// Convert to CSV
const csvHeader = 'productId,partNumber,brand,name,catalogUrl\n';
const csvRows = rows.map(p => 
  `"${p.productId}","${p.partNumber}","Merck","${(p.name || '').replace(/"/g, '""')}","${p.catalogUrl || ''}"`
).join('\n');

const fs = await import('fs');
fs.writeFileSync('merck_product_list_for_crawler.csv', csvHeader + csvRows);

console.log('✅ CSV file created: merck_product_list_for_crawler.csv');
console.log(`Total products: ${rows.length}`);

await connection.end();
