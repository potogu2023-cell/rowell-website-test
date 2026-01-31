import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { resources } from '../drizzle/schema';
import * as fs from 'fs';
import * as path from 'path';

// Resource articles data
const resourceArticles = [
  {
    title: "HPLC Method Development: A Step-by-Step Guide for Beginners",
    slug: "hplc-method-development-guide",
    category: "Technical Guides",
    excerpt: "Learn the fundamentals of HPLC method development with this comprehensive beginner's guide covering column selection, mobile phase optimization, and method validation.",
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/technical_guides/TG-001_HPLC_Method_Development_A_Step-by-Step_Guide_for_Beginners.md'), 'utf-8'),
    author: "ROWELL Technical Team",
    publishedAt: new Date('2025-06-15'),
    tags: ["HPLC", "Method Development", "Beginners", "Tutorial"],
    featured: true,
  },
  {
    title: "Troubleshooting Common HPLC Peak Issues",
    slug: "troubleshooting-hplc-peak-issues",
    category: "Technical Guides",
    excerpt: "Identify and resolve common HPLC peak problems including peak tailing, fronting, splitting, and broadening with practical solutions.",
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/technical_guides/TG-002_Troubleshooting_Common_HPLC_Peak_Issues.md'), 'utf-8'),
    author: "ROWELL Technical Team",
    publishedAt: new Date('2025-07-20'),
    tags: ["HPLC", "Troubleshooting", "Peak Issues", "Problem Solving"],
    featured: true,
  },
  {
    title: "How to Select the Right HPLC Column for Your Application",
    slug: "hplc-column-selection-guide",
    category: "Technical Guides",
    excerpt: "Master the art of HPLC column selection with this comprehensive guide covering stationary phases, particle sizes, and application-specific recommendations.",
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/technical_guides/TG-003_How_to_Select_the_Right_HPLC_Column_for_Your_Application.md'), 'utf-8'),
    author: "ROWELL Technical Team",
    publishedAt: new Date('2025-08-10'),
    tags: ["HPLC", "Column Selection", "Stationary Phase", "Method Development"],
    featured: false,
  },
  {
    title: "Sample Preparation Techniques for HPLC Analysis",
    slug: "sample-preparation-hplc",
    category: "Technical Guides",
    excerpt: "Explore essential sample preparation techniques for HPLC including extraction, filtration, derivatization, and cleanup methods.",
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/technical_guides/TG-004_Sample_Preparation_Techniques_for_HPLC_Analysis.md'), 'utf-8'),
    author: "ROWELL Technical Team",
    publishedAt: new Date('2025-09-05'),
    tags: ["HPLC", "Sample Preparation", "SPE", "Extraction"],
    featured: false,
  },
  {
    title: "A Practical Guide to Mobile Phase Optimization in HPLC",
    slug: "mobile-phase-optimization-hplc",
    category: "Technical Guides",
    excerpt: "Learn systematic approaches to mobile phase optimization including pH adjustment, buffer selection, and organic modifier optimization.",
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/technical_guides/TG-005_Mobile_Phase_Optimization_in_HPLC.md'), 'utf-8'),
    author: "ROWELL Technical Team",
    publishedAt: new Date('2025-10-12'),
    tags: ["HPLC", "Mobile Phase", "Optimization", "Method Development"],
    featured: false,
  },
  {
    title: "A Practical Guide to HPLC System Maintenance and Care",
    slug: "hplc-system-maintenance",
    category: "Technical Guides",
    excerpt: "Ensure optimal HPLC performance with this comprehensive maintenance guide covering preventive maintenance, troubleshooting, and best practices.",
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/technical_guides/TG-006_HPLC_System_Maintenance_and_Care.md'), 'utf-8'),
    author: "ROWELL Technical Team",
    publishedAt: new Date('2025-11-08'),
    tags: ["HPLC", "Maintenance", "Preventive Care", "System Care"],
    featured: false,
  },
  {
    title: "A Practical Guide to HPLC Column Selection",
    slug: "hplc-column-selection-practical",
    category: "Technical Guides",
    excerpt: "Navigate the complex world of HPLC column selection with practical tips for choosing the right column based on your analytical needs.",
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/technical_guides/TG-007_A_Practical_Guide_to_HPLC_Column_Selection.md'), 'utf-8'),
    author: "ROWELL Technical Team",
    publishedAt: new Date('2025-12-15'),
    tags: ["HPLC", "Column Selection", "Practical Guide", "Analytical Chemistry"],
    featured: false,
  },
  {
    title: "Pharmaceutical Analysis: Assay of Active Ingredients in Tablets",
    slug: "pharmaceutical-analysis-tablets",
    category: "Application Notes",
    excerpt: "A detailed application note demonstrating HPLC method for quantitative analysis of active pharmaceutical ingredients in tablet formulations.",
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/application_notes/AN-001_Pharmaceutical_Analysis_Assay_of_Active_Ingredients_in_Tablets.md'), 'utf-8'),
    author: "ROWELL Application Team",
    publishedAt: new Date('2025-06-25'),
    tags: ["Pharmaceutical", "HPLC", "Tablets", "API Analysis"],
    featured: true,
  },
  {
    title: "Food Safety: Detection of Pesticide Residues in Vegetables",
    slug: "pesticide-residues-vegetables",
    category: "Application Notes",
    excerpt: "Learn how to detect and quantify pesticide residues in vegetable samples using HPLC-MS/MS with QuEChERS sample preparation.",
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/application_notes/AN-002_Food_Safety_Detection_of_Pesticide_Residues_in_Vegetables.md'), 'utf-8'),
    author: "ROWELL Application Team",
    publishedAt: new Date('2025-07-30'),
    tags: ["Food Safety", "Pesticides", "HPLC-MS/MS", "QuEChERS"],
    featured: true,
  },
  {
    title: "Environmental Analysis: Determination of Heavy Metals in Water by HPLC",
    slug: "heavy-metals-water-analysis",
    category: "Application Notes",
    excerpt: "A comprehensive method for analyzing heavy metal contaminants in water samples using HPLC with post-column derivatization.",
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/application_notes/AN-003_Environmental_Analysis_Water_Quality_Testing_for_Heavy_Metals.md'), 'utf-8'),
    author: "ROWELL Application Team",
    publishedAt: new Date('2025-08-20'),
    tags: ["Environmental", "Heavy Metals", "Water Analysis", "HPLC"],
    featured: false,
  },
  {
    title: "Petrochemical Analysis: Determination of Antioxidant Additives in Gasoline",
    slug: "antioxidant-additives-gasoline",
    category: "Application Notes",
    excerpt: "Analyze antioxidant additives in gasoline samples using reversed-phase HPLC with UV detection for quality control.",
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/application_notes/AN-004_Petrochemical_Analysis_Determination_of_Additives_in_Gasoline.md'), 'utf-8'),
    author: "ROWELL Application Team",
    publishedAt: new Date('2025-09-15'),
    tags: ["Petrochemical", "Gasoline", "Additives", "Quality Control"],
    featured: false,
  },
  {
    title: "Clinical Diagnostics: Analysis of Vitamin D in Human Serum",
    slug: "vitamin-d-serum-analysis",
    category: "Application Notes",
    excerpt: "A validated HPLC-MS/MS method for quantification of vitamin D metabolites in human serum for clinical diagnostics.",
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/application_notes/AN-005_Clinical_Diagnostics_Analysis_of_Vitamin_D_in_Human_Serum.md'), 'utf-8'),
    author: "ROWELL Application Team",
    publishedAt: new Date('2025-10-22'),
    tags: ["Clinical", "Vitamin D", "Serum Analysis", "HPLC-MS/MS"],
    featured: false,
  },
  {
    title: "Nutraceuticals: Analysis of Curcuminoids in Turmeric Supplements",
    slug: "curcuminoids-turmeric-analysis",
    category: "Application Notes",
    excerpt: "Quantify curcuminoids in turmeric dietary supplements using HPLC with UV-Vis detection for quality assurance.",
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/application_notes/AN-006_Nutraceuticals_Analysis_of_Curcuminoids_in_Turmeric_Supplements.md'), 'utf-8'),
    author: "ROWELL Application Team",
    publishedAt: new Date('2025-11-18'),
    tags: ["Nutraceuticals", "Curcuminoids", "Turmeric", "Dietary Supplements"],
    featured: false,
  },
  {
    title: "Food Analysis: Determination of Artificial Sweeteners in Beverages",
    slug: "artificial-sweeteners-beverages",
    category: "Application Notes",
    excerpt: "Detect and quantify artificial sweeteners in beverage samples using HPLC with refractive index detection.",
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/application_notes/AN-007_Food_Analysis_Determination_of_Artificial_Sweeteners_in_Beverages.md'), 'utf-8'),
    author: "ROWELL Application Team",
    publishedAt: new Date('2025-12-25'),
    tags: ["Food Analysis", "Sweeteners", "Beverages", "HPLC"],
    featured: false,
  },
  {
    title: "The Rise of Biopharmaceuticals and the Indispensable Role of HPLC",
    slug: "biopharmaceuticals-hplc-role",
    category: "Industry Insights",
    excerpt: "Explore how HPLC technology is driving innovation in biopharmaceutical development and quality control.",
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/industry_insights/II-001_The_Rise_of_Biopharmaceuticals_and_the_Role_of_HPLC.md'), 'utf-8'),
    author: "ROWELL Industry Analysts",
    publishedAt: new Date('2025-07-05'),
    tags: ["Biopharmaceuticals", "Industry Trends", "HPLC", "Innovation"],
    featured: true,
  },
  {
    title: "Emerging Trends in HPLC Technology",
    slug: "emerging-trends-hplc",
    category: "Industry Insights",
    excerpt: "Discover the latest technological advances in HPLC including UHPLC, 2D-LC, and miniaturization trends.",
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/industry_insights/II-002_Emerging_Trends_in_HPLC_Technology.md'), 'utf-8'),
    author: "ROWELL Industry Analysts",
    publishedAt: new Date('2025-08-28'),
    tags: ["HPLC", "Technology Trends", "UHPLC", "Innovation"],
    featured: false,
  },
  {
    title: "The Impact of AI on Chromatography Data Analysis",
    slug: "ai-chromatography-data-analysis",
    category: "Industry Insights",
    excerpt: "How artificial intelligence and machine learning are revolutionizing chromatography data analysis and method development.",
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/industry_insights/II-003_The_Impact_of_AI_on_Chromatography_Data_Analysis.md'), 'utf-8'),
    author: "ROWELL Industry Analysts",
    publishedAt: new Date('2025-10-02'),
    tags: ["AI", "Machine Learning", "Data Analysis", "Chromatography"],
    featured: false,
  },
  {
    title: "HPLC in Forensic Science",
    slug: "hplc-forensic-science",
    category: "Industry Insights",
    excerpt: "Explore the critical role of HPLC in forensic analysis including drug testing, toxicology, and trace evidence analysis.",
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/industry_insights/II-004_HPLC_in_Forensic_Science.md'), 'utf-8'),
    author: "ROWELL Industry Analysts",
    publishedAt: new Date('2025-11-10'),
    tags: ["Forensic Science", "HPLC", "Toxicology", "Drug Testing"],
    featured: false,
  },
  {
    title: "Pharma 4.0: The Future of Pharmaceutical Quality Control",
    slug: "pharma-4-future-quality-control",
    category: "Industry Insights",
    excerpt: "Discover how Industry 4.0 technologies are transforming pharmaceutical quality control and the role of advanced chromatography.",
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/industry_insights/II-005_The_Future_of_Pharmaceutical_Quality_Control.md'), 'utf-8'),
    author: "ROWELL Industry Analysts",
    publishedAt: new Date('2025-12-05'),
    tags: ["Pharma 4.0", "Quality Control", "Industry 4.0", "Pharmaceutical"],
    featured: false,
  },
  {
    title: "HPLC in Cannabis Testing",
    slug: "hplc-cannabis-testing",
    category: "Industry Insights",
    excerpt: "Learn about the growing role of HPLC in cannabis potency testing, contaminant analysis, and quality assurance.",
    content: fs.readFileSync(path.join(__dirname, '../resource_center_articles/industry_insights/II-006_HPLC_in_Cannabis_Testing.md'), 'utf-8'),
    author: "ROWELL Industry Analysts",
    publishedAt: new Date('2026-01-12'),
    tags: ["Cannabis", "HPLC", "Testing", "Quality Assurance"],
    featured: false,
  },
];

async function seedResources() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const client = postgres(DATABASE_URL);
  const db = drizzle(client);

  try {
    console.log(`Starting to seed ${resourceArticles.length} resource articles...`);
    
    for (const article of resourceArticles) {
      console.log(`Inserting: ${article.title}`);
      await db.insert(resources).values({
        title: article.title,
        slug: article.slug,
        category: article.category,
        excerpt: article.excerpt,
        content: article.content,
        author: article.author,
        publishedAt: article.publishedAt,
        tags: article.tags,
        featured: article.featured,
        status: 'published',
      });
    }

    console.log('✅ Successfully seeded all resource articles!');
  } catch (error) {
    console.error('❌ Error seeding resources:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the seed function
seedResources()
  .then(() => {
    console.log('Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
