const mysql = require('mysql2/promise');
const fs = require('fs');

async function updateProductParameters() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Load extracted parameters
    const extractedData = JSON.parse(fs.readFileSync('/home/ubuntu/extracted_parameters.json', 'utf-8'));
    
    console.log(`Loaded ${extractedData.length} products with extracted parameters`);
    console.log('Starting batch update...\n');
    
    let updated = 0;
    let failed = 0;
    
    for (const product of extractedData) {
      try {
        // Filter out very large particle sizes (likely errors)
        const particleSizeNum = product.particleSizeNum && product.particleSizeNum <= 100 
          ? Math.round(product.particleSizeNum) 
          : null;
        
        const columnLengthNum = product.columnLength ? Math.round(product.columnLength) : null;
        const innerDiameterNum = product.innerDiameter ? Math.round(product.innerDiameter * 10) / 10 : null; // Keep 1 decimal
        
        await connection.execute(
          `UPDATE products 
           SET phaseType = ?,
               particleSizeNum = ?,
               poreSizeNum = ?,
               columnLengthNum = ?,
               innerDiameterNum = ?
           WHERE productId = ?`,
          [
            product.phaseType,
            particleSizeNum,
            product.poreSizeNum,
            columnLengthNum,
            innerDiameterNum,
            product.productId
          ]
        );
        
        updated++;
        if (updated % 100 === 0) {
          console.log(`Updated ${updated}/${extractedData.length} products...`);
        }
      } catch (err) {
        console.error(`Failed to update product ${product.productId}:`, err.message);
        failed++;
      }
    }
    
    console.log(`\n✅ Update complete!`);
    console.log(`   Successfully updated: ${updated}`);
    console.log(`   Failed: ${failed}`);
    
    // Verify the update
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN phaseType IS NOT NULL THEN 1 ELSE 0 END) as has_phase_type,
        SUM(CASE WHEN particleSizeNum IS NOT NULL THEN 1 ELSE 0 END) as has_particle_size,
        SUM(CASE WHEN poreSizeNum IS NOT NULL THEN 1 ELSE 0 END) as has_pore_size,
        SUM(CASE WHEN columnLengthNum IS NOT NULL THEN 1 ELSE 0 END) as has_column_length,
        SUM(CASE WHEN innerDiameterNum IS NOT NULL THEN 1 ELSE 0 END) as has_inner_diameter
      FROM products
    `);
    
    console.log('\n📊 Database statistics:');
    console.log(`   Total products: ${stats[0].total}`);
    console.log(`   Phase Type: ${stats[0].has_phase_type} (${(stats[0].has_phase_type/stats[0].total*100).toFixed(1)}%)`);
    console.log(`   Particle Size: ${stats[0].has_particle_size} (${(stats[0].has_particle_size/stats[0].total*100).toFixed(1)}%)`);
    console.log(`   Pore Size: ${stats[0].has_pore_size} (${(stats[0].has_pore_size/stats[0].total*100).toFixed(1)}%)`);
    console.log(`   Column Length: ${stats[0].has_column_length} (${(stats[0].has_column_length/stats[0].total*100).toFixed(1)}%)`);
    console.log(`   Inner Diameter: ${stats[0].has_inner_diameter} (${(stats[0].has_inner_diameter/stats[0].total*100).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

updateProductParameters();

