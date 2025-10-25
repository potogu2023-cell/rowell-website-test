import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  products: router({
    list: publicProcedure.query(async () => {
      const { getAllProducts } = await import("./db");
      return getAllProducts();
    }),
    byBrand: publicProcedure
      .input((val: unknown) => {
        if (typeof val === "string") return val;
        throw new Error("Brand must be a string");
      })
      .query(async ({ input }) => {
        const { getProductsByBrand } = await import("./db");
        return getProductsByBrand(input);
      }),
  }),

  category: router({
    getAll: publicProcedure.query(async () => {
      const { getAllCategories } = await import("./db");
      return await getAllCategories();
    }),
    
    getVisible: publicProcedure.query(async () => {
      const { getVisibleCategories } = await import("./db");
      return await getVisibleCategories();
    }),
    
    getTopLevel: publicProcedure.query(async () => {
      const { getTopLevelCategories } = await import("./db");
      return await getTopLevelCategories(true);
    }),
    
    getChildren: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null || !('parentId' in val)) {
          throw new Error('Invalid input');
        }
        const { parentId } = val as { parentId: unknown };
        if (typeof parentId !== 'number') {
          throw new Error('parentId must be a number');
        }
        return { parentId };
      })
      .query(async ({ input }) => {
        const { getChildCategories } = await import("./db");
        return await getChildCategories(input.parentId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
