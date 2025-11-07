# 产品清单数据分析

## 基本信息

- **总产品数**: 2689个
- **数据文件**: product_list_for_crawler_2025-11-05.csv
- **字段**: productId, partNumber, brand, name

## 品牌分布

| 品牌 | 产品数量 | 批次 | 优先级 |
|------|---------|------|--------|
| Agilent | 630 | 第一批 | 🔴 最高 |
| Thermo Fisher Scientific | 366 | 第一批 | 🔴 最高 |
| Waters | 270 | 第一批 | 🔴 最高 |
| Daicel | 277 | 第二批 | 🟡 高 |
| Phenomenex | 247 | 第二批 | 🟡 高 |
| Restek | 215 | 第二批 | 🟡 高 |
| Merck | 199 | 第二批 | 🟡 高 |
| ACE | 151 | 第三批 | 🟢 中 |
| Shimadzu | 130 | 第三批 | 🟢 中 |
| Develosil | 118 | 第三批 | 🟢 中 |
| Avantor | 83 | 第三批 | 🟢 中 |
| Thermo Fisher | 3 | - | ⚠️ 需要统一 |

**注意**: 有3个产品的品牌名称为"Thermo Fisher",需要统一为"Thermo Fisher Scientific"

## 批次划分

### 第一批 (1266个产品)
- Agilent: 630
- Thermo Fisher Scientific: 366
- Waters: 270
- **预计时间**: 3-5天

### 第二批 (938个产品)
- Daicel: 277
- Phenomenex: 247
- Restek: 215
- Merck: 199
- **预计时间**: 3-5天

### 第三批 (482个产品)
- ACE: 151
- Shimadzu: 130
- Develosil: 118
- Avantor: 83
- **预计时间**: 2-3天

### 需要处理的特殊情况
- Thermo Fisher (3个): 需要统一为"Thermo Fisher Scientific"

## 数据质量问题

### 产品名称问题
从样本数据看,部分产品名称可能存在:
1. 截断问题(需要从官网获取完整名称)
2. 格式不统一
3. 包含特殊字符(如®, µ)

### 待补充字段
- description: 100%缺失
- specifications: 100%缺失
- detailedDescription: 100%缺失

## 爬取策略

### 匹配规则
- 主键: productId
- 备用: brand + partNumber

### 官网URL映射
| 品牌 | 官网 |
|------|------|
| Agilent | https://www.agilent.com |
| Thermo Fisher Scientific | https://www.thermofisher.com |
| Waters | https://www.waters.com |
| Daicel | https://www.daicel.com |
| Phenomenex | https://www.phenomenex.com |
| Restek | https://www.restek.com |
| Merck | https://www.sigmaaldrich.com |
| Shimadzu | https://www.shimadzu.com |
| ACE | https://www.ace-hplc.com |
| Develosil | https://www.nomura-chem.co.jp |
| Avantor | https://www.avantorsciences.com |
