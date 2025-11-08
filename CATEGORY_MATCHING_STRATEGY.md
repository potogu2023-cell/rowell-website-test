# 产品分类匹配策略（修正版）

**日期**: 2025-11-08  
**修正原因**: 之前错误地假设需要创建新分类，实际上应该将产品匹配到现有34个分类  
**目标**: 将2,059个未分类产品匹配到现有分类体系

---

## 🎯 问题重新定义

### 现状

**现有分类体系**：
- ✅ 4个一级分类
- ✅ 30个二级分类
- ✅ 总计34个分类

**产品分类状态**：
- ✅ 630个产品已分类（23.4%）
- ❌ 2,059个产品未分类（76.6%）

### 真正的任务

**不是**：创建新的分类体系  
**而是**：将未分类产品匹配到现有34个分类

---

## 📊 现有分类体系分析

### 一级分类（4个）

| ID | 名称 | 英文名称 | 产品数量 |
|----|------|---------|---------|
| 1 | HPLC色谱柱 | HPLC Columns | ? |
| 2 | GC色谱柱 | GC Columns | ? |
| 3 | SPE固相萃取柱 | SPE Cartridges | ? |
| 4 | 样品前处理产品 | Sample Preparation | ? |

### 二级分类（30个）

需要查询具体的30个二级分类及其所属的一级分类...

---

## 🔧 匹配策略

### 阶段1：产品类型识别

**目标**：判断产品属于哪个一级分类

**识别规则**：

1. **HPLC色谱柱**（一级分类ID: 1）
   ```typescript
   - productType包含 "HPLC Column"
   - 或产品名称包含 "HPLC", "LC Column", "Liquid Chromatography"
   - 或规格包含 "UHPLC", "HPLC"
   ```

2. **GC色谱柱**（一级分类ID: 2）
   ```typescript
   - productType包含 "GC Column"
   - 或产品名称包含 "GC", "Gas Chromatography", "Capillary Column"
   - 或规格包含 "GC"
   ```

3. **SPE固相萃取柱**（一级分类ID: 3）
   ```typescript
   - productType包含 "SPE"
   - 或产品名称包含 "SPE", "Solid Phase Extraction", "Cartridge"
   ```

4. **样品前处理产品**（一级分类ID: 4）
   ```typescript
   - productType包含 "Vial", "Filter", "Cap", "Septa"
   - 或产品名称包含 "Sample Vial", "Filter", "Syringe"
   ```

### 阶段2：二级分类匹配

**目标**：根据产品特征匹配到具体的二级分类

**需要先查询现有30个二级分类的详细信息**，然后针对每个二级分类定义匹配规则。

**示例（假设的二级分类）**：

#### HPLC色谱柱的二级分类

1. **C18反相色谱柱**
   ```typescript
   - 产品名称包含 "C18", "ODS", "Octadecyl"
   - 或规格中Chemistry = "C18"
   ```

2. **C8反相色谱柱**
   ```typescript
   - 产品名称包含 "C8", "Octyl"
   - 或规格中Chemistry = "C8"
   ```

3. **HILIC色谱柱**
   ```typescript
   - 产品名称包含 "HILIC"
   - 或规格中Separation Mode = "HILIC"
   ```

4. **手性色谱柱**
   ```typescript
   - 产品名称包含 "Chiral", "CHIRALPAK", "CHIRALCEL"
   - 或品牌 = "Daicel" 且产品系列包含 "CHIRAL"
   ```

5. **离子交换色谱柱**
   ```typescript
   - 产品名称包含 "Ion Exchange", "IEX", "SCX", "SAX"
   ```

6. **尺寸排阻色谱柱**
   ```typescript
   - 产品名称包含 "SEC", "Size Exclusion", "GPC"
   ```

#### GC色谱柱的二级分类

1. **非极性GC柱**
   ```typescript
   - 产品名称包含 "ZB-1", "DB-1", "HP-1"
   ```

2. **中极性GC柱**
   ```typescript
   - 产品名称包含 "ZB-5", "DB-5", "HP-5"
   ```

3. **极性GC柱**
   ```typescript
   - 产品名称包含 "WAX", "Polyethylene Glycol"
   ```

### 阶段3：多分类支持

**一个产品可以属于多个分类**：

例如：
- 一级分类：HPLC色谱柱
- 二级分类1：C18反相色谱柱
- 二级分类2：UHPLC色谱柱（如果粒径<2µm）
- 二级分类3：快速分离柱（如果柱长<50mm）

---

## 📋 实施步骤

### 步骤1：查询现有分类详情

```sql
SELECT 
  c.id,
  c.name,
  c.nameEn,
  c.parentId,
  c.level,
  (SELECT name FROM categories WHERE id = c.parentId) as parent_name
FROM categories c
ORDER BY c.parentId, c.displayOrder, c.id;
```

**目标**：了解每个二级分类的具体含义和所属一级分类

### 步骤2：定义匹配规则

基于步骤1的结果，为每个分类定义匹配规则：

```typescript
interface CategoryRule {
  categoryId: number;
  categoryName: string;
  parentId: number | null;
  matchRules: {
    productType?: string[];      // 产品类型匹配
    nameKeywords?: string[];      // 产品名称关键词
    specKeywords?: string[];      // 规格关键词
    brandSpecific?: {             // 品牌特定规则
      brand: string;
      condition: string;
    };
  };
  priority: number;               // 匹配优先级
}
```

### 步骤3：开发匹配引擎

```typescript
async function matchProductToCategories(product: Product): Promise<number[]> {
  const matchedCategories: number[] = [];
  
  // 1. 匹配一级分类
  const primaryCategory = matchPrimaryCategory(product);
  if (primaryCategory) {
    matchedCategories.push(primaryCategory.id);
  }
  
  // 2. 匹配二级分类
  const secondaryCategories = matchSecondaryCategories(product, primaryCategory);
  matchedCategories.push(...secondaryCategories.map(c => c.id));
  
  return matchedCategories;
}
```

### 步骤4：批量处理

```typescript
// 处理所有未分类产品
const uncategorizedProducts = await db
  .select()
  .from(products)
  .leftJoin(productCategories, eq(products.id, productCategories.productId))
  .where(isNull(productCategories.productId));

for (const product of uncategorizedProducts) {
  const categoryIds = await matchProductToCategories(product);
  
  for (const categoryId of categoryIds) {
    await db.insert(productCategories).values({
      productId: product.id,
      categoryId: categoryId,
      isPrimary: categoryIds.indexOf(categoryId) === 0 ? 1 : 0,
    });
  }
}
```

### 步骤5：验证和优化

- 抽样检查匹配结果
- 调整规则权重
- 处理边缘案例
- 生成匹配质量报告

---

## 🎯 预期效果

### 匹配覆盖率

**保守估计**：
- 一级分类匹配率: 95%+（基于productType）
- 二级分类匹配率: 70-80%（基于产品名称和规格）
- **综合匹配率**: 70-80%

**实际效果**：
- 当前: 630个产品有分类（23.4%）
- 实施后: 2,070-2,280个产品有分类（77.0-84.8%）
- 提升: +229-262%

### 未匹配产品处理

对于无法自动匹配的产品（约400-600个）：
1. 生成待审核列表
2. 提供人工分类界面
3. 或暂时分配到"其他"分类

---

## ⏰ 实施时间表

### 第1天：分析现有分类
- 查询并分析34个分类的详细信息
- 理解每个分类的含义和范围
- 识别分类之间的关系

### 第2天：定义匹配规则
- 为每个一级分类定义匹配规则
- 为每个二级分类定义匹配规则
- 测试规则准确性

### 第3天：开发匹配引擎
- 编写产品类型识别器
- 编写分类匹配引擎
- 实现批量处理脚本

### 第4天：测试和优化
- 抽样测试100个产品
- 调整规则权重
- 优化匹配逻辑

### 第5天：批量处理和部署
- 处理所有未分类产品
- 生成匹配报告
- 部署到生产环境

---

## 📝 下一步行动

### 立即执行

- [ ] 查询34个分类的完整详情
- [ ] 分析每个分类的含义和范围
- [ ] 设计匹配规则框架

### 本周完成

- [ ] 定义所有分类的匹配规则
- [ ] 开发分类匹配引擎
- [ ] 批量处理未分类产品
- [ ] 生成匹配质量报告

---

**报告结束**

*日期: 2025-11-08*  
*修正版本: v2.0*  
*目标: 将产品匹配到现有34个分类*
