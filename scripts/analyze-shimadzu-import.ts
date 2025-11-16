import { drizzle } from "drizzle-orm/mysql2";
import { products } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function generateReport() {
  console.log('=== Shimadzu导入后数据分析 ===\n');
  
  // Get all Shimadzu products
  const shimadzuProducts = await db
    .select()
    .from(products)
    .where(eq(products.brand, 'Shimadzu'));
  
  console.log(`📊 Shimadzu品牌总产品数: ${shimadzuProducts.length}\n`);
  
  // Count by status
  const statusCounts: Record<string, number> = {};
  shimadzuProducts.forEach(p => {
    const status = p.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  
  console.log('📈 按状态分布:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    const percentage = (count / shimadzuProducts.length * 100).toFixed(1);
    console.log(`  ${status}: ${count} (${percentage}%)`);
  });
  
  // Count description and specs coverage
  const withDescription = shimadzuProducts.filter(p => p.description && p.description.length > 0).length;
  const withSpecs = shimadzuProducts.filter(p => p.specifications && p.specifications !== '{}').length;
  
  console.log('\n📊 数据覆盖率:');
  console.log(`  描述覆盖率: ${withDescription}/${shimadzuProducts.length} (${(withDescription/shimadzuProducts.length*100).toFixed(1)}%)`);
  console.log(`  规格覆盖率: ${withSpecs}/${shimadzuProducts.length} (${(withSpecs/shimadzuProducts.length*100).toFixed(1)}%)`);
  
  // Analyze verified products
  const verifiedProducts = shimadzuProducts.filter(p => p.status === 'verified');
  console.log(`\n✅ 已验证产品分析 (${verifiedProducts.length}个):`);
  
  if (verifiedProducts.length > 0) {
    // Calculate average specs fields
    let totalSpecsFields = 0;
    let validSpecsCount = 0;
    
    verifiedProducts.forEach(p => {
      if (p.specifications && p.specifications !== '{}') {
        try {
          const specs = JSON.parse(p.specifications);
          const fieldsCount = Object.keys(specs).length;
          totalSpecsFields += fieldsCount;
          validSpecsCount++;
        } catch (e) {
          // Skip invalid JSON
        }
      }
    });
    
    const avgSpecsFields = validSpecsCount > 0 ? (totalSpecsFields / validSpecsCount).toFixed(1) : 0;
    console.log(`  平均规格字段数: ${avgSpecsFields}`);
  }
  
  // Analyze needs_review products
  const needsReviewProducts = shimadzuProducts.filter(p => p.status === 'needs_review');
  console.log(`\n⚠️ 需要审核的产品 (${needsReviewProducts.length}个):`);
  console.log(`  这些产品有描述但规格不匹配`);
  
  // Analyze discontinued products
  const discontinuedProducts = shimadzuProducts.filter(p => p.status === 'discontinued');
  console.log(`\n❌ 已停产产品 (${discontinuedProducts.length}个):`);
  console.log(`  这些产品在官网未找到`);
  
  // Overall quality score
  const verifiedRate = verifiedProducts.length / shimadzuProducts.length;
  const descriptionRate = withDescription / shimadzuProducts.length;
  const specsRate = withSpecs / shimadzuProducts.length;
  
  const qualityScore = (verifiedRate * 0.5 + descriptionRate * 0.25 + specsRate * 0.25) * 100;
  
  console.log(`\n🎯 Shimadzu品牌质量评分: ${qualityScore.toFixed(1)}分`);
  console.log(`  验证率: ${(verifiedRate * 100).toFixed(1)}%`);
  console.log(`  描述率: ${(descriptionRate * 100).toFixed(1)}%`);
  console.log(`  规格率: ${(specsRate * 100).toFixed(1)}%`);
  
  // Get overall database stats
  console.log('\n=== 整体数据库状态 ===\n');
  
  const allProducts = await db.select().from(products);
  const totalProducts = allProducts.length;
  const totalWithDesc = allProducts.filter(p => p.description && p.description.length > 0).length;
  const totalWithSpecs = allProducts.filter(p => p.specifications && p.specifications !== '{}').length;
  const totalVerified = allProducts.filter(p => p.status === 'verified').length;
  
  console.log(`📊 总产品数: ${totalProducts}`);
  console.log(`📈 描述覆盖率: ${totalWithDesc}/${totalProducts} (${(totalWithDesc/totalProducts*100).toFixed(1)}%)`);
  console.log(`📈 规格覆盖率: ${totalWithSpecs}/${totalProducts} (${(totalWithSpecs/totalProducts*100).toFixed(1)}%)`);
  console.log(`📈 验证覆盖率: ${totalVerified}/${totalProducts} (${(totalVerified/totalProducts*100).toFixed(1)}%)`);
  
  // Calculate improvement
  console.log('\n=== 改进情况 ===\n');
  console.log('Shimadzu品牌:');
  console.log(`  验证覆盖率: 0% → ${(verifiedRate * 100).toFixed(1)}%`);
  console.log(`  质量评分: 提升至 ${qualityScore.toFixed(1)}分`);
  
  console.log('\n整体数据库:');
  console.log(`  验证覆盖率: 0% → ${(totalVerified/totalProducts*100).toFixed(1)}%`);
  console.log(`  已验证产品数: ${totalVerified}个`);
  
  process.exit(0);
}

generateReport().catch(console.error);
