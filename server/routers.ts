
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
