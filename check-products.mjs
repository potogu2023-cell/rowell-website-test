import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [totalRows] = await connection.execute('SELECT COUNT(*) as count FROM products');
console.log('Current total products:', totalRows[0].count);

const [agilentRows] = await connection.execute('SELECT COUNT(*) as count FROM products WHERE brand = ?', ['Agilent']);
console.log('Current Agilent products:', agilentRows[0].count);

const [watersRows] = await connection.execute('SELECT COUNT(*) as count FROM products WHERE brand = ?', ['Waters']);
console.log('Current Waters products:', watersRows[0].count);

await connection.end();
