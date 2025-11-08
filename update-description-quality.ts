import { drizzle } from 'drizzle-orm/mysql2';
import { products } from './drizzle/schema';
import { eq, or, isNotNull } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL!);

// Function to assess description quality
function assessDescriptionQuality(description: string | null): 'high' | 'medium' | 'low' | 'extracted' | 'none' {
  if (!description || description.trim().length === 0) {
    return 'none';
  }

  const length = description.length;
  const hasDetailedInfo = /\b(use|feature|provide|offer|design|suitable|ideal|excellent|performance|application|analysis|separation|chromatography)\b/i.test(description);
  const hasMultipleSentences = (description.match(/\./g) || []).length >= 2;
  const hasNumbers = /\d/.test(description);

  // Check if it's an extracted description (catalog number pattern)
  if (/^(Catalog number|Laboratory supply|Product code):/i.test(description) && length < 100) {
    return 'extracted';
  }

  // High quality: >200 chars, detailed info, multiple sentences
  if (length > 200 && hasDetailedInfo && hasMultipleSentences) {
    return 'high';
  }

  // Medium quality: 100-200 chars or has some detail
  if (length > 100 || (hasDetailedInfo && hasNumbers)) {
    return 'medium';
  }

  // Low quality: 50-100 chars or minimal info
  if (length > 50) {
    return 'low';
  }

  // Very short descriptions
  return 'low';
}

async function updateDescriptionQuality() {
  console.log('\n=== 更新产品描述质量等级 ===\n');

  // Get all products from Agilent and Thermo Fisher
  const targetBrands = ['Agilent', 'Thermo Fisher Scientific'];

  for (const brand of targetBrands) {
    console.log(`\n--- 处理品牌: ${brand} ---\n`);

    const brandProducts = await db
      .select()
      .from(products)
      .where(eq(products.brand, brand));

    console.log(`找到 ${brandProducts.length} 个产品`);

    let updated = 0;
    let skipped = 0;

    for (const product of brandProducts) {
      const quality = assessDescriptionQuality(product.description);

      // Update the product
      await db
        .update(products)
        .set({ descriptionQuality: quality })
        .where(eq(products.id, product.id));

      if (quality !== 'none') {
        updated++;
        if (updated <= 5) {
          console.log(`✅ ${product.productId}: ${quality} (${product.description?.substring(0, 50)}...)`);
        }
      } else {
        skipped++;
      }
    }

    console.log(`\n完成: ${updated} 个产品已更新, ${skipped} 个产品无描述`);
  }

  console.log('\n\n=== 验证更新结果 ===\n');

  for (const brand of targetBrands) {
    const brandProducts = await db
      .select()
      .from(products)
      .where(eq(products.brand, brand));

    const qualityStats = {
      high: brandProducts.filter(p => p.descriptionQuality === 'high').length,
      medium: brandProducts.filter(p => p.descriptionQuality === 'medium').length,
      low: brandProducts.filter(p => p.descriptionQuality === 'low').length,
      extracted: brandProducts.filter(p => p.descriptionQuality === 'extracted').length,
      none: brandProducts.filter(p => p.descriptionQuality === 'none').length
    };

    console.log(`\n${brand}:`);
    console.log(`  high (A级): ${qualityStats.high} (${(qualityStats.high / brandProducts.length * 100).toFixed(1)}%)`);
    console.log(`  medium (B级): ${qualityStats.medium} (${(qualityStats.medium / brandProducts.length * 100).toFixed(1)}%)`);
    console.log(`  low (C级): ${qualityStats.low} (${(qualityStats.low / brandProducts.length * 100).toFixed(1)}%)`);
    console.log(`  extracted (D级): ${qualityStats.extracted} (${(qualityStats.extracted / brandProducts.length * 100).toFixed(1)}%)`);
    console.log(`  none: ${qualityStats.none} (${(qualityStats.none / brandProducts.length * 100).toFixed(1)}%)`);

    const abGrade = qualityStats.high + qualityStats.medium;
    console.log(`  A/B级占比: ${(abGrade / brandProducts.length * 100).toFixed(1)}%`);
  }

  console.log('\n✅ 描述质量等级更新完成！\n');
}

updateDescriptionQuality().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
