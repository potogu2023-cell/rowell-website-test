import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const [rows] = await connection.execute('SELECT id, name, slug, parentId FROM categories ORDER BY id');

console.log('ID\tName\tSlug\tParentID');
console.log('---\t---\t---\t---');
rows.forEach(row => {
  console.log(`${row.id}\t${row.name}\t${row.slug}\t${row.parentId || 'NULL'}`);
});

await connection.end();
process.exit(0);
