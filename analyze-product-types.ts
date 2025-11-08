import { drizzle } from 'drizzle-orm/mysql2';
import { products } from './drizzle/schema';
import { eq, or, sql } from 'drizzle-orm';
import * as fs from 'fs';

const db = drizzle(process.env.DATABASE_URL!);

async function analyzeProductTypes() {
  console.log('\n=== 产品类型和覆盖范围分析 ===\n');

  const completedBrands = ['Agilent', 'Thermo Fisher Scientific'];

  for (const brand of completedBrands) {
    console.log(`\n--- ${brand} ---\n`);

    const brandProducts = await db
      .select()
      .from(products)
      .where(eq(products.brand, brand));

    // Analyze product types
    const productTypes: Record<string, number> = {};
    brandProducts.forEach(p => {
      const type = p.productType || 'Unknown';
      productTypes[type] = (productTypes[type] || 0) + 1;
    });

    console.log('产品类型分布:');
    Object.entries(productTypes)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        const percentage = (count / brandProducts.length * 100).toFixed(1);
        console.log(`  ${type}: ${count} (${percentage}%)`);
      });

    // Analyze phase types (for HPLC columns)
    const phaseTypes: Record<string, number> = {};
    brandProducts.forEach(p => {
      if (p.phaseType) {
        phaseTypes[p.phaseType] = (phaseTypes[p.phaseType] || 0) + 1;
      }
    });

    if (Object.keys(phaseTypes).length > 0) {
      console.log('\n填料类型分布 (Top 10):');
      Object.entries(phaseTypes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([type, count]) => {
          console.log(`  ${type}: ${count}`);
        });
    }

    // Analyze particle sizes
    const particleSizes: Record<string, number> = {};
    brandProducts.forEach(p => {
      if (p.particleSize) {
        particleSizes[p.particleSize] = (particleSizes[p.particleSize] || 0) + 1;
      }
    });

    if (Object.keys(particleSizes).length > 0) {
      console.log('\n粒径分布 (Top 10):');
      Object.entries(particleSizes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([size, count]) => {
          console.log(`  ${size}: ${count}`);
        });
    }

    // Analyze USP classifications
    const uspTypes: Record<string, number> = {};
    brandProducts.forEach(p => {
      if (p.usp) {
        uspTypes[p.usp] = (uspTypes[p.usp] || 0) + 1;
      }
    });

    if (Object.keys(uspTypes).length > 0) {
      console.log('\nUSP分类分布:');
      Object.entries(uspTypes)
        .sort((a, b) => b[1] - a[1])
        .forEach(([usp, count]) => {
          console.log(`  ${usp}: ${count}`);
        });
    }

    // Analyze column lengths
    const columnLengths: Record<string, number> = {};
    brandProducts.forEach(p => {
      if (p.columnLength) {
        columnLengths[p.columnLength] = (columnLengths[p.columnLength] || 0) + 1;
      }
    });

    if (Object.keys(columnLengths).length > 0) {
      console.log('\n柱长分布 (Top 10):');
      Object.entries(columnLengths)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([length, count]) => {
          console.log(`  ${length}: ${count}`);
        });
    }

    // Analyze inner diameters
    const innerDiameters: Record<string, number> = {};
    brandProducts.forEach(p => {
      if (p.innerDiameter) {
        innerDiameters[p.innerDiameter] = (innerDiameters[p.innerDiameter] || 0) + 1;
      }
    });

    if (Object.keys(innerDiameters).length > 0) {
      console.log('\n内径分布 (Top 10):');
      Object.entries(innerDiameters)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([diameter, count]) => {
          console.log(`  ${diameter}: ${count}`);
        });
    }
  }

  // Overall coverage analysis
  console.log('\n\n=== 总体覆盖范围分析 ===\n');

  const allCompleted = await db
    .select()
    .from(products)
    .where(or(
      eq(products.brand, 'Agilent'),
      eq(products.brand, 'Thermo Fisher Scientific')
    ));

  const allProducts = await db.select().from(products);

  console.log(`已完成品牌: 2/12 (16.7%)`);
  console.log(`已完成产品: ${allCompleted.length}/${allProducts.length} (${(allCompleted.length / allProducts.length * 100).toFixed(1)}%)`);

  // Field completeness
  const fieldCompleteness = {
    description: allCompleted.filter(p => p.description && p.description.trim().length > 0).length,
    specifications: allCompleted.filter(p => {
      if (!p.specifications) return false;
      try {
        const specs = typeof p.specifications === 'string' ? JSON.parse(p.specifications) : p.specifications;
        return Object.keys(specs).length > 0;
      } catch {
        return false;
      }
    }).length,
    productType: allCompleted.filter(p => p.productType).length,
    phaseType: allCompleted.filter(p => p.phaseType).length,
    particleSize: allCompleted.filter(p => p.particleSize).length,
    columnLength: allCompleted.filter(p => p.columnLength).length,
    innerDiameter: allCompleted.filter(p => p.innerDiameter).length,
    usp: allCompleted.filter(p => p.usp).length,
  };

  console.log('\n字段完整性:');
  Object.entries(fieldCompleteness).forEach(([field, count]) => {
    const percentage = (count / allCompleted.length * 100).toFixed(1);
    console.log(`  ${field}: ${count}/${allCompleted.length} (${percentage}%)`);
  });

  // Export analysis data
  const analysisData = {
    completedBrands: 2,
    totalBrands: 12,
    completedProducts: allCompleted.length,
    totalProducts: allProducts.length,
    completionRate: parseFloat((allCompleted.length / allProducts.length * 100).toFixed(1)),
    fieldCompleteness,
    brands: {} as any
  };

  for (const brand of completedBrands) {
    const brandProducts = await db
      .select()
      .from(products)
      .where(eq(products.brand, brand));

    const productTypes: Record<string, number> = {};
    const phaseTypes: Record<string, number> = {};
    const particleSizes: Record<string, number> = {};
    const uspTypes: Record<string, number> = {};

    brandProducts.forEach(p => {
      const type = p.productType || 'Unknown';
      productTypes[type] = (productTypes[type] || 0) + 1;

      if (p.phaseType) {
        phaseTypes[p.phaseType] = (phaseTypes[p.phaseType] || 0) + 1;
      }

      if (p.particleSize) {
        particleSizes[p.particleSize] = (particleSizes[p.particleSize] || 0) + 1;
      }

      if (p.usp) {
        uspTypes[p.usp] = (uspTypes[p.usp] || 0) + 1;
      }
    });

    analysisData.brands[brand] = {
      totalProducts: brandProducts.length,
      productTypes,
      phaseTypes,
      particleSizes,
      uspTypes
    };
  }

  fs.writeFileSync('product_types_analysis.json', JSON.stringify(analysisData, null, 2));
  console.log('\n分析数据已保存到: product_types_analysis.json');
}

analyzeProductTypes().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
