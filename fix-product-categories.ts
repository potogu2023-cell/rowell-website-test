import { getDb } from './server/db';
import { products, productCategories, categories } from './drizzle/schema';
import { eq, sql, and, like, or } from 'drizzle-orm';

async function fixProductCategories() {
  const db = await getDb();
  if (!db) {
    throw new Error('Database connection failed');
  }

  console.log('\n🔧 开始修复产品分类...\n');

  // 1. 查找GC Columns和Guard Columns的分类ID
  const allCategories = await db.select().from(categories);
  console.log('📂 所有分类:');
  allCategories.forEach(cat => {
    console.log(`   ID: ${cat.id}, Name: ${cat.name}, Slug: ${cat.slug}`);
  });

  const gcCategory = allCategories.find(c => c.slug === 'gc-columns' || c.name.includes('GC Columns'));
  const guardCategory = allCategories.find(c => c.slug === 'guard-columns' || c.name.includes('Guard Columns'));

  if (!gcCategory) {
    console.log('\n❌ 未找到GC Columns分类');
    return;
  }
  if (!guardCategory) {
    console.log('\n❌ 未找到Guard Columns分类');
    return;
  }

  console.log(`\n✅ GC Columns分类ID: ${gcCategory.id}`);
  console.log(`✅ Guard Columns分类ID: ${guardCategory.id}`);

  // 2. 查找所有GC产品（通过productId模式识别）
  const gcProducts = await db
    .select()
    .from(products)
    .where(
      or(
        like(products.productId, 'PHEN-ZB-%'),
        like(products.productId, 'WATS-WAT2%'),
        like(products.productId, 'AGIL-19091%'),
        like(products.productId, 'AGIL-122-%'),
        like(products.productId, 'AGIL-123-%'),
        like(products.productId, 'SHIM-SH-Rxi-%'),
        like(products.productId, 'SHIM-SH-Rtx-%'),
        like(products.productId, 'THER-TG-%'),
        like(products.productId, 'YMC-YMC-GC-%'),
        like(products.productId, 'DAIC-DC-%'),
        like(products.productId, 'TOSO-TSK-GC-%'),
        like(products.productId, 'AVAN-AV-GC-%'),
        like(products.productId, 'MERC-Supelco-%'),
        like(products.productId, 'TCI-TCI-GC-%')
      )
    );

  console.log(`\n📦 找到${gcProducts.length}个GC产品`);

  // 3. 查找所有Guard产品
  const guardProducts = await db
    .select()
    .from(products)
    .where(
      or(
        like(products.productId, 'PHEN-Z-Guard-%'),
        like(products.productId, 'WATS-WAT3%'),
        like(products.productId, 'AGIL-5188-%'),
        like(products.productId, 'SHIM-SH-Guard-%'),
        like(products.productId, 'THER-TG-Guard-%'),
        like(products.productId, 'YMC-YMC-Guard-%'),
        like(products.productId, 'DAIC-DC-Guard-%')
      )
    );

  console.log(`📦 找到${guardProducts.length}个Guard产品\n`);

  // 4. 为GC产品分配分类
  let gcAssigned = 0;
  for (const product of gcProducts) {
    try {
      // 检查是否已分配
      const existing = await db
        .select()
        .from(productCategories)
        .where(
          and(
            eq(productCategories.productId, product.id),
            eq(productCategories.categoryId, gcCategory.id)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(productCategories).values({
          productId: product.id,
          categoryId: gcCategory.id,
        });
        console.log(`✅ 分配GC分类: ${product.productId}`);
        gcAssigned++;
      } else {
        console.log(`⏭️  已有GC分类: ${product.productId}`);
      }
    } catch (error: any) {
      console.log(`❌ 分配失败: ${product.productId} - ${error.message}`);
    }
  }

  // 5. 为Guard产品分配分类
  let guardAssigned = 0;
  for (const product of guardProducts) {
    try {
      // 检查是否已分配
      const existing = await db
        .select()
        .from(productCategories)
        .where(
          and(
            eq(productCategories.productId, product.id),
            eq(productCategories.categoryId, guardCategory.id)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(productCategories).values({
          productId: product.id,
          categoryId: guardCategory.id,
        });
        console.log(`✅ 分配Guard分类: ${product.productId}`);
        guardAssigned++;
      } else {
        console.log(`⏭️  已有Guard分类: ${product.productId}`);
      }
    } catch (error: any) {
      console.log(`❌ 分配失败: ${product.productId} - ${error.message}`);
    }
  }

  console.log(`\n📊 分类分配统计:`);
  console.log(`   GC Columns: ${gcAssigned} 个新分配`);
  console.log(`   Guard Columns: ${guardAssigned} 个新分配`);
  console.log('\n✅ 分类修复完成！\n');
}

fixProductCategories()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ 修复失败:', err);
    process.exit(1);
  });

