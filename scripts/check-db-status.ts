import { drizzle } from "drizzle-orm/mysql2";
import { products } from "../drizzle/schema";
import { sql, count } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL as string);

async function checkDatabaseStatus() {
  console.log('=== 数据库产品状态检查 ===\n');
  
  // Total products
  const totalResult = await db.select({ count: count() }).from(products);
  const total = totalResult[0].count;
  console.log(`总产品数: ${total}\n`);
  
  // By brand and status
  const brandStats = await db
    .select({
      brand: products.brand,
      total: count(),
      verified: sql<number>`SUM(CASE WHEN ${products.status} = 'verified' THEN 1 ELSE 0 END)`,
      hasDescription: sql<number>`SUM(CASE WHEN ${products.description} IS NOT NULL AND ${products.description} != '' THEN 1 ELSE 0 END)`,
      hasSpecs: sql<number>`SUM(CASE WHEN ${products.specifications} IS NOT NULL AND ${products.specifications} != '' AND ${products.specifications} != '{}' THEN 1 ELSE 0 END)`,
    })
    .from(products)
    .groupBy(products.brand)
    .orderBy(sql`count(*) DESC`);
  
  console.log('=== 按品牌统计 ===\n');
  console.log('品牌                      总数    已验证  有描述  有规格  描述率  规格率  验证率');
  console.log('-'.repeat(95));
  
  let totalVerified = 0;
  let totalWithDesc = 0;
  let totalWithSpecs = 0;
  
  for (const stat of brandStats) {
    const descRate = ((stat.hasDescription / stat.total) * 100).toFixed(1);
    const specRate = ((stat.hasSpecs / stat.total) * 100).toFixed(1);
    const verifiedRate = ((stat.verified / stat.total) * 100).toFixed(1);
    
    console.log(
      `${stat.brand.padEnd(25)} ${String(stat.total).padStart(4)} ${String(stat.verified).padStart(7)} ${String(stat.hasDescription).padStart(7)} ${String(stat.hasSpecs).padStart(7)} ${descRate.padStart(6)}% ${specRate.padStart(6)}% ${verifiedRate.padStart(6)}%`
    );
    
    totalVerified += Number(stat.verified);
    totalWithDesc += Number(stat.hasDescription);
    totalWithSpecs += Number(stat.hasSpecs);
  }
  
  console.log('-'.repeat(95));
  const totalDescRate = ((totalWithDesc / total) * 100).toFixed(1);
  const totalSpecRate = ((totalWithSpecs / total) * 100).toFixed(1);
  const totalVerifiedRate = ((totalVerified / total) * 100).toFixed(1);
  
  console.log(
    `${'总计'.padEnd(25)} ${String(total).padStart(4)} ${String(totalVerified).padStart(7)} ${String(totalWithDesc).padStart(7)} ${String(totalWithSpecs).padStart(7)} ${totalDescRate.padStart(6)}% ${totalSpecRate.padStart(6)}% ${totalVerifiedRate.padStart(6)}%`
  );
  
  console.log('\n=== 需要处理的品牌 ===\n');
  
  const needsWork = [];
  const completed = [];
  
  for (const stat of brandStats) {
    const descRate = (Number(stat.hasDescription) / stat.total) * 100;
    const specRate = (Number(stat.hasSpecs) / stat.total) * 100;
    const verifiedRate = (Number(stat.verified) / stat.total) * 100;
    
    if (descRate < 90 || specRate < 80 || verifiedRate < 50) {
      const issues = [];
      if (descRate < 90) issues.push(`描述${descRate.toFixed(1)}%`);
      if (specRate < 80) issues.push(`规格${specRate.toFixed(1)}%`);
      if (verifiedRate < 50) issues.push(`验证${verifiedRate.toFixed(1)}%`);
      
      needsWork.push({
        brand: stat.brand,
        total: stat.total,
        issues: issues.join(', ')
      });
      
      console.log(`❌ ${stat.brand} (${stat.total}个): ${issues.join(', ')}`);
    } else {
      completed.push(stat.brand);
      console.log(`✅ ${stat.brand} (${stat.total}个): 数据质量良好`);
    }
  }
  
  console.log('\n=== 总结 ===\n');
  console.log(`✅ 已完成品牌: ${completed.length}个`);
  console.log(`❌ 需要处理品牌: ${needsWork.length}个`);
  console.log(`\n整体数据质量:`);
  console.log(`- 描述覆盖率: ${totalDescRate}%`);
  console.log(`- 规格覆盖率: ${totalSpecRate}%`);
  console.log(`- 验证覆盖率: ${totalVerifiedRate}%`);
  
  process.exit(0);
}

checkDatabaseStatus().catch(console.error);
