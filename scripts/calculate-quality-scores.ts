import { drizzle } from "drizzle-orm/mysql2";
import { products, productCategories } from "../drizzle/schema";
import { sql, eq } from "drizzle-orm";
import * as fs from "fs";

const db = drizzle(process.env.DATABASE_URL!);

interface QualityScore {
  productId: number;
  partNumber: string;
  brand: string;
  name: string;
  totalScore: number;
  basicInfoScore: number;
  descriptionScore: number;
  specsScore: number;
  imageScore: number;
  categoryScore: number;
  verificationScore: number;
  grade: string;
}

async function calculateQualityScores() {
  console.log("\n📊 计算产品数据质量评分\n");
  
  const allProducts = await db.select().from(products);
  
  const scores: QualityScore[] = [];
  let processed = 0;
  
  for (const product of allProducts) {
    // 1. 基础信息完整性 (20分)
    let basicInfoScore = 0;
    if (product.productId && product.productId.trim()) basicInfoScore += 5;
    if (product.partNumber && product.partNumber.trim()) basicInfoScore += 5;
    if (product.brand && product.brand.trim()) basicInfoScore += 5;
    if (product.name && product.name.trim()) basicInfoScore += 5;
    
    // 2. 描述质量 (25分)
    let descriptionScore = 0;
    const desc = product.description || '';
    if (desc.length > 0) descriptionScore += 5;
    if (desc.length > 50) descriptionScore += 5;
    if (desc.length > 100) descriptionScore += 5;
    if (desc.length > 200) descriptionScore += 5;
    if (product.descriptionQuality === 'high') descriptionScore += 5;
    else if (product.descriptionQuality === 'medium') descriptionScore += 3;
    else if (product.descriptionQuality === 'low') descriptionScore += 1;
    
    // 3. 规格完整性 (25分)
    let specsScore = 0;
    const specs = product.specifications as Record<string, any> || {};
    const specsCount = Object.keys(specs).length;
    if (specsCount > 0) specsScore += 5;
    if (specsCount >= 3) specsScore += 5;
    if (specsCount >= 5) specsScore += 5;
    if (specsCount >= 8) specsScore += 5;
    if (specsCount >= 10) specsScore += 5;
    
    // 4. 图片可用性 (10分)
    let imageScore = 0;
    if (product.imageUrl && product.imageUrl.trim()) {
      imageScore += 10;
    }
    
    // 5. 分类状态 (10分)
    const categories = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.productId, product.id));
    let categoryScore = 0;
    if (categories.length > 0) categoryScore += 5;
    if (categories.length >= 2) categoryScore += 5;
    
    // 6. 验证状态 (10分)
    let verificationScore = 0;
    if (product.status === 'verified') verificationScore += 10;
    else if (product.status === 'pending') verificationScore += 5;
    
    // 总分
    const totalScore = basicInfoScore + descriptionScore + specsScore + 
                      imageScore + categoryScore + verificationScore;
    
    // 评级
    let grade = 'F';
    if (totalScore >= 90) grade = 'A';
    else if (totalScore >= 80) grade = 'B';
    else if (totalScore >= 70) grade = 'C';
    else if (totalScore >= 60) grade = 'D';
    
    scores.push({
      productId: product.id,
      partNumber: product.partNumber,
      brand: product.brand,
      name: product.name || '',
      totalScore,
      basicInfoScore,
      descriptionScore,
      specsScore,
      imageScore,
      categoryScore,
      verificationScore,
      grade,
    });
    
    processed++;
    if (processed % 500 === 0) {
      console.log(`已处理 ${processed}/${allProducts.length} 个产品...`);
    }
  }
  
  console.log(`\n✅ 完成！共处理 ${processed} 个产品\n`);
  
  // 统计
  const gradeStats = {
    A: scores.filter(s => s.grade === 'A').length,
    B: scores.filter(s => s.grade === 'B').length,
    C: scores.filter(s => s.grade === 'C').length,
    D: scores.filter(s => s.grade === 'D').length,
    F: scores.filter(s => s.grade === 'F').length,
  };
  
  const avgScore = (scores.reduce((sum, s) => sum + s.totalScore, 0) / scores.length).toFixed(1);
  
  console.log("📊 质量评分统计:\n");
  console.log(`平均分: ${avgScore}/100`);
  console.log(`A级 (90-100分): ${gradeStats.A} 个 (${(gradeStats.A/scores.length*100).toFixed(1)}%)`);
  console.log(`B级 (80-89分): ${gradeStats.B} 个 (${(gradeStats.B/scores.length*100).toFixed(1)}%)`);
  console.log(`C级 (70-79分): ${gradeStats.C} 个 (${(gradeStats.C/scores.length*100).toFixed(1)}%)`);
  console.log(`D级 (60-69分): ${gradeStats.D} 个 (${(gradeStats.D/scores.length*100).toFixed(1)}%)`);
  console.log(`F级 (<60分): ${gradeStats.F} 个 (${(gradeStats.F/scores.length*100).toFixed(1)}%)`);
  
  // 保存结果
  const sortedScores = scores.sort((a, b) => a.totalScore - b.totalScore);
  
  // 保存完整报告
  fs.writeFileSync(
    '/home/ubuntu/PRODUCT_QUALITY_SCORES.json',
    JSON.stringify(sortedScores, null, 2)
  );
  
  // 保存低质量产品清单 (F级)
  const lowQuality = sortedScores.filter(s => s.grade === 'F');
  fs.writeFileSync(
    '/home/ubuntu/LOW_QUALITY_PRODUCTS.json',
    JSON.stringify(lowQuality, null, 2)
  );
  
  console.log(`\n📄 报告已保存:`);
  console.log(`  - /home/ubuntu/PRODUCT_QUALITY_SCORES.json (完整报告)`);
  console.log(`  - /home/ubuntu/LOW_QUALITY_PRODUCTS.json (低质量产品清单)`);
  console.log();
  
  process.exit(0);
}

calculateQualityScores();
