import { publicProcedure, router } from "./_core/trpc";
import { z } from 'zod';
import mysql from 'mysql2/promise';

export const fullConsistencyCheckRouter = router({
  run: publicProcedure
    .query(async () => {

      const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL!,
        ssl: { rejectUnauthorized: true }
      });
      
      try {
        const results: any = {};
        
        // 1. 产品总数统计
        const [totalRows] = await connection.execute(
          'SELECT COUNT(*) as total FROM products'
        );
        results.totalProducts = (totalRows as any)[0].total;
        
        const [activeRows] = await connection.execute(
          'SELECT COUNT(*) as total FROM products WHERE status = ?',
          ['active']
        );
        results.activeProducts = (activeRows as any)[0].total;
        
        // 2. 分类关联统计
        const [withCategoryRows] = await connection.execute(
          'SELECT COUNT(DISTINCT product_id) as total FROM product_categories'
        );
        results.productsWithCategory = (withCategoryRows as any)[0].total;
        
        const [withoutCategoryRows] = await connection.execute(
          'SELECT COUNT(*) as total FROM products WHERE status = "active" AND id NOT IN (SELECT DISTINCT product_id FROM product_categories)'
        );
        results.orphanProducts = (withoutCategoryRows as any)[0].total;
        
        // 3. category_id不一致检查
        const [inconsistentRows] = await connection.execute(`
          SELECT COUNT(*) as total FROM products p
          JOIN product_categories pc ON p.id = pc.product_id AND pc.is_primary = 1
          WHERE p.category_id != pc.category_id
        `);
        results.inconsistentCategoryId = (inconsistentRows as any)[0].total;
        
        // 4. 分类分布
        const [categoryDist] = await connection.execute(`
          SELECT c.id, c.name_en as name, c.slug, COUNT(pc.product_id) as product_count
          FROM categories c
          LEFT JOIN product_categories pc ON c.id = pc.category_id
          GROUP BY c.id, c.name_en, c.slug
          ORDER BY product_count DESC
          LIMIT 30
        `);
        results.categoryDistribution = categoryDist;
        
        // 5. 重复的分类关联
        const [duplicateRows] = await connection.execute(`
          SELECT COUNT(*) as total FROM (
            SELECT product_id, category_id, COUNT(*) as count
            FROM product_categories
            GROUP BY product_id, category_id
            HAVING count > 1
          ) as duplicates
        `);
        results.duplicateAssociations = (duplicateRows as any)[0].total;
        
        // 6. 多主分类产品
        const [multiplePrimaryRows] = await connection.execute(`
          SELECT COUNT(*) as total FROM (
            SELECT product_id, COUNT(*) as primary_count
            FROM product_categories
            WHERE is_primary = 1
            GROUP BY product_id
            HAVING primary_count > 1
          ) as multiples
        `);
        results.multiplePrimaryProducts = (multiplePrimaryRows as any)[0].total;
        
        // 7. 无分类关联的产品样本
        if (results.orphanProducts > 0) {
          const [orphanSamples] = await connection.execute(`
            SELECT id, productId, partNumber, brand, productName, category_id, status
            FROM products
            WHERE status = "active" AND id NOT IN (SELECT DISTINCT product_id FROM product_categories)
            LIMIT 20
          `);
          results.orphanSamples = orphanSamples;
        }
        
        return {
          success: true,
          timestamp: new Date().toISOString(),
          results
        };
      } finally {
        await connection.end();
      }
    }),
});
