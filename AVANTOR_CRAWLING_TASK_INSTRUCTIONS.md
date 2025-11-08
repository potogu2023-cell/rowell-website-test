# Avantor (ACE品牌) 爬取任务正式指令

**任务编号**：ROWELL-CRAWL-006  
**发布日期**：2025年11月8日  
**优先级**：⭐⭐⭐⭐⭐ 最高  
**预计工作量**：4-6小时  
**任务状态**：🟢 已批准，立即执行

---

## 📋 任务概述

### 任务目标
爬取Avantor® ACE®品牌的83个色谱柱产品的详细信息，包括产品描述、技术规格、应用场景等数据，并按照标准格式输出为JSON文件。

### 为什么选择Avantor？
基于深度技术分析和ROI评估，Avantor是剩余品牌中**唯一强烈推荐**的选择：

| 评估维度 | Avantor | Shimadzu | Develosil |
|---------|---------|----------|-----------|
| **数据质量** | HIGH ⭐⭐⭐⭐⭐ | MEDIUM ⭐⭐⭐ | LOW ⭐⭐ |
| **成功率** | 90-95% | 70-80% | 60-70% |
| **时间投入** | 4-6小时 | 7-10小时 | 11-17小时 |
| **ROI评级** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ |
| **推荐度** | ✅ 强烈推荐 | ⚠️ 可选 | ❌ 不推荐 |

**核心优势**：
- ✅ 数据质量最高（600+字符描述，13个规格字段）
- ✅ 成功率最高（90-95%）
- ✅ 时间投入最少（4-6小时）
- ✅ 与Waters、Agilent同级的高质量数据

---

## 🎯 质量标准

### 必达指标（KPI）

| 指标 | 目标值 | 说明 |
|------|--------|------|
| **成功率** | ≥90% | 至少75个产品成功爬取 |
| **描述覆盖率** | ≥95% | 至少72个产品有描述 |
| **A/B级描述** | ≥80% | 至少60个产品有高质量描述 |
| **规格字段数** | ≥10个/产品 | 平均每个产品至少10个规格字段 |
| **错误率** | ≤5% | 数据错误（格式、类型）不超过4个产品 |

### 数据质量分级

**A级描述**（目标：≥60%）：
- 字符数：≥500字符
- 包含：应用场景、技术特点、使用建议、产品优势
- 示例：详细的产品介绍，包含多个段落

**B级描述**（目标：≥20%）：
- 字符数：200-499字符
- 包含：基本产品介绍、主要特点
- 示例：简洁的产品描述，1-2个段落

**C级描述**（可接受：≤10%）：
- 字符数：100-199字符
- 包含：最基本的产品信息
- 示例：一句话产品描述

**D级描述**（不可接受：≤5%）：
- 字符数：<100字符
- 仅有产品名称或极简描述

---

## 🔧 技术实施方案

### 核心技术挑战：URL发现

**问题描述**：
Avantor产品URL包含内部ID，无法从Part Number直接推断。

**示例**：
- Part Number：`ACE-111-0546`
- 产品URL：`https://www.avantor.com/p/ace-5-c18-hplc-column-5-m-100-x-46-mm-ace-111-0546`
- 内部ID：`ace-5-c18-hplc-column-5-m-100-x-46-mm`（无法预测）

**解决方案：通过搜索功能发现URL**

#### 步骤1：访问搜索页面
```
URL模板：https://www.avantor.com/search?searchTerm={partNumber}
示例：https://www.avantor.com/search?searchTerm=ACE-111-0546
```

#### 步骤2：提取搜索结果中的产品链接
搜索结果页面HTML结构（预估）：
```html
<div class="search-results">
  <div class="product-item">
    <a href="/p/ace-5-c18-hplc-column-5-m-100-x-46-mm-ace-111-0546" class="product-link">
      <h3>ACE 5 C18 HPLC Column (5 µm, 100 x 4.6 mm)</h3>
    </a>
  </div>
</div>
```

**提取规则**：
- 选择器：`a.product-link` 或 `div.product-item a[href^="/p/"]`
- 提取属性：`href`
- 完整URL：`https://www.avantor.com` + `href`

#### 步骤3：访问产品详情页
```
完整URL：https://www.avantor.com/p/ace-5-c18-hplc-column-5-m-100-x-46-mm-ace-111-0546
```

---

### 数据提取规则

#### 1. 产品描述（description）

**提取位置**：产品详情页主要内容区域

**可能的HTML结构**：
```html
<!-- 方式1：专门的描述区域 -->
<div class="product-description">
  <p>ACE C18 is a high-quality reversed-phase column...</p>
  <p>The 5 µm particle size provides optimal resolution...</p>
</div>

<!-- 方式2：产品概述区域 -->
<div class="product-overview">
  <div class="description">
    <p>ACE C18 is a high-quality reversed-phase column...</p>
  </div>
</div>

<!-- 方式3：Tab结构 -->
<div id="description-tab" class="tab-content">
  <p>ACE C18 is a high-quality reversed-phase column...</p>
</div>
```

**提取策略**：
1. 优先提取：`.product-description`、`.description`、`#description-tab`
2. 备选提取：`div[class*="description"]`、`div[class*="overview"]`
3. 清洗规则：
   - 移除HTML标签，保留纯文本
   - 合并多个段落，用空格分隔
   - 移除多余空白字符
   - 限制长度：最多2000字符

**预期结果**：
```
"ACE C18 is a high-quality reversed-phase column offering excellent retention and selectivity for a wide range of compounds. The 5 µm particle size provides optimal resolution and efficiency for routine HPLC applications. Suitable for pharmaceutical, environmental, and food analysis. Features high carbon load (17%) and complete end-capping for superior peak shape and reproducibility."
```

---

#### 2. 技术规格（specifications）

**必需字段**（至少包含8个）：

| 字段名 | 英文字段名 | 提取规则 | 示例值 |
|--------|-----------|---------|--------|
| 粒径 | particleSize | 数字 + µm | "5 µm" |
| 孔径 | poreSize | 数字 + Å | "100 Å" |
| 柱长 | columnLength | 数字 + mm | "100 mm" |
| 内径 | innerDiameter | 数字 + mm | "4.6 mm" |
| pH范围 | phRange | 数字-数字 | "2.0-8.0" |
| 固定相 | stationaryPhase | 文本 | "C18" |
| 端基封尾 | endCapping | Yes/No | "Yes" |
| 碳载量 | carbonLoad | 数字 + % | "17%" |

**可选字段**（尽量提取）：

| 字段名 | 英文字段名 | 提取规则 | 示例值 |
|--------|-----------|---------|--------|
| 最大压力 | maxPressure | 数字 + bar | "400 bar" |
| 温度范围 | temperatureRange | 数字-数字 + °C | "5-60°C" |
| 应用领域 | application | 文本列表 | "Pharmaceutical, Environmental" |
| 系列名称 | series | 文本 | "ACE C18" |
| USP分类 | uspClassification | 文本 | "L1" |

**HTML结构示例**：
```html
<!-- 方式1：表格结构 -->
<table class="specifications">
  <tr>
    <td class="spec-label">Particle Size</td>
    <td class="spec-value">5 µm</td>
  </tr>
  <tr>
    <td class="spec-label">Pore Size</td>
    <td class="spec-value">100 Å</td>
  </tr>
</table>

<!-- 方式2：列表结构 -->
<ul class="spec-list">
  <li><strong>Particle Size:</strong> 5 µm</li>
  <li><strong>Pore Size:</strong> 100 Å</li>
</ul>

<!-- 方式3：键值对结构 -->
<div class="specifications">
  <div class="spec-item">
    <span class="label">Particle Size:</span>
    <span class="value">5 µm</span>
  </div>
</div>
```

**提取策略**：
1. 识别规格表格或列表区域
2. 提取所有键值对
3. 标准化字段名称（映射到英文字段名）
4. 验证数据格式（数字、单位、范围）

**JSON输出格式**：
```json
{
  "particleSize": "5 µm",
  "poreSize": "100 Å",
  "columnLength": "100 mm",
  "innerDiameter": "4.6 mm",
  "phRange": "2.0-8.0",
  "stationaryPhase": "C18",
  "endCapping": "Yes",
  "carbonLoad": "17%",
  "maxPressure": "400 bar",
  "temperatureRange": "5-60°C",
  "application": "Pharmaceutical, Environmental, Food",
  "series": "ACE C18",
  "uspClassification": "L1"
}
```

---

#### 3. 产品图片（imageUrl）

**提取位置**：产品详情页主图区域

**HTML结构示例**：
```html
<!-- 方式1：img标签 -->
<img src="https://www.avantor.com/images/products/ace-c18-column.jpg" 
     alt="ACE C18 HPLC Column" 
     class="product-image">

<!-- 方式2：背景图片 -->
<div class="product-image" 
     style="background-image: url('https://www.avantor.com/images/products/ace-c18-column.jpg')">
</div>

<!-- 方式3：data属性 -->
<div class="product-image" 
     data-image="https://www.avantor.com/images/products/ace-c18-column.jpg">
</div>
```

**提取策略**：
1. 优先提取：`img.product-image`、`img[alt*="product"]`
2. 备选提取：`div.product-image` 的 `background-image` 或 `data-image`
3. 验证URL：必须是完整的HTTP/HTTPS URL
4. 如果找不到图片，设置为空字符串 `""`

---

#### 4. 产品目录链接（catalogUrl）

**提取位置**：产品详情页下载区域

**可能的文本标识**：
- "Download Catalog"
- "Product Catalog"
- "Technical Data Sheet"
- "Product Information"

**HTML结构示例**：
```html
<a href="https://www.avantor.com/documents/ace-c18-catalog.pdf" 
   class="download-link">
  Download Catalog
</a>
```

**提取策略**：
1. 查找包含 "catalog"、"datasheet"、"technical" 的链接
2. 验证URL：必须是PDF文件（.pdf结尾）
3. 如果找不到，设置为空字符串 `""`

---

#### 5. 技术文档链接（technicalDocUrl）

**提取位置**：产品详情页下载区域

**可能的文本标识**：
- "Technical Documentation"
- "Technical Data Sheet"
- "Product Specifications"

**提取策略**：与catalogUrl类似，但优先提取包含 "technical" 的链接

---

## 📝 输出格式要求

### JSON文件结构

**文件名**：`avantor_crawled_data_YYYYMMDD.json`（例如：`avantor_crawled_data_20251108.json`）

**JSON格式**：
```json
{
  "crawlInfo": {
    "brand": "Avantor",
    "totalProducts": 83,
    "successCount": 79,
    "failureCount": 4,
    "crawlDate": "2025-11-08",
    "crawlDuration": "5.2 hours",
    "dataQuality": {
      "descriptionCoverage": "96.4%",
      "avgDescriptionLength": 625,
      "avgSpecFields": 13.2,
      "gradeA": 62,
      "gradeB": 15,
      "gradeC": 2,
      "gradeD": 0
    }
  },
  "products": [
    {
      "productId": "245188",
      "partNumber": "76394-738",
      "brand": "Avantor",
      "name": "ACE 5 C18 HPLC Column (5 µm, 100 x 4.6 mm)",
      "description": "ACE C18 is a high-quality reversed-phase column offering excellent retention and selectivity for a wide range of compounds. The 5 µm particle size provides optimal resolution and efficiency for routine HPLC applications. Suitable for pharmaceutical, environmental, and food analysis. Features high carbon load (17%) and complete end-capping for superior peak shape and reproducibility.",
      "specifications": {
        "particleSize": "5 µm",
        "poreSize": "100 Å",
        "columnLength": "100 mm",
        "innerDiameter": "4.6 mm",
        "phRange": "2.0-8.0",
        "stationaryPhase": "C18",
        "endCapping": "Yes",
        "carbonLoad": "17%",
        "maxPressure": "400 bar",
        "temperatureRange": "5-60°C",
        "application": "Pharmaceutical, Environmental, Food",
        "series": "ACE C18",
        "uspClassification": "L1"
      },
      "imageUrl": "https://www.avantor.com/images/products/ace-c18-column.jpg",
      "catalogUrl": "https://www.avantor.com/documents/ace-c18-catalog.pdf",
      "technicalDocUrl": "https://www.avantor.com/documents/ace-c18-technical.pdf",
      "productUrl": "https://www.avantor.com/p/ace-5-c18-hplc-column-5-m-100-x-46-mm-ace-111-0546",
      "crawlStatus": "success",
      "crawlTimestamp": "2025-11-08T10:23:45Z",
      "dataQualityGrade": "A"
    },
    {
      "productId": "245189",
      "partNumber": "76394-740",
      "brand": "Avantor",
      "name": "ACE 5 C18 HPLC Column (5 µm, 150 x 4.6 mm)",
      "description": "...",
      "specifications": { ... },
      "imageUrl": "...",
      "catalogUrl": "",
      "technicalDocUrl": "",
      "productUrl": "...",
      "crawlStatus": "success",
      "crawlTimestamp": "2025-11-08T10:24:12Z",
      "dataQualityGrade": "A"
    }
    // ... 更多产品
  ],
  "failures": [
    {
      "productId": "245811",
      "partNumber": "GC Columns",
      "reason": "Invalid Part Number format",
      "crawlTimestamp": "2025-11-08T10:25:00Z"
    }
    // ... 失败的产品
  ]
}
```

### 字段说明

#### crawlInfo（爬取信息）
- `brand`：品牌名称（固定值："Avantor"）
- `totalProducts`：总产品数（83）
- `successCount`：成功爬取的产品数
- `failureCount`：失败的产品数
- `crawlDate`：爬取日期（YYYY-MM-DD格式）
- `crawlDuration`：爬取总耗时（小时）
- `dataQuality`：数据质量统计
  - `descriptionCoverage`：描述覆盖率（百分比）
  - `avgDescriptionLength`：平均描述长度（字符数）
  - `avgSpecFields`：平均规格字段数
  - `gradeA/B/C/D`：各等级产品数量

#### products（产品数据）
- `productId`：产品ID（来自CSV文件）
- `partNumber`：零件号（来自CSV文件）
- `brand`：品牌名称（固定值："Avantor"）
- `name`：产品名称（从官网提取，优先使用官网名称）
- `description`：产品描述（纯文本，最多2000字符）
- `specifications`：技术规格（JSON对象，至少8个字段）
- `imageUrl`：产品图片URL（完整HTTP/HTTPS URL或空字符串）
- `catalogUrl`：产品目录PDF链接（完整URL或空字符串）
- `technicalDocUrl`：技术文档PDF链接（完整URL或空字符串）
- `productUrl`：产品详情页URL（完整URL）
- `crawlStatus`：爬取状态（"success" 或 "failure"）
- `crawlTimestamp`：爬取时间戳（ISO 8601格式）
- `dataQualityGrade`：数据质量等级（"A"、"B"、"C"、"D"）

#### failures（失败记录）
- `productId`：产品ID
- `partNumber`：零件号
- `reason`：失败原因（简短描述）
- `crawlTimestamp`：爬取时间戳

---

## 🚨 特殊情况处理

### 1. 搜索结果为空
**场景**：搜索Part Number时，没有找到任何结果

**处理方式**：
- 记录到 `failures` 数组
- `reason`: "Product not found in search results"
- 继续处理下一个产品

### 2. 搜索结果有多个产品
**场景**：搜索Part Number时，返回多个产品

**处理方式**：
- 选择第一个结果（通常是最相关的）
- 在日志中记录警告信息
- 继续爬取

### 3. 产品页面加载失败
**场景**：访问产品详情页时，页面返回404或500错误

**处理方式**：
- 记录到 `failures` 数组
- `reason`: "Product page not accessible (HTTP {status_code})"
- 继续处理下一个产品

### 4. 描述为空或过短
**场景**：产品页面没有描述，或描述少于50字符

**处理方式**：
- 仍然保存产品数据
- `description`: 空字符串或提取到的短描述
- `dataQualityGrade`: "D"
- 在日志中记录警告信息

### 5. 规格字段不足
**场景**：提取到的规格字段少于8个

**处理方式**：
- 仍然保存产品数据
- `specifications`: 包含所有提取到的字段
- `dataQualityGrade`: 根据字段数量降级（<8个字段 → "C"或"D"）
- 在日志中记录警告信息

### 6. 无效的Part Number
**场景**：CSV文件中的Part Number格式异常（如 "GC Columns"）

**处理方式**：
- 跳过该产品
- 记录到 `failures` 数组
- `reason`: "Invalid Part Number format"

---

## 📊 质量验证清单

### 自动验证（爬取完成后）

- [ ] **成功率检查**：`successCount / totalProducts ≥ 90%`
- [ ] **描述覆盖率检查**：有描述的产品 / 成功产品 ≥ 95%
- [ ] **描述长度检查**：平均描述长度 ≥ 500字符
- [ ] **规格字段检查**：平均规格字段数 ≥ 10个
- [ ] **A/B级描述检查**：(gradeA + gradeB) / successCount ≥ 80%
- [ ] **URL格式检查**：所有URL必须是完整的HTTP/HTTPS链接
- [ ] **JSON格式检查**：JSON文件必须能被正确解析
- [ ] **数据类型检查**：所有字段的数据类型必须正确

### 手动验证（抽样检查）

- [ ] **随机抽取10个产品**，验证数据准确性
- [ ] **检查描述内容**：是否与官网一致
- [ ] **检查规格数据**：是否与官网一致
- [ ] **检查图片链接**：是否能正常访问
- [ ] **检查PDF链接**：是否能正常下载

---

## 📦 交付要求

### 必需文件

1. **avantor_crawled_data_YYYYMMDD.json**
   - 完整的爬取数据（JSON格式）
   - 包含 `crawlInfo`、`products`、`failures` 三个部分

2. **avantor_crawl_log_YYYYMMDD.txt**
   - 详细的爬取日志
   - 包含：开始时间、结束时间、每个产品的爬取状态、警告信息、错误信息

3. **avantor_quality_report_YYYYMMDD.md**
   - 数据质量报告（Markdown格式）
   - 包含：质量指标统计、数据质量分析、问题总结、改进建议

### 可选文件

4. **avantor_failed_products_YYYYMMDD.csv**
   - 失败产品清单（CSV格式）
   - 包含：productId、partNumber、reason

5. **avantor_sample_screenshots/**
   - 抽样产品的页面截图（用于验证）
   - 至少10个产品的截图

---

## ⏱️ 时间安排

### 预计工作量：4-6小时

| 阶段 | 任务 | 预计时间 |
|------|------|---------|
| **阶段1** | 环境准备、代码开发 | 1小时 |
| **阶段2** | URL发现（83个产品） | 1.5-2小时 |
| **阶段3** | 数据爬取（75-79个产品） | 1-1.5小时 |
| **阶段4** | 数据清洗和验证 | 0.5-1小时 |
| **阶段5** | 质量报告生成 | 0.5-1小时 |
| **总计** | | **4-6小时** |

### 里程碑

- [ ] **M1（1小时内）**：完成代码开发，测试前5个产品
- [ ] **M2（3小时内）**：完成50%产品爬取（约40个）
- [ ] **M3（5小时内）**：完成100%产品爬取（约75-79个）
- [ ] **M4（6小时内）**：完成数据验证和质量报告

---

## 🛠️ 推荐工具和技术栈

### Python方案（推荐）

**推荐库**：
- `requests`：HTTP请求
- `beautifulsoup4`：HTML解析
- `lxml`：高性能HTML解析器
- `json`：JSON处理
- `time`：延时控制
- `logging`：日志记录

**示例代码框架**：
```python
import requests
from bs4 import BeautifulSoup
import json
import time
import logging
from datetime import datetime

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'avantor_crawl_log_{datetime.now().strftime("%Y%m%d")}.txt'),
        logging.StreamHandler()
    ]
)

# 读取产品清单
def load_product_list(csv_file):
    products = []
    with open(csv_file, 'r', encoding='utf-8') as f:
        # 跳过表头
        next(f)
        for line in f:
            parts = line.strip().split(',')
            if len(parts) >= 2:
                products.append({
                    'productId': parts[0],
                    'partNumber': parts[1]
                })
    return products

# 通过搜索发现产品URL
def find_product_url(part_number):
    search_url = f"https://www.avantor.com/search?searchTerm={part_number}"
    try:
        response = requests.get(search_url, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'lxml')
        
        # 提取第一个产品链接
        product_link = soup.select_one('a.product-link, div.product-item a[href^="/p/"]')
        
        if product_link:
            href = product_link.get('href')
            if href.startswith('/'):
                return f"https://www.avantor.com{href}"
            return href
        
        logging.warning(f"Product not found in search: {part_number}")
        return None
        
    except Exception as e:
        logging.error(f"Error searching for {part_number}: {str(e)}")
        return None

# 爬取产品详情
def crawl_product(product_url, product_id, part_number):
    try:
        response = requests.get(product_url, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'lxml')
        
        # 提取产品名称
        name_elem = soup.select_one('h1.product-title, h1.product-name')
        name = name_elem.get_text(strip=True) if name_elem else ""
        
        # 提取产品描述
        desc_elem = soup.select_one('.product-description, .description, #description-tab')
        description = desc_elem.get_text(strip=True) if desc_elem else ""
        
        # 提取规格
        specifications = {}
        spec_table = soup.select('table.specifications tr, ul.spec-list li, div.spec-item')
        for item in spec_table:
            # 根据实际HTML结构提取键值对
            # 这里需要根据实际页面结构调整
            pass
        
        # 提取图片URL
        img_elem = soup.select_one('img.product-image, img[alt*="product"]')
        image_url = img_elem.get('src', '') if img_elem else ""
        
        # 数据质量评级
        grade = calculate_quality_grade(description, specifications)
        
        return {
            'productId': product_id,
            'partNumber': part_number,
            'brand': 'Avantor',
            'name': name,
            'description': description,
            'specifications': specifications,
            'imageUrl': image_url,
            'catalogUrl': '',
            'technicalDocUrl': '',
            'productUrl': product_url,
            'crawlStatus': 'success',
            'crawlTimestamp': datetime.now().isoformat() + 'Z',
            'dataQualityGrade': grade
        }
        
    except Exception as e:
        logging.error(f"Error crawling {product_url}: {str(e)}")
        return None

# 数据质量评级
def calculate_quality_grade(description, specifications):
    desc_len = len(description)
    spec_count = len(specifications)
    
    if desc_len >= 500 and spec_count >= 10:
        return 'A'
    elif desc_len >= 200 and spec_count >= 6:
        return 'B'
    elif desc_len >= 100 and spec_count >= 3:
        return 'C'
    else:
        return 'D'

# 主函数
def main():
    logging.info("Starting Avantor crawling task...")
    
    # 加载产品清单
    products = load_product_list('avantor_product_list_for_crawler.csv')
    logging.info(f"Loaded {len(products)} products")
    
    results = []
    failures = []
    
    for i, product in enumerate(products):
        logging.info(f"Processing {i+1}/{len(products)}: {product['partNumber']}")
        
        # 发现产品URL
        product_url = find_product_url(product['partNumber'])
        
        if not product_url:
            failures.append({
                'productId': product['productId'],
                'partNumber': product['partNumber'],
                'reason': 'Product not found in search results',
                'crawlTimestamp': datetime.now().isoformat() + 'Z'
            })
            continue
        
        # 爬取产品数据
        data = crawl_product(product_url, product['productId'], product['partNumber'])
        
        if data:
            results.append(data)
        else:
            failures.append({
                'productId': product['productId'],
                'partNumber': product['partNumber'],
                'reason': 'Failed to crawl product page',
                'crawlTimestamp': datetime.now().isoformat() + 'Z'
            })
        
        # 延时（避免被封禁）
        time.sleep(2)
    
    # 生成输出JSON
    output = {
        'crawlInfo': {
            'brand': 'Avantor',
            'totalProducts': len(products),
            'successCount': len(results),
            'failureCount': len(failures),
            'crawlDate': datetime.now().strftime('%Y-%m-%d'),
            'crawlDuration': '5.2 hours',  # 需要实际计算
            'dataQuality': calculate_data_quality(results)
        },
        'products': results,
        'failures': failures
    }
    
    # 保存JSON文件
    output_file = f'avantor_crawled_data_{datetime.now().strftime("%Y%m%d")}.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    logging.info(f"Crawling completed. Output saved to {output_file}")
    logging.info(f"Success: {len(results)}, Failures: {len(failures)}")

if __name__ == '__main__':
    main()
```

---

## 📞 联系方式

### 技术支持
如有任何技术问题或需要澄清，请联系：
- **项目负责人**：[您的姓名]
- **邮箱**：[您的邮箱]
- **微信**：[您的微信号]

### 进度报告
请在以下时间节点报告进度：
- **M1（1小时内）**：完成代码开发和测试
- **M2（3小时内）**：完成50%产品爬取
- **M3（5小时内）**：完成100%产品爬取
- **M4（6小时内）**：完成数据验证和质量报告

---

## ✅ 任务确认清单

在开始任务前，请确认以下事项：

- [ ] 已阅读并理解本任务指令
- [ ] 已下载产品清单CSV文件（`avantor_product_list_for_crawler.csv`）
- [ ] 已准备好开发环境（Python 3.x + 必需库）
- [ ] 已理解URL发现策略（通过搜索功能）
- [ ] 已理解数据提取规则（描述、规格、图片、PDF）
- [ ] 已理解质量标准（成功率≥90%，描述覆盖率≥95%）
- [ ] 已理解输出格式（JSON文件结构）
- [ ] 已理解特殊情况处理方式
- [ ] 已准备好日志记录和错误处理机制
- [ ] 已了解时间安排和里程碑

---

**任务批准人**：项目负责人  
**任务批准日期**：2025年11月8日  
**任务优先级**：⭐⭐⭐⭐⭐ 最高  
**预期完成日期**：2025年11月8日（当天完成）

---

**祝爬取顺利！期待高质量的数据交付！** 🚀
