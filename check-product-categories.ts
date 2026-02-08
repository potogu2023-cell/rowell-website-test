import mysql from 'mysql2/promise';

async function checkProductCategories() {
  console.log('=== Product Category Validation Report ===\n');
  
  // Parse DATABASE_URL
  const dbUrl = new URL(process.env.DATABASE_URL!);
  dbUrl.searchParams.delete('ssl');
  
  const connection = await mysql.createConnection({
    host: dbUrl.hostname,
    port: dbUrl.port ? parseInt(dbUrl.port) : 3306,
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.slice(1),
    ssl: process.env.DATABASE_URL?.includes('ssl=true') ? { rejectUnauthorized: true } : undefined
  });

  try {
    // Get all products with their categories
    const [products] = await connection.execute(`
      SELECT 
        p.id,
        p.productId,
        p.partNumber,
        p.brand,
        p.name,
        p.productType,
        p.category as oldCategory,
        c.name as categoryName,
        c.nameEn as categoryNameEn,
        c.slug as categorySlug,
        pc.isPrimary
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.productId
      LEFT JOIN categories c ON pc.categoryId = c.id
      ORDER BY p.brand, p.partNumber
    `);

    const productList = products as any[];
    console.log(`Total products found: ${productList.length}\n`);

    // Group products by category
    const categoryGroups: Record<string, any[]> = {};
    const uncategorized: any[] = [];

    for (const product of productList) {
      if (!product.categoryName) {
        uncategorized.push(product);
      } else {
        const key = product.categoryName || 'Unknown';
        if (!categoryGroups[key]) {
          categoryGroups[key] = [];
        }
        categoryGroups[key].push(product);
      }
    }

    // Identify potential misclassifications
    console.log('=== Potential Misclassifications ===\n');
    
    const wellPlatePatterns = [
      /96.*well/i,
      /384.*well/i,
      /well.*plate/i,
      /microplate/i,
      /\d+\s*well/i
    ];

    const columnPatterns = [
      /column/i,
      /\d+\s*x\s*\d+\s*mm/i,  // e.g., "4.6 x 250 mm"
      /\d+\.\d+\s*µm/i,        // e.g., "2.7 µm"
      /\d+\.\d+\s*um/i         // e.g., "2.7 um"
    ];

    const errors: any[] = [];

    for (const [categoryName, products] of Object.entries(categoryGroups)) {
      const isColumnCategory = /column/i.test(categoryName);
      
      for (const product of products) {
        const productText = `${product.name || ''} ${product.partNumber || ''} ${product.description || ''}`.toLowerCase();
        
        // Check if it's a well plate in a column category
        const isWellPlate = wellPlatePatterns.some(pattern => pattern.test(productText));
        const hasColumnIndicators = columnPatterns.some(pattern => pattern.test(productText));
        
        if (isColumnCategory && isWellPlate && !hasColumnIndicators) {
          errors.push({
            type: 'well_plate_in_column_category',
            product,
            reason: 'Product appears to be a well plate but is categorized as a column'
          });
        }
      }
    }

    // Print errors
    if (errors.length > 0) {
      console.log(`Found ${errors.length} potential misclassifications:\n`);
      
      for (const error of errors) {
        const p = error.product;
        console.log(`❌ ${p.brand} ${p.partNumber}`);
        console.log(`   Product ID: ${p.productId}`);
        console.log(`   Name: ${p.name || 'N/A'}`);
        console.log(`   Current Category: ${p.categoryName} (${p.categorySlug})`);
        console.log(`   Reason: ${error.reason}`);
        console.log('');
      }
    } else {
      console.log('✅ No obvious misclassifications found.\n');
    }

    // Print category summary
    console.log('\n=== Category Summary ===\n');
    for (const [categoryName, products] of Object.entries(categoryGroups).sort((a, b) => b[1].length - a[1].length)) {
      console.log(`${categoryName}: ${products.length} products`);
    }

    if (uncategorized.length > 0) {
      console.log(`\nUncategorized: ${uncategorized.length} products`);
    }

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      totalProducts: productList.length,
      categorized: productList.length - uncategorized.length,
      uncategorized: uncategorized.length,
      errors: errors.map(e => ({
        productId: e.product.productId,
        partNumber: e.product.partNumber,
        brand: e.product.brand,
        name: e.product.name,
        currentCategory: e.product.categoryName,
        categorySlug: e.product.categorySlug,
        reason: e.reason
      })),
      categoryBreakdown: Object.entries(categoryGroups).map(([name, prods]) => ({
        category: name,
        count: prods.length
      })).sort((a, b) => b.count - a.count)
    };

    const fs = require('fs');
    fs.writeFileSync('/home/ubuntu/product-category-report.json', JSON.stringify(report, null, 2));
    console.log('\n✅ Detailed report saved to: /home/ubuntu/product-category-report.json');

  } finally {
    await connection.end();
  }
}

checkProductCategories().catch(console.error);
