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
});

export type AppRouter = typeof appRouter;
