import { drizzle } from 'drizzle-orm/mysql2';

const db = drizzle(process.env.DATABASE_URL!);

async function checkColumn() {
  const result = await db.execute('DESCRIBE products');
  const cols = result[0] as any[];
  
  console.log('\n=== Products Table Columns ===\n');
  cols.forEach((col: any) => {
    console.log(`${col.Field}: ${col.Type}`);
  });
  
  const hasDescQuality = cols.some((col: any) => col.Field === 'descriptionQuality');
  
  console.log('\n=== Check Result ===\n');
  console.log(`Has descriptionQuality column: ${hasDescQuality}`);
  
  if (!hasDescQuality) {
    console.log('\n⚠️  Column descriptionQuality does NOT exist in products table!');
    console.log('This field needs to be added to the schema and migrated.');
  }
}

checkColumn().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
