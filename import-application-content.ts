import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ApplicationData {
  applications: Array<{
    id: string;
    title: { en: string; zh: string };
    icon: string;
    detailedDescription: { en: string; zh: string };
    commonAnalysisItems: Array<{
      name: { en: string; zh: string };
      description: { en: string; zh: string };
    }>;
    recommendedColumns: Array<{
      columnType: string;
      uspStandard: string;
      particleSize: string;
      typicalDimensions: string;
      applications: { en: string; zh: string };
    }>;
    typicalApplications: Array<{
      title: { en: string; zh: string };
      sampleType: { en: string; zh: string };
      analysisGoal: { en: string; zh: string };
      columnUsed: string;
      keyParameters: {
        mobilePhase: string;
        flowRate: string;
        detection: string;
        injectionVolume: string;
      };
    }>;
    technicalChallenges: Array<{
      challenge: { en: string; zh: string };
      solution: { en: string; zh: string };
    }>;
    relatedStandards: Array<{
      standard: string;
      description: { en: string; zh: string };
    }>;
  }>;
}

console.log("🚀 Starting import of Application content data...\n");

// Read application content data
const appData: ApplicationData = JSON.parse(
  readFileSync("/home/ubuntu/upload/application_content_data.json", "utf-8")
);

console.log(`📊 Loaded ${appData.applications.length} applications\n`);

// Read existing translation files
const localesDir = join(__dirname, "client/src/i18n/locales");
const languages = ["en", "zh"];

for (const lang of languages) {
  console.log(`\n📝 Processing ${lang} translation...`);
  
  const filePath = join(localesDir, `${lang}.json`);
  const translations = JSON.parse(readFileSync(filePath, "utf-8"));

  // Update applications section
  translations.applications = translations.applications || {};
  
  // Keep existing fields
  translations.applications.title = translations.applications.title || (lang === "en" ? "Applications" : "应用领域");
  translations.applications.subtitle = translations.applications.subtitle || (lang === "en" ? "Chromatography solutions for diverse analytical needs across industries" : "为各行业提供多样化分析需求的色谱解决方案");
  translations.applications.intro = translations.applications.intro || (lang === "en" ? "Our chromatography consumables serve a wide range of applications..." : "我们的色谱耗材服务于制药、环境、食品和研究等广泛应用领域...");

  // Add detailed content for each application
  for (const app of appData.applications) {
    const appKey = app.id;
    
    // Initialize application section
    translations.applications[appKey] = translations.applications[appKey] || {};
    
    // Basic info
    translations.applications[appKey].title = app.title[lang];
    translations.applications[appKey].description = app.detailedDescription[lang];
    
    // Common analysis items
    translations.applications[appKey].analysisItems = app.commonAnalysisItems.map(item => ({
      name: item.name[lang],
      description: item.description[lang]
    }));
    
    // Recommended columns
    translations.applications[appKey].columns = app.recommendedColumns.map(col => ({
      type: col.columnType,
      usp: col.uspStandard,
      particleSize: col.particleSize,
      dimensions: col.typicalDimensions,
      applications: col.applications[lang]
    }));
    
    // Typical applications
    translations.applications[appKey].cases = app.typicalApplications.map(cas => ({
      title: cas.title[lang],
      sample: cas.sampleType[lang],
      goal: cas.analysisGoal[lang],
      column: cas.columnUsed,
      parameters: cas.keyParameters
    }));
    
    // Technical challenges
    translations.applications[appKey].challenges = app.technicalChallenges.map(ch => ({
      challenge: ch.challenge[lang],
      solution: ch.solution[lang]
    }));
    
    // Related standards
    translations.applications[appKey].standards = app.relatedStandards.map(std => ({
      standard: std.standard,
      description: std.description[lang]
    }));
    
    console.log(`  ✅ Updated ${appKey}`);
  }

  // Write back to file
  writeFileSync(filePath, JSON.stringify(translations, null, 2) + "\n");
  console.log(`  💾 Saved ${lang}.json`);
}

console.log("\n\n✅ Import complete!");
console.log("\n📊 Summary:");
console.log(`  Applications: ${appData.applications.length}`);
console.log(`  Languages: ${languages.length}`);
console.log(`  Total analysis items: ${appData.applications.reduce((sum, app) => sum + app.commonAnalysisItems.length, 0)}`);
console.log(`  Total columns: ${appData.applications.reduce((sum, app) => sum + app.recommendedColumns.length, 0)}`);
console.log(`  Total cases: ${appData.applications.reduce((sum, app) => sum + app.typicalApplications.length, 0)}`);
console.log(`  Total challenges: ${appData.applications.reduce((sum, app) => sum + app.technicalChallenges.length, 0)}`);
console.log(`  Total standards: ${appData.applications.reduce((sum, app) => sum + app.relatedStandards.length, 0)}`);

process.exit(0);
