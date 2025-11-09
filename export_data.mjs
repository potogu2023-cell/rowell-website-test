import { drizzle } from 'drizzle-orm/mysql2';
import { writeFileSync } from 'fs';

const db = drizzle(process.env.DATABASE_URL);

// Export products
console.log('Exporting products...');
const productsResult = await db.execute('SELECT * FROM products');
const productsCsv = convertToCSV(productsResult[0]);
writeFileSync('/home/ubuntu/rowell-backup/database/products.csv', productsCsv);
console.log(`✓ Exported ${productsResult[0].length} products`);

// Export categories
console.log('Exporting categories...');
const categoriesResult = await db.execute('SELECT * FROM categories');
const categoriesCsv = convertToCSV(categoriesResult[0]);
writeFileSync('/home/ubuntu/rowell-backup/database/categories.csv', categoriesCsv);
console.log(`✓ Exported ${categoriesResult[0].length} categories`);

// Export product_categories
console.log('Exporting product_categories...');
const pcResult = await db.execute('SELECT * FROM product_categories');
const pcCsv = convertToCSV(pcResult[0]);
writeFileSync('/home/ubuntu/rowell-backup/database/product_categories.csv', pcCsv);
console.log(`✓ Exported ${pcResult[0].length} product-category associations`);

// Export articles
console.log('Exporting articles...');
const articlesResult = await db.execute('SELECT * FROM articles');
const articlesCsv = convertToCSV(articlesResult[0]);
writeFileSync('/home/ubuntu/rowell-backup/database/articles.csv', articlesCsv);
console.log(`✓ Exported ${articlesResult[0].length} articles`);

function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(header => {
      let value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') value = JSON.stringify(value);
      value = String(value).replace(/"/g, '""');
      return `"${value}"`;
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

console.log('✓ All data exported successfully!');
