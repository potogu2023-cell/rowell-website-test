import { publicProcedure, router } from "./_core/trpc";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { getDb } from './db';
import { articles, authors } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Articles directory in the project
const ARTICLES_DIR = path.join(__dirname, '..', 'content', 'articles');

// Required fields validation
const REQUIRED_FIELDS = [
  'title',
  'author_slug',
  'category',
  'application_area',
  'slug',
  'published_date'
];

// Valid ENUM values
const VALID_CATEGORIES = ['application-notes', 'technical-guides', 'industry-trends', 'literature-reviews'] as const;
const VALID_AREAS = ['pharmaceutical', 'environmental', 'food-safety', 'biopharmaceutical', 'clinical', 'chemical'] as const;
type ArticleCategory = (typeof VALID_CATEGORIES)[number];
type ArticleArea = (typeof VALID_AREAS)[number];

// Language validation - CRITICAL: Prevent Chinese content
function validateLanguage(text: string): boolean {
  if (!text) return true; // Empty is OK
  const chineseRegex = /[\u4e00-\u9fa5]/;
  return !chineseRegex.test(text);
}

// Format validation
function validateFormat(frontmatter: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!frontmatter[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate ENUM values
  if (frontmatter.category && !VALID_CATEGORIES.includes(frontmatter.category)) {
    errors.push(`Invalid category: ${frontmatter.category}. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }
  
  if (frontmatter.application_area && !VALID_AREAS.includes(frontmatter.application_area)) {
    errors.push(`Invalid application_area: ${frontmatter.application_area}. Must be one of: ${VALID_AREAS.join(', ')}`);
  }
  
  return { valid: errors.length === 0, errors };
}

export const manualImportRouter = router({
  importArticles: publicProcedure.query(async () => {
    const results: any[] = [];
    const logs: string[] = [];
    
    try {
      logs.push(`[INFO] Articles directory: ${ARTICLES_DIR}`);
      logs.push(`[INFO] Directory exists: ${fs.existsSync(ARTICLES_DIR)}`);
      
      if (!fs.existsSync(ARTICLES_DIR)) {
        return {
          success: false,
          error: `Articles directory not found: ${ARTICLES_DIR}`,
          logs,
        };
      }
      
      const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.md') && f !== 'README.md');
      logs.push(`[INFO] Found ${files.length} markdown files`);
      
      const db = await getDb();
      if (!db) {
        return {
          success: false,
          error: 'Database connection failed',
          logs,
        };
      }
      
      for (const filename of files) {
        const filePath = path.join(ARTICLES_DIR, filename);
        logs.push(`\n[INFO] Processing: ${filename}`);
        
        try {
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const { data: frontmatter, content } = matter(fileContent);
          
          // Validate format
          const formatValidation = validateFormat(frontmatter);
          if (!formatValidation.valid) {
            logs.push(`[ERROR] Format validation failed: ${formatValidation.errors.join(', ')}`);
            results.push({ filename, status: 'error', error: formatValidation.errors.join(', ') });
            continue;
          }
          
          // Validate language
          const textsToCheck = [
            frontmatter.title,
            content,
            frontmatter.meta_description,
            frontmatter.keywords
          ];
          
          for (const text of textsToCheck) {
            if (text && !validateLanguage(text)) {
              logs.push(`[ERROR] Chinese content detected - REJECTED`);
              results.push({ filename, status: 'error', error: 'Chinese content detected' });
              continue;
            }
          }
          
          // Get author ID
          const authorResult = await db.select().from(authors).where(eq(authors.slug, frontmatter.author_slug)).limit(1);
          
          if (authorResult.length === 0) {
            logs.push(`[ERROR] Author not found: ${frontmatter.author_slug}`);
            results.push({ filename, status: 'error', error: `Author not found: ${frontmatter.author_slug}` });
            continue;
          }
          
          const authorId = authorResult[0].id;
          logs.push(`[INFO] Found author ID: ${authorId}`);
          
          // Check if article already exists
          const existingArticle = await db.select().from(articles).where(eq(articles.slug, frontmatter.slug)).limit(1);
          
          const parsedPublishedDate = new Date(frontmatter.published_date);
          if (Number.isNaN(parsedPublishedDate.getTime())) {
            logs.push(`[ERROR] Invalid published_date: ${frontmatter.published_date}`);
            results.push({ filename, status: 'error', error: 'Invalid published_date' });
            continue;
          }
          const articleData: typeof articles.$inferInsert = {
            title: String(frontmatter.title),
            slug: String(frontmatter.slug),
            content,
            category: frontmatter.category as ArticleCategory,
            applicationArea: frontmatter.application_area as ArticleArea,
            metaDescription: frontmatter.meta_description ? String(frontmatter.meta_description) : '',
            keywords: frontmatter.keywords ? String(frontmatter.keywords) : '',
            publishedDate: parsedPublishedDate.toISOString().slice(0, 19).replace('T', ' '),
            authorId,
            viewCount: 0,
          };
          
          if (existingArticle.length > 0) {
            // Update existing article
            await db.update(articles)
              .set(articleData)
              .where(eq(articles.slug, frontmatter.slug));
            
            logs.push(`[SUCCESS] Updated article: ${frontmatter.slug}`);
            results.push({ filename, status: 'updated', slug: frontmatter.slug });
          } else {
            // Create new article
            await db.insert(articles).values(articleData);
            
            logs.push(`[SUCCESS] Created article: ${frontmatter.slug}`);
            results.push({ filename, status: 'created', slug: frontmatter.slug });
          }
          
        } catch (error: any) {
          logs.push(`[ERROR] Failed to process ${filename}: ${error.message}`);
          results.push({ filename, status: 'error', error: error.message });
        }
      }
      
      return {
        success: true,
        results,
        logs,
      };
      
    } catch (error: any) {
      logs.push(`[FATAL] ${error.message}`);
      return {
        success: false,
        error: error.message,
        logs,
      };
    }
  }),
});
