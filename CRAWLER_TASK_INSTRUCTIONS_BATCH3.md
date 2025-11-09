# 🎯 爬虫任务指令 - 批次3

**任务编号**: ROWELL-BATCH-003  
**发布日期**: 2025-11-09  
**目标品牌**: Phenomenex, Restek, Merck, Shimadzu  
**总产品数**: 791个  
**优先级**: 🔥 高  
**预计完成时间**: 2-3周

---

## 📋 任务概述

本批次任务是ROWELL爬虫项目的第三阶段，目标是完成4个高优先级品牌的产品数据爬取。这些品牌在数据库中已有基础数据，但缺少完整的描述、规格和图片信息。通过本次爬取，将显著提升数据完整性，从当前的57.4%提升到86.8%。

### 任务目标

本批次爬取任务旨在为ROWELL HPLC色谱柱产品网站补充4个主流品牌的完整产品数据，包括详细描述、技术规格、产品图片和目录链接。这些数据将直接用于网站展示，帮助用户更好地了解和选择产品，同时提升网站的SEO价值和用户体验。

### 成功标准

- **数据完整性**: 每个产品至少包含名称、描述、5个以上规格字段
- **描述质量**: 80%以上产品达到Medium或High级描述
- **成功率**: 整体成功率≥85%
- **数据准确性**: 抽查验证准确率≥95%

---

## 🎯 品牌任务详情

### 任务1: Phenomenex（247个产品）

**品牌信息**:
- **官网**: https://www.phenomenex.com
- **产品线**: HPLC色谱柱、GC色谱柱、SPE柱
- **特点**: 高端色谱柱品牌，技术文档完善

**当前数据状态**:
- 总产品数: 247个
- 描述覆盖: 65.2%（161/247）
- 规格覆盖: 100%（247/247）✅
- 图片覆盖: 17.0%（42/247）
- 目录URL: 100%（247/247）✅

**爬取目标**:
- ✅ 补充86个产品的描述（目标100%覆盖）
- ✅ 补充205个产品的图片（目标100%覆盖）
- ✅ 验证并更新现有规格数据
- ✅ 确保所有目录URL有效

**技术要点**:
- **URL模式**: 产品页面URL规范，易于构建
- **数据结构**: 使用结构化数据标记，提取容易
- **反爬虫**: 中等难度，建议使用浏览器自动化
- **图片**: 高质量产品图片，需要下载URL

**数据要求**:
- **描述**: 至少100字，包含产品特点和应用
- **规格字段**: 至少10个（粒径、孔径、长度、内径、pH范围、最大压力、固定相等）
- **图片**: 产品主图URL，分辨率≥800x800px
- **目录URL**: 官网产品详情页链接

**预计时间**: 8-12小时  
**优先级**: 🔥🔥🔥🔥🔥 最高

---

### 任务2: Restek（215个产品）

**品牌信息**:
- **官网**: https://www.restek.com
- **产品线**: GC色谱柱、HPLC色谱柱、样品前处理
- **特点**: GC色谱柱专家，技术支持强

**当前数据状态**:
- 总产品数: 215个
- 描述覆盖: 28.8%（62/215）
- 规格覆盖: 0%（0/215）❌
- 图片覆盖: 0%（0/215）❌
- 目录URL: 0%（0/215）❌

**爬取目标**:
- ✅ 补充153个产品的描述（目标100%覆盖）
- ✅ 爬取所有产品的规格数据（目标100%覆盖）
- ✅ 爬取所有产品的图片（目标90%+覆盖）
- ✅ 获取所有产品的目录URL（目标95%+覆盖）

**技术要点**:
- **URL模式**: 需要通过产品名称或Part Number搜索
- **数据结构**: 可能需要解析表格或列表
- **反爬虫**: 中等难度，建议分批爬取
- **图片**: 可能有多张产品图片，选择主图

**数据要求**:
- **描述**: 至少80字，重点突出GC/HPLC应用
- **规格字段**: 至少8个（对于GC柱，包括膜厚、温度范围等）
- **图片**: 产品主图URL
- **目录URL**: 官网产品详情页链接

**预计时间**: 8-12小时  
**优先级**: 🔥🔥🔥🔥 高

---

### 任务3: Merck（199个产品）

**品牌信息**:
- **官网**: https://www.sigmaaldrich.com 或 https://www.merckmillipore.com
- **产品线**: HPLC色谱柱、试剂、实验室耗材
- **特点**: 全球化工巨头，产品线广泛

**当前数据状态**:
- 总产品数: 199个
- 描述覆盖: 15.1%（30/199）
- 规格覆盖: 0%（0/199）❌
- 图片覆盖: 0%（0/199）❌
- 目录URL: 0%（0/199）❌

**爬取目标**:
- ✅ 补充169个产品的描述（目标100%覆盖）
- ✅ 爬取所有产品的规格数据（目标100%覆盖）
- ✅ 爬取所有产品的图片（目标90%+覆盖）
- ✅ 获取所有产品的目录URL（目标95%+覆盖）

**技术要点**:
- **URL模式**: Sigma-Aldrich网站结构复杂，需要仔细分析
- **数据结构**: 可能有多个数据源（Sigma-Aldrich, Merck Millipore）
- **反爬虫**: 较高难度，建议使用浏览器自动化 + 延迟
- **图片**: 高质量产品图片

**数据要求**:
- **描述**: 至少100字，包含产品特性和典型应用
- **规格字段**: 至少10个
- **图片**: 产品主图URL
- **目录URL**: 官网产品详情页链接

**特别注意**:
- Merck可能有多个品牌（Supelco, LiChrosorb等），需要统一为"Merck"
- 产品编号格式可能不统一，需要标准化

**预计时间**: 8-12小时  
**优先级**: 🔥🔥🔥🔥 高

---

### 任务4: Shimadzu（130个产品）

**品牌信息**:
- **官网**: https://www.shimadzu.com 或 https://www.shimadzu.com.cn
- **产品线**: HPLC色谱柱、HPLC仪器、分析仪器
- **特点**: 日本品牌，技术先进

**当前数据状态**:
- 总产品数: 130个
- 描述覆盖: 18.5%（24/130）
- 规格覆盖: 0%（0/130）❌
- 图片覆盖: 0%（0/130）❌
- 目录URL: 0%（0/130）❌

**爬取目标**:
- ✅ 补充106个产品的描述（目标100%覆盖）
- ✅ 爬取所有产品的规格数据（目标90%+覆盖）
- ✅ 爬取所有产品的图片（目标80%+覆盖）
- ✅ 获取所有产品的目录URL（目标90%+覆盖）

**技术要点**:
- **URL模式**: 可能需要访问中文或英文网站
- **数据结构**: 日本网站结构可能不同
- **反爬虫**: 中等难度
- **语言**: 优先爬取英文数据，如无则使用中文

**数据要求**:
- **描述**: 至少80字，英文优先
- **规格字段**: 至少8个
- **图片**: 产品主图URL
- **目录URL**: 官网产品详情页链接

**特别注意**:
- 如果英文网站数据不全，可以爬取中文网站并翻译
- 注意日文字符的处理

**预计时间**: 6-9小时  
**优先级**: 🔥🔥🔥 中高

---

## 📊 数据格式规范

### CSV文件格式

所有爬取结果必须保存为CSV文件，使用以下字段：

```csv
productId,partNumber,brand,name,description,descriptionQuality,specifications,imageUrl,catalogUrl,status
```

### 字段说明

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `productId` | String | ✅ | 产品唯一ID，格式：`{品牌缩写}-{Part Number}` | `PHEN-00H-4601-E0` |
| `partNumber` | String | ✅ | 制造商零件号 | `00H-4601-E0` |
| `brand` | String | ✅ | 品牌名称（标准化） | `Phenomenex` |
| `name` | String | ✅ | 产品名称 | `Luna® 5 μm C18(2) 100 Å, LC Column 250 x 4.6 mm` |
| `description` | String | ✅ | 产品描述（100-500字） | `Luna C18(2) columns are based on...` |
| `descriptionQuality` | Enum | ✅ | 描述质量等级：`low`, `medium`, `high` | `high` |
| `specifications` | JSON | ✅ | 规格参数（JSON格式） | `{"Particle Size": "5 μm", "Pore Size": "100 Å", ...}` |
| `imageUrl` | String | ⚠️ | 产品图片URL | `https://www.phenomenex.com/...` |
| `catalogUrl` | String | ⚠️ | 产品目录页URL | `https://www.phenomenex.com/product/...` |
| `status` | Enum | ✅ | 爬取状态：`success`, `failed`, `not_found` | `success` |

### 描述质量等级定义

- **High**: 150字以上，包含产品特点、应用、技术优势
- **Medium**: 80-150字，包含基本产品信息和主要特点
- **Low**: 少于80字，仅有简单描述

### 规格字段要求

规格数据必须以JSON格式存储，包含但不限于以下字段：

**HPLC色谱柱必需字段**:
- `Particle Size` (粒径)
- `Pore Size` (孔径)
- `Length` (长度)
- `Inner Diameter` (内径)
- `Stationary Phase` (固定相)
- `pH Range` (pH范围)
- `Max Pressure` (最大压力)

**GC色谱柱必需字段**:
- `Film Thickness` (膜厚)
- `Length` (长度)
- `Inner Diameter` (内径)
- `Stationary Phase` (固定相)
- `Temperature Range` (温度范围)

**其他推荐字段**:
- `Product Line` (产品系列)
- `USP Type` (USP分类)
- `Endcapped` (封端)
- `Carbon Load` (碳载量)
- `Surface Area` (比表面积)

---

## 🛠️ 技术规范

### 爬虫工具推荐

基于前两个批次的成功经验，推荐使用以下技术栈：

**Python环境**:
- Python 3.11+
- Selenium WebDriver（浏览器自动化）
- BeautifulSoup4（HTML解析）
- Pandas（数据处理）
- Requests（HTTP请求）

**浏览器**:
- Chrome/Chromium（无头模式）
- 建议使用最新稳定版

### 爬取策略

#### 策略1：直接HTTP请求（优先）

适用于网站结构简单、无复杂JavaScript渲染的情况。

**优势**:
- 速度快（约3-5秒/产品）
- 资源消耗低
- 易于调试

**实施**:
```python
import requests
from bs4 import BeautifulSoup

url = f"https://example.com/product/{part_number}"
response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.content, 'html.parser')
```

#### 策略2：浏览器自动化（备选）

适用于有反爬虫机制、动态内容加载的网站。

**优势**:
- 绕过反爬虫
- 支持JavaScript渲染
- 模拟真实用户行为

**实施**:
```python
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument('--headless')
driver = webdriver.Chrome(options=options)
driver.get(url)
```

#### 策略3：搜索匹配（特殊情况）

适用于无法直接构建产品URL的情况（参考Waters批次经验）。

**实施**:
1. 在官网搜索框输入Part Number
2. 匹配搜索结果
3. 访问匹配的产品页面

### 分批执行建议

为降低风险和便于调试，建议分批执行：

- **小批量测试**: 先爬取5-10个产品，验证逻辑
- **中批量验证**: 爬取50个产品，检查数据质量
- **全量爬取**: 分批次爬取全部产品（每批50-100个）

### 错误处理

必须实现完善的错误处理机制：

```python
try:
    # 爬取逻辑
    product_data = scrape_product(url)
    status = 'success'
except requests.exceptions.HTTPError as e:
    status = 'failed'
    error_message = str(e)
except Exception as e:
    status = 'failed'
    error_message = str(e)
```

### 延迟和速率限制

为避免被封禁，必须设置合理的延迟：

- **请求间隔**: 2-5秒（随机）
- **批次间隔**: 每50个产品休息30-60秒
- **失败重试**: 最多3次，指数退避

---

## ✅ 质量控制

### 数据验证清单

每个产品数据必须通过以下验证：

- [ ] **productId格式正确**: `{品牌缩写}-{Part Number}`
- [ ] **partNumber非空**: 不能为空字符串
- [ ] **brand标准化**: 使用统一的品牌名称
- [ ] **name非空**: 产品名称完整
- [ ] **description长度**: ≥80字符（Medium级以上）
- [ ] **specifications格式**: 有效的JSON格式
- [ ] **specifications字段数**: ≥5个字段
- [ ] **imageUrl有效**: URL可访问（HTTP 200）
- [ ] **catalogUrl有效**: URL可访问（HTTP 200）
- [ ] **status正确**: 只能是`success`, `failed`, `not_found`

### 质量分级标准

根据数据完整性对每个产品进行质量分级：

| 等级 | 标准 | 描述覆盖 | 规格字段 | 图片 | URL |
|------|------|---------|---------|------|-----|
| ⭐⭐⭐⭐⭐ | 完美 | High | ≥10个 | ✅ | ✅ |
| ⭐⭐⭐⭐ | 优秀 | Medium+ | ≥8个 | ✅ | ✅ |
| ⭐⭐⭐ | 良好 | Medium | ≥5个 | ⚠️ | ✅ |
| ⭐⭐ | 及格 | Low+ | ≥3个 | ❌ | ⚠️ |
| ⭐ | 不及格 | 无 | <3个 | ❌ | ❌ |

**目标**: 80%以上产品达到⭐⭐⭐或以上

### 抽查验证

完成爬取后，必须进行抽查验证：

1. **随机抽取**: 每个品牌随机抽取10-20个产品
2. **人工验证**: 访问官网对比数据准确性
3. **字段检查**: 验证规格字段的准确性
4. **URL测试**: 测试图片和目录URL的有效性

**准确率要求**: ≥95%

---

## 📦 交付要求

### 文件清单

每个品牌必须提交以下文件：

1. **数据文件**: `{brand_name}_results.csv`
   - 示例: `phenomenex_results.csv`
   - 格式: UTF-8编码的CSV文件
   - 包含所有爬取结果（成功+失败）

2. **质量报告**: `{brand_name}_quality_report.md`
   - 爬取统计（总数、成功数、失败数、成功率）
   - 数据质量分析（描述覆盖率、规格完整性等）
   - 问题和挑战
   - 解决方案
   - 抽查验证结果

3. **导入报告**: `import_report_{brand_name}_{timestamp}.json`
   - 由导入脚本自动生成
   - 记录导入过程和结果

### 提交方式

所有文件打包为ZIP文件，命名格式：

```
ROWELL_BATCH3_{brand_name}_{date}.zip
```

示例：
```
ROWELL_BATCH3_Phenomenex_20251115.zip
ROWELL_BATCH3_Restek_20251118.zip
ROWELL_BATCH3_Merck_20251120.zip
ROWELL_BATCH3_Shimadzu_20251122.zip
```

### 交付时间表

| 品牌 | 预计开始 | 预计完成 | 交付日期 |
|------|---------|---------|---------|
| Phenomenex | Week 1 Day 1 | Week 1 Day 2-3 | Week 1 End |
| Restek | Week 1 Day 4 | Week 2 Day 2 | Week 2 Day 3 |
| Merck | Week 2 Day 3 | Week 2 Day 5 | Week 2 End |
| Shimadzu | Week 3 Day 1 | Week 3 Day 3 | Week 3 Day 4 |

**最终交付**: Week 3 End（所有品牌完成）

---

## 🎯 成功标准

### 批次成功标准

本批次任务被认为成功完成，需满足以下条件：

1. **数据覆盖率**: ≥85%产品成功爬取
2. **数据质量**: ≥80%产品达到⭐⭐⭐或以上
3. **描述覆盖**: ≥90%产品有描述（Medium级以上）
4. **规格完整性**: ≥85%产品有5个以上规格字段
5. **准确性**: 抽查验证准确率≥95%
6. **按时交付**: 所有品牌在预定时间内完成

### 品牌成功标准

每个品牌单独评估，成功标准：

| 品牌 | 最低成功率 | 最低质量等级 | 描述覆盖 | 规格字段 |
|------|-----------|-------------|---------|---------|
| Phenomenex | ≥90% | ⭐⭐⭐⭐ | ≥95% | ≥10个 |
| Restek | ≥85% | ⭐⭐⭐ | ≥90% | ≥8个 |
| Merck | ≥85% | ⭐⭐⭐ | ≥90% | ≥8个 |
| Shimadzu | ≥80% | ⭐⭐⭐ | ≥85% | ≥6个 |

---

## 📞 支持和沟通

### 问题上报

遇到以下情况请立即上报：

- **技术障碍**: 反爬虫机制无法绕过
- **数据问题**: 官网数据缺失或格式异常
- **时间延误**: 预计无法按时完成
- **质量问题**: 数据准确性存疑

### 沟通渠道

- **项目负责人**: 网站建设总工程师（Manus AI Agent）
- **上报方式**: 通过任务管理系统提交问题报告
- **响应时间**: 24小时内响应

### 进度报告

每完成一个品牌，提交进度报告，包括：

1. 完成情况（成功数、失败数）
2. 数据质量评估
3. 遇到的问题和解决方案
4. 下一个品牌的准备情况

---

## 📚 参考资料

### 前期批次经验

**批次1（Agilent + Waters）**:
- Agilent: 98%成功率，浏览器自动化有效
- Waters: 39.3%成功率（清单包含非色谱柱产品），搜索匹配策略有效

**批次2（Thermo Fisher + Daicel）**:
- Thermo Fisher: 100%成功率，直接HTTP请求高效
- Daicel: 100%成功率，网站结构简单

### 技术文档

- [Selenium官方文档](https://www.selenium.dev/documentation/)
- [BeautifulSoup文档](https://www.crummy.com/software/BeautifulSoup/bs4/doc/)
- [Pandas CSV处理](https://pandas.pydata.org/docs/reference/api/pandas.read_csv.html)

### 项目文档

- `CRAWLER_PROJECT_COMPLETION_REPORT.md` - 前期批次完成报告
- `import-crawler-batch.mjs` - 数据导入脚本
- `REMAINING_PRODUCTS_PROCESSING_PLAN.md` - 剩余产品处理方案

---

## ✅ 任务确认

请爬虫团队确认以下事项：

- [ ] 已理解所有4个品牌的爬取要求
- [ ] 已了解数据格式规范和质量标准
- [ ] 已准备好技术环境（Python, Selenium等）
- [ ] 已制定详细的执行计划
- [ ] 已了解交付要求和时间表
- [ ] 已知晓沟通渠道和上报流程

**确认方式**: 回复"任务已确认，预计{日期}开始执行"

---

## 🎉 激励和期望

本批次任务是ROWELL爬虫项目的关键阶段，成功完成将使数据库覆盖率从57.4%提升到86.8%，显著提升网站价值。期待爬虫团队继续发挥专业能力，保持高质量标准，按时交付优秀成果。

**项目愿景**: 建立业界最全面的HPLC色谱柱产品数据库，为用户提供最佳的产品选择体验。

**团队口号**: 高质量、高效率、高标准！

---

**任务发布人**: 网站建设总工程师（Manus AI Agent）  
**发布日期**: 2025-11-09  
**任务状态**: 🟢 待执行  
**预计完成**: 2025-11-30

---

**附录**: 品牌官网快速链接

- [Phenomenex官网](https://www.phenomenex.com)
- [Restek官网](https://www.restek.com)
- [Merck/Sigma-Aldrich官网](https://www.sigmaaldrich.com)
- [Shimadzu官网](https://www.shimadzu.com)
