import { drizzle } from 'drizzle-orm/mysql2';
import { products, productCategories, categories } from './drizzle/schema';
import { eq, sql, isNull } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL!);

// 正确的分类ID（从数据库查询获得）
const CATEGORY_IDS = {
  // Chromatography Supplies 子分类
  VIALS_CAPS: 13,           // Vials & Caps
  SYRINGES_NEEDLES: 14,     // Syringes & Needles
  FITTINGS_TUBING: 15,      // Fittings & Tubing
  
  // Filtration 子分类
  SYRINGE_FILTERS: 17,      // Syringe Filters
  MEMBRANE_FILTERS: 18,     // Membrane Filters
  
  // Sample Preparation 子分类
  SPE_CARTRIDGES: 20,       // SPE Cartridges
  
  // Chromatography Columns 子分类
  HPLC_COLUMNS: 2,          // HPLC Columns
  GC_COLUMNS: 3,            // GC Columns
  GUARD_COLUMNS: 4,         // Guard Columns
};

interface CategoryRule {
  categoryId: number;
  categoryName: string;
  patterns: string[];
  excludePatterns?: string[];
  priority: number;
}

const CATEGORY_RULES: CategoryRule[] = [
  // Vials & Caps (highest priority for supplies)
  {
    categoryId: CATEGORY_IDS.VIALS_CAPS,
    categoryName: 'Vials & Caps',
    patterns: ['%Vial%', '%vial%', '%Cap%', '%cap%', '%Septa%', '%septa%'],
    priority: 100
  },
  
  // Syringes & Needles
  {
    categoryId: CATEGORY_IDS.SYRINGES_NEEDLES,
    categoryName: 'Syringes & Needles',
    patterns: ['%Syringe%', '%syringe%', '%Needle%', '%needle%'],
    excludePatterns: ['%Filter%'],  // Exclude syringe filters
    priority: 95
  },
  
  // Fittings & Tubing
  {
    categoryId: CATEGORY_IDS.FITTINGS_TUBING,
    categoryName: 'Fittings & Tubing',
    patterns: ['%Fitting%', '%fitting%', '%Tubing%', '%tubing%', '%Connector%', '%connector%', '%PEEK%'],
    priority: 90
  },
  
  // Syringe Filters
  {
    categoryId: CATEGORY_IDS.SYRINGE_FILTERS,
    categoryName: 'Syringe Filters',
    patterns: ['%Syringe Filter%', '%syringe filter%'],
    priority: 85
  },
  
  // Membrane Filters
  {
    categoryId: CATEGORY_IDS.MEMBRANE_FILTERS,
    categoryName: 'Membrane Filters',
    patterns: ['%Membrane Filter%', '%membrane filter%', '%Membrane%'],
    excludePatterns: ['%Syringe%'],
    priority: 80
  },
  
  // SPE Cartridges
  {
    categoryId: CATEGORY_IDS.SPE_CARTRIDGES,
    categoryName: 'SPE Cartridges',
    patterns: ['%SPE%', '%Cartridge%', '%cartridge%'],
    excludePatterns: ['%GC%', '%Guard%'],
    priority: 75
  },
  
  // GC Columns
  {
    categoryId: CATEGORY_IDS.GC_COLUMNS,
    categoryName: 'GC Columns',
    patterns: ['%GC%', '%Gas Chromatography%', '%Capillary%'],
    priority: 70
  },
  
  // Guard Columns
  {
    categoryId: CATEGORY_IDS.GUARD_COLUMNS,
    categoryName: 'Guard Columns',
    patterns: ['%Guard%', '%guard%'],
    priority: 65
  },
  
  // HPLC Columns (lowest priority, catch-all)
  {
    categoryId: CATEGORY_IDS.HPLC_COLUMNS,
    categoryName: 'HPLC Columns',
    patterns: ['%Column%', '%column%'],
    excludePatterns: ['%GC%', '%Guard%', '%guard%'],
    priority: 50
  },
];

async function fixSubcategoryMappings() {
  console.log('=== 开始修复子分类产品映射 ===\n');
  
  // 1. 统计当前状态
  const totalProducts = await db.select({ count: sql<number>`count(*)` }).from(products);
  const mappedProducts = await db.select({ count: sql<number>`count(distinct productId)` }).from(productCategories);
  
  console.log(`总产品数: ${totalProducts[0].count}`);
  console.log(`已映射产品数: ${mappedProducts[0].count}`);
  console.log(`未映射产品数: ${totalProducts[0].count - mappedProducts[0].count}\n`);
  
  let totalMapped = 0;
  let totalSkipped = 0;
  
  // 2. 按优先级处理每个分类规则
  for (const rule of CATEGORY_RULES.sort((a, b) => b.priority - a.priority)) {
    console.log(`\n处理分类: ${rule.categoryName} (ID: ${rule.categoryId}, Priority: ${rule.priority})`);
    
    // 构建WHERE条件
    let whereConditions = '(';
    whereConditions += rule.patterns.map(p => `p.name LIKE '${p}'`).join(' OR ');
    whereConditions += ')';
    
    if (rule.excludePatterns && rule.excludePatterns.length > 0) {
      whereConditions += ' AND NOT (';
      whereConditions += rule.excludePatterns.map(p => `p.name LIKE '${p}'`).join(' OR ');
      whereConditions += ')';
    }
    
    // 查找匹配的未映射产品
    const query = `
      SELECT p.id, p.name
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.productId
      WHERE pc.productId IS NULL
      AND ${whereConditions}
    `;
    
    const matchingProducts = await db.execute(sql.raw(query));
    const productIds = (matchingProducts as any[]).map((row: any) => row.id);
    
    console.log(`找到 ${productIds.length} 个匹配产品`);
    
    if (productIds.length === 0) {
      console.log('跳过（无匹配产品）');
      continue;
    }
    
    // 显示前5个产品示例
    if (matchingProducts.length > 0) {
      console.log('产品示例:');
      (matchingProducts as any[]).slice(0, 5).forEach((row: any) => {
        console.log(`  - ${row.name}`);
      });
    }
    
    // 批量插入映射关系（每次100个）
    let inserted = 0;
    const batchSize = 100;
    
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      const values = batch.map(productId => ({
        productId,
        categoryId: rule.categoryId,
        isPrimary: 1
      }));
      
      try {
        await db.insert(productCategories).values(values);
        inserted += batch.length;
        if (inserted % 100 === 0 || inserted === productIds.length) {
          console.log(`  插入进度: ${inserted}/${productIds.length}`);
        }
      } catch (error) {
        console.error(`  批量插入失败:`, error);
        totalSkipped += batch.length;
      }
    }
    
    totalMapped += inserted;
    console.log(`✅ 成功映射 ${inserted} 个产品到 ${rule.categoryName}`);
  }
  
  // 3. 最终统计
  console.log('\n=== 修复完成 ===');
  const finalMappedProducts = await db.select({ count: sql<number>`count(distinct productId)` }).from(productCategories);
  const finalUnmappedProducts = await db.select({ count: sql<number>`count(*)` })
    .from(products)
    .leftJoin(productCategories, eq(products.id, productCategories.productId))
    .where(isNull(productCategories.productId));
  
  console.log(`\n最终统计:`);
  console.log(`- 总产品数: ${totalProducts[0].count}`);
  console.log(`- 已映射产品数: ${finalMappedProducts[0].count}`);
  console.log(`- 未映射产品数: ${finalUnmappedProducts[0].count}`);
  console.log(`- 本次新增映射: ${totalMapped}`);
  console.log(`- 跳过/失败: ${totalSkipped}`);
  
  // 4. 按分类统计
  console.log('\n=== 各分类产品统计 ===');
  const categoryStats = await db
    .select({
      categoryId: productCategories.categoryId,
      categoryName: categories.name,
      count: sql<number>`count(*)`
    })
    .from(productCategories)
    .leftJoin(categories, eq(productCategories.categoryId, categories.id))
    .groupBy(productCategories.categoryId, categories.name)
    .orderBy(sql`count(*) DESC`);
  
  categoryStats.forEach(stat => {
    console.log(`${stat.categoryName}: ${stat.count}个产品`);
  });
}

fixSubcategoryMappings().then(() => {
  console.log('\n✅ 所有操作完成！');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ 错误:', err);
  process.exit(1);
});
