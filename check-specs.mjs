import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await connection.execute(
  'SELECT productId, name, SUBSTRING(description, 1, 100) as desc_preview, specifications, imageUrl FROM products WHERE productId = ? LIMIT 1',
  ['AGIL-121-1013']
);

console.log('Product ID:', rows[0].productId);
console.log('Name:', rows[0].name);
console.log('Description preview:', rows[0].desc_preview);
console.log('Specifications type:', typeof rows[0].specifications);
console.log('Specifications value:', rows[0].specifications);
console.log('Image URL:', rows[0].imageUrl);

await connection.end();
