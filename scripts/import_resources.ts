import { db } from "../server/db";
import { resources, resourceCategories } from "../drizzle/schema";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

// Article metadata with distributed publication dates
const articleMetadata: Record<string, {
  category: string;
  publishedAt: string;
  featured: boolean;
}> = {
  "TG-001_HPLC_Method_Development_A_Step-by-Step_Guide_for_Beginners.md": {
    category: "Technical Guides",
    publishedAt: "2025-08-15",
    featured: true
  },
  "TG-002_Troubleshooting_Common_HPLC_Peak_Issues.md": {
    category: "Technical Guides",
    publishedAt: "2025-09-01",
    featured: true
  },
  "TG-003_How_to_Select_the_Right_HPLC_Column_for_Your_Application.md": {
    category: "Technical Guides",
    publishedAt: "2025-09-20",
    featured: false
  },
  "TG-004_Sample_Preparation_Techniques_for_HPLC_Analysis.md": {
    category: "Technical Guides",
    publishedAt: "2025-10-05",
    featured: false
  },
  "TG-005_Mobile_Phase_Optimization_in_HPLC.md": {
    category: "Technical Guides",
    publishedAt: "2025-10-25",
    featured: false
  },
  "TG-006_HPLC_System_Maintenance_and_Care.md": {
    category: "Technical Guides",
    publishedAt: "2025-11-10",
    featured: false
  },
  "TG-007_A_Practical_Guide_to_HPLC_Column_Selection.md": {
    category: "Technical Guides",
    publishedAt: "2025-12-01",
    featured: false
  },
  "AN-001_Pharmaceutical_Analysis_Assay_of_Active_Ingredients_in_Tablets.md": {
    category: "Application Notes",
    publishedAt: "2025-08-20",
    featured: true
  },
  "AN-002_Food_Safety_Detection_of_Pesticide_Residues_in_Vegetables.md": {
    category: "Application Notes",
    publishedAt: "2025-09-05",
    featured: true
  },
  "AN-003_Environmental_Analysis_Water_Quality_Testing_for_Heavy_Metals.md": {
    category: "Application Notes",
    publishedAt: "2025-09-25",
    featured: false
  },
  "AN-004_Petrochemical_Analysis_Determination_of_Additives_in_Gasoline.md": {
    category: "Application Notes",
    publishedAt: "2025-10-10",
    featured: false
  },
  "AN-005_Clinical_Diagnostics_Analysis_of_Vitamin_D_in_Human_Serum.md": {
    category: "Application Notes",
    publishedAt: "2025-10-30",
    featured: false
  },
  "AN-006_Nutraceuticals_Analysis_of_Curcuminoids_in_Turmeric_Supplements.md": {
    category: "Application Notes",
    publishedAt: "2025-11-15",
    featured: false
  },
  "AN-007_Food_Analysis_Determination_of_Artificial_Sweeteners_in_Beverages.md": {
    category: "Application Notes",
    publishedAt: "2025-12-05",
    featured: false
  },
  "II-001_The_Rise_of_Biopharmaceuticals_and_the_Role_of_HPLC.md": {
    category: "Industry Insights",
    publishedAt: "2025-08-25",
    featured: true
  },
  "II-002_Emerging_Trends_in_HPLC_Technology.md": {
    category: "Industry Insights",
    publishedAt: "2025-09-10",
    featured: true
  },
  "II-003_The_Impact_of_AI_on_Chromatography_Data_Analysis.md": {
    category: "Industry Insights",
    publishedAt: "2025-10-01",
    featured: true
  },
  "II-004_HPLC_in_Forensic_Science.md": {
    category: "Industry Insights",
    publishedAt: "2025-10-20",
    featured: false
  },
  "II-005_The_Future_of_Pharmaceutical_Quality_Control.md": {
    category: "Industry Insights",
    publishedAt: "2025-11-05",
    featured: false
  },
  "II-006_HPLC_in_Cannabis_Testing.md": {
    category: "Industry Insights",
    publishedAt: "2025-11-25",
    featured: false
  }
};

function extractTitleFromMarkdown(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "Untitled";
}

function extractExcerpt(content: string): string {
  // Find the first paragraph after the metadata
  const lines = content.split('\n');
  let inMetadata = false;
  let excerpt = '';
  
  for (const line of lines) {
    if (line.startsWith('---')) {
      inMetadata = !inMetadata;
      continue;
    }
    if (inMetadata || line.startsWith('#') || line.trim() === '') {
      continue;
    }
    if (line.trim().length > 50) {
      excerpt = line.trim();
      break;
    }
  }
  
  return excerpt.substring(0, 500);
}

function generateSlug(filename: string): string {
  return filename
    .replace(/\.md$/, '')
    .toLowerCase()
    .replace(/_/g, '-');
}

async function importResources() {
  console.log("Starting resource import...");

  // Create categories
  const categoryMap: Record<string, number> = {};
  const categories = ["Technical Guides", "Application Notes", "Industry Insights"];
  
  for (const categoryName of categories) {
    const slug = categoryName.toLowerCase().replace(/\s+/g, '-');
    const [result] = await db.insert(resourceCategories).values({
      name: categoryName,
      slug: slug,
      description: `${categoryName} for HPLC professionals`
    }).onDuplicateKeyUpdate({
      set: { name: categoryName }
    });
    
    // Get the category ID
    const [category] = await db.select().from(resourceCategories).where(eq(resourceCategories.slug, slug));
    categoryMap[categoryName] = category.id;
    console.log(`Created/Updated category: ${categoryName} (ID: ${category.id})`);
  }

  // Import articles
  const articlesDir = "/home/ubuntu/resource_center_articles";
  const subdirs = ["technical_guides", "application_notes", "industry_insights"];
  
  let importedCount = 0;
  
  for (const subdir of subdirs) {
    const dirPath = join(articlesDir, subdir);
    const files = readdirSync(dirPath).filter(f => f.endsWith('.md'));
    
    for (const file of files) {
      const filePath = join(dirPath, file);
      const content = readFileSync(filePath, 'utf-8');
      const title = extractTitleFromMarkdown(content);
      const excerpt = extractExcerpt(content);
      const slug = generateSlug(file);
      const metadata = articleMetadata[file];
      
      if (!metadata) {
        console.warn(`No metadata found for ${file}, skipping...`);
        continue;
      }
      
      const categoryId = categoryMap[metadata.category];
      
      await db.insert(resources).values({
        slug: slug,
        title: title,
        content: content,
        excerpt: excerpt,
        metaDescription: excerpt.substring(0, 200),
        authorName: "Manus AI",
        status: "published",
        language: "en",
        categoryId: categoryId,
        viewCount: Math.floor(Math.random() * 500) + 100, // Random view count between 100-600
        featured: metadata.featured ? 1 : 0,
        publishedAt: metadata.publishedAt
      }).onDuplicateKeyUpdate({
        set: {
          title: title,
          content: content,
          excerpt: excerpt,
          updatedAt: new Date().toISOString()
        }
      });
      
      importedCount++;
      console.log(`Imported: ${title} (${metadata.category})`);
    }
  }
  
  console.log(`\nImport complete! ${importedCount} articles imported.`);
}

// Run the import
importResources().catch(console.error);
