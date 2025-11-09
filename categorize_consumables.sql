-- Categorize consumables products

-- SPE Cartridges (category ID: 18)
INSERT INTO product_categories (productId, categoryId)
SELECT DISTINCT p.id, 18
FROM products p
WHERE p.brand IN ('Waters', 'Phenomenex')
  AND (
    LOWER(p.name) LIKE '%vanguard cartridge%'
    OR LOWER(p.name) LIKE '%spe cartridge%'
    OR LOWER(p.name) LIKE '%solid phase extraction%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM product_categories pc 
    WHERE pc.productId = p.id AND pc.categoryId = 18
  );

-- Autosampler Vials (category ID: 15)
INSERT INTO product_categories (productId, categoryId)
SELECT DISTINCT p.id, 15
FROM products p
WHERE p.brand IN ('Waters', 'Phenomenex')
  AND (
    LOWER(p.name) LIKE '%autosampler vial%'
    OR LOWER(p.name) LIKE '%sample vial%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM product_categories pc 
    WHERE pc.productId = p.id AND pc.categoryId = 15
  );

-- Syringe Filters (category ID: 16)
INSERT INTO product_categories (productId, categoryId)
SELECT DISTINCT p.id, 16
FROM products p
WHERE p.brand IN ('Waters', 'Phenomenex')
  AND (
    LOWER(p.name) LIKE '%syringe filter%'
    OR LOWER(p.name) LIKE '%phenex-%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM product_categories pc 
    WHERE pc.productId = p.id AND pc.categoryId = 16
  );

-- Septa and Caps (category ID: 17)
INSERT INTO product_categories (productId, categoryId)
SELECT DISTINCT p.id, 17
FROM products p
WHERE p.brand IN ('Waters', 'Phenomenex')
  AND (
    LOWER(p.name) LIKE '%screw cap%'
    OR LOWER(p.name) LIKE '%septa%'
    OR LOWER(p.name) LIKE '%closure%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM product_categories pc 
    WHERE pc.productId = p.id AND pc.categoryId = 17
  );

-- Show results
SELECT 'SPE Cartridges' as category, COUNT(*) as product_count
FROM product_categories WHERE categoryId = 18
UNION ALL
SELECT 'Autosampler Vials', COUNT(*)
FROM product_categories WHERE categoryId = 15
UNION ALL
SELECT 'Syringe Filters', COUNT(*)
FROM product_categories WHERE categoryId = 16
UNION ALL
SELECT 'Septa and Caps', COUNT(*)
FROM product_categories WHERE categoryId = 17;
