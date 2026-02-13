import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const dbUrl = new URL(DATABASE_URL);
const connection = await mysql.createConnection({
  host: dbUrl.hostname,
  port: dbUrl.port ? parseInt(dbUrl.port) : 3306,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.slice(1),
  ssl: { rejectUnauthorized: true }
});

// Check YMC products
const [ymcRows] = await connection.execute(
  'SELECT partNumber, particleSize, poreSize, dimensions, status FROM products WHERE brand = ? LIMIT 5',
  ['YMC']
);
console.log('YMC Products Sample:');
console.log(JSON.stringify(ymcRows, null, 2));

// Check Tosoh products
const [tosohRows] = await connection.execute(
  'SELECT partNumber, particleSize, poreSize, dimensions, status FROM products WHERE brand = ? LIMIT 5',
  ['Tosoh']
);
console.log('\nTosoh Products Sample:');
console.log(JSON.stringify(tosohRows, null, 2));

await connection.end();
