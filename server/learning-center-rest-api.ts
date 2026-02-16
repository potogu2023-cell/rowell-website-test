import { Router } from "express";
import { getDb } from "./db";
import { articles, authors } from "../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export const learningCenterRouter = Router();

// Get all articles with pagination
learningCenterRouter.get("/articles", async (req, res) => {
  try {
    const db = await getDb();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const offset = (page - 1) * limit;
    const category = req.query.category as string;
    const applicationArea = req.query.applicationArea as string;

    let query = db
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
      .orderBy(desc(articles.publishedDate))
      .limit(limit)
      .offset(offset);

    // Apply category filter if provided
    if (category) {
      query = query.where(eq(articles.category, category as any));
    }

    // Apply application area filter if provided
    if (applicationArea) {
      query = query.where(eq(articles.applicationArea, applicationArea as any));
    }

    const result = await query;

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles);

    const total = Number(totalResult[0].count);

    res.json({
      articles: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ error: "Failed to fetch articles" });
  }
});

// Get single article by slug
learningCenterRouter.get("/articles/:slug", async (req, res) => {
  try {
    const db = await getDb();
    const { slug } = req.params;

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
      .where(eq(articles.slug, slug))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: "Article not found" });
    }

    const article = result[0];

    // Increment view count
    await db
      .update(articles)
      .set({ viewCount: sql`${articles.viewCount} + 1` })
      .where(eq(articles.id, article.id));

    res.json(article);
  } catch (error) {
    console.error("Error fetching article:", error);
    res.status(500).json({ error: "Failed to fetch article" });
  }
});

// Get all categories (return enum values)
learningCenterRouter.get("/categories", async (req, res) => {
  try {
    const db = await getDb();
    
    // Get unique categories with article counts
    const result = await db
      .select({
        category: articles.category,
        count: sql<number>`count(*)`,
      })
      .from(articles)
      .groupBy(articles.category);

    res.json(result);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Get all application areas (return enum values)
learningCenterRouter.get("/application-areas", async (req, res) => {
  try {
    const db = await getDb();
    
    // Get unique application areas with article counts
    const result = await db
      .select({
        applicationArea: articles.applicationArea,
        count: sql<number>`count(*)`,
      })
      .from(articles)
      .groupBy(articles.applicationArea);

    res.json(result);
  } catch (error) {
    console.error("Error fetching application areas:", error);
    res.status(500).json({ error: "Failed to fetch application areas" });
  }
});

// Get all authors
learningCenterRouter.get("/authors", async (req, res) => {
  try {
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

    res.json(result);
  } catch (error) {
    console.error("Error fetching authors:", error);
    res.status(500).json({ error: "Failed to fetch authors" });
  }
});

// Get single author by slug
learningCenterRouter.get("/authors/:slug", async (req, res) => {
  try {
    const db = await getDb();
    const { slug } = req.params;

    const result = await db
      .select()
      .from(authors)
      .where(eq(authors.slug, slug))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: "Author not found" });
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

    res.json({
      ...author,
      articles: authorArticles,
    });
  } catch (error) {
    console.error("Error fetching author:", error);
    res.status(500).json({ error: "Failed to fetch author" });
  }
});

// Get featured articles (top 3 by view count)
learningCenterRouter.get("/featured", async (req, res) => {
  try {
    const db = await getDb();
    
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
        authorName: authors.fullName,
      })
      .from(articles)
      .leftJoin(authors, eq(articles.authorId, authors.id))
      .orderBy(desc(articles.viewCount))
      .limit(3);

    res.json(result);
  } catch (error) {
    console.error("Error fetching featured articles:", error);
    res.status(500).json({ error: "Failed to fetch featured articles" });
  }
});

// Get related articles (same category, exclude current article)
learningCenterRouter.get("/articles/:slug/related", async (req, res) => {
  try {
    const db = await getDb();
    const { slug } = req.params;

    // First get the current article
    const currentArticle = await db
      .select({ id: articles.id, category: articles.category })
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1);

    if (currentArticle.length === 0) {
      return res.status(404).json({ error: "Article not found" });
    }

    // Get related articles from same category
    const result = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        metaDescription: articles.metaDescription,
        publishedDate: articles.publishedDate,
        viewCount: articles.viewCount,
        category: articles.category,
      })
      .from(articles)
      .where(
        and(
          eq(articles.category, currentArticle[0].category),
          sql`${articles.id} != ${currentArticle[0].id}`
        )
      )
      .orderBy(desc(articles.publishedDate))
      .limit(3);

    res.json(result);
  } catch (error) {
    console.error("Error fetching related articles:", error);
    res.status(500).json({ error: "Failed to fetch related articles" });
  }
});
