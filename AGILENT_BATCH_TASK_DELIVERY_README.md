# Agilent批量爬取任务交付包

**任务编号**: ROWELL-CRAWLER-AGILENT-BATCH-001  
**发布日期**: 2025-11-05  
**优先级**: 🔴 高优先级

---

## 📦 交付包内容

本交付包包含执行Agilent品牌630个产品批量爬取任务所需的全部文件和文档。

### 1. 任务指令文档

**文件**: `AGILENT_BATCH_CRAWLING_INSTRUCTIONS.md`

**内容**:
- 任务目标和执行策略
- 阶段1：小批量测试（50-100个产品）
- 阶段2：全量爬取（630个产品）
- 数据格式要求和质量标准
- 验收标准和沟通机制

**重要性**: ⭐⭐⭐⭐⭐（必读）

### 2. 执行计划文档

**文件**: `AGILENT_BATCH_CRAWLING_PLAN.md`

**内容**:
- 项目概述和爬取范围
- 执行策略和时间计划
- 数据质量标准
- 风险管理和应急预案
- 成功指标和检查清单

**重要性**: ⭐⭐⭐⭐（建议阅读）

### 3. 产品清单文件

**文件**: `product_list_for_crawler_2025-11-05.csv`

**内容**:
- 全部2,689个产品的清单
- 其中Agilent品牌：630个产品
- 字段：productId, partNumber, brand, name

**重要性**: ⭐⭐⭐⭐⭐（必需）

**使用方法**:
```bash
# 过滤出Agilent产品
grep "Agilent" product_list_for_crawler_2025-11-05.csv > agilent_products.csv
```

### 4. 爬虫程序包

**文件**: 已在之前交付（`hplc_crawler_delivery.tar.gz`）

**内容**:
- Python爬虫程序
- 批量爬取辅助工具
- 使用文档

**重要性**: ⭐⭐⭐⭐⭐（必需）

---

## 🚀 快速开始

### Step 1: 阅读任务指令

```bash
# 阅读任务指令文档
cat AGILENT_BATCH_CRAWLING_INSTRUCTIONS.md
```

**重点关注**:
- 两阶段执行策略
- 数据格式要求
- 质量验收标准

### Step 2: 准备产品清单

```bash
# 从完整清单中提取Agilent产品
grep "Agilent" product_list_for_crawler_2025-11-05.csv > agilent_products_630.csv

# 验证产品数量
wc -l agilent_products_630.csv
# 应该显示: 631 (包含表头)
```

### Step 3: 执行阶段1测试

```bash
# 小批量测试（50个产品）
python batch_crawl_helper.py \
  --brand agilent \
  --limit 50 \
  --random \
  --output test_50_results.csv \
  --log-file test_50.log \
  --report-file test_50_report.md
```

**预计时间**: 3-5分钟

### Step 4: 验证测试结果

```bash
# 查看测试报告
cat test_50_report.md

# 检查数据质量
# - 成功率 ≥ 95%？
# - 产品名称完整？
# - 规格字段 ≥ 3个？
```

### Step 5: 执行阶段2全量爬取

**前提**: 阶段1测试通过

```bash
# 全量爬取（630个产品）
python batch_crawl_helper.py \
  --brand agilent \
  --input agilent_products_630.csv \
  --output agilent_full_results.csv \
  --log-file agilent_full.log \
  --report-file agilent_full_report.md \
  --delay 1.0 \
  --retry 3
```

**预计时间**: 45-60分钟

### Step 6: 交付成果

**交付文件**:
1. `agilent_full_results.csv` - 爬取结果（630个产品）
2. `agilent_full_report.md` - 详细报告
3. `agilent_full.log` - 完整日志
4. `agilent_failed_products.csv` - 失败产品清单（如有）

---

## 📊 数据格式示例

### CSV输出格式

```csv
productId,partNumber,brand,name,description,specifications,descriptionQuality,imageUrl,catalogUrl
AGIL-000001,5067-0226,Agilent,"Screw Thread Vial, 2 mL, clear glass, write-on spot, 100/pk","Vial size: 22.75 x 75 mm (20 mm cap). Ideal for HPLC and GC applications.","{""Capacity"": ""2 mL"", ""Material"": ""Clear Glass"", ""Dimensions"": ""22.75 x 75 mm"", ""Cap Size"": ""20 mm"", ""Package Quantity"": ""100""}",low,https://example.com/image.jpg,https://example.com/product
```

### 字段说明

| 字段 | 必需 | 示例 | 说明 |
|------|------|------|------|
| productId | ✅ | AGIL-000001 | 从产品清单中读取 |
| partNumber | ✅ | 5067-0226 | 从产品清单中读取 |
| brand | ✅ | Agilent | 固定值 |
| name | ✅ | Screw Thread Vial... | 完整产品名称 |
| description | ✅ | Vial size: 22.75... | 产品描述（≥20字符） |
| specifications | ✅ | {"Capacity": "2 mL"...} | JSON格式，≥3个字段 |
| descriptionQuality | ✅ | high/medium/low/extracted/none | 描述质量等级 |
| imageUrl | ⭕ | https://... | 产品图片URL |
| catalogUrl | ⭕ | https://... | 产品目录页URL |

---

## ✅ 质量检查清单

### 数据完整性

- [ ] 所有产品都有productId
- [ ] 所有产品都有partNumber
- [ ] 所有产品都有brand（Agilent）
- [ ] 所有产品都有name（完整无截断）

### 数据质量

- [ ] 成功率 ≥ 90%（至少567个产品）
- [ ] 规格完整性 ≥ 90%（至少567个产品有≥3个规格字段）
- [ ] 描述覆盖率 ≥ 70%（至少441个产品有描述）
- [ ] A/B级描述占比 ≥ 30%（至少189个产品）

### 文件完整性

- [ ] agilent_full_results.csv 文件存在
- [ ] agilent_full_report.md 文件存在
- [ ] agilent_full.log 文件存在
- [ ] CSV文件格式正确（UTF-8编码）
- [ ] JSON字段格式正确

---

## 🔍 常见问题

### Q1: 如何从完整清单中提取Agilent产品？

**A**: 使用grep命令：
```bash
grep "Agilent" product_list_for_crawler_2025-11-05.csv > agilent_products_630.csv
```

### Q2: 如果阶段1测试失败怎么办？

**A**: 
1. 检查错误日志（test_50.log）
2. 分析失败原因
3. 调整爬取策略
4. 重新执行测试
5. 如果问题严重，立即联系ROWELL团队

### Q3: 如何判断数据质量是否达标？

**A**: 查看报告文件中的质量统计：
- 成功率 ≥ 90%
- 规格完整性 ≥ 90%
- 描述覆盖率 ≥ 70%
- A/B级描述占比 ≥ 30%

### Q4: CSV中的JSON字段如何处理？

**A**: 
- 使用标准JSON格式
- 不要在JSON外面加额外引号
- 确保JSON格式正确（可以用在线工具验证）

### Q5: 如果爬取时间超出预期怎么办？

**A**:
1. 检查网络连接
2. 检查是否被限速
3. 适当增加延迟时间
4. 如果超时严重，联系ROWELL团队

### Q6: 失败的产品需要重新爬取吗？

**A**:
- 如果失败率 < 10%：可以接受，在报告中说明
- 如果失败率 10-20%：建议重新爬取失败的产品
- 如果失败率 > 20%：必须分析原因并重新爬取

---

## 📞 联系方式

### 进度汇报

**频率**:
- 阶段1：完成后立即汇报
- 阶段2：每完成200个产品汇报一次

**格式**:
```
进度汇报 - Agilent批量爬取

已完成: XXX/630个产品
成功率: XX.X%
当前状态: 正常/异常
预计完成时间: XX:XX

问题（如有）:
1. ...
```

### 问题反馈

**一般问题**: 完成后汇报  
**重要问题**: 立即通知  
**严重问题**: 立即暂停，紧急会议

---

## 📋 执行时间表

| 阶段 | 任务 | 预计时间 | 状态 |
|------|------|---------|------|
| 准备 | 阅读文档，准备环境 | 10-15分钟 | ⏳ |
| 阶段1 | 小批量测试 | 3-5分钟 | ⏳ |
| 阶段1 | 验证和决策 | 10-15分钟 | ⏳ |
| 阶段2 | 全量爬取 | 45-60分钟 | ⏳ |
| 阶段2 | 报告生成 | 5-10分钟 | ⏳ |
| 交付 | 文件打包和交付 | 5分钟 | ⏳ |
| **总计** | - | **1.5-2小时** | ⏳ |

---

## 🎯 成功标准

### 技术成功

- ✅ 630个产品数据采集完成
- ✅ 成功率 ≥ 90%
- ✅ 数据质量达到验收标准
- ✅ 无重大技术问题

### 业务成功

- ✅ 数据可以成功导入ROWELL数据库
- ✅ 为后续品牌爬取建立标准流程
- ✅ 客户满意度高

---

## 📄 附录

### A. 文件清单

```
AGILENT_BATCH_TASK_DELIVERY_README.md          (本文件)
AGILENT_BATCH_CRAWLING_INSTRUCTIONS.md         (任务指令)
AGILENT_BATCH_CRAWLING_PLAN.md                 (执行计划)
product_list_for_crawler_2025-11-05.csv        (产品清单)
hplc_crawler_delivery.tar.gz                   (爬虫程序，已交付)
```

### B. 参考文档

1. **爬虫任务指令V2.0**: `CRAWLER_TEXT_INFO_INSTRUCTIONS.md`
2. **策略更新文档**: `STRATEGY_UPDATE_SUMMARY.md`
3. **交付验证报告**: `CRAWLER_DELIVERY_VERIFICATION_REPORT.md`

### C. 数据导入

**ROWELL团队负责**:
- 接收爬取结果CSV文件
- 运行数据导入脚本
- 验证数据质量
- 生成导入报告

**爬虫团队无需关心**:
- 数据库结构
- 数据导入逻辑
- 网站展示效果

---

**任务发布时间**: 2025-11-05  
**期望完成时间**: 2-3小时内  
**任务优先级**: 🔴 高优先级

**祝执行顺利！** 🚀

---

**下一步**: 开始执行阶段1小批量测试！
