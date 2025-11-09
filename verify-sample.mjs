import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Check a sample Agilent product
const [agilentRows] = await connection.execute(
  'SELECT productId, name, description, specifications, imageUrl FROM products WHERE productId = ? LIMIT 1',
  ['AGIL-121-1013']
);

console.log('=== Sample Agilent Product ===');
console.log('Product ID:', agilentRows[0].productId);
console.log('Name:', agilentRows[0].name);
console.log('Description length:', agilentRows[0].description?.length || 0);
console.log('Has specifications:', !!agilentRows[0].specifications);
console.log('Has image:', !!agilentRows[0].imageUrl);

if (agilentRows[0].specifications) {
  const specs = JSON.parse(agilentRows[0].specifications);
  console.log('Specification fields:', Object.keys(specs).length);
  console.log('Sample specs:', Object.keys(specs).slice(0, 5).join(', '));
}

// Check a sample Waters product
const [watersRows] = await connection.execute(
  'SELECT productId, name, description, specifications, imageUrl FROM products WHERE productId = ? LIMIT 1',
  ['WATS-186010476']
);

console.log('\n=== Sample Waters Product ===');
console.log('Product ID:', watersRows[0].productId);
console.log('Name:', watersRows[0].name);
console.log('Description length:', watersRows[0].description?.length || 0);
console.log('Has specifications:', !!watersRows[0].specifications);
console.log('Has image:', !!watersRows[0].imageUrl);

if (watersRows[0].specifications) {
  const specs = JSON.parse(watersRows[0].specifications);
  console.log('Specification fields:', Object.keys(specs).length);
  console.log('Sample specs:', Object.keys(specs).slice(0, 5).join(', '));
}

await connection.end();
