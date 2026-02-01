import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('✅ Connected to database');

// Resource articles data
const articles = [
  {
    slug: 'hplc-method-development-guide',
    title: 'HPLC Method Development: A Step-by-Step Guide for Beginners',
    category: 'Technical Guides',
    excerpt: 'A comprehensive guide to developing robust HPLC methods from scratch, covering column selection, mobile phase optimization, and method validation.',
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/technical_guides/TG-001_HPLC_Method_Development_A_Step-by-Step_Guide_for_Beginners.md'), 'utf-8'),
    author: 'Rowell HPLC Team',
    publishedAt: new Date('2025-09-15'),
    tags: JSON.stringify(['Method Development', 'HPLC', 'Beginners', 'Column Selection'])
  },
  {
    slug: 'troubleshooting-hplc-peak-issues',
    title: 'Troubleshooting Common HPLC Peak Issues',
    category: 'Technical Guides',
    excerpt: 'Learn how to identify and resolve common HPLC peak problems including tailing, fronting, split peaks, and ghost peaks.',
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/technical_guides/TG-002_Troubleshooting_Common_HPLC_Peak_Issues.md'), 'utf-8'),
    author: 'Rowell HPLC Team',
    publishedAt: new Date('2025-10-01'),
    tags: JSON.stringify(['Troubleshooting', 'Peak Shape', 'HPLC', 'Problem Solving'])
  },
  {
    slug: 'hplc-column-selection-guide',
    title: 'How to Select the Right HPLC Column for Your Application',
    category: 'Technical Guides',
    excerpt: 'A practical guide to choosing the optimal HPLC column based on your analyte properties, separation goals, and sample matrix.',
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/technical_guides/TG-003_How_to_Select_the_Right_HPLC_Column_for_Your_Application.md'), 'utf-8'),
    author: 'Rowell HPLC Team',
    publishedAt: new Date('2025-10-15'),
    tags: JSON.stringify(['Column Selection', 'HPLC', 'Stationary Phase', 'C18'])
  },
  {
    slug: 'sample-preparation-techniques-hplc',
    title: 'Sample Preparation Techniques for HPLC Analysis',
    category: 'Technical Guides',
    excerpt: 'Master essential sample preparation techniques including extraction, filtration, and derivatization to improve HPLC analysis quality.',
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/technical_guides/TG-004_Sample_Preparation_Techniques_for_HPLC_Analysis.md'), 'utf-8'),
    author: 'Rowell HPLC Team',
    publishedAt: new Date('2025-11-01'),
    tags: JSON.stringify(['Sample Preparation', 'HPLC', 'SPE', 'Extraction'])
  },
  {
    slug: 'mobile-phase-optimization-hplc',
    title: 'A Practical Guide to Mobile Phase Optimization in HPLC',
    category: 'Technical Guides',
    excerpt: 'Learn systematic approaches to optimize mobile phase composition, pH, and gradient conditions for better HPLC separations.',
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/technical_guides/TG-005_Mobile_Phase_Optimization_in_HPLC.md'), 'utf-8'),
    author: 'Rowell HPLC Team',
    publishedAt: new Date('2025-11-15'),
    tags: JSON.stringify(['Mobile Phase', 'Optimization', 'HPLC', 'Gradient'])
  },
  {
    slug: 'hplc-system-maintenance-guide',
    title: 'A Practical Guide to HPLC System Maintenance and Care',
    category: 'Technical Guides',
    excerpt: 'Essential maintenance procedures to keep your HPLC system running smoothly and extend column lifetime.',
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/technical_guides/TG-006_HPLC_System_Maintenance_and_Care.md'), 'utf-8'),
    author: 'Rowell HPLC Team',
    publishedAt: new Date('2025-12-01'),
    tags: JSON.stringify(['Maintenance', 'HPLC', 'System Care', 'Column Care'])
  },
  {
    slug: 'hplc-column-selection-practical-guide',
    title: 'A Practical Guide to HPLC Column Selection',
    category: 'Technical Guides',
    excerpt: 'Comprehensive guide to selecting HPLC columns based on analyte chemistry, separation mode, and application requirements.',
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/technical_guides/TG-007_A_Practical_Guide_to_HPLC_Column_Selection.md'), 'utf-8'),
    author: 'Rowell HPLC Team',
    publishedAt: new Date('2025-12-15'),
    tags: JSON.stringify(['Column Selection', 'HPLC', 'Reversed Phase', 'Normal Phase'])
  },
  {
    slug: 'pharmaceutical-analysis-active-ingredients',
    title: 'Pharmaceutical Analysis: Assay of Active Ingredients in Tablets',
    category: 'Application Notes',
    excerpt: 'A validated HPLC method for quantitative analysis of active pharmaceutical ingredients in tablet formulations.',
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/application_notes/AN-001_Pharmaceutical_Analysis_Assay_of_Active_Ingredients_in_Tablets.md'), 'utf-8'),
    author: 'Rowell HPLC Team',
    publishedAt: new Date('2025-09-20'),
    tags: JSON.stringify(['Pharmaceutical', 'API', 'Tablets', 'Quality Control'])
  },
  {
    slug: 'food-safety-pesticide-residues',
    title: 'Food Safety: Detection of Pesticide Residues in Vegetables',
    category: 'Application Notes',
    excerpt: 'HPLC-MS/MS method for multi-residue analysis of pesticides in vegetable samples for food safety compliance.',
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/application_notes/AN-002_Food_Safety_Detection_of_Pesticide_Residues_in_Vegetables.md'), 'utf-8'),
    author: 'Rowell HPLC Team',
    publishedAt: new Date('2025-10-05'),
    tags: JSON.stringify(['Food Safety', 'Pesticides', 'HPLC-MS', 'Vegetables'])
  },
  {
    slug: 'environmental-analysis-heavy-metals-water',
    title: 'Environmental Analysis: Determination of Heavy Metals in Water by HPLC',
    category: 'Application Notes',
    excerpt: 'HPLC method for trace analysis of heavy metal ions in water samples with pre-column derivatization.',
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/application_notes/AN-003_Environmental_Analysis_Water_Quality_Testing_for_Heavy_Metals.md'), 'utf-8'),
    author: 'Rowell HPLC Team',
    publishedAt: new Date('2025-10-20'),
    tags: JSON.stringify(['Environmental', 'Heavy Metals', 'Water Analysis', 'Trace Analysis'])
  },
  {
    slug: 'petrochemical-analysis-additives-gasoline',
    title: 'Petrochemical Analysis: Determination of Antioxidant Additives in Gasoline',
    category: 'Application Notes',
    excerpt: 'HPLC method for quantification of antioxidant additives in gasoline and petroleum products.',
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/application_notes/AN-004_Petrochemical_Analysis_Determination_of_Additives_in_Gasoline.md'), 'utf-8'),
    author: 'Rowell HPLC Team',
    publishedAt: new Date('2025-11-05'),
    tags: JSON.stringify(['Petrochemical', 'Additives', 'Gasoline', 'Quality Control'])
  },
  {
    slug: 'clinical-diagnostics-vitamin-d-serum',
    title: 'Clinical Diagnostics: Analysis of Vitamin D in Human Serum',
    category: 'Application Notes',
    excerpt: 'Validated HPLC-MS/MS method for quantification of vitamin D metabolites in human serum for clinical diagnostics.',
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/application_notes/AN-005_Clinical_Diagnostics_Analysis_of_Vitamin_D_in_Human_Serum.md'), 'utf-8'),
    author: 'Rowell HPLC Team',
    publishedAt: new Date('2025-11-20'),
    tags: JSON.stringify(['Clinical', 'Vitamin D', 'Serum', 'HPLC-MS'])
  },
  {
    slug: 'nutraceuticals-curcuminoids-turmeric',
    title: 'Nutraceuticals: Analysis of Curcuminoids in Turmeric Supplements',
    category: 'Application Notes',
    excerpt: 'HPLC method for quantification of curcumin, demethoxycurcumin, and bisdemethoxycurcumin in turmeric supplements.',
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/application_notes/AN-006_Nutraceuticals_Analysis_of_Curcuminoids_in_Turmeric_Supplements.md'), 'utf-8'),
    author: 'Rowell HPLC Team',
    publishedAt: new Date('2025-12-05'),
    tags: JSON.stringify(['Nutraceuticals', 'Curcumin', 'Supplements', 'Natural Products'])
  },
  {
    slug: 'food-analysis-artificial-sweeteners-beverages',
    title: 'Food Analysis: Determination of Artificial Sweeteners in Beverages',
    category: 'Application Notes',
    excerpt: 'HPLC method for simultaneous determination of multiple artificial sweeteners in soft drinks and beverages.',
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/application_notes/AN-007_Food_Analysis_Determination_of_Artificial_Sweeteners_in_Beverages.md'), 'utf-8'),
    author: 'Rowell HPLC Team',
    publishedAt: new Date('2025-12-20'),
    tags: JSON.stringify(['Food Analysis', 'Sweeteners', 'Beverages', 'HPLC'])
  },
  {
    slug: 'biopharmaceuticals-role-of-hplc',
    title: 'The Rise of Biopharmaceuticals and the Indispensable Role of HPLC',
    category: 'Industry Insights',
    excerpt: 'Explore how HPLC technology is evolving to meet the unique challenges of biopharmaceutical analysis and characterization.',
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/industry_insights/II-001_The_Rise_of_Biopharmaceuticals_and_the_Role_of_HPLC.md'), 'utf-8'),
    author: 'Rowell HPLC Team',
    publishedAt: new Date('2025-09-25'),
    tags: JSON.stringify(['Biopharmaceuticals', 'Industry Trends', 'HPLC', 'Biologics'])
  },
  {
    slug: 'emerging-trends-hplc-technology',
    title: 'Emerging Trends in HPLC Technology',
    category: 'Industry Insights',
    excerpt: 'Discover the latest innovations in HPLC including UHPLC, 2D-LC, and miniaturization technologies.',
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/industry_insights/II-002_Emerging_Trends_in_HPLC_Technology.md'), 'utf-8'),
    author: 'Rowell HPLC Team',
    publishedAt: new Date('2025-10-10'),
    tags: JSON.stringify(['UHPLC', 'Technology Trends', 'Innovation', '2D-LC'])
  },
  {
    slug: 'ai-impact-chromatography-data-analysis',
    title: 'The Impact of AI on Chromatography Data Analysis',
    category: 'Industry Insights',
    excerpt: 'How artificial intelligence and machine learning are revolutionizing HPLC method development and data interpretation.',
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/industry_insights/II-003_The_Impact_of_AI_on_Chromatography_Data_Analysis.md'), 'utf-8'),
    author: 'Rowell HPLC Team',
    publishedAt: new Date('2025-10-25'),
    tags: JSON.stringify(['Artificial Intelligence', 'Machine Learning', 'Data Analysis', 'HPLC'])
  },
  {
    slug: 'hplc-forensic-science',
    title: 'HPLC in Forensic Science',
    category: 'Industry Insights',
    excerpt: 'The critical role of HPLC in forensic toxicology, drug analysis, and crime scene investigation.',
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/industry_insights/II-004_HPLC_in_Forensic_Science.md'), 'utf-8'),
    author: 'Rowell HPLC Team',
    publishedAt: new Date('2025-11-10'),
    tags: JSON.stringify(['Forensic Science', 'Toxicology', 'Drug Analysis', 'HPLC'])
  },
  {
    slug: 'pharma-4-future-quality-control',
    title: 'Pharma 4.0: The Future of Pharmaceutical Quality Control',
    category: 'Industry Insights',
    excerpt: 'How Industry 4.0 technologies are transforming pharmaceutical QC with smart HPLC systems and real-time analytics.',
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/industry_insights/II-005_The_Future_of_Pharmaceutical_Quality_Control.md'), 'utf-8'),
    author: 'Rowell HPLC Team',
    publishedAt: new Date('2025-11-25'),
    tags: JSON.stringify(['Pharma 4.0', 'Quality Control', 'Industry 4.0', 'Smart Manufacturing'])
  },
  {
    slug: 'hplc-cannabis-testing',
    title: 'HPLC in Cannabis Testing',
    category: 'Industry Insights',
    excerpt: 'The growing role of HPLC in cannabis potency testing, pesticide screening, and quality assurance.',
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/industry_insights/II-006_HPLC_in_Cannabis_Testing.md'), 'utf-8'),
    author: 'Rowell HPLC Team',
    publishedAt: new Date('2025-12-10'),
    tags: JSON.stringify(['Cannabis', 'Potency Testing', 'Quality Assurance', 'HPLC'])
  }
];

console.log(`Starting to seed ${articles.length} resource articles...`);

// Insert articles
for (const article of articles) {
  try {
    await connection.execute(
      `INSERT INTO resources (slug, title, category, excerpt, content, author, publishedAt, tags, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', NOW(), NOW())`,
      [
        article.slug,
        article.title,
        article.category,
        article.excerpt,
        article.content,
        article.author,
        article.publishedAt,
        article.tags
      ]
    );
    console.log(`✅ Inserted: ${article.title}`);
  } catch (error) {
    console.error(`❌ Failed to insert ${article.title}:`, error.message);
  }
}

await connection.end();
console.log('\n🎉 Seed completed successfully!');
