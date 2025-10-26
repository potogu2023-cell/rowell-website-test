import { getDb } from './server/db';
import { products, productCategories, categories } from './drizzle/schema';
import { sql, eq, inArray } from 'drizzle-orm';
import * as fs from 'fs';

const db = await getDb();
if (!db) process.exit(1);

const targetCategories = [
  'HPLC Columns',
  'GC Columns', 
  'Guard Columns',
  'SPE Cartridges',
  'Filtration',
  'Chromatography Supplies'
];

// Get all brands
const brandsResult = await db
  .select({ brand: products.brand })
  .from(products)
  .groupBy(products.brand)
  .orderBy(products.brand);

const brands = brandsResult.map(r => r.brand);

// Get category coverage by brand
const coverageData: any[] = [];

for (const brand of brands) {
  const brandData: any = { brand };
  
  for (const categoryName of targetCategories) {
    const result = await db.execute(sql`
      SELECT COUNT(DISTINCT p.id) as count
      FROM products p
      JOIN product_categories pc ON p.id = pc.productId
      JOIN categories c ON pc.categoryId = c.id
      WHERE p.brand = ${brand}
      AND c.name = ${categoryName}
    `);
    
    const count = (result as any)[0]?.count || 0;
    brandData[categoryName] = count;
  }
  
  coverageData.push(brandData);
}

// Generate coverage matrix
console.log('\n📊 Brand-Category Coverage Matrix\n');
console.log('Brand'.padEnd(25) + targetCategories.map(c => c.substring(0, 12).padEnd(13)).join(''));
console.log('='.repeat(25 + targetCategories.length * 13));

for (const data of coverageData) {
  const row = data.brand.padEnd(25) + 
    targetCategories.map(c => {
      const count = data[c] || 0;
      return count > 0 ? String(count).padEnd(13) : '-'.padEnd(13);
    }).join('');
  console.log(row);
}

// Generate gap analysis
console.log('\n\n📋 Coverage Gap Analysis\n');

const gaps: any[] = [];
for (const data of coverageData) {
  for (const categoryName of targetCategories) {
    if (!data[categoryName] || data[categoryName] === 0) {
      gaps.push({ brand: data.brand, category: categoryName });
    }
  }
}

console.log(`Total gaps: ${gaps.length}\n`);

const gapsByCategory: any = {};
for (const gap of gaps) {
  if (!gapsByCategory[gap.category]) {
    gapsByCategory[gap.category] = [];
  }
  gapsByCategory[gap.category].push(gap.brand);
}

for (const categoryName of targetCategories) {
  const missingBrands = gapsByCategory[categoryName] || [];
  console.log(`${categoryName}:`);
  console.log(`  Missing brands (${missingBrands.length}): ${missingBrands.join(', ') || 'None'}`);
  console.log('');
}

// Save to file
const report = {
  coverageMatrix: coverageData,
  gaps: gaps,
  gapsByCategory: gapsByCategory,
  summary: {
    totalBrands: brands.length,
    totalCategories: targetCategories.length,
    totalPossibleCombinations: brands.length * targetCategories.length,
    totalGaps: gaps.length,
    coverageRate: ((brands.length * targetCategories.length - gaps.length) / (brands.length * targetCategories.length) * 100).toFixed(1) + '%'
  }
};

fs.writeFileSync('coverage-analysis.json', JSON.stringify(report, null, 2));
console.log('✅ Coverage analysis saved to coverage-analysis.json');

