import { publicProcedure, router } from "./_core/trpc";
import mysql from 'mysql2/promise';

export const createGcCategoriesRouter = router({
  create: publicProcedure.query(async () => {
    try {
      const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL!,
        ssl: {
          rejectUnauthorized: true
        }
      });

      const results = {
        parent: null as any,
        subcategories: [] as any[],
        errors: [] as string[]
      };

      // 1. Create GC Columns parent category
      try {
        const [parentResult] = await connection.execute(`
          INSERT INTO categories (name_en, slug, parent_id, created_at, updated_at)
          VALUES ('GC Columns', 'gc-columns', NULL, NOW(), NOW())
        `);
        results.parent = {
          id: (parentResult as any).insertId,
          name: 'GC Columns',
          slug: 'gc-columns'
        };
      } catch (error: any) {
        results.errors.push(`Parent category error: ${error.message}`);
        await connection.end();
        return { success: false, error: error.message, results };
      }

      const parentId = results.parent.id;

      // 2. Create subcategories
      const subcategories = [
        { name: 'Capillary GC Columns', slug: 'capillary-gc-columns' },
        { name: 'Packed GC Columns', slug: 'packed-gc-columns' },
        { name: 'GC Guard Columns', slug: 'gc-guard-columns' },
        { name: 'Other GC Columns', slug: 'other-gc-columns' }
      ];

      for (const subcat of subcategories) {
        try {
          const [subResult] = await connection.execute(`
            INSERT INTO categories (name_en, slug, parent_id, created_at, updated_at)
            VALUES (?, ?, ?, NOW(), NOW())
          `, [subcat.name, subcat.slug, parentId]);
          
          results.subcategories.push({
            id: (subResult as any).insertId,
            name: subcat.name,
            slug: subcat.slug,
            parent_id: parentId
          });
        } catch (error: any) {
          results.errors.push(`Subcategory ${subcat.name} error: ${error.message}`);
        }
      }

      await connection.end();

      return {
        success: true,
        results
      };
    } catch (error: any) {
      console.error('Error creating GC categories:', error);
      return {
        success: false,
        error: error.message
      };
    }
  })
});
