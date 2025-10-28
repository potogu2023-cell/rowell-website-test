import Database from "better-sqlite3";

const db = new Database(process.env.DATABASE_URL!.replace('file:', ''));

// 查询所有产品及其主分类
const products = db.prepare(`
  SELECT 
    p.partNumber as productId,
    p.partNumber,
    p.brand,
    c.name as productType,
    p.imageUrl as currentImageUrl
  FROM products p
  LEFT JOIN productCategories pc ON p.id = pc.productId AND pc.isPrimary = 1
  LEFT JOIN categories c ON pc.categoryId = c.id
  ORDER BY p.brand, c.name, p.partNumber
`).all();

console.log('productId,partNumber,brand,productType,currentImageUrl');
products.forEach((p: any) => {
  console.log(`${p.productId},${p.partNumber},${p.brand},${p.productType || 'Unknown'},${p.currentImageUrl || ''}`);
});

console.error(`\nTotal products exported: ${products.length}`);
