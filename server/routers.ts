
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getProductsByIds, createInquiry, createInquiryItems } from './db';
import { generateInquiryNumber } from './inquiryUtils';
import { sendInquiryEmail } from './emailService';
import { z } from 'zod';
import { seedRouter } from './seed-api';
import { adminRouter } from './admin-api';
import { listCategoriesRouter } from './list-categories-api';
import { addGlycoWorksSimpleRouter } from './add-glycoworks-simple';
import { updateProductCategoryRouter } from './update-product-category';
import { updateGlycoWorksMysql2Router } from './update-glycoworks-mysql2';
import { describeProductsTableRouter } from './describe-products-table';
import { queryCategoriesRouter } from './query-categories';


export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,

  // Product routes
  products: router({
    list: publicProcedure
      .input((raw: unknown) => {
        const { productsListInput } = require('./products_list_new');
        return productsListInput.parse(raw);
      })
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const { productsListQuery } = await import('./products_list_new');
        const db = await getDb();
        return await productsListQuery(input, db);
      }),
    
    getByIds: publicProcedure
      .input((raw: unknown) => {
        return z.object({
          productIds: z.array(z.number()),
        }).parse(raw);
      })
      .query(async ({ input }) => {
        return await getProductsByIds(input.productIds);
      }),
    
    getBySlug: publicProcedure
      .input((raw: unknown) => {
        return z.string().parse(raw);
      })
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const { products } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const db = await getDb();
        
        // Query product by productId (slug)
        const result = await db
          .select()
          .from(products)
          .where(eq(products.productId, input))
          .limit(1);
        
        return result[0] || null;
      }),
    
    getRelated: publicProcedure
      .input((raw: unknown) => {
        return z.object({
          productId: z.string(),
          limit: z.number().optional().default(6),
        }).parse(raw);
      })
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const { products } = await import('../drizzle/schema');
        const { eq, and, or, ne, sql } = await import('drizzle-orm');
        const db = await getDb();
        
        // First, get the current product
        const currentProduct = await db
          .select()
          .from(products)
          .where(eq(products.productId, input.productId))
          .limit(1);
        
        if (!currentProduct || currentProduct.length === 0) {
          return [];
        }
        
        const product = currentProduct[0];
        
        // Build recommendation query based on similarity
        // Priority: same brand > similar specs > same phase type > same USP
        const relatedProducts = await db
          .select()
          .from(products)
          .where(
            and(
              ne(products.id, product.id), // Exclude current product
              eq(products.status, 'active'), // Only active products
              or(
                eq(products.brand, product.brand), // Same brand
                eq(products.phaseType, product.phaseType), // Same phase type
                eq(products.usp, product.usp), // Same USP
                // Similar particle size (within 1 µm)
                product.particleSize ? sql`ABS(${products.particleSize} - ${product.particleSize}) <= 1` : undefined,
              )
            )
          )
          .limit(input.limit);
        
        return relatedProducts;
      }),
  }),

  // Customer messages routes
  messages: router({
    list: publicProcedure
      .input((raw: unknown) => {
        return z.object({
          status: z.enum(['new', 'read', 'replied', 'closed', 'all']).optional().default('all'),
          page: z.number().optional().default(1),
          pageSize: z.number().optional().default(20),
          search: z.string().optional(),
        }).parse(raw);
      })
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const { customerMessages } = await import('../drizzle/schema');
        const { eq, desc, or, sql, and } = await import('drizzle-orm');
        const db = await getDb();
        
        const conditions = [];
        
        // Status filter
        if (input.status !== 'all') {
          conditions.push(eq(customerMessages.status, input.status));
        }
        
        // Search filter
        if (input.search) {
          const searchTerm = `%${input.search}%`;
          conditions.push(
            or(
              sql`LOWER(${customerMessages.name}) LIKE ${searchTerm.toLowerCase()}`,
              sql`LOWER(${customerMessages.email}) LIKE ${searchTerm.toLowerCase()}`,
              sql`LOWER(${customerMessages.productId}) LIKE ${searchTerm.toLowerCase()}`,
              sql`LOWER(${customerMessages.message}) LIKE ${searchTerm.toLowerCase()}`
            )!
          );
        }
        
        // Build where clause
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        
        // Get total count
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(customerMessages)
          .where(whereClause);
        const total = countResult[0]?.count || 0;
        
        // Get messages with pagination
        const messages = await db
          .select()
          .from(customerMessages)
          .where(whereClause)
          .orderBy(desc(customerMessages.createdAt))
          .limit(input.pageSize)
          .offset((input.page - 1) * input.pageSize);
        
        return {
          messages,
          total,
          totalPages: Math.ceil(total / input.pageSize),
        };
      }),
    
    updateStatus: publicProcedure
      .input((raw: unknown) => {
        return z.object({
          id: z.number(),
          status: z.enum(['new', 'read', 'replied', 'closed']),
        }).parse(raw);
      })
      .mutation(async ({ input }) => {
        const { getDb } = await import('./db');
        const { customerMessages } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const db = await getDb();
        
        await db
          .update(customerMessages)
          .set({ status: input.status })
          .where(eq(customerMessages.id, input.id));
        
        return { success: true };
      }),
    
    getStats: publicProcedure
      .query(async () => {
        const { getDb } = await import('./db');
        const { customerMessages } = await import('../drizzle/schema');
        const { eq, sql } = await import('drizzle-orm');
        const db = await getDb();
        
        const stats = await db
          .select({
            status: customerMessages.status,
            count: sql<number>`count(*)`
          })
          .from(customerMessages)
          .groupBy(customerMessages.status);
        
        const statsMap = {
          new: 0,
          read: 0,
          replied: 0,
          closed: 0,
          total: 0,
        };
        
        stats.forEach(stat => {
          statsMap[stat.status as keyof typeof statsMap] = stat.count;
          statsMap.total += stat.count;
        });
        
        return statsMap;
      }),
    
    create: publicProcedure
      .input((raw: unknown) => {
        return z.object({
          type: z.enum(['inquiry', 'message', 'quote_request']).default('message'),
          name: z.string().min(2, '姓名至少 2 个字符').max(100, '姓名最多 100 个字符'),
          email: z.string().email('请输入有效的邮箱地址'),
          company: z.string().optional(),
          phone: z.string().optional(),
          productId: z.string().optional(),
          productName: z.string().optional(),
          message: z.string().min(10, '留言至少 10 个字符').max(1000, '留言最多 1000 个字符'),
        }).parse(raw);
      })
      .mutation(async ({ input }) => {
        const { getDb } = await import('./db');
        const { customerMessages } = await import('../drizzle/schema');
        const db = await getDb();
        
        // Insert message into database
        const result = await db.insert(customerMessages).values({
          type: input.type || 'message',
          name: input.name,
          email: input.email,
          company: input.company,
          phone: input.phone,
          productId: input.productId,
          productName: input.productName,
          message: input.message,
          status: 'new',
        });
        
        // Send notification email (optional)
        try {
          const { sendCustomerMessageNotification } = await import('./email_notification');
          await sendCustomerMessageNotification({
            type: input.type || 'message',
            name: input.name,
            email: input.email,
            phone: input.phone,
            company: input.company,
            message: input.message,
            productId: input.productId,
            productName: input.productName,
          });
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError);
        }
        
        return {
          success: true,
          messageId: result[0].insertId,
        };
      }),
  }),

  // Inquiry routes
  inquiries: router({
    create: publicProcedure
      .input((raw: unknown) => {
        return z.object({
          productIds: z.array(z.number()).min(1, '请选择至少一个产品'),
          userInfo: z.object({
            name: z.string().min(2, '姓名至少 2 个字符').max(50, '姓名最多 50 个字符'),
            email: z.string().email('请输入有效的邮箱地址'),
            company: z.string().optional(),
            phone: z.string().optional(),
            message: z.string().max(500, '留言最多 500 个字符').optional(),
          }),
        }).parse(raw);
      })
      .mutation(async ({ input }) => {
        // Generate unique inquiry number
        const inquiryNumber = generateInquiryNumber();
        
        // Get product details
        const products = await getProductsByIds(input.productIds);
        if (products.length === 0) {
          throw new Error('未找到产品信息');
        }
        
        // Create inquiry record
        const inquiryId = await createInquiry({
          inquiryNumber,
          userName: input.userInfo.name,
          userEmail: input.userInfo.email,
          userCompany: input.userInfo.company,
          userPhone: input.userInfo.phone,
          userMessage: input.userInfo.message,
        });
        
        // Create inquiry items
        const items = products.map(p => ({
          productId: p.id,
          partNumber: p.partNumber,
          productName: p.name,
          brand: p.brand,
        }));
        await createInquiryItems(inquiryId, items);
        
        // Send confirmation email
        const emailSent = await sendInquiryEmail({
          inquiryNumber,
          userName: input.userInfo.name,
          userEmail: input.userInfo.email,
          userMessage: input.userInfo.message,
          products: products.map(p => ({
            name: p.name,
            partNumber: p.partNumber,
          })),
          createdAt: new Date(),
        });
        
        return {
          success: true,
          inquiryNumber,
          message: emailSent 
            ? '询价已提交，确认邮件已发送至您的邮箱' 
            : '询价已提交，但邮件发送失败，请记录您的询价单号',
        };
      }),
  }),

  // USP Standards routes
  usp: router({
    listWithProductCount: publicProcedure
      .query(async () => {
        const { getAllUSPStandardsWithProductCount } = await import('./db-usp');
        return await getAllUSPStandardsWithProductCount();
      }),
    
    getByCode: publicProcedure
      .input((raw: unknown) => {
        return z.object({
          code: z.string(),
          productLimit: z.number().optional().default(50),
        }).parse(raw);
      })
      .query(async ({ input }) => {
        const { getUSPStandardWithProducts } = await import('./db-usp');
        return await getUSPStandardWithProducts(input.code, input.productLimit);
      }),
    
    fillProductData: publicProcedure
      .mutation(async () => {
        const { fillProductUSPData } = await import('./db-usp');
        return await fillProductUSPData();
      }),
  }),

  // Resources routes
  resources: router({
    list: publicProcedure
      .input((raw: unknown) => {
        return z.object({
          page: z.number().min(1).optional(),
          pageSize: z.number().min(1).max(100).optional(),
          search: z.string().optional(),
          category: z.string().optional(),
        }).optional().parse(raw);
      })
      .query(async ({ input }) => {
        const page = input?.page || 1;
        const pageSize = input?.pageSize || 12;
        const { getDb } = await import('./db');
        const db = await getDb();
        if (!db) {
          return { items: [], total: 0, page, pageSize };
        }

        const { resources } = await import('../drizzle/schema');
        const { eq, like, and, desc } = await import('drizzle-orm');

        // Build where conditions
        const conditions: any[] = [];
        if (input?.search) {
          conditions.push(
            like(resources.title, `%${input.search}%`)
          );
        }
        if (input?.category) {
          conditions.push(eq(resources.category, input.category));
        }

        // Get total count
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const allResources = await db.select().from(resources).where(whereClause);
        const total = allResources.length;

        // Get paginated results
        const offset = (page - 1) * pageSize;
        const results = await db
          .select()
          .from(resources)
          .where(whereClause)
          .orderBy(desc(resources.publishedAt))
          .limit(pageSize)
          .offset(offset);

        return {
          items: results,
          total,
          page,
          pageSize,
        };
      }),

    getBySlug: publicProcedure
      .input((raw: unknown) => {
        return z.object({
          slug: z.string(),
        }).parse(raw);
      })
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const db = await getDb();
        if (!db) {
          return null;
        }

        const { resources } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');

        const results = await db
          .select()
          .from(resources)
          .where(eq(resources.slug, input.slug))
          .limit(1);

        return results.length > 0 ? results[0] : null;
      }),

    listCategories: publicProcedure.query(async () => {
      const { getDb } = await import('./db');
      const db = await getDb();
      if (!db) {
        return [];
      }

      const { resources } = await import('../drizzle/schema');
      const { sql } = await import('drizzle-orm');

      const results = await db
        .select({ category: resources.category })
        .from(resources)
        .groupBy(resources.category);

      return results.map(r => r.category).filter(Boolean);
    }),
  }),

  // Category routes
  category: router({
    getAll: publicProcedure
      .query(async () => {
        const { getDb } = await import('./db');
        const { categories } = await import('../drizzle/schema');
        const { asc } = await import('drizzle-orm');
        const db = await getDb();
        
        const result = await db
          .select()
          .from(categories)
          .orderBy(asc(categories.parentId), asc(categories.displayOrder));
        
        return result;
      }),
    
    getWithProductCount: publicProcedure
      .query(async () => {
        const { getDb } = await import('./db');
        const db = await getDb();
        
        // Use raw SQL query for now to avoid drizzle issues
        const [rows] = await db.execute(`
          SELECT 
            c.id,
            c.name,
            c.name_en as nameEn,
            c.slug,
            c.parent_id as parentId,
            c.level,
            c.display_order as displayOrder,
            c.is_visible as isVisible,
            c.description,
            c.icon,
            c.created_at as createdAt,
            c.updated_at as updatedAt,
            COUNT(DISTINCT pc.product_id) as productCount
          FROM categories c
          LEFT JOIN product_categories pc ON c.id = pc.category_id
          GROUP BY c.id, c.name, c.name_en, c.slug, c.parent_id, c.level, c.display_order, c.is_visible, c.description, c.icon, c.created_at, c.updated_at
          ORDER BY c.parent_id, c.display_order
        `);
        
        return rows as any[];
      }),
  }),

  // Brand routes
  brand: router({
    getWithProductCount: publicProcedure
      .query(async () => {
        const { getDb } = await import('./db');
        const db = await getDb();
        
        // Use raw SQL query to get brands with product counts
        const [rows] = await db.execute(`
          SELECT 
            brand,
            COUNT(*) as productCount
          FROM products
          WHERE brand IS NOT NULL AND brand != ''
          GROUP BY brand
          ORDER BY productCount DESC, brand ASC
        `);
        
        return rows as any[];
      }),
  }),

  // Seed API for importing resources
  seed: seedRouter,

  // Admin API for data management
  admin: adminRouter,

  // List categories API
  listCategories: listCategoriesRouter,

  // Add GlycoWorks products (simple version)
  addGlycoWorksSimple: addGlycoWorksSimpleRouter,

  // Update product category
  updateProductCategory: updateProductCategoryRouter,

  // Update GlycoWorks using mysql2
  updateGlycoWorksMysql2: updateGlycoWorksMysql2Router,
  describeProductsTable: describeProductsTableRouter,

  // Query categories
  queryCategories: queryCategoriesRouter,

});

export type AppRouter = typeof appRouter;
