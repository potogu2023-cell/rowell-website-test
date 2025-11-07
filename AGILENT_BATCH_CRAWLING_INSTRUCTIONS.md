# Agilent品牌批量爬取任务指令

**任务编号**: ROWELL-CRAWLER-AGILENT-BATCH-001  
**发布日期**: 2025-11-05  
**优先级**: 🔴 高优先级  
**预计时间**: 2-3小时

---

## 📋 任务概述

### 任务目标

完成Agilent品牌全部**630个产品**的数据采集，建立高质量的产品数据库。

### 执行策略

采用**两阶段执行策略**：
1. **阶段1**：小批量测试（50-100个产品，3-5分钟）
2. **阶段2**：全量爬取（630个产品，45-60分钟）

### 为什么采用两阶段？

✅ **降低风险**：先测试验证，避免大规模错误  
✅ **快速反馈**：15分钟内就能知道是否需要调整  
✅ **节省时间**：如果测试通过，直接进入全量爬取  
✅ **灵活调整**：根据测试结果优化策略

---

## 🎯 阶段1：小批量测试（50-100个产品）

### 目标

验证批量爬取的稳定性和数据质量，确保可以安全进入全量爬取。

### 执行步骤

#### Step 1: 准备测试产品清单

**方式A：随机抽取**（推荐）
```bash
# 从630个产品中随机抽取50个
python batch_crawl_helper.py --brand agilent --limit 50 --random --output test_50_results.csv
```

**方式B：按类型抽取**（可选）
- 色谱柱：20个
- 样品瓶：15个
- 其他耗材：15个

#### Step 2: 执行爬取

**预计时间**: 3-5分钟

**执行命令**:
```bash
python batch_crawl_helper.py \
  --brand agilent \
  --limit 50 \
  --output test_50_results.csv \
  --log-file test_50.log \
  --report-file test_50_report.md
```

**监控要点**:
- ✅ 爬取速度是否稳定
- ✅ 错误率是否可接受
- ✅ 数据质量是否达标

#### Step 3: 生成测试报告

**报告内容**:
```markdown
# Agilent小批量测试报告

## 基本信息
- 测试产品数: 50个
- 成功数量: XX个
- 失败数量: XX个
- 成功率: XX%

## 数据质量
- 产品名称完整性: XX%
- 规格完整性: XX%
- 描述覆盖率: XX%
- A/B级描述占比: XX%

## 问题列表
1. [问题类型] 问题描述
2. ...

## 建议
- 是否继续全量爬取：是/否
- 需要调整的地方：...
```

#### Step 4: 决策评审

**决策标准**:

| 成功率 | 决策 | 行动 |
|--------|------|------|
| ≥95% | ✅ 继续全量爬取 | 直接进入阶段2 |
| 90-95% | ⚠️ 小幅调整 | 优化后进入阶段2 |
| 80-90% | ⚠️ 重大调整 | 修复问题后重新测试 |
| <80% | ❌ 暂停评估 | 深入分析问题，重新规划 |

**预计决策时间**: 5-10分钟

---

## 🚀 阶段2：全量爬取（630个产品）

### 前提条件

✅ 阶段1测试通过（成功率≥90%）  
✅ 数据质量达标  
✅ 无重大技术问题

### 执行步骤

#### Step 1: 准备全量爬取

**检查清单**:
- [x] 产品清单文件已准备（630个产品）
- [x] 爬虫程序运行正常
- [x] 日志和报告目录已创建
- [x] 网络连接稳定

#### Step 2: 执行全量爬取

**预计时间**: 45-60分钟

**执行命令**:
```bash
python batch_crawl_helper.py \
  --brand agilent \
  --input /path/to/product_list_for_crawler_2025-11-05.csv \
  --output agilent_full_results.csv \
  --log-file agilent_full.log \
  --report-file agilent_full_report.md \
  --delay 1.0 \
  --retry 3
```

**参数说明**:
- `--input`: 产品清单CSV文件（630个Agilent产品）
- `--output`: 爬取结果CSV文件
- `--log-file`: 日志文件
- `--report-file`: 报告文件
- `--delay`: 每个请求之间的延迟（秒）
- `--retry`: 失败重试次数

**监控要点**:
- ✅ 每完成100个产品，检查一次质量
- ✅ 如果连续失败>10个，暂停检查
- ✅ 记录所有错误和警告

#### Step 3: 生成完整报告

**报告内容**:
```markdown
# Agilent全量爬取报告

## 执行信息
- 开始时间: YYYY-MM-DD HH:MM:SS
- 结束时间: YYYY-MM-DD HH:MM:SS
- 总耗时: XX分钟

## 爬取统计
- 目标产品数: 630个
- 成功数量: XXX个
- 失败数量: XXX个
- 成功率: XX.X%

## 数据质量
- 产品名称完整性: XX.X%
- 规格完整性: XX.X%
- 描述覆盖率: XX.X%
- A/B级描述占比: XX.X%

## 描述质量分布
- A级 (high): XXX个 (XX.X%)
- B级 (medium): XXX个 (XX.X%)
- C级 (low): XXX个 (XX.X%)
- D级 (extracted): XXX个 (XX.X%)
- N/A (none): XXX个 (XX.X%)

## 失败产品列表
| productId | partNumber | 错误原因 |
|-----------|-----------|---------|
| AGIL-XXXXX | XXXXX | ... |

## 建议
- 数据质量评价：优秀/良好/合格/不合格
- 是否需要重新爬取：是/否
- 需要人工复核的产品：XXX个
```

#### Step 4: 交付成果

**交付文件**:
1. ✅ `agilent_full_results.csv` - 爬取结果（630个产品）
2. ✅ `agilent_full_report.md` - 详细报告
3. ✅ `agilent_full.log` - 完整日志
4. ✅ `agilent_failed_products.csv` - 失败产品清单（如有）

---

## 📊 数据格式要求

### CSV文件格式

**必需字段**:

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| productId | String | 产品ID | AGIL-000001 |
| partNumber | String | 原厂零件号 | 5067-0226 |
| brand | String | 品牌名称 | Agilent |
| name | String | 完整产品名称 | Screw Thread Vial, 2 mL, clear glass... |
| description | String | 产品描述 | Vial size: 22.75 x 75 mm (20 mm cap) |
| specifications | JSON | 技术规格 | {"Capacity": "2 mL", "Material": "Glass"} |
| descriptionQuality | String | 描述质量等级 | high/medium/low/extracted/none |

**可选字段**:

| 字段名 | 类型 | 说明 |
|--------|------|------|
| imageUrl | String | 产品图片URL |
| catalogUrl | String | 产品目录页URL |
| technicalDocUrl | String | 技术文档URL |
| detailedDescription | String | 详细描述 |

### 字段详细说明

#### 1. productId
- **格式**: `AGIL-` + 6位数字
- **示例**: `AGIL-000001`, `AGIL-123456`
- **来源**: 从产品清单CSV中读取
- **要求**: 必须与产品清单中的productId完全一致

#### 2. partNumber
- **格式**: 原厂零件号（保持原样）
- **示例**: `5067-0226`, `121-1012`, `0890-1762`
- **来源**: 从产品清单CSV中读取
- **要求**: 必须与产品清单中的partNumber完全一致

#### 3. brand
- **格式**: 固定值 `Agilent`
- **要求**: 所有产品都是Agilent品牌

#### 4. name
- **要求**: 
  - ✅ 完整的产品名称，无截断
  - ✅ 包含所有关键信息（型号、规格、尺寸等）
  - ✅ 保持原厂命名格式
- **示例**: 
  - ✅ 好: `J&W DB-1 GC Column, 10 m, 0.18 mm, 0.18 µm, 7 inch cage`
  - ❌ 差: `J&W DB-1 GC Column...`（截断）

#### 5. description
- **要求**:
  - ✅ 尽量获取详细描述（≥100字符为优秀）
  - ✅ 如果无详细描述，提取关键信息（≥20字符为合格）
  - ✅ 描述应该有实际内容，不要只是重复产品名称
- **示例**:
  - ✅ A级: `This is the most common GC column format compatible with Agilent 5890, 6890, 7820, 7890, 8860, and 8890 series GC systems and all non-Agilent GC systems with a similarly sized oven.` (181字符)
  - ✅ C级: `Vial size: 22.75 x 75 mm (20 mm cap)` (42字符)
  - ✅ D级: `Laboratory supply with Material: Stainless Steel.` (49字符)
  - ❌ 差: `Agilent product` (太短，无实际信息)

#### 6. specifications
- **格式**: JSON对象（字符串）
- **要求**:
  - ✅ 有效的JSON格式
  - ✅ 至少包含3个字段
  - ✅ 字段名和值都要有意义
  - ✅ 优先提取技术参数（尺寸、材质、容量、温度范围等）
- **示例**:
```json
{
  "Capacity": "2 mL",
  "Material": "Clear Glass",
  "Dimensions": "22.75 x 75 mm",
  "Cap Size": "20 mm",
  "Package Quantity": "100",
  "Certification": "USP Type I",
  "Temperature Range": "-40°C to 200°C",
  "Closure Type": "Screw Thread",
  "Septa Material": "PTFE/Silicone",
  "Application": "HPLC, GC",
  "Part Number": "5067-0226"
}
```

#### 7. descriptionQuality
- **格式**: 枚举值
- **可选值**:
  - `high`: 描述≥100字符，内容详细
  - `medium`: 描述50-99字符，内容良好
  - `low`: 描述20-49字符，内容简短
  - `extracted`: 描述<20字符，或从其他字段提取
  - `none`: 无描述
- **要求**: 根据description字段的长度和质量自动判断

### CSV文件示例

```csv
productId,partNumber,brand,name,description,specifications,descriptionQuality,imageUrl,catalogUrl
AGIL-000001,5067-0226,Agilent,"Screw Thread Vial, 2 mL, clear glass, write-on spot, 100/pk","Vial size: 22.75 x 75 mm (20 mm cap). Ideal for HPLC and GC applications.","{""Capacity"": ""2 mL"", ""Material"": ""Clear Glass"", ""Dimensions"": ""22.75 x 75 mm"", ""Cap Size"": ""20 mm"", ""Package Quantity"": ""100""}",low,https://example.com/image.jpg,https://example.com/product
AGIL-000002,121-1012,Agilent,"J&W DB-1 GC Column, 10 m, 0.18 mm, 0.18 µm, 7 inch cage","This is the most common GC column format compatible with Agilent 5890, 6890, 7820, 7890, 8860, and 8890 series GC systems and all non-Agilent GC systems with a similarly sized oven.","{""Length"": ""10 m"", ""Inner Diameter"": ""0.18 mm"", ""Film Thickness"": ""0.18 µm"", ""Format"": ""7 inch"", ""Phase"": ""DB-1"", ""Polarity"": ""Low Polarity"", ""Temperature Range"": ""-60°C-325/350°C""}",high,https://example.com/image2.jpg,https://example.com/product2
```

---

## ✅ 质量验收标准

### 必达标准（不达标需要重新爬取）

| 指标 | 目标 | 说明 |
|------|------|------|
| 成功率 | ≥90% | 至少567个产品成功爬取 |
| 产品名称完整性 | 100% | 所有产品名称完整无截断 |
| 规格完整性 | ≥90% | 至少567个产品有≥3个规格字段 |

### 优秀标准（达到则质量优秀）

| 指标 | 目标 | 说明 |
|------|------|------|
| 成功率 | ≥95% | 至少599个产品成功爬取 |
| 描述覆盖率 | ≥70% | 至少441个产品有描述 |
| A/B级描述占比 | ≥30% | 至少189个产品有高质量描述 |
| 规格字段数 | 平均≥5个 | 规格信息丰富 |

### 验收流程

1. **ROWELL团队接收文件**
   - 检查文件完整性
   - 验证CSV格式

2. **数据质量验证**
   - 运行自动验证脚本
   - 生成质量报告

3. **验收决策**
   - ✅ 达到必达标准 → 接受交付
   - ⚠️ 部分不达标 → 要求修复
   - ❌ 严重不达标 → 要求重新爬取

---

## 🛠️ 技术要求

### 爬取规范

1. **速度控制**
   - 每个请求之间延迟1-2秒
   - 避免对目标网站造成压力

2. **错误处理**
   - 网络错误：重试3次
   - 解析错误：记录日志，跳过该产品
   - 超时错误：增加延迟后重试

3. **日志记录**
   - 记录每个产品的爬取状态
   - 记录所有错误和警告
   - 记录爬取时间和性能指标

4. **数据验证**
   - 爬取后立即验证数据格式
   - 检查必需字段是否完整
   - 验证JSON格式是否正确

### 合规要求

1. **遵守robots.txt**
   - 检查目标网站的robots.txt
   - 遵守爬取规则

2. **尊重版权**
   - 仅爬取公开产品信息
   - 不爬取受保护的内容

3. **数据使用**
   - 数据仅用于ROWELL网站产品展示
   - 不用于其他商业用途

---

## 📞 沟通机制

### 进度汇报

**阶段1（测试）**:
- 完成后立即汇报测试结果
- 提供测试报告和建议

**阶段2（全量）**:
- 每完成200个产品汇报一次进度
- 遇到问题立即沟通

### 汇报内容

```
进度汇报 - Agilent批量爬取

已完成: XXX/630个产品
成功率: XX.X%
当前状态: 正常/异常
预计完成时间: XX:XX

问题（如有）:
1. ...
2. ...
```

### 问题升级

| 问题严重程度 | 响应时间 | 处理方式 |
|------------|---------|---------|
| 一般问题 | 完成后汇报 | 自行解决 |
| 重要问题 | 立即通知 | 共同讨论 |
| 严重问题 | 立即暂停 | 紧急会议 |

---

## 📋 执行检查清单

### 开始前检查

- [x] 已阅读并理解任务指令
- [x] 已准备产品清单文件（630个产品）
- [x] 已测试爬虫程序可用
- [x] 已创建输出和日志目录
- [x] 网络连接稳定

### 阶段1检查

- [ ] 已完成50-100个产品测试
- [ ] 已生成测试报告
- [ ] 测试成功率≥90%
- [ ] 数据质量达标
- [ ] 已获得继续全量爬取的批准

### 阶段2检查

- [ ] 已完成630个产品爬取
- [ ] 已生成完整报告
- [ ] 成功率≥90%
- [ ] 数据质量达标
- [ ] 已交付所有文件

### 交付前检查

- [ ] CSV文件格式正确
- [ ] 所有必需字段完整
- [ ] JSON格式验证通过
- [ ] 报告内容详细
- [ ] 日志文件完整

---

## 🎯 成功标准

### 技术成功

- ✅ 630个产品数据采集完成
- ✅ 成功率≥90%
- ✅ 数据质量达到验收标准
- ✅ 无重大技术问题

### 业务成功

- ✅ 数据可以成功导入数据库
- ✅ 网站产品展示正常
- ✅ 为后续品牌爬取建立标准流程
- ✅ 客户满意度高

---

## 📄 附录

### A. 产品清单文件

**文件位置**: 已随本指令一起提供

**文件名**: `product_list_for_crawler_2025-11-05.csv`

**Agilent产品数**: 630个

**文件格式**:
```csv
productId,partNumber,brand,name
AGIL-000001,000001,Agilent,Product Name 1
AGIL-000002,000002,Agilent,Product Name 2
...
```

### B. 参考文档

1. **爬虫任务指令V2.0**: `CRAWLER_TEXT_INFO_INSTRUCTIONS.md`
2. **策略更新文档**: `STRATEGY_UPDATE_SUMMARY.md`
3. **交付验证报告**: `CRAWLER_DELIVERY_VERIFICATION_REPORT.md`
4. **批量爬取计划**: `AGILENT_BATCH_CRAWLING_PLAN.md`

### C. 联系方式

**ROWELL项目团队**:
- 通过任务系统沟通
- 紧急问题立即通知

---

## 🚀 开始执行

### 立即行动

1. ✅ 确认已收到本任务指令
2. ✅ 确认已收到产品清单文件（630个产品）
3. ✅ 开始阶段1：小批量测试（50-100个产品）

### 预期时间表

| 阶段 | 任务 | 预计时间 |
|------|------|---------|
| 阶段1 | 小批量测试 | 3-5分钟 |
| 阶段1 | 验证和决策 | 10-15分钟 |
| 阶段2 | 全量爬取 | 45-60分钟 |
| 阶段2 | 报告生成 | 5-10分钟 |
| **总计** | - | **1-1.5小时** |

---

**任务发布时间**: 2025-11-05  
**任务优先级**: 🔴 高优先级  
**期望完成时间**: 2-3小时内

**祝执行顺利！如有任何问题，请立即沟通。** 🚀
