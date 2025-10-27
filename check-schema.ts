import { drizzle } from 'drizzle-orm/mysql2';

const db = drizzle(process.env.DATABASE_URL!);

const result = await db.execute('DESCRIBE products');
console.log('Products表结构:');
console.log(result);

const sample = await db.execute('SELECT id, partNumber, name FROM products LIMIT 5');
console.log('\n示例产品:');
console.log(sample);

process.exit(0);
