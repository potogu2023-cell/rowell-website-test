import { Router } from "express";
import { db } from "./db";
import { articles, authors, categories, tags, articleTags } from "../drizzle/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";

export const learningCenterRouter = Router();

// Get all articles with pagination
learningCenterRouter.get("/articles", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const offset = (page - 1) * limit;
    const categoryId = req.query.categoryId as string;
    const tagId = req.query.tagId as string;

    let query = db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        featuredImage: articles.featuredImage,
        publishedAt: articles.publishedAt,
        readTime: articles.readTime,
        viewCount: articles.viewCount,
        categoryId: articles.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
        authorId: articles.authorId,
        authorName: authors.name,
        authorAvatar: authors.avatar,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(authors, eq(articles.authorId, authors.id))
      .where(eq(articles.status, "published"))
      .orderBy(desc(articles.publishedAt))
      .limit(limit)
      .offset(offset);

    // Apply category filter if provided
    if (categoryId) {
      query = query.where(eq(articles.categoryId, parseInt(categoryId)));
    }

    // Apply tag filter if provided
    if (tagId) {
      const articleIds = await db
        .select({ articleId: articleTags.articleId })
        .from(articleTags)
        .where(eq(articleTags.tagId, parseInt(tagId)));
      
      const ids = articleIds.map(a => a.articleId);
      if (ids.length > 0) {
        query = query.where(inArray(articles.id, ids));
      }
    }

    const result = await query;

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(eq(articles.status, "published"));

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
    const { slug } = req.params;

    const result = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        content: articles.content,
        excerpt: articles.excerpt,
        featuredImage: articles.featuredImage,
        publishedAt: articles.publishedAt,
        updatedAt: articles.updatedAt,
        readTime: articles.readTime,
        viewCount: articles.viewCount,
        categoryId: articles.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
        authorId: articles.authorId,
        authorName: authors.name,
        authorTitle: authors.title,
        authorBio: authors.bio,
        authorAvatar: authors.avatar,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(authors, eq(articles.authorId, authors.id))
      .where(and(eq(articles.slug, slug), eq(articles.status, "published")))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: "Article not found" });
    }

    const article = result[0];

    // Get article tags
    const articleTagsResult = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
      })
      .from(articleTags)
      .leftJoin(tags, eq(articleTags.tagId, tags.id))
      .where(eq(articleTags.articleId, article.id));

    // Increment view count
    await db
      .update(articles)
      .set({ viewCount: sql`${articles.viewCount} + 1` })
      .where(eq(articles.id, article.id));

    res.json({
      ...article,
      tags: articleTagsResult,
    });
  } catch (error) {
    console.error("Error fetching article:", error);
    res.status(500).json({ error: "Failed to fetch article" });
  }
});

// Get all categories
learningCenterRouter.get("/categories", async (req, res) => {
  try {
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        articleCount: sql<number>`(SELECT COUNT(*) FROM ${articles} WHERE ${articles.categoryId} = ${categories.id} AND ${articles.status} = 'published')`,
      })
      .from(categories)
      .orderBy(categories.name);

    res.json(result);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Get all tags
learningCenterRouter.get("/tags", async (req, res) => {
  try {
    const result = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        articleCount: sql<number>`(SELECT COUNT(*) FROM ${articleTags} WHERE ${articleTags.tagId} = ${tags.id})`,
      })
      .from(tags)
      .orderBy(tags.name);

    res.json(result);
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
});

// Get all authors
learningCenterRouter.get("/authors", async (req, res) => {
  try {
    const result = await db
      .select({
        id: authors.id,
        name: authors.name,
        slug: authors.slug,
        title: authors.title,
        bio: authors.bio,
        avatar: authors.avatar,
        articleCount: sql<number>`(SELECT COUNT(*) FROM ${articles} WHERE ${articles.authorId} = ${authors.id} AND ${articles.status} = 'published')`,
      })
      .from(authors)
      .orderBy(authors.name);

    res.json(result);
  } catch (error) {
    console.error("Error fetching authors:", error);
    res.status(500).json({ error: "Failed to fetch authors" });
  }
});

// Get single author by slug
learningCenterRouter.get("/authors/:slug", async (req, res) => {
  try {
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
        excerpt: articles.excerpt,
        featuredImage: articles.featuredImage,
        publishedAt: articles.publishedAt,
        readTime: articles.readTime,
        viewCount: articles.viewCount,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(eq(articles.authorId, author.id), eq(articles.status, "published")))
      .orderBy(desc(articles.publishedAt));

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
    const result = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        featuredImage: articles.featuredImage,
        publishedAt: articles.publishedAt,
        readTime: articles.readTime,
        viewCount: articles.viewCount,
        categoryName: categories.name,
        categorySlug: categories.slug,
        authorName: authors.name,
        authorAvatar: authors.avatar,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(authors, eq(articles.authorId, authors.id))
      .where(eq(articles.status, "published"))
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
    const { slug } = req.params;

    // First get the current article
    const currentArticle = await db
      .select({ id: articles.id, categoryId: articles.categoryId })
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
        excerpt: articles.excerpt,
        featuredImage: articles.featuredImage,
        publishedAt: articles.publishedAt,
        readTime: articles.readTime,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(
        and(
          eq(articles.categoryId, currentArticle[0].categoryId),
          eq(articles.status, "published"),
          sql`${articles.id} != ${currentArticle[0].id}`
        )
      )
      .orderBy(desc(articles.publishedAt))
      .limit(3);

    res.json(result);
  } catch (error) {
    console.error("Error fetching related articles:", error);
    res.status(500).json({ error: "Failed to fetch related articles" });
  }
});
