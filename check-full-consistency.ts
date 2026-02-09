import mysql from 'mysql2/promise';

async function checkConsistency() {
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: true }
  });
  
  try {
    console.log('=== 数据一致性全面检查 ===\n');
    
    // 1. 产品总数统计
    console.log('1. 产品总数统计');
    const [totalRows] = await connection.execute(
      'SELECT COUNT(*) as total FROM products'
    );
    console.log(`   数据库产品总数: ${(totalRows as any)[0].total}`);
    
    const [activeRows] = await connection.execute(
      'SELECT COUNT(*) as total FROM products WHERE status = ?',
      ['active']
    );
    console.log(`   活跃产品数: ${(activeRows as any)[0].total}\n`);
    
    // 2. 分类关联统计
    console.log('2. 分类关联统计');
    const [withCategoryRows] = await connection.execute(
      'SELECT COUNT(DISTINCT product_id) as total FROM product_categories'
    );
    console.log(`   有分类关联的产品数: ${(withCategoryRows as any)[0].total}`);
    
    const [withoutCategoryRows] = await connection.execute(
      'SELECT COUNT(*) as total FROM products WHERE status = "active" AND id NOT IN (SELECT DISTINCT product_id FROM product_categories)'
    );
    const orphanCount = (withoutCategoryRows as any)[0].total;
    console.log(`   无分类关联的活跃产品数: ${orphanCount}`);
    
    if (orphanCount > 0) {
      console.log(`   ⚠️ 警告: ${orphanCount}个活跃产品缺少分类关联，前端无法显示!\n`);
    } else {
      console.log(`   ✅ 所有活跃产品都有分类关联\n`);
    }
    
    // 3. products表与product_categories表的category_id不一致
    console.log('3. 检查category_id不一致');
    const [inconsistentRows] = await connection.execute(`
      SELECT p.id, p.productId, p.category_id as products_category, pc.category_id as pc_category
      FROM products p
      JOIN product_categories pc ON p.id = pc.product_id AND pc.is_primary = 1
      WHERE p.category_id != pc.category_id
      LIMIT 10
    `);
    const inconsistentCount = (inconsistentRows as any).length;
    if (inconsistentCount > 0) {
      console.log(`   ⚠️ 发现${inconsistentCount}个产品的category_id不一致（显示前10个）:`);
      (inconsistentRows as any).forEach((row: any) => {
        console.log(`      产品${row.productId}: products表=${row.products_category}, product_categories表=${row.pc_category}`);
      });
      console.log('');
    } else {
      console.log('   ✅ 所有产品的category_id一致\n');
    }
    
    // 4. 分类分布（前20个）
    console.log('4. 分类产品分布（前20个）');
    const [categoryDist] = await connection.execute(`
      SELECT c.id, c.name_en as name, c.slug, COUNT(pc.product_id) as product_count
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      GROUP BY c.id, c.name_en, c.slug
      ORDER BY product_count DESC
      LIMIT 20
    `);
    (categoryDist as any).forEach((row: any) => {
      console.log(`   ${row.name} (ID: ${row.id}, slug: ${row.slug}): ${row.product_count}个产品`);
    });
    console.log('');
    
    // 5. 检查重复的product_categories记录
    console.log('5. 检查重复的分类关联');
    const [duplicateRows] = await connection.execute(`
      SELECT product_id, category_id, COUNT(*) as count
      FROM product_categories
      GROUP BY product_id, category_id
      HAVING count > 1
      LIMIT 10
    `);
    if ((duplicateRows as any).length > 0) {
      console.log(`   ⚠️ 发现${(duplicateRows as any).length}组重复的分类关联:`);
      (duplicateRows as any).forEach((row: any) => {
        console.log(`      产品${row.product_id} - 分类${row.category_id}: ${row.count}条记录`);
      });
      console.log('');
    } else {
      console.log('   ✅ 没有重复的分类关联\n');
    }
    
    // 6. 检查产品有多个主分类的情况
    console.log('6. 检查多主分类产品');
    const [multiplePrimaryRows] = await connection.execute(`
      SELECT product_id, COUNT(*) as primary_count
      FROM product_categories
      WHERE is_primary = 1
      GROUP BY product_id
      HAVING primary_count > 1
      LIMIT 10
    `);
    if ((multiplePrimaryRows as any).length > 0) {
      console.log(`   ⚠️ 发现${(multiplePrimaryRows as any).length}个产品有多个主分类:`);
      (multiplePrimaryRows as any).forEach((row: any) => {
        console.log(`      产品${row.product_id}: ${row.primary_count}个主分类`);
      });
      console.log('');
    } else {
      console.log('   ✅ 所有产品只有一个主分类\n');
    }
    
    // 7. 获取无分类关联的产品样本
    if (orphanCount > 0) {
      console.log('7. 无分类关联的产品样本（前10个）');
      const [orphanSamples] = await connection.execute(`
        SELECT id, productId, partNumber, brand, productName, category_id, status
        FROM products
        WHERE status = "active" AND id NOT IN (SELECT DISTINCT product_id FROM product_categories)
        LIMIT 10
      `);
      (orphanSamples as any).forEach((row: any) => {
        console.log(`   ${row.productId} (${row.brand}): ${row.productName}`);
        console.log(`      products表category_id: ${row.category_id}`);
      });
      console.log('');
    }
    
    console.log('=== 检查完成 ===');
    
  } finally {
    await connection.end();
  }
}

checkConsistency().catch(console.error);
