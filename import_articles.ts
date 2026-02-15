import { getDb } from './server/db';
import { articles, authors } from './drizzle/schema';
import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

// Author profiles
const authorProfiles = {
  'dr-michael-zhang': {
    name: 'Dr. Michael Zhang',
    slug: 'dr-michael-zhang',
    title: 'Technical Director',
    bio: 'Dr. Michael Zhang is a seasoned chromatography expert with over 15 years of experience in analytical chemistry. He specializes in HPLC method development and instrumentation, providing practical guidance for laboratories worldwide.',
    expertise: ['HPLC', 'Method Development', 'Instrumentation', 'Troubleshooting'],
    email: 'michael.zhang@rowellhplc.com',
    photoUrl: null
  },
  'dr-evelyn-reed': {
    name: 'Dr. Evelyn Reed',
    slug: 'dr-evelyn-reed',
    title: 'Pharmaceutical Analysis Expert',
    bio: 'Dr. Evelyn Reed brings extensive pharmaceutical industry experience, specializing in drug development and quality control. Her expertise spans API characterization, impurity profiling, and regulatory compliance.',
    expertise: ['Pharmaceutical Analysis', 'Drug Development', 'Quality Control', 'Regulatory Compliance'],
    email: 'evelyn.reed@rowellhplc.com',
    photoUrl: null
  },
  'dr-james-chen': {
    name: 'Dr. James Chen',
    slug: 'dr-james-chen',
    title: 'Environmental & Food Safety Specialist',
    bio: 'Dr. James Chen focuses on environmental monitoring and food safety testing using chromatographic techniques. He has published numerous papers on pesticide analysis and contaminant detection.',
    expertise: ['Environmental Testing', 'Food Safety', 'Pesticide Analysis', 'Contaminant Detection'],
    email: 'james.chen@rowellhplc.com',
    photoUrl: null
  },
  'dr-sarah-martinez': {
    name: 'Dr. Sarah Martinez',
    slug: 'dr-sarah-martinez',
    title: 'Clinical & Biopharmaceutical Specialist',
    bio: 'Dr. Sarah Martinez specializes in clinical diagnostics and biopharmaceutical analysis. Her work includes therapeutic drug monitoring, biomarker discovery, and monoclonal antibody characterization.',
    expertise: ['Clinical Diagnostics', 'Therapeutic Drug Monitoring', 'Biopharmaceuticals', 'Biomarker Analysis'],
    email: 'sarah.martinez@rowellhplc.com',
    photoUrl: null
  }
};

async function importArticles() {
  console.log('Starting article import...');
  
  const db = await getDb();
  
  // Step 1: Import authors
  console.log('\n=== Importing Authors ===');
  for (const [slug, profile] of Object.entries(authorProfiles)) {
    try {
      await db.insert(authors).values({
        name: profile.name,
        slug: profile.slug,
        title: profile.title,
        bio: profile.bio,
        expertise: JSON.stringify(profile.expertise),
        email: profile.email,
        photoUrl: profile.photoUrl,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✓ Imported author: ${profile.name}`);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`- Author already exists: ${profile.name}`);
      } else {
        console.error(`✗ Error importing author ${profile.name}:`, error.message);
      }
    }
  }
  
  // Step 2: Import articles
  console.log('\n=== Importing Articles ===');
  const articleFiles = fs.readdirSync('/home/ubuntu')
    .filter(file => file.startsWith('ARTICLE_') && file.endsWith('.md'));
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const filename of articleFiles) {
    try {
      const filePath = path.join('/home/ubuntu', filename);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data: frontmatter, content } = matter(fileContent);
      
      // Extract metadata
      const {
        title,
        author,
        author_slug,
        category,
        area,
        slug,
        year,
        quarter,
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
      
      console.log(`✓ Imported: ${title} (${year})`);
      successCount++;
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`- Article already exists: ${filename}`);
      } else {
        console.error(`✗ Error importing ${filename}:`, error.message);
        errorCount++;
      }
    }
  }
  
  console.log(`\n=== Import Summary ===`);
  console.log(`Total articles processed: ${articleFiles.length}`);
  console.log(`Successfully imported: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Already existed: ${articleFiles.length - successCount - errorCount}`);
  
  process.exit(0);
}

importArticles().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
