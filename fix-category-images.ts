import { db } from './server/db';
import { products, categories, productCategories } from './drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Fix product images based on category
 * Different product categories should have different images
 */

// Image URL mapping based on category and brand
const categoryImageMap: Record<string, Record<string, string>> = {
  // HPLC Columns - use existing column images
  'HPLC Columns': {
    'Phenomenex': 'https://www.phenomenex.com/-/jssmedia/phxjss/data/media/images/order/Premium_horiz_{{length}}.png',
    'Waters': 'https://www.waters.com/webassets/cms/category/images/hplc-columns-generic.jpg',
    'Agilent': 'https://www.agilent.com/cs/library/catalog/public/HPLC-Column-Generic.jpg',
    'default': 'https://www.phenomenex.com/-/jssmedia/phxjss/data/media/images/order/Premium_horiz_100mm.png'
  },
  
  // GC Columns - different from HPLC
  'GC Columns': {
    'Phenomenex': 'https://www.phenomenex.com/-/jssmedia/phxjss/data/media/images/order/GC-Column-Generic.png',
    'Agilent': 'https://www.agilent.com/cs/library/catalog/public/GC-Column-Generic.jpg',
    'default': 'https://www.phenomenex.com/-/jssmedia/phxjss/data/media/images/order/GC-Column-Generic.png'
  },
  
  // Guard Columns - shorter columns
  'Guard Columns': {
    'Phenomenex': 'https://www.phenomenex.com/-/jssmedia/phxjss/data/media/images/order/Premium_horiz_30mm.png',
    'Waters': 'https://www.waters.com/webassets/cms/category/images/guard-column-generic.jpg',
    'default': 'https://www.phenomenex.com/-/jssmedia/phxjss/data/media/images/order/Premium_horiz_30mm.png'
  },
  
  // SPE Cartridges - completely different shape
  'SPE Cartridges': {
    'Phenomenex': 'https://www.phenomenex.com/-/jssmedia/phxjss/data/media/images/order/SPE-Cartridge-Generic.png',
    'Waters': 'https://www.waters.com/webassets/cms/category/images/spe-cartridge-generic.jpg',
    'default': 'https://www.phenomenex.com/-/jssmedia/phxjss/data/media/images/order/SPE-Cartridge-Generic.png'
  },
  
  // Filtration - filters and membranes
  'Filtration': {
    'default': 'https://www.phenomenex.com/-/jssmedia/phxjss/data/media/images/order/Filter-Generic.png'
  },
  
  // Chromatography Supplies - various consumables
  'Chromatography Supplies': {
    'default': 'https://www.phenomenex.com/-/jssmedia/phxjss/data/media/images/order/Supplies-Generic.png'
  }
};

// Fallback: use generic column image
const defaultImage = 'https://www.phenomenex.com/-/jssmedia/phxjss/data/media/images/order/Premium_horiz_100mm.png';

async function fixCategoryImages() {
  console.log('Starting category image fix...\n');
  
  // Get all products with their primary category
  const productsWithCategory = await db
    .select({
      productId: products.id,
      productPartNumber: products.partNumber,
      brand: products.brand,
      columnLength: products.columnLength,
      columnLengthNum: products.columnLengthNum,
      categoryName: categories.name,
      currentImageUrl: products.imageUrl
    })
    .from(products)
    .leftJoin(productCategories, and(
      eq(products.id, productCategories.productId),
      eq(productCategories.isPrimary, 1)
    ))
    .leftJoin(categories, eq(productCategories.categoryId, categories.id));
  
  console.log(`Found ${productsWithCategory.length} products to process\n`);
  
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const product of productsWithCategory) {
    try {
      const categoryName = product.categoryName || 'HPLC Columns'; // Default to HPLC Columns
      const brand = product.brand;
      
      // Get image URL based on category and brand
      let newImageUrl = defaultImage;
      
      if (categoryImageMap[categoryName]) {
        const categoryImages = categoryImageMap[categoryName];
        
        // Try brand-specific image first
        if (categoryImages[brand]) {
          newImageUrl = categoryImages[brand];
          
          // For HPLC columns, replace {{length}} placeholder
          if (categoryName === 'HPLC Columns' && newImageUrl.includes('{{length}}')) {
            const columnLengthNum = product.columnLengthNum || 100;
            let lengthSuffix = '100mm';
            
            if (columnLengthNum <= 50) {
              lengthSuffix = '30mm';
            } else if (columnLengthNum <= 150) {
              lengthSuffix = '100mm';
            } else {
              lengthSuffix = '250mm';
            }
            
            newImageUrl = newImageUrl.replace('{{length}}', lengthSuffix);
          }
        } else if (categoryImages['default']) {
          // Use default image for this category
          newImageUrl = categoryImages['default'];
        }
      }
      
      // Only update if image URL changed
      if (newImageUrl !== product.currentImageUrl) {
        await db
          .update(products)
          .set({ imageUrl: newImageUrl })
          .where(eq(products.id, product.productId));
        
        updated++;
        
        if (updated % 100 === 0) {
          console.log(`Progress: ${updated} products updated...`);
        }
      } else {
        skipped++;
      }
      
    } catch (error) {
      console.error(`Error updating product ${product.productPartNumber}:`, error);
      errors++;
    }
  }
  
  console.log('\n=== Category Image Fix Complete ===');
  console.log(`Total products: ${productsWithCategory.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (no change): ${skipped}`);
  console.log(`Errors: ${errors}`);
  
  // Show statistics by category
  console.log('\n=== Statistics by Category ===');
  const categoryStats = await db
    .select({
      category: categories.name,
      count: sql<number>`COUNT(DISTINCT ${products.id})`,
      sampleImage: products.imageUrl
    })
    .from(products)
    .leftJoin(productCategories, and(
      eq(products.id, productCategories.productId),
      eq(productCategories.isPrimary, 1)
    ))
    .leftJoin(categories, eq(productCategories.categoryId, categories.id))
    .groupBy(categories.name, products.imageUrl)
    .orderBy(categories.name);
  
  for (const stat of categoryStats) {
    console.log(`${stat.category || 'Uncategorized'}: ${stat.count} products`);
    console.log(`  Sample image: ${stat.sampleImage}`);
  }
}

fixCategoryImages()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

