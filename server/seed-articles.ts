import { getDb } from './db';
import { articles, authors } from '../drizzle/schema';
import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Author profiles
const authorProfiles = [
  {
    fullName: 'Dr. Michael Zhang',
    slug: 'dr-michael-zhang',
    title: 'Technical Director',
    yearsOfExperience: 15,
    education: 'Ph.D. in Analytical Chemistry',
    biography: 'Dr. Michael Zhang is a seasoned chromatography expert with over 15 years of experience in analytical chemistry. He specializes in HPLC method development and instrumentation, providing practical guidance for laboratories worldwide.',
    expertise: JSON.stringify(['HPLC', 'Method Development', 'Instrumentation', 'Troubleshooting']),
    photoUrl: null
  },
  {
    fullName: 'Dr. Evelyn Reed',
    slug: 'dr-evelyn-reed',
    title: 'Pharmaceutical Analysis Expert',
    yearsOfExperience: 12,
    education: 'Ph.D. in Pharmaceutical Sciences',
    biography: 'Dr. Evelyn Reed brings extensive pharmaceutical industry experience, specializing in drug development and quality control. Her expertise spans API characterization, impurity profiling, and regulatory compliance.',
    expertise: JSON.stringify(['Pharmaceutical Analysis', 'Drug Development', 'Quality Control', 'Regulatory Compliance']),
    photoUrl: null
  },
  {
    fullName: 'Dr. James Chen',
    slug: 'dr-james-chen',
    title: 'Environmental & Food Safety Specialist',
    yearsOfExperience: 10,
    education: 'Ph.D. in Environmental Chemistry',
    biography: 'Dr. James Chen focuses on environmental monitoring and food safety testing using chromatographic techniques. He has published numerous papers on pesticide analysis and contaminant detection.',
    expertise: JSON.stringify(['Environmental Testing', 'Food Safety', 'Pesticide Analysis', 'Contaminant Detection']),
    photoUrl: null
  },
  {
    fullName: 'Dr. Sarah Martinez',
    slug: 'dr-sarah-martinez',
    title: 'Clinical & Biopharmaceutical Specialist',
    yearsOfExperience: 8,
    education: 'Ph.D. in Clinical Chemistry',
    biography: 'Dr. Sarah Martinez specializes in clinical diagnostics and biopharmaceutical analysis. Her work includes therapeutic drug monitoring, biomarker discovery, and monoclonal antibody characterization.',
    expertise: JSON.stringify(['Clinical Diagnostics', 'Therapeutic Drug Monitoring', 'Biopharmaceuticals', 'Biomarker Analysis']),
    photoUrl: null
  }
];

export async function seedArticles() {
  console.log('Starting article seeding...');
  
  const db = await getDb();
  
  if (!db) {
    console.error('Database connection failed');
    return { success: false, error: 'Database connection failed' };
  }
  
  // Step 1: Import authors
  console.log('\n=== Seeding Authors ===');
  let authorsCreated = 0;
  let authorsExisted = 0;
  
  for (const profile of authorProfiles) {
    try {
      await db.insert(authors).values({
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✓ Created author: ${profile.name}`);
      authorsCreated++;
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`- Author already exists: ${profile.name}`);
        authorsExisted++;
      } else {
        console.error(`✗ Error creating author ${profile.name}:`, error.message);
      }
    }
  }
  
  // Step 2: Import articles
  console.log('\n=== Seeding Articles ===');
  const articlesDir = path.join(__dirname, '../data/articles');
  
  if (!fs.existsSync(articlesDir)) {
    console.error(`Articles directory not found: ${articlesDir}`);
    return { 
      success: false, 
      error: 'Articles directory not found',
      authorsCreated,
      authorsExisted
    };
  }
  
  const articleFiles = fs.readdirSync(articlesDir)
    .filter(file => file.startsWith('ARTICLE_') && file.endsWith('.md'));
  
  let articlesCreated = 0;
  let articlesExisted = 0;
  let articlesError = 0;
  
  for (const filename of articleFiles) {
    try {
      const filePath = path.join(articlesDir, filename);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data: frontmatter, content } = matter(fileContent);
      
      // Extract metadata
      const {
        title,
        author_slug,
        category,
        area,
        slug,
        published_date,
        description,
        keywords
      } = frontmatter;
      
      // Insert article
      await db.insert(articles).values({
        title,
        slug,
        content,
        excerpt: description,
        category: category as any,
        applicationArea: area as any,
        authorSlug: author_slug,
        featuredImage: null,
        tags: keywords ? JSON.stringify(keywords.split(', ')) : null,
        metaDescription: description,
        metaKeywords: keywords,
        publishedAt: new Date(published_date),
        viewCount: 0,
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`✓ Created: ${title}`);
      articlesCreated++;
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`- Article already exists: ${filename}`);
        articlesExisted++;
      } else {
        console.error(`✗ Error creating ${filename}:`, error.message);
        articlesError++;
      }
    }
  }
  
  const summary = {
    success: true,
    authorsCreated,
    authorsExisted,
    articlesCreated,
    articlesExisted,
    articlesError,
    totalArticles: articleFiles.length
  };
  
  console.log(`\n=== Seeding Summary ===`);
  console.log(JSON.stringify(summary, null, 2));
  
  return summary;
}

// Note: This function is called via tRPC router, not directly
