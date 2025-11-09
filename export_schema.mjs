import { drizzle } from 'drizzle-orm/mysql2';
import { writeFileSync } from 'fs';

const db = drizzle(process.env.DATABASE_URL);

// Get CREATE TABLE statements
const tables = await db.execute(`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = DATABASE()
  AND table_type = 'BASE TABLE'
`);

let schema = '-- ROWELL Website Database Schema\n';
schema += '-- Generated: ' + new Date().toISOString() + '\n\n';

for (const table of tables[0]) {
  const createTable = await db.execute(`SHOW CREATE TABLE \`${table.table_name}\``);
  schema += createTable[0][0]['Create Table'] + ';\n\n';
}

writeFileSync('/home/ubuntu/rowell-backup/database/schema.sql', schema);
console.log('✓ Schema exported to schema.sql');
