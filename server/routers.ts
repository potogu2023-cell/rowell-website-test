
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getProductsByIds, createInquiry, createInquiryItems } from './db';
import { generateInquiryNumber } from './inquiryUtils';
import { sendInquiryEmail } from './emailService';
import { z } from 'zod';

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
  }),

  // Customer messages routes
  messages: router({
    create: publicProcedure
      .input((raw: unknown) => {
        return z.object({
          name: z.string().min(2, '姓名至少 2 个字符').max(100, '姓名最多 100 个字符'),
          email: z.string().email('请输入有效的邮箱地址'),
          company: z.string().optional(),
          phone: z.string().optional(),
          productId: z.string().optional(),
          message: z.string().min(10, '留言至少 10 个字符').max(1000, '留言最多 1000 个字符'),
        }).parse(raw);
      })
      .mutation(async ({ input }) => {
        const { getDb } = await import('./db');
        const { customerMessages } = await import('../drizzle/schema');
        const db = await getDb();
        
        // Insert message into database
        const result = await db.insert(customerMessages).values({
          name: input.name,
          email: input.email,
          company: input.company,
          phone: input.phone,
          productId: input.productId,
          message: input.message,
          status: 'pending',
        });
        
        // Send notification email (optional)
        try {
          const { sendInquiryEmail } = await import('./emailService');
          await sendInquiryEmail({
            inquiryNumber: `MSG-${result[0].insertId}`,
            userName: input.name,
            userEmail: input.email,
            userMessage: input.message,
            products: input.productId ? [{ name: input.productId, partNumber: input.productId }] : [],
            createdAt: new Date(),
          });
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError);
        }
        
        return {
          success: true,
          messageId: result[0].insertId,
          message: '留言已提交,我们会尽快回复您',
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
});

export type AppRouter = typeof appRouter;
