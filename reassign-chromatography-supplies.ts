import { drizzle } from 'drizzle-orm/mysql2';
import { products, productCategories } from './drizzle/schema';
import { eq, sql, and } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL!);

const CHROMATOGRAPHY_SUPPLIES_ID = 5;  // 父分类
const VIALS_CAPS_ID = 13;
const SYRINGES_NEEDLES_ID = 14;
const FITTINGS_TUBING_ID = 15;

async function reassignChromatographySupplies() {
  console.log('=== 开始重新分配Chromatography Supplies产品到子分类 ===\n');
  
  // 1. 获取所有映射到父分类的产品
  const mappedProducts = await db
    .select({
      productId: productCategories.productId,
      productName: products.name,
      mappingId: productCategories.id
    })
    .from(productCategories)
    .innerJoin(products, eq(productCategories.productId, products.id))
    .where(eq(productCategories.categoryId, CHROMATOGRAPHY_SUPPLIES_ID));
  
  console.log(`找到 ${mappedProducts.length} 个映射到Chromatography Supplies的产品\n`);
  
  // 2. 按产品名称分类
  const vialsAndCaps: number[] = [];
  const syringesAndNeedles: number[] = [];
  const fittingsAndTubing: number[] = [];
  const unclassified: number[] = [];
  
  for (const product of mappedProducts) {
    const name = product.productName.toLowerCase();
    
    if (name.includes('vial') || name.includes('cap') || name.includes('septa')) {
      vialsAndCaps.push(product.productId);
    } else if (name.includes('syringe') || name.includes('needle')) {
      // 排除syringe filter
      if (!name.includes('filter')) {
        syringesAndNeedles.push(product.productId);
      } else {
        unclassified.push(product.productId);
      }
    } else if (name.includes('fitting') || name.includes('tubing') || name.includes('connector') || name.includes('peek')) {
      fittingsAndTubing.push(product.productId);
    } else {
      unclassified.push(product.productId);
    }
  }
  
  console.log('分类统计:');
  console.log(`- Vials & Caps: ${vialsAndCaps.length}个产品`);
  console.log(`- Syringes & Needles: ${syringesAndNeedles.length}个产品`);
  console.log(`- Fittings & Tubing: ${fittingsAndTubing.length}个产品`);
  console.log(`- 未分类: ${unclassified.length}个产品\n`);
  
  // 3. 删除父分类的映射
  console.log('删除父分类映射...');
  await db.delete(productCategories)
    .where(eq(productCategories.categoryId, CHROMATOGRAPHY_SUPPLIES_ID));
  console.log('✅ 删除完成\n');
  
  // 4. 批量插入新的子分类映射
  let totalInserted = 0;
  
  // Vials & Caps
  if (vialsAndCaps.length > 0) {
    console.log(`插入Vials & Caps映射 (${vialsAndCaps.length}个产品)...`);
    const batchSize = 100;
    for (let i = 0; i < vialsAndCaps.length; i += batchSize) {
      const batch = vialsAndCaps.slice(i, i + batchSize);
      const values = batch.map(productId => ({
        productId,
        categoryId: VIALS_CAPS_ID,
        isPrimary: 1
      }));
      await db.insert(productCategories).values(values);
      totalInserted += batch.length;
      console.log(`  进度: ${Math.min(i + batchSize, vialsAndCaps.length)}/${vialsAndCaps.length}`);
    }
    console.log('✅ Vials & Caps映射完成\n');
  }
  
  // Syringes & Needles
  if (syringesAndNeedles.length > 0) {
    console.log(`插入Syringes & Needles映射 (${syringesAndNeedles.length}个产品)...`);
    const batchSize = 100;
    for (let i = 0; i < syringesAndNeedles.length; i += batchSize) {
      const batch = syringesAndNeedles.slice(i, i + batchSize);
      const values = batch.map(productId => ({
        productId,
        categoryId: SYRINGES_NEEDLES_ID,
        isPrimary: 1
      }));
      await db.insert(productCategories).values(values);
      totalInserted += batch.length;
      console.log(`  进度: ${Math.min(i + batchSize, syringesAndNeedles.length)}/${syringesAndNeedles.length}`);
    }
    console.log('✅ Syringes & Needles映射完成\n');
  }
  
  // Fittings & Tubing
  if (fittingsAndTubing.length > 0) {
    console.log(`插入Fittings & Tubing映射 (${fittingsAndTubing.length}个产品)...`);
    const batchSize = 100;
    for (let i = 0; i < fittingsAndTubing.length; i += batchSize) {
      const batch = fittingsAndTubing.slice(i, i + batchSize);
      const values = batch.map(productId => ({
        productId,
        categoryId: FITTINGS_TUBING_ID,
        isPrimary: 1
      }));
      await db.insert(productCategories).values(values);
      totalInserted += batch.length;
      console.log(`  进度: ${Math.min(i + batchSize, fittingsAndTubing.length)}/${fittingsAndTubing.length}`);
    }
    console.log('✅ Fittings & Tubing映射完成\n');
  }
  
  // 5. 最终统计
  console.log('=== 重新分配完成 ===');
  console.log(`- 总共处理: ${mappedProducts.length}个产品`);
  console.log(`- 成功重新分配: ${totalInserted}个产品`);
  console.log(`- 未分类: ${unclassified.length}个产品`);
  
  if (unclassified.length > 0) {
    console.log('\n未分类产品示例:');
    const unclassifiedProducts = mappedProducts.filter(p => unclassified.includes(p.productId));
    unclassifiedProducts.slice(0, 10).forEach(p => {
      console.log(`  - ${p.productName}`);
    });
  }
}

reassignChromatographySupplies().then(() => {
  console.log('\n✅ 所有操作完成！');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ 错误:', err);
  process.exit(1);
});
