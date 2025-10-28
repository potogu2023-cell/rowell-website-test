import { drizzle } from 'drizzle-orm/mysql2';
import { products, productCategories, categories } from './drizzle/schema';
import { eq, sql, and, isNull } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL!);

// Category IDs (from database query)
const CATEGORY_IDS = {
  HPLC_ANALYTICAL: 8,      // Analytical Columns
  HPLC_PREP: 9,            // Preparative Columns  
  HPLC_SPECIALTY: 10,      // Specialty Columns
  GC_CAPILLARY: 12,        // Capillary Columns
  GUARD: 13,               // Guard Columns
  SPE: 15,                 // SPE Cartridges
  VIALS: 18,               // Vials & Caps
  FILTERS: 20,             // Syringe Filters
  MEMBRANE: 21,            // Membrane Filters
};

interface CategoryRule {
  categoryId: number;
  patterns: string[];
  excludePatterns?: string[];
  priority: number; // Higher number = higher priority
}

const CATEGORY_RULES: CategoryRule[] = [
  // GC Columns (highest priority)
  {
    categoryId: CATEGORY_IDS.GC_CAPILLARY,
    patterns: ['%GC%', '%Gas Chromatography%', '%Capillary%'],
    priority: 100
  },
  
  // Guard Columns
  {
    categoryId: CATEGORY_IDS.GUARD,
    patterns: ['%Guard%', '%guard%'],
    priority: 90
  },
  
  // SPE Cartridges
  {
    categoryId: CATEGORY_IDS.SPE,
    patterns: ['%SPE%', '%Cartridge%', '%cartridge%'],
    excludePatterns: ['%GC%', '%Guard%'],
    priority: 80
  },
  
  // Syringe Filters
  {
    categoryId: CATEGORY_IDS.FILTERS,
    patterns: ['%Syringe Filter%', '%syringe filter%', '%Filter%'],
    excludePatterns: ['%Membrane%'],
    priority: 70
  },
  
  // Membrane Filters
  {
    categoryId: CATEGORY_IDS.MEMBRANE,
    patterns: ['%Membrane%', '%membrane%'],
    priority: 75
  },
  
  // Vials & Caps
  {
    categoryId: CATEGORY_IDS.VIALS,
    patterns: ['%Vial%', '%vial%', '%Cap%', '%cap%', '%Septa%', '%septa%'],
    priority: 60
  },
  
  // HPLC Columns (lowest priority, catch-all for columns)
  {
    categoryId: CATEGORY_IDS.HPLC_ANALYTICAL,
    patterns: ['%Column%', '%column%'],
    excludePatterns: ['%GC%', '%Guard%', '%guard%'],
    priority: 50
  },
];

async function fixProductCategoryMappings() {
  console.log('=== 开始修复产品分类映射 ===\n');
  
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
    console.log(`\n处理分类规则: Priority ${rule.priority}, Category ID ${rule.categoryId}`);
    
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
      SELECT p.id
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
        console.log(`  插入进度: ${inserted}/${productIds.length}`);
      } catch (error) {
        console.error(`  批量插入失败:`, error);
        totalSkipped += batch.length;
      }
    }
    
    totalMapped += inserted;
    console.log(`✅ 成功映射 ${inserted} 个产品到分类 ${rule.categoryId}`);
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

fixProductCategoryMappings().then(() => {
  console.log('\n✅ 所有操作完成！');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ 错误:', err);
  process.exit(1);
});
