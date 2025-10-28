-- 修复子分类产品映射
-- 将包含特定关键词的产品映射到正确的子分类

-- 1. Vials & Caps (id=13)
INSERT INTO product_categories (productId, categoryId, isPrimary)
SELECT DISTINCT p.id, 13, 1
FROM products p
LEFT JOIN product_categories pc ON p.id = pc.productId
WHERE pc.productId IS NULL
AND (
  p.name LIKE '%Vial%' OR
  p.name LIKE '%vial%' OR
  p.name LIKE '%Cap%' OR
  p.name LIKE '%cap%' OR
  p.name LIKE '%Septa%' OR
  p.name LIKE '%septa%'
);

-- 2. Syringes & Needles (id=14)
INSERT INTO product_categories (productId, categoryId, isPrimary)
SELECT DISTINCT p.id, 14, 1
FROM products p
LEFT JOIN product_categories pc ON p.id = pc.productId
WHERE pc.productId IS NULL
AND (
  p.name LIKE '%Syringe%' OR
  p.name LIKE '%syringe%' OR
  p.name LIKE '%Needle%' OR
  p.name LIKE '%needle%'
)
AND p.name NOT LIKE '%Filter%'
AND p.name NOT LIKE '%filter%';

-- 3. Fittings & Tubing (id=15)
INSERT INTO product_categories (productId, categoryId, isPrimary)
SELECT DISTINCT p.id, 15, 1
FROM products p
LEFT JOIN product_categories pc ON p.id = pc.productId
WHERE pc.productId IS NULL
AND (
  p.name LIKE '%Fitting%' OR
  p.name LIKE '%fitting%' OR
  p.name LIKE '%Tubing%' OR
  p.name LIKE '%tubing%' OR
  p.name LIKE '%PEEK%' OR
  p.name LIKE '%Connector%' OR
  p.name LIKE '%connector%'
);

-- 4. Syringe Filters (id=17)
INSERT INTO product_categories (productId, categoryId, isPrimary)
SELECT DISTINCT p.id, 17, 1
FROM products p
LEFT JOIN product_categories pc ON p.id = pc.productId
WHERE pc.productId IS NULL
AND (
  p.name LIKE '%Syringe Filter%' OR
  p.name LIKE '%syringe filter%'
);

-- 5. Membrane Filters (id=18)
INSERT INTO product_categories (productId, categoryId, isPrimary)
SELECT DISTINCT p.id, 18, 1
FROM products p
LEFT JOIN product_categories pc ON p.id = pc.productId
WHERE pc.productId IS NULL
AND (
  p.name LIKE '%Membrane%' OR
  p.name LIKE '%membrane%'
)
AND p.name NOT LIKE '%Syringe%'
AND p.name NOT LIKE '%syringe%';

-- 6. SPE Cartridges (id=20)
INSERT INTO product_categories (productId, categoryId, isPrimary)
SELECT DISTINCT p.id, 20, 1
FROM products p
LEFT JOIN product_categories pc ON p.id = pc.productId
WHERE pc.productId IS NULL
AND (
  p.name LIKE '%SPE%' OR
  p.name LIKE '%Cartridge%' OR
  p.name LIKE '%cartridge%'
)
AND p.name NOT LIKE '%GC%'
AND p.name NOT LIKE '%Guard%';

-- 查询最终统计
SELECT 
  c.id,
  c.name,
  COUNT(pc.productId) as product_count
FROM categories c
LEFT JOIN product_categories pc ON c.id = pc.categoryId
WHERE c.id IN (13, 14, 15, 17, 18, 20)
GROUP BY c.id, c.name
ORDER BY c.id;

