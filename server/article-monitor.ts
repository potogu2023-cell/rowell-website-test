import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import { getDb } from './db';
import { articles, authors } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import chokidar, { type FSWatcher } from 'chokidar';

const HOT_FOLDER = '/home/ubuntu/shared/articles_for_publication/';
const ARCHIVE_FOLDER = path.join(HOT_FOLDER, 'archive');
const ERROR_FOLDER = path.join(HOT_FOLDER, 'error');

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

function toMysqlTimestamp(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

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
  if (frontmatter.published_date && isNaN(Date.parse(frontmatter.published_date))) {
    errors.push(`Invalid date format: ${frontmatter.published_date}. Must be YYYY-MM-DD`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Process article
async function processArticle(filePath: string) {
  const filename = path.basename(filePath);
  console.log(`\n📄 Processing: ${filename}`);
  
  try {
    // 1. Read file
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(fileContent);
    
    // 2. Validate format
    const formatValidation = validateFormat(frontmatter);
    if (!formatValidation.valid) {
      throw new Error(`Format validation failed:\n${formatValidation.errors.join('\n')}`);
    }
    
    // 3. Validate language (CRITICAL - STRICT ENFORCEMENT)
    if (!validateLanguage(frontmatter.title)) {
      throw new Error('🚨 LANGUAGE_VIOLATION: Chinese characters detected in title');
    }
    
    if (!validateLanguage(content)) {
      throw new Error('🚨 LANGUAGE_VIOLATION: Chinese characters detected in content');
    }
    
    if (frontmatter.meta_description && !validateLanguage(frontmatter.meta_description)) {
      throw new Error('🚨 LANGUAGE_VIOLATION: Chinese characters detected in meta_description');
    }
    
    if (frontmatter.keywords && !validateLanguage(frontmatter.keywords)) {
      throw new Error('🚨 LANGUAGE_VIOLATION: Chinese characters detected in keywords');
    }
    
    console.log('✓ Language validation passed (English content confirmed)');
    
    // 4. Get or create author
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available for article import');
    }
    let authorId: number;
    
    const existingAuthor = await db.select()
      .from(authors)
      .where(eq(authors.slug, frontmatter.author_slug))
      .limit(1);
    
    if (existingAuthor.length > 0) {
      authorId = existingAuthor[0].id;
      console.log(`✓ Found existing author: ${frontmatter.author_slug} (ID: ${authorId})`);
    } else {
      // Create default author
      const result = await db.insert(authors).values({
        slug: frontmatter.author_slug,
        fullName: 'Rowell HPLC Team',
        title: 'Technical Experts',
        biography: 'Our team of chromatography experts provides practical guidance for laboratories worldwide.',
        yearsOfExperience: 20,
        education: 'Collective expertise in analytical chemistry',
        expertise: JSON.stringify(['HPLC', 'Method Development', 'Troubleshooting']),
        createdAt: toMysqlTimestamp(new Date()),
        updatedAt: toMysqlTimestamp(new Date())
      });
      authorId = Number(result[0].insertId);
      console.log(`✓ Created default author: ${frontmatter.author_slug} (ID: ${authorId})`);
    }
    
    // 5. Prepare article data
    const articleData = {
      title: frontmatter.title,
      slug: frontmatter.slug,
      content: content,
      category: frontmatter.category,
      applicationArea: frontmatter.application_area,
      authorId: authorId,
      metaDescription: frontmatter.meta_description || null,
      keywords: frontmatter.keywords || null,
      publishedDate: toMysqlTimestamp(new Date(frontmatter.published_date)),
      viewCount: 0,
      updatedAt: toMysqlTimestamp(new Date())
    };
    
    // 6. Check if exists (update vs create)
    const existing = await db.select()
      .from(articles)
      .where(eq(articles.slug, frontmatter.slug))
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing article
      await db.update(articles)
        .set(articleData)
        .where(eq(articles.slug, frontmatter.slug));
      console.log(`✅ Updated article: ${frontmatter.title}`);
    } else {
      // Create new article
      await db.insert(articles).values({
        ...articleData,
        createdAt: toMysqlTimestamp(new Date())
      });
      console.log(`✅ Created article: ${frontmatter.title}`);
    }
    
    // 7. Archive file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archivePath = path.join(ARCHIVE_FOLDER, `${timestamp}_${filename}`);
    await fs.rename(filePath, archivePath);
    console.log(`✓ Archived: ${filename}`);
    
    return { success: true, action: existing.length > 0 ? 'updated' : 'created' };
    
  } catch (error: any) {
    console.error(`❌ Error processing ${filename}:`, error.message);
    
    // Log error
    const errorLog = {
      file: filename,
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    };
    
    const errorLogPath = path.join(ERROR_FOLDER, 'error.log');
    await fs.appendFile(
      errorLogPath,
      JSON.stringify(errorLog, null, 2) + '\n---\n'
    );
    
    // Move to error directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const errorPath = path.join(ERROR_FOLDER, `${timestamp}_${filename}`);
    await fs.rename(filePath, errorPath);
    console.log(`❌ Moved to error directory: ${filename}`);
    
    return { success: false, error: error.message };
  }
}

// Start article monitor
export async function startArticleMonitor() {
  console.log('\n🚀 Starting Article Monitor Service...');
  
  // Ensure directories exist
  await fs.mkdir(HOT_FOLDER, { recursive: true });
  await fs.mkdir(ARCHIVE_FOLDER, { recursive: true });
  await fs.mkdir(ERROR_FOLDER, { recursive: true });
  console.log('✓ Directory structure verified');
  
  // Initialize watcher
  const watcher = chokidar.watch(HOT_FOLDER, {
    ignored: /(^|[\/\\])\../, // Ignore hidden files
    persistent: true,
    ignoreInitial: false, // Process existing files on startup
    awaitWriteFinish: {
      stabilityThreshold: 2000, // Wait 2s for file write to complete
      pollInterval: 100
    },
    depth: 0 // Only watch root level, not subdirectories
  });
  
  watcher.on('add', async (filePath) => {
    const filename = path.basename(filePath);
    const dirname = path.dirname(filePath);
    
    // Only process .md files in the hot folder (not in subdirectories)
    if (filename.endsWith('.md') && dirname === HOT_FOLDER.replace(/\/$/, '')) {
      await processArticle(filePath);
    }
  });
  
  watcher.on('error', (error) => {
    console.error('❌ Watcher error:', error);
  });
  
  console.log(`👀 Monitoring: ${HOT_FOLDER}`);
  console.log('✅ Article Monitor Service is running');
  console.log('   Waiting for new .md files...\n');
  
  return watcher;
}

// Graceful shutdown
export async function stopArticleMonitor(watcher: FSWatcher) {
  console.log('\n⏸️  Stopping Article Monitor Service...');
  await watcher.close();
  console.log('✅ Article Monitor Service stopped');
}
