import { getDb } from './server/db';

async function fixSubcategoryMappings() {
  console.log('=== 开始修复子分类产品映射（使用正确的ID） ===\n');
  
  const db = await getDb();
  if (!db) {
    console.error('无法连接数据库');
    process.exit(1);
  }

  // 定义映射规则（使用正确的分类ID）
  const mappingRules = [
    {
      fromCategoryId: 2, // Chromatography Supplies (父分类)
      toCategoryId: 21,  // Vials & Caps
      categoryName: 'Vials & Caps',
      keywords: ['Vial', 'vial', 'Cap', 'cap', 'Septa', 'septa'],
      excludeKeywords: []
    },
    {
      fromCategoryId: 2,
      toCategoryId: 22,  // Syringes & Needles
      categoryName: 'Syringes & Needles',
      keywords: ['Syringe', 'syringe', 'Needle', 'needle'],
      excludeKeywords: ['Filter', 'filter']
    },
    {
      fromCategoryId: 2,
      toCategoryId: 23,  // Fittings & Tubing
      categoryName: 'Fittings & Tubing',
      keywords: ['Fitting', 'fitting', 'Tubing', 'tubing', 'PEEK', 'Connector', 'connector'],
      excludeKeywords: []
    },
    {
      fromCategoryId: 4, // Filtration (父分类)
      toCategoryId: 41,  // Syringe Filters
      categoryName: 'Syringe Filters',
      keywords: ['Syringe Filter', 'syringe filter'],
      excludeKeywords: []
    },
    {
      fromCategoryId: 4,
      toCategoryId: 42,  // Membrane Filters
      categoryName: 'Membrane Filters',
      keywords: ['Membrane', 'membrane'],
      excludeKeywords: ['Syringe', 'syringe']
    }
  ];

  let totalUpdated = 0;

  for (const rule of mappingRules) {
    console.log(`\n处理: ${rule.categoryName} (${rule.fromCategoryId} -> ${rule.toCategoryId})`);
    
    // 构建WHERE条件
    const likeConditions = rule.keywords.map(kw => `p.name LIKE '%${kw}%'`).join(' OR ');
    const excludeConditions = rule.excludeKeywords.length > 0
      ? ' AND ' + rule.excludeKeywords.map(kw => `p.name NOT LIKE '%${kw}%'`).join(' AND ')
      : '';
    
    const query = `
      UPDATE product_categories pc
      INNER JOIN products p ON pc.productId = p.id
      SET pc.categoryId = ${rule.toCategoryId}
      WHERE pc.categoryId = ${rule.fromCategoryId}
      AND (${likeConditions})
      ${excludeConditions}
    `;
    
    try {
      const result: any = await db.execute(query);
      const affectedRows = result[0]?.affectedRows || 0;
      console.log(`✅ 更新了 ${affectedRows} 个产品映射`);
      totalUpdated += affectedRows;
    } catch (error) {
      console.error(`❌ 更新失败:`, error);
    }
  }

  // 最终统计
  console.log('\n=== 最终统计 ===');
  console.log(`总共更新了 ${totalUpdated} 个产品映射\n`);
  
  const statsQuery = `
    SELECT 
      c.id,
      c.name,
      c.slug,
      COUNT(pc.productId) as product_count
    FROM categories c
    LEFT JOIN product_categories pc ON c.id = pc.categoryId
    WHERE c.id IN (21, 22, 23, 31, 41, 42)
    GROUP BY c.id, c.name, c.slug
    ORDER BY c.id
  `;
  
  try {
    const stats: any = await db.execute(statsQuery);
    console.log('子分类产品数量：');
    console.table(stats[0]);
  } catch (error) {
    console.error('统计查询失败:', error);
  }
}

fixSubcategoryMappings().then(() => {
  console.log('\n✅ 修复完成！');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ 错误:', err);
  process.exit(1);
});
