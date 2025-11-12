import { drizzle } from 'drizzle-orm/mysql2';
import { products, productCategories } from '../drizzle/schema';
import { eq, inArray, isNull, or } from 'drizzle-orm';

async function autoReclassifyProducts() {
  const db = drizzle(process.env.DATABASE_URL!);
  
  console.log('=== 智能产品分类系统 ===\n');
  
  // 分类规则映射
  const categoryRules = [
    // HPLC Columns (11)
    {
      id: 11,
      name: 'HPLC Columns',
      keywords: ['hplc column', 'lc column', 'uplc column', 'uhplc column', 'analytical column', 'prep column', 'preparative column']
    },
    // GC Columns (12)
    {
      id: 12,
      name: 'GC Columns',
      keywords: ['gc column', 'gas chromatography column', 'capillary column', 'packed column']
    },
    // Guard Columns (13)
    {
      id: 13,
      name: 'Guard Columns',
      keywords: ['guard', 'vanguard', 'pre-column', 'precolumn', 'guard cartridge', 'guard column', 'security guard']
    },
    // Vials & Caps (21)
    {
      id: 21,
      name: 'Vials & Caps',
      keywords: ['vial', 'cap', 'septa', 'closure', 'crimp', 'screw thread', 'autosampler vial']
    },
    // Syringes & Needles (22)
    {
      id: 22,
      name: 'Syringes & Needles',
      keywords: ['syringe', 'needle', 'injection', 'hamilton', 'sge']
    },
    // Fittings & Tubing (23)
    {
      id: 23,
      name: 'Fittings & Tubing',
      keywords: ['fitting', 'tubing', 'ferrule', 'connector', 'union', 'tee', 'adapter']
    },
    // SPE Cartridges (31)
    {
      id: 31,
      name: 'SPE Cartridges',
      keywords: ['spe', 'solid phase extraction', 'extraction cartridge', 'oasis', 'strata']
    },
    // Derivatization (33)
    {
      id: 33,
      name: 'Derivatization',
      keywords: ['derivatization', 'derivatisation']
    },
    // Syringe Filters (41)
    {
      id: 41,
      name: 'Syringe Filters',
      keywords: ['syringe filter', 'filter syringe', 'membrane filter', 'disc filter', 'phenex']
    },
    // Plasticware (52)
    {
      id: 52,
      name: 'Plasticware',
      keywords: ['centrifuge tube', 'microcentrifuge', 'conical tube', 'pipette tip']
    },
    // Spectroscopy (6)
    {
      id: 6,
      name: 'Spectroscopy',
      keywords: ['cuvette', 'cell', 'spectroscopy', 'uv cell']
    }
  ];
  
  // 获取所有需要分类的产品
  const allProducts = await db.select({ id: products.id }).from(products);
  const categorizedProductIds = await db.select({ productId: productCategories.productId })
    .from(productCategories);
  
  const categorizedIds = new Set(categorizedProductIds.map(p => p.productId));
  const uncategorizedProductIds = allProducts.filter(p => !categorizedIds.has(p.id)).map(p => p.id);
  
  // 获取Consumables中的产品
  const consumablesProductIds = await db.select({ productId: productCategories.productId })
    .from(productCategories)
    .where(eq(productCategories.categoryId, 60007));
  
  const allProductIdsToClassify = [
    ...uncategorizedProductIds,
    ...consumablesProductIds.map(p => p.productId)
  ];
  
  console.log(`需要分类的产品总数: ${allProductIdsToClassify.length}`);
  console.log(`- 完全未分类: ${uncategorizedProductIds.length}`);
  console.log(`- Consumables分类: ${consumablesProductIds.length}\n`);
  
  let classified = 0;
  let skipped = 0;
  
  // 分批处理产品
  const batchSize = 100;
  for (let i = 0; i < allProductIdsToClassify.length; i += batchSize) {
    const batch = allProductIdsToClassify.slice(i, i + batchSize);
    
    const productsToClassify = await db.select({
      id: products.id,
      productId: products.productId,
      name: products.name
    })
    .from(products)
    .where(inArray(products.id, batch));
    
    for (const product of productsToClassify) {
      if (!product.name) {
        skipped++;
        continue;
      }
      
      const nameLower = product.name.toLowerCase();
      let matchedCategoryId: number | null = null;
      
      // 按优先级匹配分类
      for (const rule of categoryRules) {
        for (const keyword of rule.keywords) {
          if (nameLower.includes(keyword)) {
            matchedCategoryId = rule.id;
            break;
          }
        }
        if (matchedCategoryId) break;
      }
      
      if (matchedCategoryId) {
        // 检查是否已有该分类
        const existing = await db.select()
          .from(productCategories)
          .where(eq(productCategories.productId, product.id));
        
        const hasCategory = existing.some(pc => pc.categoryId === matchedCategoryId);
        
        if (!hasCategory) {
          // 如果产品在Consumables中，先删除该关联
          if (consumablesProductIds.some(p => p.productId === product.id)) {
            await db.delete(productCategories)
              .where(eq(productCategories.productId, product.id));
          }
          
          // 添加新分类
          await db.insert(productCategories).values({
            productId: product.id,
            categoryId: matchedCategoryId,
            isPrimary: 1
          });
          
          classified++;
          if (classified % 50 === 0) {
            console.log(`已分类: ${classified}/${allProductIdsToClassify.length}`);
          }
        }
      } else {
        skipped++;
      }
    }
  }
  
  console.log('\n=== 分类完成 ===');
  console.log(`成功分类: ${classified}个`);
  console.log(`跳过: ${skipped}个（无法匹配或无产品名称）`);
  console.log(`成功率: ${((classified / allProductIdsToClassify.length) * 100).toFixed(1)}%`);
  
  process.exit(0);
}

autoReclassifyProducts().catch(console.error);
