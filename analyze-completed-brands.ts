import { drizzle } from 'drizzle-orm/mysql2';
import { products } from './drizzle/schema';
import { eq, or, isNotNull, sql } from 'drizzle-orm';
import * as fs from 'fs';

const db = drizzle(process.env.DATABASE_URL!);

async function analyzeCompletedBrands() {
  console.log('\n=== 已完成品牌数据质量分析 ===\n');
  
  // Query Agilent and Thermo Fisher products
  const completedBrands = ['Agilent', 'Thermo Fisher Scientific'];
  
  for (const brand of completedBrands) {
    console.log(`\n--- ${brand} ---\n`);
    
    // Get all products for this brand
    const brandProducts = await db
      .select()
      .from(products)
      .where(eq(products.brand, brand));
    
    console.log(`总产品数: ${brandProducts.length}`);
    
    // Analyze description quality
    const withDescription = brandProducts.filter(p => p.description && p.description.trim().length > 0);
    const descriptionCoverage = (withDescription.length / brandProducts.length * 100).toFixed(1);
    console.log(`\n描述覆盖率: ${withDescription.length}/${brandProducts.length} (${descriptionCoverage}%)`);
    
    // Analyze description quality levels
    const qualityLevels = {
      high: brandProducts.filter(p => p.descriptionQuality === 'high').length,
      medium: brandProducts.filter(p => p.descriptionQuality === 'medium').length,
      low: brandProducts.filter(p => p.descriptionQuality === 'low').length,
      extracted: brandProducts.filter(p => p.descriptionQuality === 'extracted').length,
      none: brandProducts.filter(p => !p.descriptionQuality || p.descriptionQuality === 'none').length
    };
    
    console.log('\n描述质量分布:');
    console.log(`  high (A级): ${qualityLevels.high} (${(qualityLevels.high / brandProducts.length * 100).toFixed(1)}%)`);
    console.log(`  medium (B级): ${qualityLevels.medium} (${(qualityLevels.medium / brandProducts.length * 100).toFixed(1)}%)`);
    console.log(`  low (C级): ${qualityLevels.low} (${(qualityLevels.low / brandProducts.length * 100).toFixed(1)}%)`);
    console.log(`  extracted (D级): ${qualityLevels.extracted} (${(qualityLevels.extracted / brandProducts.length * 100).toFixed(1)}%)`);
    console.log(`  none: ${qualityLevels.none} (${(qualityLevels.none / brandProducts.length * 100).toFixed(1)}%)`);
    
    const abGrade = qualityLevels.high + qualityLevels.medium;
    console.log(`\nA/B级描述占比: ${abGrade}/${brandProducts.length} (${(abGrade / brandProducts.length * 100).toFixed(1)}%)`);
    
    // Analyze specifications
    const withSpecs = brandProducts.filter(p => {
      if (!p.specifications) return false;
      try {
        const specs = typeof p.specifications === 'string' ? JSON.parse(p.specifications) : p.specifications;
        return Object.keys(specs).length >= 3;
      } catch {
        return false;
      }
    });
    
    console.log(`\n规格完整性(≥3字段): ${withSpecs.length}/${brandProducts.length} (${(withSpecs.length / brandProducts.length * 100).toFixed(1)}%)`);
    
    // Calculate average spec fields
    let totalSpecFields = 0;
    let productsWithSpecs = 0;
    
    brandProducts.forEach(p => {
      if (p.specifications) {
        try {
          const specs = typeof p.specifications === 'string' ? JSON.parse(p.specifications) : p.specifications;
          const fieldCount = Object.keys(specs).length;
          if (fieldCount > 0) {
            totalSpecFields += fieldCount;
            productsWithSpecs++;
          }
        } catch {}
      }
    });
    
    const avgSpecFields = productsWithSpecs > 0 ? (totalSpecFields / productsWithSpecs).toFixed(1) : '0';
    console.log(`平均规格字段数: ${avgSpecFields}个 (基于${productsWithSpecs}个有规格的产品)`);
    
    // Analyze description length
    const descLengths = withDescription.map(p => p.description!.length);
    const avgDescLength = descLengths.length > 0 ? (descLengths.reduce((a, b) => a + b, 0) / descLengths.length).toFixed(0) : '0';
    const maxDescLength = descLengths.length > 0 ? Math.max(...descLengths) : 0;
    const minDescLength = descLengths.length > 0 ? Math.min(...descLengths) : 0;
    
    console.log(`\n描述长度统计:`);
    console.log(`  平均: ${avgDescLength}字符`);
    console.log(`  最长: ${maxDescLength}字符`);
    console.log(`  最短: ${minDescLength}字符`);
  }
  
  // Overall statistics
  console.log('\n\n=== 总体统计 ===\n');
  
  const allCompleted = await db
    .select()
    .from(products)
    .where(or(
      eq(products.brand, 'Agilent'),
      eq(products.brand, 'Thermo Fisher Scientific')
    ));
  
  console.log(`已完成品牌数: 2/12`);
  console.log(`已完成产品数: ${allCompleted.length}`);
  
  const allProducts = await db.select({ count: sql<number>`count(*)` }).from(products);
  const totalProducts = allProducts[0].count;
  const completionRate = (allCompleted.length / totalProducts * 100).toFixed(1);
  console.log(`产品信息完整度: ${allCompleted.length}/${totalProducts} (${completionRate}%)`);
  
  // Export data for visualization
  const analysisData = {
    brands: completedBrands,
    totalProducts: allCompleted.length,
    completionRate: parseFloat(completionRate),
    brandDetails: {} as any
  };
  
  for (const brand of completedBrands) {
    const brandProducts = await db
      .select()
      .from(products)
      .where(eq(products.brand, brand));
    
    const withDescription = brandProducts.filter(p => p.description && p.description.trim().length > 0);
    const withSpecs = brandProducts.filter(p => {
      if (!p.specifications) return false;
      try {
        const specs = typeof p.specifications === 'string' ? JSON.parse(p.specifications) : p.specifications;
        return Object.keys(specs).length >= 3;
      } catch {
        return false;
      }
    });
    
    const qualityLevels = {
      high: brandProducts.filter(p => p.descriptionQuality === 'high').length,
      medium: brandProducts.filter(p => p.descriptionQuality === 'medium').length,
      low: brandProducts.filter(p => p.descriptionQuality === 'low').length,
      extracted: brandProducts.filter(p => p.descriptionQuality === 'extracted').length,
      none: brandProducts.filter(p => !p.descriptionQuality || p.descriptionQuality === 'none').length
    };
    
    let totalSpecFields = 0;
    let productsWithSpecs = 0;
    
    brandProducts.forEach(p => {
      if (p.specifications) {
        try {
          const specs = typeof p.specifications === 'string' ? JSON.parse(p.specifications) : p.specifications;
          const fieldCount = Object.keys(specs).length;
          if (fieldCount > 0) {
            totalSpecFields += fieldCount;
            productsWithSpecs++;
          }
        } catch {}
      }
    });
    
    analysisData.brandDetails[brand] = {
      totalProducts: brandProducts.length,
      descriptionCoverage: (withDescription.length / brandProducts.length * 100).toFixed(1),
      specCompleteness: (withSpecs.length / brandProducts.length * 100).toFixed(1),
      avgSpecFields: productsWithSpecs > 0 ? (totalSpecFields / productsWithSpecs).toFixed(1) : '0',
      qualityDistribution: qualityLevels,
      abGradePercentage: ((qualityLevels.high + qualityLevels.medium) / brandProducts.length * 100).toFixed(1)
    };
  }
  
  fs.writeFileSync('analysis_data.json', JSON.stringify(analysisData, null, 2));
  console.log('\n分析数据已保存到: analysis_data.json');
}

analyzeCompletedBrands().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
