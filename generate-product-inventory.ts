import { getDb } from './server/db';
import * as fs from 'fs';

async function generateProductInventory() {
  console.log('=== 生成产品清单 ===\n');
  
  const db = await getDb();
  if (!db) {
    console.error('无法连接数据库');
    process.exit(1);
  }

  // 查询所有产品及其分类信息
  const query = `
    SELECT 
      p.id,
      p.name,
      p.brand,
      p.partNumber,
      p.imageUrl,
      c.id as categoryId,
      c.name as categoryName,
      c.slug as categorySlug
    FROM products p
    LEFT JOIN product_categories pc ON p.id = pc.productId
    LEFT JOIN categories c ON pc.categoryId = c.id
    ORDER BY c.name, p.brand, p.name
  `;
  
  const result: any = await db.execute(query);
  const products = result[0];
  
  console.log(`找到 ${products.length} 个产品\n`);

  // 定义产品类型识别规则
  const productTypeRules = [
    { type: 'Vial', keywords: ['Vial', 'vial'], excludeKeywords: [] },
    { type: 'Cap', keywords: ['Cap', 'cap', 'Septa', 'septa'], excludeKeywords: ['Cartridge', 'cartridge'] },
    { type: 'Syringe', keywords: ['Syringe', 'syringe'], excludeKeywords: ['Filter', 'filter'] },
    { type: 'Needle', keywords: ['Needle', 'needle'], excludeKeywords: [] },
    { type: 'Syringe Filter', keywords: ['Syringe Filter', 'syringe filter'], excludeKeywords: [] },
    { type: 'Membrane Filter', keywords: ['Membrane', 'membrane'], excludeKeywords: ['Syringe', 'syringe'] },
    { type: 'Filter (Other)', keywords: ['Filter', 'filter'], excludeKeywords: ['Syringe', 'syringe', 'Membrane', 'membrane'] },
    { type: 'HPLC Column', keywords: ['Column', 'column'], excludeKeywords: ['GC', 'gc', 'Guard', 'guard'] },
    { type: 'GC Column', keywords: ['GC', 'gc', 'Gas Chromatography'], excludeKeywords: [] },
    { type: 'Guard Column', keywords: ['Guard', 'guard'], excludeKeywords: [] },
    { type: 'SPE Cartridge', keywords: ['SPE', 'Cartridge', 'cartridge'], excludeKeywords: [] },
    { type: 'Fitting', keywords: ['Fitting', 'fitting', 'Connector', 'connector'], excludeKeywords: [] },
    { type: 'Tubing', keywords: ['Tubing', 'tubing', 'PEEK'], excludeKeywords: [] },
  ];

  // 识别每个产品的类型
  const productsWithType = products.map((product: any) => {
    let productType = 'Other';
    
    for (const rule of productTypeRules) {
      const hasKeyword = rule.keywords.some(kw => product.name.includes(kw));
      const hasExcludeKeyword = rule.excludeKeywords.some(kw => product.name.includes(kw));
      
      if (hasKeyword && !hasExcludeKeyword) {
        productType = rule.type;
        break;
      }
    }
    
    return {
      ...product,
      productType
    };
  });

  // 统计每种产品类型的数量
  const typeStats: Record<string, number> = {};
  productsWithType.forEach((product: any) => {
    typeStats[product.productType] = (typeStats[product.productType] || 0) + 1;
  });

  console.log('=== 产品类型统计 ===');
  console.table(
    Object.entries(typeStats)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }))
  );

  // 生成CSV文件
  const csvHeader = 'ID,Name,Brand,Part Number,Category,Product Type,Current Image URL,Suggested Image Type\n';
  const csvRows = productsWithType.map((product: any) => {
    const suggestedImageType = product.productType !== 'Other' ? product.productType : product.categoryName || 'Generic';
    return [
      product.id,
      `"${product.name.replace(/"/g, '""')}"`,
      product.brand,
      product.partNumber || '',
      product.categoryName || 'Uncategorized',
      product.productType,
      product.imageUrl || '',
      suggestedImageType
    ].join(',');
  });
  
  const csvContent = csvHeader + csvRows.join('\n');
  
  const outputPath = '/home/ubuntu/product-inventory.csv';
  fs.writeFileSync(outputPath, csvContent, 'utf-8');
  console.log(`\n✅ 产品清单已保存到: ${outputPath}`);

  // 生成Markdown报告
  const mdContent = `# 产品清单和图片优化方案

## 产品类型统计

| 产品类型 | 数量 | 建议图片 |
|---------|------|---------|
${Object.entries(typeStats)
  .sort((a, b) => b[1] - a[1])
  .map(([type, count]) => `| ${type} | ${count} | ${type}.png |`)
  .join('\n')}

## 图片优化建议

### 1. 优先级1：高频产品类型（>100个产品）

${Object.entries(typeStats)
  .filter(([_, count]) => count > 100)
  .sort((a, b) => b[1] - a[1])
  .map(([type, count]) => `- **${type}** (${count}个产品): 需要设计专属图片`)
  .join('\n')}

### 2. 优先级2：中频产品类型（10-100个产品）

${Object.entries(typeStats)
  .filter(([_, count]) => count >= 10 && count <= 100)
  .sort((a, b) => b[1] - a[1])
  .map(([type, count]) => `- **${type}** (${count}个产品): 可以共享相似图片`)
  .join('\n')}

### 3. 优先级3：低频产品类型（<10个产品）

${Object.entries(typeStats)
  .filter(([_, count]) => count < 10)
  .sort((a, b) => b[1] - a[1])
  .map(([type, count]) => `- **${type}** (${count}个产品): 使用通用图片`)
  .join('\n')}

## 图片设计要求

### 技术规格
- **尺寸**: 1024x1024px
- **格式**: PNG（透明背景）或JPG（白色背景）
- **风格**: 技术插图或产品照片
- **命名**: {product_type}.png（例如：vial.png, syringe.png）

### 视觉要求
- 清晰展示产品特征
- 统一的视觉风格
- 适合网页显示
- 支持缩放到不同尺寸

## 实施步骤

1. **设计图片**: 为每种产品类型设计专属图片
2. **上传图片**: 将图片上传到 \`/public/product-images/\` 目录
3. **更新数据库**: 批量更新产品的imageUrl字段
4. **验证显示**: 检查所有产品页面的图片显示

## 产品清单

完整的产品清单已保存到CSV文件：\`/home/ubuntu/product-inventory.csv\`

CSV文件包含以下字段：
- ID: 产品ID
- Name: 产品名称
- Brand: 品牌
- Part Number: 部件号
- Category: 产品分类
- Product Type: 产品类型（自动识别）
- Current Image URL: 当前图片URL
- Suggested Image Type: 建议的图片类型

---

**生成时间**: ${new Date().toISOString()}
**总产品数**: ${products.length}
**产品类型数**: ${Object.keys(typeStats).length}
`;

  const mdOutputPath = '/home/ubuntu/PRODUCT_INVENTORY_REPORT.md';
  fs.writeFileSync(mdOutputPath, mdContent, 'utf-8');
  console.log(`✅ 产品清单报告已保存到: ${mdOutputPath}`);
}

generateProductInventory().then(() => {
  console.log('\n✅ 完成！');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ 错误:', err);
  process.exit(1);
});
