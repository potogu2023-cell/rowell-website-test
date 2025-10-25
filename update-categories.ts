import { drizzle } from "drizzle-orm/mysql2";
import { categories } from "./drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function updateCategories() {
  console.log("Clearing existing categories...");
  await db.delete(categories);

  console.log("Creating new category structure...");
  
  const newCategories = [
    // 前台显示分类
    { id: 1, name: "Chromatography Columns", slug: "chromatography-columns", description: "HPLC, GC, and specialty chromatography columns", parentId: null, displayOrder: 1, isVisible: true, level: 1 },
    { id: 2, name: "Chromatography Supplies", slug: "chromatography-supplies", description: "Consumables and supplies for chromatography", parentId: null, displayOrder: 2, isVisible: true, level: 1 },
    { id: 3, name: "Sample Preparation", slug: "sample-preparation", description: "Sample preparation products and equipment", parentId: null, displayOrder: 3, isVisible: true, level: 1 },
    { id: 4, name: "Filtration", slug: "filtration", description: "Filtration products and membrane filters", parentId: null, displayOrder: 4, isVisible: true, level: 1 },
    { id: 5, name: "Lab Supplies", slug: "lab-supplies", description: "General laboratory supplies and consumables", parentId: null, displayOrder: 5, isVisible: true, level: 1 },
    
    // 后台预留分类
    { id: 6, name: "Spectroscopy", slug: "spectroscopy", description: "Spectroscopy products and accessories (Reserved for future)", parentId: null, displayOrder: 6, isVisible: false, level: 1 },
    { id: 7, name: "Standards", slug: "standards", description: "Chemical standards and reference materials (Reserved for future)", parentId: null, displayOrder: 7, isVisible: false, level: 1 },
    
    // Chromatography Columns 二级分类
    { id: 11, name: "HPLC Columns", slug: "hplc-columns", description: "High Performance Liquid Chromatography columns", parentId: 1, displayOrder: 1, isVisible: true, level: 2 },
    { id: 12, name: "GC Columns", slug: "gc-columns", description: "Gas Chromatography columns", parentId: 1, displayOrder: 2, isVisible: true, level: 2 },
    { id: 13, name: "Guard Columns", slug: "guard-columns", description: "Guard columns and holders", parentId: 1, displayOrder: 3, isVisible: true, level: 2 },
    
    // HPLC Columns 三级分类
    { id: 111, name: "Analytical Columns", slug: "analytical-columns", description: "Analytical HPLC columns", parentId: 11, displayOrder: 1, isVisible: true, level: 3 },
    { id: 112, name: "Preparative Columns", slug: "preparative-columns", description: "Preparative HPLC columns", parentId: 11, displayOrder: 2, isVisible: true, level: 3 },
    { id: 113, name: "UHPLC Columns", slug: "uhplc-columns", description: "Ultra High Performance LC columns", parentId: 11, displayOrder: 3, isVisible: true, level: 3 },
    { id: 114, name: "Chiral Columns", slug: "chiral-columns", description: "Chiral separation columns", parentId: 11, displayOrder: 4, isVisible: true, level: 3 },
    { id: 115, name: "Bio Columns", slug: "bio-columns", description: "Biological sample analysis columns", parentId: 11, displayOrder: 5, isVisible: true, level: 3 },
    
    // Chromatography Supplies 二级分类
    { id: 21, name: "Vials & Caps", slug: "vials-caps", description: "Sample vials, caps, and septa", parentId: 2, displayOrder: 1, isVisible: true, level: 2 },
    { id: 22, name: "Syringes & Needles", slug: "syringes-needles", description: "Syringes and needles for chromatography", parentId: 2, displayOrder: 2, isVisible: true, level: 2 },
    { id: 23, name: "Fittings & Tubing", slug: "fittings-tubing", description: "Connectors, fittings, and tubing", parentId: 2, displayOrder: 3, isVisible: true, level: 2 },
    { id: 24, name: "Mobile Phase", slug: "mobile-phase", description: "Solvents and mobile phase additives", parentId: 2, displayOrder: 4, isVisible: true, level: 2 },
    
    // Sample Preparation 二级分类
    { id: 31, name: "SPE Cartridges", slug: "spe-cartridges", description: "Solid Phase Extraction cartridges", parentId: 3, displayOrder: 1, isVisible: true, level: 2 },
    { id: 32, name: "Extraction Accessories", slug: "extraction-accessories", description: "Accessories for sample extraction", parentId: 3, displayOrder: 2, isVisible: true, level: 2 },
    { id: 33, name: "Derivatization", slug: "derivatization", description: "Derivatization reagents and kits", parentId: 3, displayOrder: 3, isVisible: true, level: 2 },
    
    // Filtration 二级分类
    { id: 41, name: "Syringe Filters", slug: "syringe-filters", description: "Disposable syringe filters", parentId: 4, displayOrder: 1, isVisible: true, level: 2 },
    { id: 42, name: "Membrane Filters", slug: "membrane-filters", description: "Membrane filters and discs", parentId: 4, displayOrder: 2, isVisible: true, level: 2 },
    { id: 43, name: "Filter Holders", slug: "filter-holders", description: "Filter holders and apparatus", parentId: 4, displayOrder: 3, isVisible: true, level: 2 },
    
    // Lab Supplies 二级分类
    { id: 51, name: "Glassware", slug: "glassware", description: "Laboratory glassware", parentId: 5, displayOrder: 1, isVisible: true, level: 2 },
    { id: 52, name: "Plasticware", slug: "plasticware", description: "Laboratory plasticware", parentId: 5, displayOrder: 2, isVisible: true, level: 2 },
    { id: 53, name: "Storage", slug: "storage", description: "Storage containers and solutions", parentId: 5, displayOrder: 3, isVisible: true, level: 2 },
  ];

  for (const category of newCategories) {
    await db.insert(categories).values(category);
    console.log(`✓ Created: ${category.name} (Level ${category.level})`);
  }

  console.log("\n✅ Category structure updated successfully!");
  console.log(`Total categories: ${newCategories.length}`);
  console.log(`- Visible (Frontend): ${newCategories.filter(c => c.isVisible).length}`);
  console.log(`- Hidden (Backend Reserved): ${newCategories.filter(c => !c.isVisible).length}`);
}

updateCategories().catch(console.error);
