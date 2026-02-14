import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import mysql from "mysql2/promise";

// Database connection helper
async function getConnection() {
  return await mysql.createConnection(process.env.DATABASE_URL!);
}

export const learningCenterRouter = router({
  // Get all articles with pagination and filtering
  articles: router({
    list: publicProcedure
      .input(
        z.object({
          page: z.number().min(1).default(1),
          pageSize: z.number().min(1).max(100).default(24),
          category: z.enum(['application-notes', 'technical-guides', 'industry-trends', 'literature-reviews']).optional(),
          area: z.enum(['pharmaceutical', 'environmental', 'food-safety', 'biopharmaceutical', 'clinical', 'chemical']).optional(),
          authorSlug: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const connection = await getConnection();
        
        try {
          const { page, pageSize, category, area, authorSlug } = input;
          const offset = (page - 1) * pageSize;
          
          // Build WHERE clause
          const conditions: string[] = [];
          const params: any[] = [];
          
          if (category) {
            conditions.push('a.category = ?');
            params.push(category);
          }
          
          if (area) {
            conditions.push('a.application_area = ?');
            params.push(area);
          }
          
          if (authorSlug) {
            conditions.push('au.slug = ?');
            params.push(authorSlug);
          }
          
          const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
          
          // Get total count
          const [countResult] = await connection.query(
            `SELECT COUNT(*) as total 
             FROM articles a 
             JOIN authors au ON a.author_id = au.id 
             ${whereClause}`,
            params
          );
          const total = (countResult as any)[0].total;
          
          // Get articles
          const [articles] = await connection.query(
            `SELECT 
               a.id, a.slug, a.title, a.category, a.application_area,
               a.meta_description, a.published_date, a.view_count,
               au.slug as author_slug, au.full_name as author_name, au.photo_url as author_photo
             FROM articles a
             JOIN authors au ON a.author_id = au.id
             ${whereClause}
             ORDER BY a.published_date DESC
             LIMIT ? OFFSET ?`,
            [...params, pageSize, offset]
          );
          
          return {
            articles,
            pagination: {
              page,
              pageSize,
              total,
              totalPages: Math.ceil(total / pageSize),
            },
          };
        } finally {
          await connection.end();
        }
      }),
    
    // Get single article by slug
    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const connection = await getConnection();
        
        try {
          const [articles] = await connection.query(
            `SELECT 
               a.id, a.slug, a.title, a.category, a.application_area,
               a.content, a.meta_description, a.keywords, a.published_date, a.view_count,
               au.id as author_id, au.slug as author_slug, au.full_name as author_name,
               au.title as author_title, au.photo_url as author_photo
             FROM articles a
             JOIN authors au ON a.author_id = au.id
             WHERE a.slug = ?`,
            [input.slug]
          );
          
          if ((articles as any[]).length === 0) {
            throw new Error('Article not found');
          }
          
          // Increment view count
          await connection.query(
            'UPDATE articles SET view_count = view_count + 1 WHERE slug = ?',
            [input.slug]
          );
          
          return (articles as any[])[0];
        } finally {
          await connection.end();
        }
      }),
    
    // Get featured articles (most viewed)
    featured: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(10).default(6) }))
      .query(async ({ input }) => {
        const connection = await getConnection();
        
        try {
          const [articles] = await connection.query(
            `SELECT 
               a.id, a.slug, a.title, a.category, a.application_area,
               a.meta_description, a.published_date, a.view_count,
               au.slug as author_slug, au.full_name as author_name
             FROM articles a
             JOIN authors au ON a.author_id = au.id
             ORDER BY a.view_count DESC, a.published_date DESC
             LIMIT ?`,
            [input.limit]
          );
          
          return articles;
        } finally {
          await connection.end();
        }
      }),
  }),
  
  // Authors endpoints
  authors: router({
    list: publicProcedure.query(async () => {
      const connection = await getConnection();
      
      try {
        const [authors] = await connection.query(
          `SELECT 
             au.id, au.slug, au.full_name, au.title, au.years_of_experience,
             au.photo_url, COUNT(a.id) as article_count
           FROM authors au
           LEFT JOIN articles a ON au.id = a.author_id
           GROUP BY au.id
           ORDER BY au.full_name`
        );
        
        return authors;
      } finally {
        await connection.end();
      }
    }),
    
    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const connection = await getConnection();
        
        try {
          const [authors] = await connection.query(
            `SELECT 
               id, slug, full_name, title, years_of_experience,
               education, expertise, biography, photo_url
             FROM authors
             WHERE slug = ?`,
            [input.slug]
          );
          
          if ((authors as any[]).length === 0) {
            throw new Error('Author not found');
          }
          
          return (authors as any[])[0];
        } finally {
          await connection.end();
        }
      }),
  }),
  
  // Statistics endpoint
  stats: publicProcedure.query(async () => {
    const connection = await getConnection();
    
    try {
      const [stats] = await connection.query(
        `SELECT 
           COUNT(DISTINCT a.id) as total_articles,
           COUNT(DISTINCT au.id) as total_authors,
           SUM(a.view_count) as total_views
         FROM articles a
         JOIN authors au ON a.author_id = au.id`
      );
      
      const [categoryStats] = await connection.query(
        `SELECT category, COUNT(*) as count
         FROM articles
         GROUP BY category`
      );
      
      const [areaStats] = await connection.query(
        `SELECT application_area, COUNT(*) as count
         FROM articles
         GROUP BY application_area`
      );
      
      return {
        ...(stats as any[])[0],
        byCategory: categoryStats,
        byArea: areaStats,
      };
    } finally {
      await connection.end();
    }
  }),
});
