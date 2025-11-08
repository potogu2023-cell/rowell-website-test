import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

// Database connection
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Read and parse CSV files
function readCSV(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  return records;
}

// Parse specifications JSON string
function parseSpecifications(specsString) {
  if (!specsString || specsString === '{}') return null;
  try {
    return JSON.parse(specsString);
  } catch (e) {
    console.error('Failed to parse specifications:', specsString);
    return null;
  }
}

// Extract dimensions from specifications or name
function extractDimensions(specs, name) {
  if (!specs) return null;
  
  // Try to extract from specifications
  const length = specs['Length (Metric)'] || specs['Length'] || specs['Column Length'];
  const diameter = specs['Inner Diameter (ID)'] || specs['Diameter (Metric) Inner'] || specs['Inner Diameter'];
  
  if (length && diameter) {
    // Extract numeric values
    const lengthNum = parseFloat(length);
    const diameterNum = parseFloat(diameter);
    if (!isNaN(lengthNum) && !isNaN(diameterNum)) {
      return `${lengthNum} × ${diameterNum}`;
    }
  }
  
  // Try to extract from product name (e.g., "4.6 x 250 mm" or "4.6 mm X 150 mm")
  const dimensionMatch = name.match(/(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)\s*mm/);
  if (dimensionMatch) {
    return `${parseFloat(dimensionMatch[2])} × ${parseFloat(dimensionMatch[1])}`;
  }
  
  return null;
}

// Extract particle size
function extractParticleSize(specs, name) {
  if (!specs) return null;
  
  const particleSize = specs['Particle Size'] || specs['Particle Size (µm)'];
  if (particleSize) return particleSize;
  
  // Try to extract from name (e.g., "2.7 µm")
  const sizeMatch = name.match(/(\d+\.?\d*)\s*[µu]m/i);
  if (sizeMatch) {
    return `${sizeMatch[1]} µm`;
  }
  
  return null;
}

// Extract pore size
function extractPoreSize(specs) {
  if (!specs) return null;
  return specs['Pore Size'] || specs['Pore Size (Å)'] || null;
}

// Extract pH range
function extractPhRange(specs) {
  if (!specs) return null;
  return specs['pH Range'] || specs['pH'] || null;
}

// Extract stationary phase
function extractStationaryPhase(specs, name) {
  if (!specs) return null;
  
  const phase = specs['Stationary Phase'] || specs['Phase'] || specs['Chemistry Type'];
  if (phase) return phase;
  
  // Try to extract from name (common phases: C18, C8, T3, etc.)
  const phaseMatch = name.match(/\b(C18|C8|T3|Phenyl|HILIC|CN|NH2|Diol)\b/i);
  if (phaseMatch) {
    return phaseMatch[1];
  }
  
  return null;
}

// Determine category from name and specifications
function determineCategory(name, specs) {
  const nameLower = name.toLowerCase();
  
  // GC Columns
  if (nameLower.includes('gc') || nameLower.includes('gas chromatography') || 
      nameLower.includes('capillary column') || nameLower.includes('zebron')) {
    return 'GC Columns';
  }
  
  // Guard Columns
  if (nameLower.includes('guard') || nameLower.includes('vanguard') || 
      nameLower.includes('pre-column') || nameLower.includes('precolumn')) {
    return 'Guard Columns';
  }
  
  // HPLC Columns (default for most columns)
  if (nameLower.includes('column') || nameLower.includes('hplc') || 
      nameLower.includes('uplc') || nameLower.includes('uhplc')) {
    return 'HPLC Columns';
  }
  
  // Chromatography Supplies (if not a column)
  if (nameLower.includes('vial') || nameLower.includes('filter') || 
      nameLower.includes('fitting') || nameLower.includes('adapter')) {
    return 'Chromatography Supplies';
  }
  
  // Default to HPLC Columns
  return 'HPLC Columns';
}

// Import Waters data
async function importWaters() {
  console.log('\n=== Importing Waters Data ===');
  
  const watersData = readCSV('/home/ubuntu/upload/waters_270_final_columns.csv');
  console.log(`Total Waters products in CSV: ${watersData.length}`);
  
  // Check existing Waters products
  const [existingWaters] = await connection.execute(
    'SELECT partNumber FROM products WHERE brand = ?',
    ['Waters']
  );
  const existingPartNumbers = new Set(existingWaters.map(p => p.partNumber));
  console.log(`Existing Waters products in database: ${existingPartNumbers.size}`);
  
  // Filter out existing products
  const newProducts = watersData.filter(p => !existingPartNumbers.has(p.partNumber));
  console.log(`New Waters products to import: ${newProducts.length}`);
  
  if (newProducts.length === 0) {
    console.log('No new Waters products to import.');
    return 0;
  }
  
  // Prepare insert data
  const insertData = newProducts.map(product => {
    const specs = parseSpecifications(product.specifications);
    const dimensions = extractDimensions(specs, product.name);
    const particleSize = extractParticleSize(specs, product.name);
    const poreSize = extractPoreSize(specs);
    const phRange = extractPhRange(specs);
    const stationaryPhase = extractStationaryPhase(specs, product.name);
    const category = determineCategory(product.name, specs);
    
    return {
      productId: product.productId,
      partNumber: product.partNumber,
      brand: 'Waters',
      name: product.name,
      description: product.description || null,
      descriptionQuality: product.descriptionQuality || 'none',
      category: category,
      dimensions: dimensions,
      particleSize: particleSize,
      poreSize: poreSize,
      phRange: phRange,
      stationaryPhase: stationaryPhase,
      specifications: product.specifications || '{}',
      imageUrl: product.imageUrl || null,
      catalogUrl: product.catalogUrl || null,
      technicalDocUrl: product.technicalDocUrl || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });
  
  // Batch insert
  const batchSize = 50;
  let imported = 0;
  
  for (let i = 0; i < insertData.length; i += batchSize) {
    const batch = insertData.slice(i, i + batchSize);
    
    const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const values = batch.flatMap(p => [
      p.productId, p.partNumber, p.brand, p.name, p.description,
      p.descriptionQuality, p.category, p.dimensions, p.particleSize,
      p.poreSize, p.phRange, p.stationaryPhase, p.specifications,
      p.imageUrl, p.catalogUrl, p.technicalDocUrl, p.createdAt
    ]);
    
    await connection.execute(
      `INSERT INTO products (productId, partNumber, brand, name, description, descriptionQuality, category, dimensions, particleSize, poreSize, phRange, stationaryPhase, specifications, imageUrl, catalogUrl, technicalDocUrl, createdAt) VALUES ${placeholders}`,
      values
    );
    
    imported += batch.length;
    console.log(`Imported ${imported}/${insertData.length} Waters products...`);
  }
  
  console.log(`✅ Waters import complete: ${imported} products imported`);
  return imported;
}

// Import Phenomenex data
async function importPhenomenex() {
  console.log('\n=== Importing Phenomenex Data ===');
  
  const phenomenexData = readCSV('/home/ubuntu/upload/phenomenex_247_all_results.csv');
  console.log(`Total Phenomenex products in CSV: ${phenomenexData.length}`);
  
  // Check existing Phenomenex products
  const [existingPhenomenex] = await connection.execute(
    'SELECT partNumber FROM products WHERE brand = ?',
    ['Phenomenex']
  );
  const existingPartNumbers = new Set(existingPhenomenex.map(p => p.partNumber));
  console.log(`Existing Phenomenex products in database: ${existingPartNumbers.size}`);
  
  // Filter out existing products
  const newProducts = phenomenexData.filter(p => !existingPartNumbers.has(p.partNumber));
  console.log(`New Phenomenex products to import: ${newProducts.length}`);
  
  if (newProducts.length === 0) {
    console.log('No new Phenomenex products to import.');
    return 0;
  }
  
  // Prepare insert data
  const insertData = newProducts.map(product => {
    const specs = parseSpecifications(product.specifications);
    const dimensions = extractDimensions(specs, product.name);
    const particleSize = extractParticleSize(specs, product.name);
    const poreSize = extractPoreSize(specs);
    const phRange = extractPhRange(specs);
    const stationaryPhase = extractStationaryPhase(specs, product.name);
    const category = determineCategory(product.name, specs);
    
    return {
      productId: product.productId,
      partNumber: product.partNumber,
      brand: 'Phenomenex',
      name: product.name,
      description: product.description || null,
      descriptionQuality: product.descriptionQuality || 'none',
      category: category,
      dimensions: dimensions,
      particleSize: particleSize,
      poreSize: poreSize,
      phRange: phRange,
      stationaryPhase: stationaryPhase,
      specifications: product.specifications || '{}',
      imageUrl: product.imageUrl || null,
      catalogUrl: product.catalogUrl || null,
      technicalDocUrl: product.technicalDocUrl || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });
  
  // Batch insert
  const batchSize = 50;
  let imported = 0;
  
  for (let i = 0; i < insertData.length; i += batchSize) {
    const batch = insertData.slice(i, i + batchSize);
    
    const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const values = batch.flatMap(p => [
      p.productId, p.partNumber, p.brand, p.name, p.description,
      p.descriptionQuality, p.category, p.dimensions, p.particleSize,
      p.poreSize, p.phRange, p.stationaryPhase, p.specifications,
      p.imageUrl, p.catalogUrl, p.technicalDocUrl, p.createdAt
    ]);
    
    await connection.execute(
      `INSERT INTO products (productId, partNumber, brand, name, description, descriptionQuality, category, dimensions, particleSize, poreSize, phRange, stationaryPhase, specifications, imageUrl, catalogUrl, technicalDocUrl, createdAt) VALUES ${placeholders}`,
      values
    );
    
    imported += batch.length;
    console.log(`Imported ${imported}/${insertData.length} Phenomenex products...`);
  }
  
  console.log(`✅ Phenomenex import complete: ${imported} products imported`);
  return imported;
}

// Main execution
async function main() {
  try {
    console.log('Starting crawler data import...');
    console.log('Database:', process.env.DATABASE_URL ? 'Connected' : 'Not configured');
    
    const watersImported = await importWaters();
    const phenomenexImported = await importPhenomenex();
    
    console.log('\n=== Import Summary ===');
    console.log(`Waters: ${watersImported} products imported`);
    console.log(`Phenomenex: ${phenomenexImported} products imported`);
    console.log(`Total: ${watersImported + phenomenexImported} products imported`);
    
    await connection.end();
    console.log('\n✅ Import complete!');
  } catch (error) {
    console.error('❌ Import failed:', error);
    await connection.end();
    process.exit(1);
  }
}

main();
