import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { articles, authors } from "../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export const learningCenterRouter = router({
  articles: router({
    list: publicProcedure
      .input(
        z.object({
          page: z.number().optional().default(1),
          pageSize: z.number().optional().default(12),
          category: z.string().optional(),
          area: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        const offset = (input.page - 1) * input.pageSize;

        let conditions = [];
        if (input.category) {
          conditions.push(eq(articles.category, input.category as any));
        }
        if (input.area) {
          conditions.push(eq(articles.applicationArea, input.area as any));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const result = await db
          .select({
            id: articles.id,
            title: articles.title,
            slug: articles.slug,
            metaDescription: articles.metaDescription,
            publishedDate: articles.publishedDate,
            viewCount: articles.viewCount,
            category: articles.category,
            applicationArea: articles.applicationArea,
            authorId: articles.authorId,
            authorName: authors.fullName,
          })
          .from(articles)
          .leftJoin(authors, eq(articles.authorId, authors.id))
          .where(whereClause)
          .orderBy(desc(articles.publishedDate))
          .limit(input.pageSize)
          .offset(offset);

        const totalResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(articles)
          .where(whereClause);

        const total = Number(totalResult[0].count);

        return {
          articles: result,
          pagination: {
            page: input.page,
            pageSize: input.pageSize,
            total,
            totalPages: Math.ceil(total / input.pageSize),
          },
        };
      }),

    getBySlug: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        const db = await getDb();

        const result = await db
          .select({
            id: articles.id,
            title: articles.title,
            slug: articles.slug,
            content: articles.content,
            metaDescription: articles.metaDescription,
            keywords: articles.keywords,
            publishedDate: articles.publishedDate,
            updatedAt: articles.updatedAt,
            viewCount: articles.viewCount,
            category: articles.category,
            applicationArea: articles.applicationArea,
            authorId: articles.authorId,
            authorName: authors.fullName,
            authorTitle: authors.title,
            authorBio: authors.biography,
            authorPhoto: authors.photoUrl,
          })
          .from(articles)
          .leftJoin(authors, eq(articles.authorId, authors.id))
          .where(eq(articles.slug, input))
          .limit(1);

        if (result.length === 0) {
          throw new Error("Article not found");
        }

        const article = result[0];

        // Increment view count
        await db
          .update(articles)
          .set({ viewCount: sql`${articles.viewCount} + 1` })
          .where(eq(articles.id, article.id));

        return article;
      }),
  }),

  authors: router({
    list: publicProcedure.query(async () => {
      const db = await getDb();

      const result = await db
        .select({
          id: authors.id,
          name: authors.fullName,
          slug: authors.slug,
          title: authors.title,
          bio: authors.biography,
          photo: authors.photoUrl,
          articleCount: sql<number>`(SELECT COUNT(*) FROM ${articles} WHERE ${articles.authorId} = ${authors.id})`,
        })
        .from(authors)
        .orderBy(authors.fullName);

      return result;
    }),

    getBySlug: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        const db = await getDb();

        const result = await db
          .select()
          .from(authors)
          .where(eq(authors.slug, input))
          .limit(1);

        if (result.length === 0) {
          throw new Error("Author not found");
        }

        const author = result[0];

        // Get author's articles
        const authorArticles = await db
          .select({
            id: articles.id,
            title: articles.title,
            slug: articles.slug,
            metaDescription: articles.metaDescription,
            publishedDate: articles.publishedDate,
            viewCount: articles.viewCount,
            category: articles.category,
            applicationArea: articles.applicationArea,
          })
          .from(articles)
          .where(eq(articles.authorId, author.id))
          .orderBy(desc(articles.publishedDate));

        return {
          ...author,
          articles: authorArticles,
        };
      }),
  }),

  stats: publicProcedure.query(async () => {
    const db = await getDb();

    const totalArticles = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles);

    const totalAuthors = await db
      .select({ count: sql<number>`count(*)` })
      .from(authors);

    const totalViews = await db
      .select({ total: sql<number>`SUM(${articles.viewCount})` })
      .from(articles);

    return {
      totalArticles: Number(totalArticles[0].count),
      totalAuthors: Number(totalAuthors[0].count),
      totalViews: Number(totalViews[0].total || 0),
    };
  }),
});
