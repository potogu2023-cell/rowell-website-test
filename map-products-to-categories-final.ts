import { drizzle } from 'drizzle-orm/mysql2';
import { products, productCategories, categories } from './drizzle/schema';
import { eq, sql, isNull, or, and, like } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL!);

// 正确的分类ID（从数据库查询确认）
const CATEGORIES = {
  // Chromatography Columns子分类
  HPLC_COLUMNS: 2,
  GC_COLUMNS: 3,
  GUARD_COLUMNS: 4,
  
  // Chromatography Supplies子分类
  VIALS_CAPS: 13,
  SYRINGES_NEEDLES: 14,
  FITTINGS_TUBING: 15,
  
  // Filtration子分类
  SYRINGE_FILTERS: 17,
  MEMBRANE_FILTERS: 18,
  
  // Sample Preparation子分类
  SPE_CARTRIDGES: 20,
};

interface MappingRule {
  categoryId: number;
  categoryName: string;
  conditions: any[];
  priority: number;
}

async function mapProductsToCategories() {
  console.log('=== 开始产品分类映射 ===\n');
  
  // 1. 统计当前状态
  const totalProducts = await db.select({ count: sql<number>`count(*)` }).from(products);
  const mappedProducts = await db.select({ count: sql<number>`count(distinct productId)` }).from(productCategories);
  
  console.log(`总产品数: ${totalProducts[0].count}`);
  console.log(`已映射产品数: ${mappedProducts[0].count}`);
  console.log(`未映射产品数: ${totalProducts[0].count - mappedProducts[0].count}\n`);
  
  // 2. 定义映射规则（按优先级从高到低）
  const rules: MappingRule[] = [
    // Vials & Caps (最高优先级)
    {
      categoryId: CATEGORIES.VIALS_CAPS,
      categoryName: 'Vials & Caps',
      conditions: [
        like(products.name, '%Vial%'),
        like(products.name, '%vial%'),
        like(products.name, '%Cap%'),
        like(products.name, '%cap%'),
        like(products.name, '%Septa%'),
        like(products.name, '%septa%'),
      ],
      priority: 100
    },
    
    // Syringes & Needles
    {
      categoryId: CATEGORIES.SYRINGES_NEEDLES,
      categoryName: 'Syringes & Needles',
      conditions: [
        like(products.name, '%Syringe%'),
        like(products.name, '%syringe%'),
        like(products.name, '%Needle%'),
        like(products.name, '%needle%'),
      ],
      priority: 95
    },
    
    // Fittings & Tubing
    {
      categoryId: CATEGORIES.FITTINGS_TUBING,
      categoryName: 'Fittings & Tubing',
      conditions: [
        like(products.name, '%Fitting%'),
        like(products.name, '%fitting%'),
        like(products.name, '%Tubing%'),
        like(products.name, '%tubing%'),
        like(products.name, '%PEEK%'),
        like(products.name, '%Connector%'),
      ],
      priority: 90
    },
    
    // Syringe Filters
    {
      categoryId: CATEGORIES.SYRINGE_FILTERS,
      categoryName: 'Syringe Filters',
      conditions: [
        like(products.name, '%Syringe Filter%'),
        like(products.name, '%syringe filter%'),
      ],
      priority: 85
    },
    
    // Membrane Filters
    {
      categoryId: CATEGORIES.MEMBRANE_FILTERS,
      categoryName: 'Membrane Filters',
      conditions: [
        like(products.name, '%Membrane%'),
        like(products.name, '%membrane%'),
      ],
      priority: 80
    },
    
    // SPE Cartridges
    {
      categoryId: CATEGORIES.SPE_CARTRIDGES,
      categoryName: 'SPE Cartridges',
      conditions: [
        like(products.name, '%SPE%'),
        like(products.name, '%Cartridge%'),
        like(products.name, '%cartridge%'),
      ],
      priority: 75
    },
    
    // GC Columns
    {
      categoryId: CATEGORIES.GC_COLUMNS,
      categoryName: 'GC Columns',
      conditions: [
        like(products.name, '%GC%'),
        like(products.name, '%Gas Chromatography%'),
        like(products.name, '%Capillary%'),
      ],
      priority: 70
    },
    
    // Guard Columns
    {
      categoryId: CATEGORIES.GUARD_COLUMNS,
      categoryName: 'Guard Columns',
      conditions: [
        like(products.name, '%Guard%'),
        like(products.name, '%guard%'),
      ],
      priority: 65
    },
    
    // HPLC Columns (最低优先级，catch-all)
    {
      categoryId: CATEGORIES.HPLC_COLUMNS,
      categoryName: 'HPLC Columns',
      conditions: [
        like(products.name, '%Column%'),
        like(products.name, '%column%'),
      ],
      priority: 50
    },
  ];
  
  let totalMapped = 0;
  
  // 3. 按优先级处理每个规则
  for (const rule of rules) {
    console.log(`\n处理分类: ${rule.categoryName} (ID: ${rule.categoryId}, Priority: ${rule.priority})`);
    
    // 查找未映射的匹配产品
    const unmappedProducts = await db
      .select({ id: products.id, name: products.name })
      .from(products)
      .leftJoin(productCategories, eq(products.id, productCategories.productId))
      .where(
        and(
          isNull(productCategories.productId),
          or(...rule.conditions)
        )
      );
    
    console.log(`找到 ${unmappedProducts.length} 个匹配产品`);
    
    if (unmappedProducts.length === 0) {
      console.log('跳过（无匹配产品）');
      continue;
    }
    
    // 显示前5个产品示例
    console.log('产品示例:');
    unmappedProducts.slice(0, 5).forEach(p => {
      console.log(`  - ${p.name}`);
    });
    
    // 批量插入映射关系
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < unmappedProducts.length; i += batchSize) {
      const batch = unmappedProducts.slice(i, i + batchSize);
      const values = batch.map(p => ({
        productId: p.id,
        categoryId: rule.categoryId,
        isPrimary: 1
      }));
      
      try {
        await db.insert(productCategories).values(values);
        inserted += batch.length;
        if (inserted % 100 === 0 || inserted === unmappedProducts.length) {
          console.log(`  插入进度: ${inserted}/${unmappedProducts.length}`);
        }
      } catch (error) {
        console.error(`  批量插入失败:`, error);
      }
    }
    
    totalMapped += inserted;
    console.log(`✅ 成功映射 ${inserted} 个产品到 ${rule.categoryName}`);
  }
  
  // 4. 最终统计
  console.log('\n=== 映射完成 ===');
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
  
  // 5. 按分类统计
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

mapProductsToCategories().then(() => {
  console.log('\n✅ 所有操作完成！');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ 错误:', err);
  console.error(err.stack);
  process.exit(1);
});
