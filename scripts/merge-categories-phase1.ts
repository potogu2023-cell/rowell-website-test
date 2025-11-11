import { drizzle } from 'drizzle-orm/mysql2';
import { categories, productCategories } from '../drizzle/schema';
import { eq, inArray } from 'drizzle-orm';

async function mergeCategoriesPhase1() {
  const db = drizzle(process.env.DATABASE_URL!);
  
  console.log('=== 方案A阶段1: 数据清理和分类合并 ===\n');
  
  // 步骤1: 合并 "Fittings & Tubing" (23) 和 "Tubing & Fittings" (60006)
  console.log('步骤1: 合并管路接头分类...');
  const fittingsTubingId = 23;
  const tubingFittingsId = 60006;
  
  // 将 Tubing & Fittings (60006) 的产品移动到 Fittings & Tubing (23)
  const moved1 = await db.update(productCategories)
    .set({ categoryId: fittingsTubingId })
    .where(eq(productCategories.categoryId, tubingFittingsId));
  
  // 删除 Tubing & Fittings (60006)
  await db.delete(categories).where(eq(categories.id, tubingFittingsId));
  console.log(`✅ 已合并管路接头分类，移动产品并删除重复分类\n`);
  
  // 步骤2: 合并样品容器分类
  console.log('步骤2: 合并样品容器分类...');
  const vialsCapsId = 21; // Vials & Caps
  const sampleVialsId = 60002; // Sample Vials
  const septaClosuresId = 60003; // Septa & Closures
  
  // 将 Sample Vials 和 Septa & Closures 的产品移动到 Vials & Caps
  await db.update(productCategories)
    .set({ categoryId: vialsCapsId })
    .where(inArray(productCategories.categoryId, [sampleVialsId, septaClosuresId]));
  
  // 删除 Sample Vials 和 Septa & Closures
  await db.delete(categories).where(inArray(categories.id, [sampleVialsId, septaClosuresId]));
  console.log(`✅ 已合并样品容器分类\n`);
  
  // 步骤3: 隐藏 Mobile Phase 空分类
  console.log('步骤3: 隐藏Mobile Phase空分类...');
  const mobilePhaseId = 24;
  await db.update(categories)
    .set({ isVisible: 0 })
    .where(eq(categories.id, mobilePhaseId));
  console.log(`✅ 已隐藏Mobile Phase分类\n`);
  
  // 步骤4: 隐藏 Standards 分类（数据库保留，前端隐藏）
  console.log('步骤4: 隐藏Standards分类（数据库保留）...');
  const standardsId = 7;
  await db.update(categories)
    .set({ isVisible: 0 })
    .where(eq(categories.id, standardsId));
  console.log(`✅ 已隐藏Standards分类\n`);
  
  // 步骤5: 合并 Filtration Products 到 Filtration
  console.log('步骤5: 合并Filtration Products到Filtration...');
  const filtrationId = 4;
  const filtrationProductsId = 60005;
  
  await db.update(productCategories)
    .set({ categoryId: filtrationId })
    .where(eq(productCategories.categoryId, filtrationProductsId));
  
  await db.delete(categories).where(eq(categories.id, filtrationProductsId));
  console.log(`✅ 已合并Filtration Products\n`);
  
  // 步骤6: 合并 Centrifuge Tubes 到 Lab Supplies
  console.log('步骤6: 合并Centrifuge Tubes到Lab Supplies...');
  const labSuppliesId = 5;
  const centrifugeTubesId = 60004;
  
  await db.update(productCategories)
    .set({ categoryId: labSuppliesId })
    .where(eq(productCategories.categoryId, centrifugeTubesId));
  
  await db.delete(categories).where(eq(categories.id, centrifugeTubesId));
  console.log(`✅ 已合并Centrifuge Tubes\n`);
  
  // 步骤7: 处理 Consumables 分类
  console.log('步骤7: 隐藏Consumables分类（产品需要重新分类）...');
  const consumablesId = 60007;
  await db.update(categories)
    .set({ isVisible: 0 })
    .where(eq(categories.id, consumablesId));
  console.log(`✅ 已隐藏Consumables分类（产品将在阶段2重新分类）\n`);
  
  console.log('=== 阶段1完成 ===');
  console.log('✅ 合并了5个重复/孤立分类');
  console.log('✅ 隐藏了3个空分类或不需要的分类');
  console.log('✅ 数据库结构已优化');
  console.log('\n下一步: 阶段2 - 产品重新分类');
  
  process.exit(0);
}

mergeCategoriesPhase1().catch(console.error);
