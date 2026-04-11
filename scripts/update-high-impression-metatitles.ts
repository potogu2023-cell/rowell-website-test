/**
 * 更新高曝光零点击产品的 metaTitle
 * 将用户实际搜索的关键词（品牌名、型号、USP 代码）融入 metaTitle，提升 CTR
 */
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { products } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// 精心设计的 metaTitle 更新列表
const METATITLE_UPDATES = [
  {
    partNumber: "92325",
    // 搜索词: "chiralpak im 92325" (241次曝光, 排名4.0)
    // 旧: "Daicel CHIRALPAK® IM Analytical column 92325 | ROWELL"
    // 问题: ® 特殊字符可能被截断；"Analytical column" 不是用户搜索词
    newMetaTitle: "Daicel Chiralpak IM 92325 Chiral HPLC Column | ROWELL",
    reason: "直接匹配搜索词 'chiralpak im 92325'，加入 'Chiral HPLC Column' 提升点击意图",
  },
  {
    partNumber: "00F-4462-E0",
    // 搜索词: "phenomenex kinetex f5 usp l43" (92次曝光), "kinetex 2.6 um c18 100a" (15次)
    // 旧: "Phenomenex Kinetex 2.6 µm C18 100 Å, LC Column 00F-4462-E0 | ROWELL"
    // 注意: 此产品是 C18 USP L1，不是 F5 USP L43（那是 00F-4453-E0）
    // 优化: 加入 USP L1 代码，移除特殊字符 µ 和 Å
    newMetaTitle: "Phenomenex Kinetex 2.6um C18 100A USP L1 00F-4462-E0 | ROWELL",
    reason: "加入 USP L1 分类代码，移除特殊字符，格式更清晰",
  },
  {
    partNumber: "993967-902",
    // 搜索词: "zorbax eclipse plus c18 column" (13次), "993967-902" (26次)
    // 旧: "Agilent ZORBAX Eclipse XDB-C18, 5 um, 4.6 x 150 mm 993967-902 | ROWELL"
    // 优化: 移除逗号，格式更简洁，加入 'HPLC Column'
    newMetaTitle: "Agilent ZORBAX Eclipse XDB-C18 5um 4.6x150mm 993967-902 | ROWELL",
    reason: "移除逗号和空格，格式更紧凑，便于 Google 完整显示",
  },
  {
    partNumber: "ACE-111-1546",
    // 搜索词: "ace 3 aq column" (22次), "ace-111-1546" (19次), "ace 3 c18" (19次)
    // 旧: "Avantor ACE 3 C18, 150 x 4.6 mm ACE-111-1546 | ROWELL"
    // 优化: 加入 'HPLC Column' 关键词，格式更简洁
    newMetaTitle: "Avantor ACE 3 C18 150x4.6mm HPLC Column ACE-111-1546 | ROWELL",
    reason: "加入 'HPLC Column' 关键词，格式更简洁",
  },
  {
    partNumber: "186002350",
    // 搜索词: "waters acquity uplc beh c18" (14次, 排名12.2)
    // 旧: "Waters ACQUITY UPLC BEH C18 Column, 130Å, 1.7 µm, 186002350 | ROWELL"
    // 优化: 移除特殊字符 Å 和 µ，加入具体规格
    newMetaTitle: "Waters ACQUITY UPLC BEH C18 1.7um 2.1x50mm 186002350 | ROWELL",
    reason: "移除特殊字符，加入具体规格，格式更清晰",
  },
  {
    partNumber: "122-7032",
    // 搜索词: "122-7032" (32次, 排名9.4)
    // 旧: "Agilent J&W DB-WAX, 30 m, 0.25 mm, 0.25 um 122-7032 | ROWELL"
    // 优化: 加入 'GC Column' 关键词，格式更简洁
    newMetaTitle: "Agilent J&W DB-WAX GC Column 30m 0.25mm 0.25um 122-7032 | ROWELL",
    reason: "加入 'GC Column' 关键词，明确产品类型",
  },
  {
    partNumber: "TA12S03-1546WT",
    // 搜索词: "ta12s03-1546wt" (34次, 排名14.7)
    // 旧: "YMC YMC-Triart C18 3um 4.6x150mm TA12S03-1546WT | ROWELL"
    // 优化: 移除重复的 YMC 前缀，加入 'HPLC Column'
    newMetaTitle: "YMC Triart C18 3um 4.6x150mm HPLC Column TA12S03-1546WT | ROWELL",
    reason: "移除重复 YMC 前缀，加入 'HPLC Column' 关键词",
  },
];

async function createDb() {
  const dbUrl = new URL(process.env.DATABASE_URL!);
  const sslParam = dbUrl.searchParams.get('ssl');
  dbUrl.searchParams.delete('ssl');

  const poolConfig: any = {
    host: dbUrl.hostname,
    port: dbUrl.port ? parseInt(dbUrl.port) : 3306,
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.slice(1),
  };

  if (sslParam) {
    try {
      poolConfig.ssl = JSON.parse(sslParam);
    } catch {
      poolConfig.ssl = { rejectUnauthorized: true };
    }
  }

  const pool = mysql.createPool(poolConfig);
  return { db: drizzle(pool), pool };
}

async function main() {
  const { db, pool } = await createDb();

  console.log("=".repeat(70));
  console.log("开始更新高曝光零点击产品 metaTitle");
  console.log("=".repeat(70));

  let successCount = 0;
  let failCount = 0;

  for (const update of METATITLE_UPDATES) {
    try {
      const current = await db
        .select({ partNumber: products.partNumber, metaTitle: products.metaTitle, name: products.name })
        .from(products)
        .where(eq(products.partNumber, update.partNumber))
        .limit(1);

      if (current.length === 0) {
        console.log(`\n❌ 未找到产品: ${update.partNumber}`);
        failCount++;
        continue;
      }

      console.log(`\n✅ 更新: ${update.partNumber}`);
      console.log(`   产品名: ${current[0].name?.substring(0, 50)}`);
      console.log(`   旧 metaTitle: ${current[0].metaTitle}`);
      console.log(`   新 metaTitle: ${update.newMetaTitle}`);
      console.log(`   原因: ${update.reason}`);
      console.log(`   字符数: ${update.newMetaTitle.length}`);

      await db
        .update(products)
        .set({ metaTitle: update.newMetaTitle })
        .where(eq(products.partNumber, update.partNumber));

      console.log(`   ✅ 数据库更新成功`);
      successCount++;
    } catch (error) {
      console.error(`   ❌ 更新失败 ${update.partNumber}: ${error}`);
      failCount++;
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log(`更新完成: 成功 ${successCount} 个，失败 ${failCount} 个`);
  console.log("=".repeat(70));

  await pool.end();
}

main().catch(console.error);
