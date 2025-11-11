import { drizzle } from 'drizzle-orm/mysql2';
import { categories, productCategories } from '../drizzle/schema';
import { eq, inArray, and } from 'drizzle-orm';

async function mergeCategoriesPhase1() {
  const db = drizzle(process.env.DATABASE_URL!);
  
  console.log('=== 方案A阶段1: 数据清理和分类合并 ===\n');
  
  // 步骤1: 合并 "Fittings & Tubing" (23) 和 "Tubing & Fittings" (60006)
  console.log('步骤1: 合并管路接头分类...');
  const fittingsTubingId = 23;
  const tubingFittingsId = 60006;
  
  // 先删除会导致重复的记录
  const productsInBoth = await db.select({ productId: productCategories.productId })
    .from(productCategories)
    .where(eq(productCategories.categoryId, tubingFittingsId));
  
  for (const { productId } of productsInBoth) {
    // 检查该产品是否已经在目标分类中
    const existing = await db.select()
      .from(productCategories)
      .where(and(
        eq(productCategories.productId, productId),
        eq(productCategories.categoryId, fittingsTubingId)
      ));
    
    if (existing.length > 0) {
      // 如果已存在，删除源分类中的记录
      await db.delete(productCategories)
        .where(and(
          eq(productCategories.productId, productId),
          eq(productCategories.categoryId, tubingFittingsId)
        ));
    } else {
      // 如果不存在，更新分类ID
      await db.update(productCategories)
        .set({ categoryId: fittingsTubingId })
        .where(and(
          eq(productCategories.productId, productId),
          eq(productCategories.categoryId, tubingFittingsId)
        ));
    }
  }
  
  // 删除 Tubing & Fittings (60006)
  await db.delete(categories).where(eq(categories.id, tubingFittingsId));
  console.log(`✅ 已合并管路接头分类\n`);
  
  // 步骤2: 合并样品容器分类
  console.log('步骤2: 合并样品容器分类...');
  const vialsCapsId = 21;
  const sampleVialsId = 60002;
  const septaClosuresId = 60003;
  
  // 处理 Sample Vials
  const productsInSampleVials = await db.select({ productId: productCategories.productId })
    .from(productCategories)
    .where(eq(productCategories.categoryId, sampleVialsId));
  
  for (const { productId } of productsInSampleVials) {
    const existing = await db.select()
      .from(productCategories)
      .where(and(
        eq(productCategories.productId, productId),
        eq(productCategories.categoryId, vialsCapsId)
      ));
    
    if (existing.length > 0) {
      await db.delete(productCategories)
        .where(and(
          eq(productCategories.productId, productId),
          eq(productCategories.categoryId, sampleVialsId)
        ));
    } else {
      await db.update(productCategories)
        .set({ categoryId: vialsCapsId })
        .where(and(
          eq(productCategories.productId, productId),
          eq(productCategories.categoryId, sampleVialsId)
        ));
    }
  }
  
  // 处理 Septa & Closures
  const productsInSepta = await db.select({ productId: productCategories.productId })
    .from(productCategories)
    .where(eq(productCategories.categoryId, septaClosuresId));
  
  for (const { productId } of productsInSepta) {
    const existing = await db.select()
      .from(productCategories)
      .where(and(
        eq(productCategories.productId, productId),
        eq(productCategories.categoryId, vialsCapsId)
      ));
    
    if (existing.length > 0) {
      await db.delete(productCategories)
        .where(and(
          eq(productCategories.productId, productId),
          eq(productCategories.categoryId, septaClosuresId)
        ));
    } else {
      await db.update(productCategories)
        .set({ categoryId: vialsCapsId })
        .where(and(
          eq(productCategories.productId, productId),
          eq(productCategories.categoryId, septaClosuresId)
        ));
    }
  }
  
  // 删除 Sample Vials 和 Septa & Closures
  await db.delete(categories).where(inArray(categories.id, [sampleVialsId, septaClosuresId]));
  console.log(`✅ 已合并样品容器分类\n`);
  
  // 步骤3: 隐藏 Mobile Phase 空分类
  console.log('步骤3: 隐藏Mobile Phase空分类...');
  await db.update(categories)
    .set({ isVisible: 0 })
    .where(eq(categories.id, 24));
  console.log(`✅ 已隐藏Mobile Phase分类\n`);
  
  // 步骤4: 隐藏 Standards 分类
  console.log('步骤4: 隐藏Standards分类...');
  await db.update(categories)
    .set({ isVisible: 0 })
    .where(eq(categories.id, 7));
  console.log(`✅ 已隐藏Standards分类\n`);
  
  // 步骤5: 合并 Filtration Products
  console.log('步骤5: 合并Filtration Products...');
  const filtrationProductsItems = await db.select({ productId: productCategories.productId })
    .from(productCategories)
    .where(eq(productCategories.categoryId, 60005));
  
  for (const { productId } of filtrationProductsItems) {
    const existing = await db.select()
      .from(productCategories)
      .where(and(
        eq(productCategories.productId, productId),
        eq(productCategories.categoryId, 4)
      ));
    
    if (existing.length > 0) {
      await db.delete(productCategories)
        .where(and(
          eq(productCategories.productId, productId),
          eq(productCategories.categoryId, 60005)
        ));
    } else {
      await db.update(productCategories)
        .set({ categoryId: 4 })
        .where(and(
          eq(productCategories.productId, productId),
          eq(productCategories.categoryId, 60005)
        ));
    }
  }
  
  await db.delete(categories).where(eq(categories.id, 60005));
  console.log(`✅ 已合并Filtration Products\n`);
  
  // 步骤6: 合并 Centrifuge Tubes
  console.log('步骤6: 合并Centrifuge Tubes...');
  const centrifugeItems = await db.select({ productId: productCategories.productId })
    .from(productCategories)
    .where(eq(productCategories.categoryId, 60004));
  
  for (const { productId } of centrifugeItems) {
    const existing = await db.select()
      .from(productCategories)
      .where(and(
        eq(productCategories.productId, productId),
        eq(productCategories.categoryId, 5)
      ));
    
    if (existing.length > 0) {
      await db.delete(productCategories)
        .where(and(
          eq(productCategories.productId, productId),
          eq(productCategories.categoryId, 60004)
        ));
    } else {
      await db.update(productCategories)
        .set({ categoryId: 5 })
        .where(and(
          eq(productCategories.productId, productId),
          eq(productCategories.categoryId, 60004)
        ));
    }
  }
  
  await db.delete(categories).where(eq(categories.id, 60004));
  console.log(`✅ 已合并Centrifuge Tubes\n`);
  
  // 步骤7: 隐藏 Consumables
  console.log('步骤7: 隐藏Consumables分类...');
  await db.update(categories)
    .set({ isVisible: 0 })
    .where(eq(categories.id, 60007));
  console.log(`✅ 已隐藏Consumables分类\n`);
  
  console.log('=== 阶段1完成 ===');
  console.log('✅ 合并了5个重复/孤立分类');
  console.log('✅ 隐藏了3个空分类或不需要的分类');
  console.log('✅ 数据库结构已优化');
  
  process.exit(0);
}

mergeCategoriesPhase1().catch(console.error);
