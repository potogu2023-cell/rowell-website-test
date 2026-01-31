const fs = require('fs');
const path = require('path');

// Article metadata with distributed publication dates
const articleMetadata = {
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

function extractTitleFromMarkdown(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "Untitled";
}

function extractExcerpt(content) {
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

function generateSlug(filename) {
  return filename
    .replace(/\.md$/, '')
    .toLowerCase()
    .replace(/_/g, '-');
}

function escapeSQL(str) {
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

// Generate SQL
const categories = {
  "Technical Guides": 1,
  "Application Notes": 2,
  "Industry Insights": 3
};

let sql = "-- Resource Categories\n";
sql += "INSERT INTO resource_categories (id, name, slug, description) VALUES\n";
sql += "(1, 'Technical Guides', 'technical-guides', 'Technical Guides for HPLC professionals'),\n";
sql += "(2, 'Application Notes', 'application-notes', 'Application Notes for HPLC professionals'),\n";
sql += "(3, 'Industry Insights', 'industry-insights', 'Industry Insights for HPLC professionals')\n";
sql += "ON DUPLICATE KEY UPDATE name=VALUES(name);\n\n";

sql += "-- Resources\n";
sql += "INSERT INTO resources (slug, title, content, excerpt, metaDescription, authorName, status, language, categoryId, viewCount, featured, publishedAt) VALUES\n";

const articlesDir = "/home/ubuntu/resource_center_articles";
const subdirs = ["technical_guides", "application_notes", "industry_insights"];

const values = [];

for (const subdir of subdirs) {
  const dirPath = path.join(articlesDir, subdir);
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const title = extractTitleFromMarkdown(content);
    const excerpt = extractExcerpt(content);
    const slug = generateSlug(file);
    const metadata = articleMetadata[file];
    
    if (!metadata) {
      console.warn(`No metadata found for ${file}, skipping...`);
      continue;
    }
    
    const categoryId = categories[metadata.category];
    const viewCount = Math.floor(Math.random() * 500) + 100;
    
    values.push(`('${escapeSQL(slug)}', '${escapeSQL(title)}', '${escapeSQL(content)}', '${escapeSQL(excerpt)}', '${escapeSQL(excerpt.substring(0, 200))}', 'Manus AI', 'published', 'en', ${categoryId}, ${viewCount}, ${metadata.featured ? 1 : 0}, '${metadata.publishedAt}')`);
  }
}

sql += values.join(',\n');
sql += "\nON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), excerpt=VALUES(excerpt), updatedAt=NOW();\n";

fs.writeFileSync('/home/ubuntu/import_resources.sql', sql);
console.log('SQL file generated: /home/ubuntu/import_resources.sql');
console.log(`Total articles: ${values.length}`);
