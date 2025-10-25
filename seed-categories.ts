import { drizzle } from "drizzle-orm/mysql2";
import { categories } from "./drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

const initialCategories = [
  // 一级分类（前台显示）
  { id: 1, name: "色谱柱", nameEn: "Chromatography Columns", slug: "chromatography-columns", parentId: null, level: 1, displayOrder: 1, isVisible: 1, description: "各类色谱柱产品，包括液相色谱柱、气相色谱柱等" },
  { id: 2, name: "色谱耗材", nameEn: "Chromatography Supplies", slug: "chromatography-supplies", parentId: null, level: 1, displayOrder: 2, isVisible: 1, description: "色谱分析所需的各类耗材" },
  { id: 3, name: "色谱配件", nameEn: "Chromatography Accessories", slug: "chromatography-accessories", parentId: null, level: 1, displayOrder: 3, isVisible: 1, description: "色谱仪器配件及附件" },
  { id: 4, name: "样品前处理", nameEn: "Sample Preparation", slug: "sample-preparation", parentId: null, level: 1, displayOrder: 4, isVisible: 1, description: "样品前处理产品和解决方案" },
  { id: 5, name: "实验室用品", nameEn: "Laboratory Supplies", slug: "laboratory-supplies", parentId: null, level: 1, displayOrder: 5, isVisible: 1, description: "实验室常用用品" },
  
  // 一级分类（后台预留）
  { id: 6, name: "化学标准品", nameEn: "Chemical Standards", slug: "chemical-standards", parentId: null, level: 1, displayOrder: 6, isVisible: 0, description: "化学标准品和参考物质" },
  { id: 7, name: "其他", nameEn: "Others", slug: "others", parentId: null, level: 1, displayOrder: 7, isVisible: 0, description: "其他产品" },
  
  // 二级分类（色谱柱）
  { id: 11, name: "液相色谱柱", nameEn: "LC Columns", slug: "lc-columns", parentId: 1, level: 2, displayOrder: 1, isVisible: 1, description: "液相色谱柱产品" },
  { id: 12, name: "气相色谱柱", nameEn: "GC Columns", slug: "gc-columns", parentId: 1, level: 2, displayOrder: 2, isVisible: 1, description: "气相色谱柱产品" },
  { id: 13, name: "柱保护", nameEn: "Column Protection", slug: "column-protection", parentId: 1, level: 2, displayOrder: 3, isVisible: 1, description: "保护柱和在线过滤器" },
  
  // 三级分类（液相色谱柱）
  { id: 111, name: "分析型HPLC柱", nameEn: "Analytical HPLC Columns", slug: "analytical-hplc-columns", parentId: 11, level: 3, displayOrder: 1, isVisible: 1, description: "分析型高效液相色谱柱" },
  { id: 112, name: "制备型HPLC柱", nameEn: "Preparative HPLC Columns", slug: "preparative-hplc-columns", parentId: 11, level: 3, displayOrder: 2, isVisible: 1, description: "制备型高效液相色谱柱" },
  { id: 113, name: "UHPLC柱", nameEn: "UHPLC Columns", slug: "uhplc-columns", parentId: 11, level: 3, displayOrder: 3, isVisible: 1, description: "超高效液相色谱柱" },
  { id: 114, name: "生物色谱柱", nameEn: "Bio LC Columns", slug: "bio-lc-columns", parentId: 11, level: 3, displayOrder: 4, isVisible: 1, description: "生物分析专用色谱柱" },
  { id: 115, name: "手性色谱柱", nameEn: "Chiral Columns", slug: "chiral-columns", parentId: 11, level: 3, displayOrder: 5, isVisible: 1, description: "手性分离色谱柱" },
  { id: 116, name: "GPC/SEC柱", nameEn: "GPC/SEC Columns", slug: "gpc-sec-columns", parentId: 11, level: 3, displayOrder: 6, isVisible: 1, description: "凝胶渗透/尺寸排阻色谱柱" },
];

async function seed() {
  console.log("开始导入分类数据...");
  
  for (const category of initialCategories) {
    try {
      await db.insert(categories).values(category);
      console.log(`✓ 已导入: ${category.name} (${category.nameEn})`);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`- 跳过（已存在）: ${category.name}`);
      } else {
        console.error(`✗ 导入失败: ${category.name}`, error.message);
      }
    }
  }
  
  console.log("\n分类数据导入完成！");
  console.log(`总计: ${initialCategories.length} 个分类`);
  console.log(`- 一级分类（前台显示）: 5 个`);
  console.log(`- 一级分类（后台预留）: 2 个`);
  console.log(`- 二级分类: 3 个`);
  console.log(`- 三级分类: 6 个`);
  
  process.exit(0);
}

seed().catch((error) => {
  console.error("导入失败:", error);
  process.exit(1);
});
