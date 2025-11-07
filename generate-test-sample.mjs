import mysql from 'mysql2/promise';
import fs from 'fs';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('正在生成50产品测试样本...\n');

// 从每个主要品牌抽取样本
const brands = [
  { name: 'Agilent', count: 10 },
  { name: 'Thermo Fisher Scientific', count: 10 },
  { name: 'Waters', count: 10 },
  { name: 'Phenomenex', count: 5 },
  { name: 'Restek', count: 5 },
  { name: 'Daicel', count: 5 },
  { name: 'Merck', count: 5 }
];

const allSamples = [];

for (const brand of brands) {
  const [products] = await connection.execute(
    `SELECT productId, partNumber, brand, name
     FROM products
     WHERE brand = ?
     ORDER BY RAND()
     LIMIT ${brand.count}`,
    [brand.name]
  );
  
  console.log(`${brand.name}: 抽取 ${products.length} 个产品`);
  allSamples.push(...products);
}

console.log(`\n总计: ${allSamples.length} 个测试样本\n`);

// 生成CSV
const csvHeader = 'productId,partNumber,brand,name\n';
const csvRows = allSamples.map(p => {
  const name = (p.name || '').replace(/"/g, '""');
  return `"${p.productId}","${p.partNumber}","${p.brand}","${name}"`;
}).join('\n');

const csvContent = csvHeader + csvRows;

// 保存文件
const filename = 'product_list_test_sample_50.csv';
fs.writeFileSync(filename, csvContent, 'utf8');

console.log(`✅ 测试样本已导出: ${filename}`);

// 生成说明文档
const readme = `# 测试样本清单说明

**文件名**: ${filename}
**生成时间**: ${new Date().toISOString()}
**样本数量**: ${allSamples.length}个产品

## 样本分布

| 品牌 | 样本数量 |
|------|---------|
${brands.map(b => `| ${b.name} | ${b.count} |`).join('\n')}

## 使用建议

### 1. 测试目的

这50个产品样本用于:
- 验证爬虫脚本的正确性
- 测试数据格式和质量
- 评估爬取时间和效率
- 发现潜在问题

### 2. 测试流程

1. **使用此样本文件进行小规模测试**
2. **验证爬取结果的准确性**
3. **调整爬虫脚本和策略**
4. **确认无误后再使用完整的2689产品清单**

### 3. 预期结果

测试完成后应该得到:
- 50个产品的完整文字信息
- 每个产品包含: name, description, specifications
- JSON格式有效
- 数据准确无误

### 4. 问题反馈

如果在测试中发现问题,请记录:
- 哪些品牌的产品容易爬取
- 哪些品牌的产品有困难
- 数据格式是否需要调整
- 是否需要修改爬取策略

## 下一步

测试成功后,使用完整清单:
- **product_list_for_crawler_2025-11-05.csv** (2689个产品)

---

**生成者**: ROWELL项目团队
**日期**: 2025-01-04
`;

fs.writeFileSync('TEST_SAMPLE_README.md', readme, 'utf8');
console.log(`✅ 说明文档已生成: TEST_SAMPLE_README.md\n`);

await connection.end();
