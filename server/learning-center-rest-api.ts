import { Router } from 'express';
import { and, desc, eq, isNull, sql, type SQL } from 'drizzle-orm';
import { getDb } from './db';
import { articles, authors } from '../drizzle/schema';

export const learningCenterRouter = Router();

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return db;
}

const articleCategories = ['application-notes', 'technical-guides', 'industry-trends', 'literature-reviews'] as const;
const applicationAreas = ['pharmaceutical', 'environmental', 'food-safety', 'biopharmaceutical', 'clinical', 'chemical'] as const;

type ArticleCategory = typeof articleCategories[number];
type ApplicationArea = typeof applicationAreas[number];

function isArticleCategory(value?: string): value is ArticleCategory {
  return value !== undefined && (articleCategories as readonly string[]).includes(value);
}

function isApplicationArea(value?: string): value is ApplicationArea {
  return value !== undefined && (applicationAreas as readonly string[]).includes(value);
}

function articleFilters(category?: string, applicationArea?: string): SQL[] {
  const conditions: SQL[] = [];
  if (isArticleCategory(category)) conditions.push(eq(articles.category, category));
  if (isApplicationArea(applicationArea)) conditions.push(eq(articles.applicationArea, applicationArea));
  return conditions;
}

learningCenterRouter.get('/articles', async (req, res) => {
  try {
    const db = await requireDb();
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 12));
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const applicationArea = typeof req.query.applicationArea === 'string' ? req.query.applicationArea : undefined;
    const conditions = articleFilters(category, applicationArea);
    const whereClause = conditions.length ? and(...conditions) : undefined;

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
      .limit(limit)
      .offset((page - 1) * limit);

    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(articles).where(whereClause);
    const total = Number(totalResult[0]?.count || 0);
    res.json({ articles: result, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

learningCenterRouter.get('/articles/:slug', async (req, res) => {
  try {
    const db = await requireDb();
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
      .where(eq(articles.slug, req.params.slug))
      .limit(1);
    const article = result[0];
    if (!article) return res.status(404).json({ error: 'Article not found' });

    await db.update(articles).set({ viewCount: sql`${articles.viewCount} + 1` }).where(eq(articles.id, article.id));
    res.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

learningCenterRouter.get('/categories', async (_req, res) => {
  try {
    const db = await requireDb();
    res.json(await db.select({ category: articles.category, count: sql<number>`count(*)` }).from(articles).groupBy(articles.category));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

learningCenterRouter.get('/application-areas', async (_req, res) => {
  try {
    const db = await requireDb();
    res.json(await db.select({ applicationArea: articles.applicationArea, count: sql<number>`count(*)` }).from(articles).groupBy(articles.applicationArea));
  } catch (error) {
    console.error('Error fetching application areas:', error);
    res.status(500).json({ error: 'Failed to fetch application areas' });
  }
});

learningCenterRouter.get('/authors', async (_req, res) => {
  try {
    const db = await requireDb();
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
    console.error('Error fetching authors:', error);
    res.status(500).json({ error: 'Failed to fetch authors' });
  }
});

learningCenterRouter.get('/authors/:slug', async (req, res) => {
  try {
    const db = await requireDb();
    const result = await db.select().from(authors).where(eq(authors.slug, req.params.slug)).limit(1);
    const author = result[0];
    if (!author) return res.status(404).json({ error: 'Author not found' });

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
    res.json({ ...author, articles: authorArticles });
  } catch (error) {
    console.error('Error fetching author:', error);
    res.status(500).json({ error: 'Failed to fetch author' });
  }
});

learningCenterRouter.get('/featured', async (_req, res) => {
  try {
    const db = await requireDb();
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
    console.error('Error fetching featured articles:', error);
    res.status(500).json({ error: 'Failed to fetch featured articles' });
  }
});

learningCenterRouter.get('/articles/:slug/related', async (req, res) => {
  try {
    const db = await requireDb();
    const currentArticle = await db
      .select({ id: articles.id, category: articles.category })
      .from(articles)
      .where(eq(articles.slug, req.params.slug))
      .limit(1);
    const current = currentArticle[0];
    if (!current) return res.status(404).json({ error: 'Article not found' });

    const categoryCondition = current.category ? eq(articles.category, current.category) : isNull(articles.category);
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
      .where(and(categoryCondition, sql`${articles.id} != ${current.id}`))
      .orderBy(desc(articles.publishedDate))
      .limit(3);
    res.json(result);
  } catch (error) {
    console.error('Error fetching related articles:', error);
    res.status(500).json({ error: 'Failed to fetch related articles' });
  }
});
