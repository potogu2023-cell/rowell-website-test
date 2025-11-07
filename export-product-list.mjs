import mysql from 'mysql2/promise';
import fs from 'fs';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('正在导出产品清单...\n');

// 导出所有产品的基本信息
const [products] = await connection.execute(`
  SELECT productId, partNumber, brand, name
  FROM products
  ORDER BY brand, partNumber
`);

console.log(`找到 ${products.length} 个产品\n`);

// 生成CSV内容
const csvHeader = 'productId,partNumber,brand,name\n';
const csvRows = products.map(p => {
  const name = (p.name || '').replace(/"/g, '""'); // 转义双引号
  return `"${p.productId}","${p.partNumber}","${p.brand}","${name}"`;
}).join('\n');

const csvContent = csvHeader + csvRows;

// 保存CSV文件
const filename = `product_list_for_crawler_${new Date().toISOString().split('T')[0]}.csv`;
fs.writeFileSync(filename, csvContent, 'utf8');

console.log(`✅ 产品清单已导出: ${filename}`);
console.log(`\n按品牌统计:`);

// 统计各品牌产品数
const brandCounts = {};
products.forEach(p => {
  brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
});

Object.entries(brandCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([brand, count]) => {
    console.log(`  ${brand}: ${count}个产品`);
  });

await connection.end();

console.log('\n✅ 导出完成!');
