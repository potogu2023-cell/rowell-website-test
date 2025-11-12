/**
 * Auto-classification utility for products
 * Matches products to categories based on name keywords
 */

import { drizzle } from 'drizzle-orm/mysql2';
import { categories, productCategories } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

// Category matching rules based on product name keywords
const CATEGORY_RULES = [
  // Chromatography Columns
  { categoryName: 'HPLC Columns', keywords: ['hplc column', 'hplc col', 'liquid chromatography column', 'lc column'] },
  { categoryName: 'GC Columns', keywords: ['gc column', 'gc col', 'gas chromatography column', 'capillary column'] },
  { categoryName: 'Guard Columns', keywords: ['guard column', 'guard cartridge', 'pre-column', 'precolumn'] },
  
  // Chromatography Supplies
  { categoryName: 'Vials & Caps', keywords: ['vial', 'cap', 'septa', 'closure', 'crimp', 'snap', 'screw cap'] },
  { categoryName: 'Syringes & Needles', keywords: ['syringe', 'needle', 'autosampler', 'injection'] },
  { categoryName: 'Fittings & Tubing', keywords: ['fitting', 'tubing', 'ferrule', 'connector', 'union', 'tee', 'peek'] },
  
  // Sample Preparation
  { categoryName: 'SPE Cartridges', keywords: ['spe', 'solid phase extraction', 'extraction cartridge', 'cleanup cartridge'] },
  { categoryName: 'Derivatization', keywords: ['derivatization', 'derivatizing', 'silylation', 'methylation'] },
  
  // Filtration
  { categoryName: 'Syringe Filters', keywords: ['syringe filter', 'membrane filter', 'filter unit', 'filtration'] },
  
  // Lab Supplies
  { categoryName: 'Plasticware', keywords: ['bottle', 'container', 'tube', 'plate', 'reservoir', 'pipette tip'] },
];

export async function autoClassifyProduct(
  db: ReturnType<typeof drizzle>,
  productId: number,
  productName: string
): Promise<string[]> {
  const nameLower = productName.toLowerCase();
  const matchedCategories: string[] = [];
  
  // Find matching categories based on keywords
  for (const rule of CATEGORY_RULES) {
    const hasMatch = rule.keywords.some(keyword => nameLower.includes(keyword));
    if (hasMatch) {
      matchedCategories.push(rule.categoryName);
    }
  }
  
  // If no matches, return empty array
  if (matchedCategories.length === 0) {
    return [];
  }
  
  // Get category IDs from database
  const categoryRecords = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.isVisible, 1));
  
  const assignedCategories: string[] = [];
  
  // Assign product to matched categories
  for (const categoryName of matchedCategories) {
    const category = categoryRecords.find(c => c.name === categoryName);
    if (!category) continue;
    
    try {
      // Check if already assigned
      const existing = await db
        .select()
        .from(productCategories)
        .where(
          and(
            eq(productCategories.productId, productId),
            eq(productCategories.categoryId, category.id)
          )
        )
        .limit(1);
      
      if (existing.length === 0) {
        // Insert new product-category relationship
        await db.insert(productCategories).values({
          productId,
          categoryId: category.id,
        });
        assignedCategories.push(categoryName);
      }
    } catch (error) {
      console.error(`Failed to assign product ${productId} to category ${categoryName}:`, error);
    }
  }
  
  return assignedCategories;
}

export async function batchAutoClassify(
  db: ReturnType<typeof drizzle>,
  products: Array<{ id: number; name: string }>
): Promise<{ total: number; classified: number; skipped: number }> {
  let classified = 0;
  let skipped = 0;
  
  for (const product of products) {
    const categories = await autoClassifyProduct(db, product.id, product.name);
    if (categories.length > 0) {
      classified++;
    } else {
      skipped++;
    }
  }
  
  return {
    total: products.length,
    classified,
    skipped,
  };
}
