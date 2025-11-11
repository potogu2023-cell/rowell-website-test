import { drizzle } from 'drizzle-orm/mysql2';
import { products } from '../drizzle/schema';

async function analyzeProductDistribution() {
  const db = drizzle(process.env.DATABASE_URL!);
  
  console.log('=== 分析3121个产品的实际类型分布 ===\n');
  
  const allProducts = await db.select({
    name: products.name,
    partNumber: products.partNumber,
    brand: products.brand
  }).from(products);
  
  console.log(`总产品数: ${allProducts.length}\n`);
  
  // 分析产品类型关键词
  const keywords = {
    '色谱柱 (Columns)': ['column', 'col.', 'cartridge'],
    '保护柱 (Guard Columns)': ['guard', 'holder', 'cartridge holder'],
    '样品瓶 (Vials)': ['vial', 'bottle'],
    '瓶盖/隔垫 (Caps/Septa)': ['cap', 'septa', 'septum', 'closure', 'crimp', 'snap'],
    '注射器 (Syringes)': ['syringe'],
    '针头 (Needles)': ['needle'],
    '过滤器 (Filters)': ['filter', 'membrane'],
    'SPE固相萃取 (SPE)': ['spe', 'extraction', 'cartridge', 'bond elut', 'oasis'],
    '管路/接头 (Tubing/Fittings)': ['tubing', 'fitting', 'ferrule', 'nut', 'connector', 'adapter'],
    '衍生化试剂 (Derivatization)': ['derivatization', 'reagent'],
    '标准品 (Standards)': ['standard', 'reference'],
    '离心管 (Centrifuge Tubes)': ['centrifuge', 'tube'],
    '光谱耗材 (Spectroscopy)': ['spectroscopy', 'cuvette'],
    '塑料耗材 (Plasticware)': ['plate', 'pipette', 'tip'],
  };
  
  const distribution: Record<string, number> = {};
  const examples: Record<string, string[]> = {};
  
  for (const [category, keywordList] of Object.entries(keywords)) {
    distribution[category] = 0;
    examples[category] = [];
  }
  
  for (const product of allProducts) {
    const searchText = `${product.name} ${product.partNumber}`.toLowerCase();
    
    for (const [category, keywordList] of Object.entries(keywords)) {
      if (keywordList.some(kw => searchText.includes(kw.toLowerCase()))) {
        distribution[category]++;
        if (examples[category].length < 3) {
          examples[category].push(`${product.brand} ${product.partNumber}: ${product.name.substring(0, 60)}...`);
        }
        break; // 每个产品只计入一个分类
      }
    }
  }
  
  // 排序并输出
  const sorted = Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, count]) => count > 0);
  
  console.log('=== 产品类型分布 (按数量排序) ===\n');
  
  for (const [category, count] of sorted) {
    const percentage = ((count / allProducts.length) * 100).toFixed(1);
    console.log(`${category}: ${count}个产品 (${percentage}%)`);
    console.log(`示例:`);
    for (const example of examples[category]) {
      console.log(`  - ${example}`);
    }
    console.log('');
  }
  
  // 统计未分类产品
  const categorized = sorted.reduce((sum, [_, count]) => sum + count, 0);
  const uncategorized = allProducts.length - categorized;
  console.log(`\n=== 统计总结 ===`);
  console.log(`已分类: ${categorized}个 (${((categorized / allProducts.length) * 100).toFixed(1)}%)`);
  console.log(`未分类: ${uncategorized}个 (${((uncategorized / allProducts.length) * 100).toFixed(1)}%)`);
  
  process.exit(0);
}

analyzeProductDistribution().catch(console.error);
