import * as fs from 'fs/promises';
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
const VALID_CATEGORIES = ['application-notes', 'technical-guides', 'industry-trends', 'literature-reviews'];
const VALID_AREAS = ['pharmaceutical', 'environmental', 'food-safety', 'biopharmaceutical', 'clinical', 'chemical'];

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
  
  // Validate date format
  if (frontmatter.published_date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(frontmatter.published_date)) {
      errors.push(`Invalid date format: ${frontmatter.published_date}. Must be YYYY-MM-DD`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Process a single article file
async function processArticle(filePath: string, db: any): Promise<{ success: boolean; error?: string }> {
  try {
    const fileName = path.basename(filePath);
    console.log(`📄 Processing: ${fileName}`);
    
    // Read file
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(fileContent);
    
    // Validate format
    const formatValidation = validateFormat(frontmatter);
    if (!formatValidation.valid) {
      const error = `Format validation failed:\n${formatValidation.errors.join('\n')}`;
      console.error(`❌ ${error}`);
      return { success: false, error };
    }
    
    // Validate language - CRITICAL
    if (!validateLanguage(frontmatter.title)) {
      const error = '🚨 LANGUAGE_VIOLATION: Chinese characters detected in title';
      console.error(`❌ ${error}`);
      return { success: false, error };
    }
    
    if (!validateLanguage(content)) {
      const error = '🚨 LANGUAGE_VIOLATION: Chinese characters detected in content';
      console.error(`❌ ${error}`);
      return { success: false, error };
    }
    
    if (!validateLanguage(frontmatter.meta_description)) {
      const error = '🚨 LANGUAGE_VIOLATION: Chinese characters detected in meta_description';
      console.error(`❌ ${error}`);
      return { success: false, error };
    }
    
    if (!validateLanguage(frontmatter.keywords)) {
      const error = '🚨 LANGUAGE_VIOLATION: Chinese characters detected in keywords';
      console.error(`❌ ${error}`);
      return { success: false, error };
    }
    
    console.log('✓ Language validation passed (English content confirmed)');
    
    // Find or create author
    let authorId: number;
    const existingAuthor = await db.select()
      .from(authors)
      .where(eq(authors.slug, frontmatter.author_slug))
      .limit(1);
    
    if (existingAuthor.length > 0) {
      authorId = existingAuthor[0].id;
      console.log(`✓ Found existing author: ${frontmatter.author_slug} (ID: ${authorId})`);
    } else {
      // Create default author if not exists
      const [newAuthor] = await db.insert(authors).values({
        name: frontmatter.author_slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        slug: frontmatter.author_slug,
        bio: 'Chromatography expert at ROWELL HPLC',
        expertise: frontmatter.application_area,
        avatar: '/images/authors/default.jpg'
      });
      authorId = newAuthor.insertId;
      console.log(`✓ Created new author: ${frontmatter.author_slug} (ID: ${authorId})`);
    }
    
    // Check if article exists (by slug)
    const existingArticle = await db.select()
      .from(articles)
      .where(eq(articles.slug, frontmatter.slug))
      .limit(1);
    
    if (existingArticle.length > 0) {
      // Update existing article
      await db.update(articles)
        .set({
          title: frontmatter.title,
          content: content,
          category: frontmatter.category,
          applicationArea: frontmatter.application_area,
          publishedDate: new Date(frontmatter.published_date),
          metaDescription: frontmatter.meta_description || null,
          keywords: frontmatter.keywords || null,
          updatedAt: new Date()
        })
        .where(eq(articles.id, existingArticle[0].id));
      
      console.log(`✅ Updated article: ${frontmatter.title}`);
    } else {
      // Create new article
      await db.insert(articles).values({
        title: frontmatter.title,
        slug: frontmatter.slug,
        content: content,
        authorId: authorId,
        category: frontmatter.category,
        applicationArea: frontmatter.application_area,
        publishedDate: new Date(frontmatter.published_date),
        metaDescription: frontmatter.meta_description || null,
        keywords: frontmatter.keywords || null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`✅ Created article: ${frontmatter.title}`);
    }
    
    return { success: true };
    
  } catch (error: any) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Import all articles from the directory
export async function importArticles(): Promise<void> {
  console.log('\n🚀 Starting article import...');
  console.log(`📁 Articles directory: ${ARTICLES_DIR}`);
  
  try {
    // Check if directory exists
    try {
      await fs.access(ARTICLES_DIR);
    } catch {
      console.log(`⚠️  Articles directory not found: ${ARTICLES_DIR}`);
      console.log('Creating directory...');
      await fs.mkdir(ARTICLES_DIR, { recursive: true });
      console.log('✓ Directory created');
      return;
    }
    
    // Read article Markdown files only. README is directory documentation, not publishable content;
    // all other Markdown files continue through the existing strict frontmatter validation.
    const files = await fs.readdir(ARTICLES_DIR);
    const mdFiles = files.filter((file) => file.endsWith('.md') && file.toLowerCase() !== 'readme.md');
    
    if (mdFiles.length === 0) {
      console.log('ℹ️  No articles found to import');
      return;
    }
    
    console.log(`📚 Found ${mdFiles.length} article(s) to process`);
    
    const db = await getDb();
    let successCount = 0;
    let errorCount = 0;
    
    for (const file of mdFiles) {
      const filePath = path.join(ARTICLES_DIR, file);
      const result = await processArticle(filePath, db);
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    }
    
    console.log('\n📊 Import Summary:');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('🏁 Article import completed\n');
    
  } catch (error: any) {
    console.error('❌ Fatal error during article import:', error.message);
  }
}
