import { drizzle } from 'drizzle-orm/mysql2';

const db = drizzle(process.env.DATABASE_URL);

const stats = await db.execute(`
  SELECT 
    table_name,
    table_rows,
    ROUND(data_length / 1024 / 1024, 2) AS data_mb,
    ROUND(index_length / 1024 / 1024, 2) AS index_mb
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
  ORDER BY data_length DESC
`);

console.log(JSON.stringify(stats[0], null, 2));
