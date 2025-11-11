import { drizzle } from 'drizzle-orm/mysql2';
import { products } from '../drizzle/schema';
import { like, or } from 'drizzle-orm';

async function checkEmptyCategoryProducts() {
  const db = drizzle(process.env.DATABASE_URL!);
  
  console.log('=== 检查空分类对应的产品 ===\n');
  
  // 1. Mobile Phase (流动相)
  console.log('1. Mobile Phase (流动相):');
  const mobilePh = await db.select().from(products)
    .where(or(
      like(products.name, '%mobile phase%'),
      like(products.name, '%solvent%'),
      like(products.name, '%eluent%')
    )).limit(5);
  console.log(`   找到 ${mobilePh.length} 个相关产品`);
  if (mobilePh.length > 0) console.log(`   示例: ${mobilePh[0].name}`);
  
  // 2. Extraction Accessories (萃取配件)
  console.log('\n2. Extraction Accessories (萃取配件):');
  const extraction = await db.select().from(products)
    .where(or(
      like(products.name, '%extraction%'),
      like(products.name, '%manifold%'),
      like(products.name, '%vacuum%')
    )).limit(5);
  console.log(`   找到 ${extraction.length} 个相关产品`);
  if (extraction.length > 0) console.log(`   示例: ${extraction[0].name}`);
  
  // 3. Membrane Filters (膜过滤器)
  console.log('\n3. Membrane Filters (膜过滤器):');
  const membrane = await db.select().from(products)
    .where(or(
      like(products.name, '%membrane%'),
      like(products.name, '%disc filter%'),
      like(products.name, '%filter disc%')
    )).limit(5);
  console.log(`   找到 ${membrane.length} 个相关产品`);
  if (membrane.length > 0) console.log(`   示例: ${membrane[0].name}`);
  
  // 4. Filter Holders (过滤器支架)
  console.log('\n4. Filter Holders (过滤器支架):');
  const holders = await db.select().from(products)
    .where(or(
      like(products.name, '%holder%'),
      like(products.name, '%housing%'),
      like(products.name, '%filter unit%')
    )).limit(5);
  console.log(`   找到 ${holders.length} 个相关产品`);
  if (holders.length > 0) console.log(`   示例: ${holders[0].name}`);
  
  // 5. Glassware (玻璃器皿)
  console.log('\n5. Glassware (玻璃器皿):');
  const glassware = await db.select().from(products)
    .where(or(
      like(products.name, '%glass%'),
      like(products.name, '%bottle%'),
      like(products.name, '%flask%'),
      like(products.name, '%beaker%')
    )).limit(5);
  console.log(`   找到 ${glassware.length} 个相关产品`);
  if (glassware.length > 0) console.log(`   示例: ${glassware[0].name}`);
  
  // 6. Storage (储存容器)
  console.log('\n6. Storage (储存容器):');
  const storage = await db.select().from(products)
    .where(or(
      like(products.name, '%storage%'),
      like(products.name, '%container%'),
      like(products.name, '%box%')
    )).limit(5);
  console.log(`   找到 ${storage.length} 个相关产品`);
  if (storage.length > 0) console.log(`   示例: ${storage[0].name}`);
  
  console.log('\n\n=== 结论 ===');
  const total = mobilePh.length + extraction.length + membrane.length + holders.length + glassware.length + storage.length;
  if (total === 0) {
    console.log('✅ 确认：数据库中没有这些类型的产品');
    console.log('建议：隐藏这些空分类');
  } else {
    console.log(`⚠️  发现：数据库中有 ${total} 个可能相关的产品`);
    console.log('建议：重新分类这些产品');
  }
  
  process.exit(0);
}

checkEmptyCategoryProducts().catch(console.error);
