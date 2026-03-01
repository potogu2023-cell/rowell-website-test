/**
 * ANPEL Reference Standards tRPC Router
 * Independent module - does not affect existing product routes
 */

import { publicProcedure, router } from "./_core/trpc";
import { z } from 'zod';

export const standardsRouter = router({
  // 获取所有分类
  listCategories: publicProcedure
    .query(async () => {
      const { getAllStandardsCategories } = await import('./db-standards');
      return await getAllStandardsCategories();
    }),

  // 获取单个分类详情
  getCategoryBySlug: publicProcedure
    .input((raw: unknown) => z.string().parse(raw))
    .query(async ({ input }) => {
      const { getStandardsCategoryBySlug } = await import('./db-standards');
      return await getStandardsCategoryBySlug(input);
    }),

  // 获取分类下的产品列表
  listByCategory: publicProcedure
    .input((raw: unknown) => z.object({
      categorySlug: z.string(),
      page: z.number().min(1).optional().default(1),
      pageSize: z.number().min(1).max(100).optional().default(20),
    }).parse(raw))
    .query(async ({ input }) => {
      const { getStandardsByCategory } = await import('./db-standards');
      return await getStandardsByCategory(input.categorySlug, input.page, input.pageSize);
    }),

  // 搜索产品
  search: publicProcedure
    .input((raw: unknown) => z.object({
      query: z.string().min(1),
      page: z.number().min(1).optional().default(1),
      pageSize: z.number().min(1).max(100).optional().default(20),
      categorySlug: z.string().optional(),
    }).parse(raw))
    .query(async ({ input }) => {
      const { searchStandardsProducts } = await import('./db-standards');
      return await searchStandardsProducts(input.query, input.page, input.pageSize, input.categorySlug);
    }),

  // 获取产品详情（by slug）
  getBySlug: publicProcedure
    .input((raw: unknown) => z.string().parse(raw))
    .query(async ({ input }) => {
      const { getStandardsProductBySlug } = await import('./db-standards');
      return await getStandardsProductBySlug(input);
    }),

  // 获取相关产品
  getRelated: publicProcedure
    .input((raw: unknown) => z.object({
      categorySlug: z.string(),
      excludeId: z.number(),
      limit: z.number().optional().default(6),
    }).parse(raw))
    .query(async ({ input }) => {
      const { getRelatedStandardsProducts } = await import('./db-standards');
      return await getRelatedStandardsProducts(input.categorySlug, input.excludeId, input.limit);
    }),

  // 获取统计数据
  getStats: publicProcedure
    .query(async () => {
      const { getStandardsStats } = await import('./db-standards');
      return await getStandardsStats();
    }),
});
