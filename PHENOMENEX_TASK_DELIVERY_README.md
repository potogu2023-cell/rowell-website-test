# Phenomenex品牌爬取任务交付包

**任务编号**: ROWELL-CRAWLER-PHENOMENEX-001  
**交付日期**: 2025-11-08  
**任务状态**: 待执行

---

## 📦 交付文件清单

本次交付包含以下文件：

### 1. PHENOMENEX_CRAWLING_INSTRUCTIONS.md
**文件类型**: 任务指令文档  
**用途**: 详细的爬虫任务执行指南

**内容概要**:
- 任务目标和背景
- 数据字段要求和格式规范
- 爬取策略和技术要求
- 质量验收标准
- 常见问题和解决方案
- 交付物要求

### 2. phenomenex_product_list_for_crawler.csv
**文件类型**: 产品清单CSV  
**用途**: 待爬取的247个Phenomenex产品列表

**文件信息**:
- 产品数量：247个
- 文件编码：UTF-8
- 字段：productId, partNumber, brand, name

**示例数据**:
```csv
productId,partNumber,brand,name
"PHEN-7EG-G006-11","7EG-G006-11","Phenomenex","Zebron ZB-1701, GC Cap. Column 15 m x 0.25 mm x 0.25 µm, Ea"
"PHEN-7EM-G006-11","7EM-G006-11","Phenomenex","Zebron ZB-1701, GC Cap. Column 15 m x 0.32 mm x 0.25 µm, Ea"
```

### 3. import-agilent-batch-data.mjs
**文件类型**: 数据导入脚本  
**用途**: 将爬取结果导入ROWELL数据库（通用脚本，可复用）

**功能**:
- 读取CSV文件
- 验证数据格式
- 更新数据库产品记录
- 生成质量评估报告
- 生成导入日志

**使用方法**:
```bash
# 将爬取结果CSV文件重命名或修改脚本中的文件名
node import-agilent-batch-data.mjs
```

---

## 🎯 任务目标

### 产品数量
- **总目标**: 247个Phenomenex产品
- **产品类型**: HPLC色谱柱、GC色谱柱、保护柱、SPE固相萃取柱等

### 质量目标

**必达标准**（Minimum Acceptable）:
- ✅ 成功率 ≥ 90%（至少222个产品）
- ✅ 产品名称完整性 = 100%
- ✅ 零件号完整性 = 100%
- ✅ 规格完整性 ≥ 90%（至少222个产品有≥3个规格字段）
- ✅ 描述覆盖率 ≥ 70%（至少173个产品）

**优秀标准**（Excellent）:
- 🌟 成功率 ≥ 95%（至少235个产品）
- 🌟 描述覆盖率 ≥ 80%（至少198个产品）
- 🌟 A/B级描述占比 ≥ 40%（至少99个产品）
- 🌟 平均规格字段数 ≥ 15个
- 🌟 图片覆盖率 ≥ 70%（至少173个产品）

---

## 📊 参考：已完成品牌的数据质量

| 品牌 | 产品数 | 成功率 | 描述覆盖率 | A/B级描述 | 平均规格字段 | 评级 |
|------|--------|--------|-----------|----------|-------------|------|
| Agilent | 630 | 98.7% | 99.0% | 97.6% | 12.9个 | ⭐⭐⭐⭐⭐ |
| Thermo Fisher | 366 | 73.5% | 78.1% | 62.0% | 14.0个 | ⭐⭐⭐⭐ |
| Daicel | 263 | 94.9% | 94.9% | 30.4% | 4.9个 | ⭐⭐⭐⭐ |
| Waters | 106 | 100% | 100% | 100% | 26.0个 | ⭐⭐⭐⭐⭐ |

**期望**: Phenomenex的数据质量应达到或超过Agilent的水平（⭐⭐⭐⭐⭐）。

---

## 📝 交付物要求

爬取完成后，请提交以下文件：

### 1. phenomenex_247_results.csv（必需）
**格式要求**:
- UTF-8编码（带BOM）
- 包含所有必需字段：productId, partNumber, brand, name, description, descriptionQuality, specifications
- 可选字段：imageUrl, catalogUrl, technicalDocUrl

**字段说明**:
- `productId`: 与输入CSV完全一致
- `partNumber`: Phenomenex官方零件号
- `brand`: 固定为"Phenomenex"
- `name`: 产品完整名称（保持官网原格式）
- `description`: 产品详细描述文本
- `descriptionQuality`: high / medium / low / extracted
- `specifications`: JSON格式的技术规格对象

### 2. PHENOMENEX_CRAWLING_REPORT.md（必需）
**内容要求**:
- 执行总结（爬取时间、成功/失败数量）
- 数据质量统计（描述覆盖率、规格字段统计等）
- 问题记录（未找到的产品、数据质量问题）
- 质量自评（对照验收标准）

### 3. crawler.log（可选）
**内容**:
- 详细的爬取日志
- 警告和错误信息
- 用于问题排查

---

## ⏱️ 预计时间

**总时间**: 2-3小时

| 阶段 | 时间 | 说明 |
|------|------|------|
| 准备阶段 | 10分钟 | 配置环境，测试连接 |
| 测试爬取 | 20分钟 | 爬取10个样本，验证策略 |
| 全量爬取 | 90-120分钟 | 爬取全部247个产品 |
| 数据验证 | 20分钟 | 检查数据质量，修复问题 |
| 生成报告 | 10分钟 | 编写爬取报告 |

---

## 🔗 相关资源

### Phenomenex官网
- 官网首页：https://www.phenomenex.com/
- 产品目录：https://www.phenomenex.com/products/
- HPLC色谱柱：https://www.phenomenex.com/products/hplc-columns
- GC色谱柱：https://www.phenomenex.com/products/gc-columns

### 项目文档
- 详细任务指令：PHENOMENEX_CRAWLING_INSTRUCTIONS.md
- Agilent爬取报告：AGILENT_FINAL_QUALITY_REPORT.md
- Thermo Fisher爬取报告：THERMO_FISHER_QUALITY_REPORT.md
- Daicel爬取报告：DAICEL_QUALITY_REPORT.md
- Waters爬取报告：WATERS_QUALITY_REPORT.md

---

## ✅ 验收流程

1. **提交交付物**
   - 上传CSV文件（phenomenex_247_results.csv）
   - 上传爬取报告（PHENOMENEX_CRAWLING_REPORT.md）
   - 上传日志文件（可选）

2. **自动验证**
   - 检查CSV格式
   - 检查必需字段完整性
   - 统计数据质量指标

3. **人工审核**
   - 随机抽查10-20个产品
   - 验证数据准确性
   - 评估整体质量

4. **反馈结果**
   - ✅ 通过：数据导入数据库，任务完成
   - ⚠️ 需要修改：指出具体问题，要求修正
   - ❌ 不通过：说明原因，重新爬取

---

## 📞 联系方式

如有任何问题或需要澄清，请随时联系：

**项目负责人**: ROWELL网站总工程师  
**沟通方式**: 通过任务对话窗口  
**响应时间**: 工作时间内1小时内回复

---

## 📈 项目进度

### 当前进度
**已完成品牌**: 4/12 (33.3%)
- ✅ Agilent: 630个产品
- ✅ Thermo Fisher Scientific: 366个产品
- ✅ Daicel: 263个产品
- ✅ Waters: 106个产品

**已完成产品**: 1,365/2,689 (50.8%) 🎉

### 剩余品牌
**待完成**: 8个品牌
- 🔄 **Phenomenex: 247个产品**（当前任务）
- ⏳ Restek: 215个产品
- ⏳ Merck: 199个产品
- ⏳ ACE: 151个产品
- ⏳ Shimadzu: 130个产品
- ⏳ Develosil: 118个产品
- ⏳ Avantor: 83个产品
- ⏳ Thermo Fisher: 3个产品

**预计完成时间**: 完成Phenomenex后，剩余7个品牌预计需要2-3个工作日。

---

## 🎯 成功标准总结

**任务成功的关键**:

1. ✅ 成功率 ≥ 90%（至少222个产品）
2. ✅ 所有产品都有name和partNumber
3. ✅ 至少70%的产品有description
4. ✅ 至少90%的产品有≥3个规格字段
5. ✅ CSV文件格式正确，可正常导入
6. ✅ 数据准确性：随机抽查10个产品，至少9个正确

**期望达到的优秀标准**:

1. 🌟 成功率 ≥ 95%
2. 🌟 描述覆盖率 ≥ 80%
3. 🌟 A/B级描述占比 ≥ 40%
4. 🌟 平均规格字段数 ≥ 15个
5. 🌟 图片覆盖率 ≥ 70%

---

**祝爬取顺利！期待收到高质量的Phenomenex产品数据！** 🚀

---

**最后更新**: 2025-11-08  
**版本**: v1.0
