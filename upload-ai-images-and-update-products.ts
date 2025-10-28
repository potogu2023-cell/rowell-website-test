import { getDb } from "./server/db";
import { products } from "./drizzle/schema";
import { eq, like, or } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 产品类型到图片文件的映射
const productTypeImageMapping: Record<string, string[]> = {
  // HPLC Columns - 使用多种HPLC色谱柱图片
  "HPLC Column": [
    "01_反相色谱柱_C18ODS.png",
    "02_反相色谱柱_C8.png",
    "03_正相色谱柱_Silica.png",
    "04_离子交换色谱柱.png",
    "05_尺寸排阻色谱柱_SECGPC.png",
    "06_手性色谱柱.png",
    "08_UHPLC超高效液相色谱柱.png",
    "09_制备色谱柱.png",
  ],
  
  // GC Columns - 使用GC毛细管柱图片
  "GC Column": [
    "30_GC毛细管柱.png",
  ],
  
  // Guard Columns - 使用保护柱图片
  "Guard Column": [
    "07_保护柱预柱.png",
  ],
  
  // SPE Cartridges - 使用SPE固相萃取柱图片
  "SPE Cartridge": [
    "41_SPE固相萃取柱C18.png",
    "42_SPE固相萃取柱离子交换.png",
    "43_SPE固相萃取板96孔.png",
  ],
  
  // Filtration - 使用过滤器图片
  "Filtration": [
    "44_注射器过滤器022μm.png",
    "45_注射器过滤器045μm.png",
    "46_膜过滤器.png",
    "33_HPLC在线过滤器.png",
    "36_HPLC流动相过滤器.png",
  ],
  
  // Chromatography Supplies - 使用各种耗材图片
  "Chromatography Supply": [
    "10_2mL螺纹口样品瓶.png",
    "11_顶空样品瓶.png",
    "12_进样小瓶棕色.png",
    "13_进样小瓶透明.png",
    "19_自动进样器注射器.png",
    "20_手动进样注射器.png",
    "31_HPLC毛细管.png",
    "32_HPLC接头连接器.png",
    "34_HPLC溶剂瓶.png",
    "49_PEEK管路.png",
    "50_不锈钢管路.png",
    "51_指旋接头.png",
    "52_快速连接接头.png",
  ],
};

// S3 base URL（使用项目的S3配置）
const S3_BASE_URL = "https://your-s3-bucket.s3.amazonaws.com/product-images";

// 图片本地路径
const IMAGE_DIR = "/home/ubuntu/upload/chromatography_product_images";

async function uploadImagesToS3AndUpdateProducts() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  console.log("开始上传AI生成的产品图片并更新数据库...\n");
  
  // 注意：这里我们先使用本地路径，实际部署时需要上传到S3
  // 对于开发环境，我们可以将图片复制到public目录
  const PUBLIC_IMAGE_DIR = path.join(__dirname, "client/public/product-images");
  
  // 创建public/product-images目录
  if (!fs.existsSync(PUBLIC_IMAGE_DIR)) {
    fs.mkdirSync(PUBLIC_IMAGE_DIR, { recursive: true });
    console.log(`✅ 创建目录: ${PUBLIC_IMAGE_DIR}\n`);
  }
  
  // 复制所有图片到public目录
  console.log("📦 复制图片到public目录...");
  const imageFiles = fs.readdirSync(IMAGE_DIR);
  let copiedCount = 0;
  
  for (const file of imageFiles) {
    if (file.endsWith(".png")) {
      const sourcePath = path.join(IMAGE_DIR, file);
      const destPath = path.join(PUBLIC_IMAGE_DIR, file);
      fs.copyFileSync(sourcePath, destPath);
      copiedCount++;
    }
  }
  
  console.log(`✅ 已复制 ${copiedCount} 张图片\n`);
  
  // 更新数据库中的产品图片URL
  console.log("🔄 开始更新产品图片URL...\n");
  
  let totalUpdated = 0;
  
  for (const [productType, imageFiles] of Object.entries(productTypeImageMapping)) {
    console.log(`\n处理产品类型: ${productType}`);
    console.log(`可用图片数量: ${imageFiles.length}`);
    
    // 根据产品类型查询产品
    let whereCondition;
    
    switch (productType) {
      case "HPLC Column":
        // 查找所有HPLC色谱柱产品（name包含HPLC或C18/C8等关键词，但不包含GC）
        whereCondition = or(
          like(products.name, "%HPLC%"),
          like(products.name, "%C18%"),
          like(products.name, "%C8%"),
          like(products.name, "%ODS%"),
          like(products.name, "%Phenyl%"),
          like(products.name, "%CN%"),
          like(products.name, "%NH2%")
        );
        break;
      
      case "GC Column":
        // 查找所有GC色谱柱产品
        whereCondition = or(
          like(products.name, "%GC%"),
          like(products.name, "%Gas Chromatography%"),
          like(products.name, "%Capillary%")
        );
        break;
      
      case "Guard Column":
        // 查找所有保护柱产品
        whereCondition = or(
          like(products.name, "%Guard%"),
          like(products.name, "%保护柱%"),
          like(products.name, "%Pre-column%")
        );
        break;
      
      case "SPE Cartridge":
        // 查找所有SPE固相萃取柱产品
        whereCondition = or(
          like(products.name, "%SPE%"),
          like(products.name, "%Solid Phase Extraction%"),
          like(products.name, "%Extraction Cartridge%")
        );
        break;
      
      case "Filtration":
        // 查找所有过滤器产品
        whereCondition = or(
          like(products.name, "%Filter%"),
          like(products.name, "%Filtration%"),
          like(products.name, "%过滤%")
        );
        break;
      
      case "Chromatography Supply":
        // 查找所有色谱耗材产品
        whereCondition = or(
          like(products.name, "%Vial%"),
          like(products.name, "%Syringe%"),
          like(products.name, "%Fitting%"),
          like(products.name, "%Tubing%"),
          like(products.name, "%Connector%"),
          like(products.name, "%Bottle%"),
          like(products.name, "%Cap%"),
          like(products.name, "%Septum%")
        );
        break;
      
      default:
        continue;
    }
    
    // 查询符合条件的产品
    const matchedProducts = await db!.select().from(products).where(whereCondition);
    
    console.log(`找到 ${matchedProducts.length} 个产品`);
    
    if (matchedProducts.length === 0) {
      continue;
    }
    
    // 为每个产品分配图片（循环使用可用图片）
    let updated = 0;
    for (let i = 0; i < matchedProducts.length; i++) {
      const product = matchedProducts[i];
      const imageFile = imageFiles[i % imageFiles.length]; // 循环使用图片
      const imageUrl = `/product-images/${imageFile}`;
      
      // 更新产品的imageUrl
      await db!
        .update(products)
        .set({ imageUrl })
        .where(eq(products.id, product.id));
      
      updated++;
      
      if (updated % 100 === 0) {
        console.log(`  已更新 ${updated}/${matchedProducts.length} 个产品...`);
      }
    }
    
    console.log(`✅ ${productType}: 成功更新 ${updated} 个产品`);
    totalUpdated += updated;
  }
  
  console.log(`\n\n🎉 全部完成！`);
  console.log(`✅ 总共更新了 ${totalUpdated} 个产品的图片URL`);
  console.log(`✅ 图片已复制到: ${PUBLIC_IMAGE_DIR}`);
  console.log(`✅ 图片URL格式: /product-images/文件名.png`);
}

// 运行脚本
uploadImagesToS3AndUpdateProducts()
  .then(() => {
    console.log("\n✅ 脚本执行完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 脚本执行失败:", error);
    process.exit(1);
  });

