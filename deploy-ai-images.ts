import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Brand name mapping: AI team name -> Database name
const BRAND_MAPPING: Record<string, string> = {
  'Waters': 'Waters',
  'Agilent': 'Agilent',
  'Thermo Fisher': 'Thermo Fisher Scientific',
  'Phenomenex': 'Phenomenex',
  'Shimadzu': 'Shimadzu',
  'Merck': 'Merck',
  'Avantor': 'Avantor',
  'Daicel': 'Daicel',
};

async function deployAIImages() {
  console.log('=== AI Generated Images Deployment Script ===\n');
  
  // Connect to database
  const dbUrl = process.env.DATABASE_URL!;
  const connection = await mysql.createConnection({
    uri: dbUrl.replace('?ssl=true', ''),
    ssl: { rejectUnauthorized: true }
  });
  
  const db = drizzle(connection, { schema, mode: 'default' });

  // Get all image files
  const imagesDir = path.join(__dirname, 'client/public/product-images');
  const imageFiles = fs.readdirSync(imagesDir).filter(f => f.endsWith('.jpg'));
  
  console.log(`Found ${imageFiles.length} image files in ${imagesDir}\n`);

  let successCount = 0;
  let failedCount = 0;
  const failedImages: string[] = [];

  for (const imageFile of imageFiles) {
    // Extract part number from filename (remove .jpg extension)
    const partNumber = imageFile.replace('.jpg', '');
    
    try {
      // Find product by part number
      const products = await db.execute(sql`
        SELECT productId, partNumber, name, brand
        FROM products
        WHERE partNumber = ${partNumber}
        LIMIT 1
      `);
      
      if ((products[0] as any[]).length === 0) {
        console.log(`❌ No product found for Part Number: ${partNumber}`);
        failedCount++;
        failedImages.push(imageFile);
        continue;
      }
      
      const product = (products[0] as any[])[0];
      
      // Update image URL
      const newImageUrl = `/product-images/${imageFile}`;
      
      await db.execute(sql`
        UPDATE products
        SET imageUrl = ${newImageUrl}
        WHERE partNumber = ${partNumber}
      `);
      
      console.log(`✅ Updated: ${partNumber} (${product.brand}) - ${product.name}`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ Error updating ${partNumber}:`, error);
      failedCount++;
      failedImages.push(imageFile);
    }
  }

  console.log('\n=== Deployment Summary ===');
  console.log(`Total images: ${imageFiles.length}`);
  console.log(`Successfully updated: ${successCount}`);
  console.log(`Failed: ${failedCount}`);
  
  if (failedImages.length > 0) {
    console.log('\nFailed images:');
    failedImages.forEach(img => console.log(`  - ${img}`));
  }

  await connection.end();
  
  console.log('\n✅ Deployment completed!');
}

deployAIImages().catch(console.error);
