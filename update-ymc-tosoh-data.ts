import { getDb } from './server/db';
import { products } from './drizzle/schema';
import { eq } from 'drizzle-orm';
import axios from 'axios';

interface ProductCSVRow {
  productCode: string;
  brand: string;
  name: string;
  particleSize: string;
  particleSizeNum: string;
  poreSize: string;
  poreSizeNum: string;
  columnLength: string;
  columnLengthNum: string;
  innerDiameter: string;
  innerDiameterNum: string;
  phRange: string;
  phMin: string;
  phMax: string;
  usp: string;
  description: string;
  applications: string;
  status: string;
}

async function fetchCSVFromCDN(url: string): Promise<ProductCSVRow[]> {
  const response = await axios.get(url);
  const content = response.data;
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map((line: string) => {
    const values = line.split(',');
    const row: any = {};
    headers.forEach((header: string, index: number) => {
      row[header] = values[index] || '';
    });
    return row as ProductCSVRow;
  });
}

async function updateProducts() {
  console.log('Starting YMC and Tosoh product data update...\n');
  
  const db = await getDb();
  
  // CDN URLs for data files
  const YMC_CDN_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/tjohcbqXsySOlnhe.csv';
  const TOSOH_CDN_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/XSAyYRUdzBdDdNIA.csv';
  
  // Fetch YMC data
  console.log('Fetching YMC data from CDN...');
  const ymcData = await fetchCSVFromCDN(YMC_CDN_URL);
  console.log(`✓ Found ${ymcData.length} YMC products\n`);
  
  // Fetch Tosoh data
  console.log('Fetching Tosoh data from CDN...');
  const tosohData = await fetchCSVFromCDN(TOSOH_CDN_URL);
  console.log(`✓ Found ${tosohData.length} Tosoh products\n`);
  
  const allData = [...ymcData, ...tosohData];
  
  let updatedCount = 0;
  let notFoundCount = 0;
  const notFoundProducts: string[] = [];
  
  console.log('Starting database update...\n');
  
  for (const row of allData) {
    try {
      // Find product by partNumber
      const existingProducts = await db
        .select()
        .from(products)
        .where(eq(products.partNumber, row.productCode))
        .limit(1);
      
      if (existingProducts.length === 0) {
        console.log(`⚠ Product not found in database: ${row.productCode}`);
        notFoundCount++;
        notFoundProducts.push(row.productCode);
        continue;
      }
      
      // Update product with complete data
      await db
        .update(products)
        .set({
          particleSize: row.particleSize || null,
          poreSize: row.poreSize || null,
          dimensions: `${row.columnLength} × ${row.innerDiameter}`,
          status: 'active', // Set status to active
          phRange: row.phRange || null,
          usp: row.usp || null,
          description: row.description || null,
          applications: row.applications || null,
        })
        .where(eq(products.partNumber, row.productCode));
      
      updatedCount++;
      
      if (updatedCount % 20 === 0) {
        console.log(`Progress: ${updatedCount}/${allData.length} products updated`);
      }
    } catch (error) {
      console.error(`✗ Error updating product ${row.productCode}:`, error);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('UPDATE SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total products processed:    ${allData.length}`);
  console.log(`Successfully updated:        ${updatedCount} ✓`);
  console.log(`Not found in database:       ${notFoundCount} ${notFoundCount > 0 ? '⚠' : '✓'}`);
  console.log('='.repeat(60));
  
  if (notFoundProducts.length > 0) {
    console.log('\nProducts not found in database:');
    notFoundProducts.forEach(code => console.log(`  - ${code}`));
  }
  
  console.log('\n✓ Update completed successfully!\n');
}

updateProducts()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Update failed:', error);
    process.exit(1);
  });
