# Merck 品牌产品数据爬取任务指令

## 📋 任务概述

**任务名称**：Merck 品牌色谱产品数据爬取  
**产品数量**：199个产品  
**品牌**：Merck (Merck KGaA / Sigma-Aldrich / Supelco)  
**优先级**：🔥 高优先级（第6个品牌，项目进度59.9%）  
**预计工作量**：2-3天  
**目标完成日期**：2025年11月10日

---

## 🎯 任务目标

### 数据质量目标
- ✅ **成功率目标**：≥90%（至少179个产品成功）
- ✅ **描述覆盖率**：≥70%（至少139个产品有详细描述）
- ✅ **A/B级描述占比**：≥40%（至少80个产品有高质量描述）
- ✅ **平均规格字段数**：≥15个字段/产品

### 业务价值
- 提升产品信息完整性，改善用户体验
- 增强SEO表现，提高搜索引擎排名
- 为客户提供更专业的产品选择依据
- 支持AI产品顾问提供更准确的推荐

---

## 📦 输入文件

### 产品清单文件
- **文件名**：`merck_product_list_for_crawler.csv`
- **格式**：CSV（UTF-8编码）
- **列结构**：
  ```
  productId,partNumber,brand,name,catalogUrl
  ```
- **示例数据**：
  ```csv
  "MERC-24218-U","24218-U","Merck","SPB®-Octyl Capillary GC Column L × I.D. 30 m × 0.25 mm, df 0.25 μm",""
  "MERC-24133-U","24133-U","Merck","Petrocol® DH 50.2 Capillary GC Column L × I.D. 50 m × 0.20 mm, df 0.50 μm",""
  ```

### 数据说明
- **productId**：数据库唯一标识（MERC-前缀 + partNumber）
- **partNumber**：Merck官方零件号（用于搜索和匹配）
- **brand**：固定值"Merck"
- **name**：产品名称（当前数据库中的名称，可能不完整）
- **catalogUrl**：产品目录页URL（当前为空，需要爬取）

---

## 🌐 数据源分析

### Merck 官方网站结构

#### 主要产品线
1. **Supelco 品牌**（色谱专业品牌）
   - 网站：https://www.sigmaaldrich.com/supelco
   - GC色谱柱（SPB系列、Equity系列、Petrocol系列）
   - HPLC色谱柱（Ascentis系列、Discovery系列）
   - SPE固相萃取柱

2. **Sigma-Aldrich 品牌**
   - 网站：https://www.sigmaaldrich.com
   - 分析标准品
   - 实验室耗材

#### URL模式分析
```
产品详情页：
https://www.sigmaaldrich.com/CN/zh/product/supelco/{partNumber}
https://www.sigmaaldrich.com/CN/zh/product/mm/{partNumber}
https://www.sigmaaldrich.com/CN/zh/product/sial/{partNumber}

搜索页：
https://www.sigmaaldrich.com/CN/zh/search/{partNumber}
```

### 网站特点
- ✅ **结构化良好**：产品页面有清晰的HTML结构
- ✅ **信息丰富**：包含详细的技术规格和应用信息
- ⚠️ **多品牌整合**：Supelco、Sigma-Aldrich、Millipore等品牌整合在一个网站
- ⚠️ **需要登录**：部分技术文档需要登录才能下载
- ⚠️ **动态加载**：部分内容通过JavaScript动态加载

---

## 🔍 爬取策略

### 第一步：URL发现（Part Number → Product URL）

#### 方法1：直接构造URL（推荐）
```python
# 尝试常见的URL模式
url_patterns = [
    f"https://www.sigmaaldrich.com/CN/zh/product/supelco/{part_number}",
    f"https://www.sigmaaldrich.com/CN/zh/product/mm/{part_number}",
    f"https://www.sigmaaldrich.com/CN/zh/product/sial/{part_number}",
]

for url in url_patterns:
    response = requests.get(url)
    if response.status_code == 200:
        product_url = url
        break
```

#### 方法2：搜索API（备选）
```python
# 使用Merck搜索API
search_url = f"https://www.sigmaaldrich.com/CN/zh/search/{part_number}"
# 解析搜索结果页面，提取第一个匹配产品的URL
```

### 第二步：产品详情页数据提取

#### 必需字段（Required）
1. **name**（产品名称）
   - CSS选择器：`h1[data-testid="product-title"]` 或 `.product-title`
   - 示例：`"SPB-Octyl Capillary GC Column"`

2. **description**（产品描述）
   - CSS选择器：`.product-description` 或 `[data-testid="product-description"]`
   - 长度：100-500字符
   - 质量等级：根据内容丰富度评级（A/B/C/D/E）

3. **catalogUrl**（产品页URL）
   - 就是当前访问的URL
   - 示例：`"https://www.sigmaaldrich.com/CN/zh/product/supelco/24218-U"`

#### 重要字段（Important）
4. **specifications**（技术规格 - JSON格式）
   ```json
   {
     "Column Length": "30 m",
     "Inner Diameter": "0.25 mm",
     "Film Thickness": "0.25 μm",
     "Phase": "Octyl",
     "Temperature Range": "-60 to 340°C",
     "Application": "Environmental analysis",
     "USP Code": "G27",
     "Matrix": "Fused silica"
   }
   ```
   - 提取位置：产品规格表格、技术参数部分
   - 字段数量目标：≥15个字段

5. **particleSize**（粒径 - 仅HPLC柱）
   - 示例：`"5 µm"`, `"3 µm"`, `"1.8 µm"`
   - 提取位置：规格表格或产品名称

6. **poreSize**（孔径 - 仅HPLC柱）
   - 示例：`"100 Å"`, `"120 Å"`, `"300 Å"`

7. **columnLength**（柱长）
   - 示例：`"250 mm"`, `"30 m"`, `"150 mm"`
   - 提取位置：规格表格或产品名称

8. **innerDiameter**（内径）
   - 示例：`"4.6 mm"`, `"2.1 mm"`, `"0.25 mm"`

9. **phRange**（pH范围 - 仅HPLC柱）
   - 示例：`"2-8"`, `"1-14"`

10. **packingMaterial**（填料类型）
    - 示例：`"C18"`, `"C8"`, `"Phenyl"`, `"Octyl"`

#### 可选字段（Optional）
11. **detailedDescription**（详细描述）
    - 更长的产品描述（500-2000字符）
    - 包含应用场景、优势特点等

12. **imageUrl**（产品图片URL）
    - 提取高分辨率产品图片
    - 示例：`"https://www.sigmaaldrich.com/content/dam/sigma-aldrich/product/24218-U.jpg"`

13. **technicalDocsUrl**（技术文档URL）
    - PDF文档链接
    - 示例：`"https://www.sigmaaldrich.com/content/dam/sigma-aldrich/docs/Supelco/Datasheet/1/24218-U.pdf"`

14. **applications**（应用领域 - 数组）
    ```json
    ["Environmental analysis", "Pharmaceutical", "Food & Beverage"]
    ```

15. **features**（产品特点 - 数组）
    ```json
    ["High resolution", "Low bleed", "Excellent thermal stability"]
    ```

---

## 📊 输出格式要求

### CSV文件结构
```csv
productId,partNumber,brand,name,description,descriptionQuality,detailedDescription,specifications,particleSize,poreSize,columnLength,innerDiameter,phRange,packingMaterial,imageUrl,catalogUrl,technicalDocsUrl,applications,features,crawlStatus,crawlError
```

### 字段说明

| 字段名 | 类型 | 必需 | 说明 | 示例 |
|--------|------|------|------|------|
| productId | string | ✅ | 数据库ID（不要修改） | `"MERC-24218-U"` |
| partNumber | string | ✅ | 零件号（不要修改） | `"24218-U"` |
| brand | string | ✅ | 固定值"Merck" | `"Merck"` |
| name | string | ✅ | 产品名称 | `"SPB-Octyl Capillary GC Column 30m x 0.25mm"` |
| description | text | ✅ | 产品描述（100-500字符） | `"High-performance GC column for..."` |
| descriptionQuality | enum | ✅ | 描述质量等级 | `"high"` / `"medium"` / `"low"` / `"extracted"` / `"none"` |
| detailedDescription | text | ⭕ | 详细描述（500-2000字符） | `"The SPB-Octyl column is designed for..."` |
| specifications | JSON | ✅ | 技术规格（JSON对象） | `{"Column Length": "30 m", "Inner Diameter": "0.25 mm"}` |
| particleSize | string | ⭕ | 粒径（仅HPLC） | `"5 µm"` |
| poreSize | string | ⭕ | 孔径（仅HPLC） | `"100 Å"` |
| columnLength | string | ⭕ | 柱长 | `"30 m"` |
| innerDiameter | string | ⭕ | 内径 | `"0.25 mm"` |
| phRange | string | ⭕ | pH范围（仅HPLC） | `"2-8"` |
| packingMaterial | string | ⭕ | 填料类型 | `"Octyl"` |
| imageUrl | string | ⭕ | 产品图片URL | `"https://..."` |
| catalogUrl | string | ✅ | 产品页URL | `"https://www.sigmaaldrich.com/..."` |
| technicalDocsUrl | text | ⭕ | 技术文档URL（多个用逗号分隔） | `"https://...,https://..."` |
| applications | text | ⭕ | 应用领域（JSON数组） | `["Environmental", "Pharmaceutical"]` |
| features | text | ⭕ | 产品特点（JSON数组） | `["High resolution", "Low bleed"]` |
| crawlStatus | string | ✅ | 爬取状态 | `"success"` / `"failed"` / `"not_found"` |
| crawlError | text | ⭕ | 错误信息（如果失败） | `"404 Not Found"` |

### 描述质量等级评判标准

| 等级 | 字符数 | 内容要求 | 示例 |
|------|--------|----------|------|
| **A (high)** | ≥300 | 包含应用场景、技术优势、适用范围 | "The SPB-Octyl column is specifically designed for environmental analysis of volatile organic compounds. It features excellent thermal stability up to 340°C and provides superior resolution for complex mixtures..." |
| **B (medium)** | 150-299 | 包含基本技术特点和应用 | "High-performance GC column with octyl stationary phase. Suitable for environmental and pharmaceutical applications." |
| **C (low)** | 50-149 | 简单描述，信息有限 | "GC column for environmental analysis." |
| **D (extracted)** | 任意 | 从产品名称或规格表提取的描述 | "Capillary GC Column, 30m x 0.25mm, 0.25µm film thickness" |
| **E (none)** | 0 | 无描述 | `""` |

---

## 🛠️ 技术实现建议

### Python爬虫框架推荐
```python
import requests
from bs4 import BeautifulSoup
import pandas as pd
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# 读取产品清单
df = pd.read_csv('merck_product_list_for_crawler.csv')

results = []

for index, row in df.iterrows():
    product_id = row['productId']
    part_number = row['partNumber']
    
    try:
        # 1. 尝试直接访问产品页
        url = f"https://www.sigmaaldrich.com/CN/zh/product/supelco/{part_number}"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 404:
            # 尝试其他URL模式
            url = f"https://www.sigmaaldrich.com/CN/zh/product/mm/{part_number}"
            response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 2. 提取产品名称
            name = soup.select_one('h1[data-testid="product-title"]').text.strip()
            
            # 3. 提取产品描述
            desc_elem = soup.select_one('.product-description')
            description = desc_elem.text.strip() if desc_elem else ""
            
            # 4. 评估描述质量
            desc_quality = evaluate_description_quality(description)
            
            # 5. 提取技术规格
            specifications = extract_specifications(soup)
            
            # 6. 提取其他字段...
            
            results.append({
                'productId': product_id,
                'partNumber': part_number,
                'brand': 'Merck',
                'name': name,
                'description': description,
                'descriptionQuality': desc_quality,
                'specifications': json.dumps(specifications),
                'catalogUrl': url,
                'crawlStatus': 'success',
                'crawlError': ''
            })
        else:
            results.append({
                'productId': product_id,
                'partNumber': part_number,
                'crawlStatus': 'not_found',
                'crawlError': f'HTTP {response.status_code}'
            })
    
    except Exception as e:
        results.append({
            'productId': product_id,
            'partNumber': part_number,
            'crawlStatus': 'failed',
            'crawlError': str(e)
        })
    
    # 延迟，避免被封IP
    time.sleep(2)
    
    # 每10个产品保存一次进度
    if (index + 1) % 10 == 0:
        pd.DataFrame(results).to_csv('merck_crawl_progress.csv', index=False)
        print(f"Progress: {index + 1}/{len(df)} products")

# 保存最终结果
pd.DataFrame(results).to_csv('merck_crawl_results.csv', index=False)
```

### 描述质量评估函数
```python
def evaluate_description_quality(description):
    """评估描述质量等级"""
    if not description:
        return 'none'
    
    length = len(description)
    
    if length >= 300:
        return 'high'
    elif length >= 150:
        return 'medium'
    elif length >= 50:
        return 'low'
    else:
        return 'extracted'
```

### 规格提取函数
```python
def extract_specifications(soup):
    """提取技术规格"""
    specs = {}
    
    # 方法1：从规格表格提取
    spec_table = soup.select_one('.specifications-table')
    if spec_table:
        rows = spec_table.select('tr')
        for row in rows:
            cells = row.select('td')
            if len(cells) >= 2:
                key = cells[0].text.strip()
                value = cells[1].text.strip()
                specs[key] = value
    
    # 方法2：从产品属性列表提取
    attr_list = soup.select('.product-attributes li')
    for item in attr_list:
        text = item.text.strip()
        if ':' in text:
            key, value = text.split(':', 1)
            specs[key.strip()] = value.strip()
    
    return specs
```

---

## ⚠️ 注意事项

### 1. 反爬虫策略应对
- ✅ **设置User-Agent**：模拟真实浏览器
  ```python
  headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
  ```
- ✅ **请求延迟**：每个请求间隔2-3秒
- ✅ **使用代理**：如果IP被封，使用代理池
- ✅ **Session管理**：保持会话状态

### 2. 数据清洗
- ✅ **去除HTML标签**：使用BeautifulSoup的`.text`
- ✅ **去除多余空格**：`.strip()` 和正则表达式
- ✅ **统一单位格式**：
  - 长度：统一为 `"mm"` 或 `"m"`
  - 粒径：统一为 `"µm"`（不要用`"um"`）
  - 孔径：统一为 `"Å"`
- ✅ **JSON格式验证**：确保specifications字段是有效的JSON

### 3. 错误处理
- ✅ **404错误**：标记为`not_found`，不要中断程序
- ✅ **超时错误**：设置合理的timeout（10-15秒）
- ✅ **网络错误**：实现重试机制（最多3次）
- ✅ **解析错误**：记录错误信息，继续处理下一个产品

### 4. 进度保存
- ✅ **定期保存**：每处理10个产品保存一次进度
- ✅ **断点续传**：支持从上次中断的地方继续
- ✅ **日志记录**：记录每个产品的处理状态

---

## 📈 质量验证清单

### 完成标准
- [ ] 成功爬取≥179个产品（90%成功率）
- [ ] ≥139个产品有description（70%描述覆盖率）
- [ ] ≥80个产品达到A/B级描述（40%高质量描述）
- [ ] 平均规格字段数≥15个
- [ ] 所有必需字段完整填写
- [ ] CSV格式正确，可直接导入数据库
- [ ] 无重复数据
- [ ] JSON字段格式正确

### 自检步骤
1. **数据完整性检查**
   ```python
   df = pd.read_csv('merck_crawl_results.csv')
   print(f"Total products: {len(df)}")
   print(f"Success rate: {len(df[df['crawlStatus'] == 'success']) / len(df) * 100:.1f}%")
   print(f"Description coverage: {len(df[df['description'].notna()]) / len(df) * 100:.1f}%")
   ```

2. **描述质量分析**
   ```python
   quality_counts = df['descriptionQuality'].value_counts()
   print(quality_counts)
   ab_grade = len(df[df['descriptionQuality'].isin(['high', 'medium'])])
   print(f"A/B grade descriptions: {ab_grade} ({ab_grade/len(df)*100:.1f}%)")
   ```

3. **规格字段统计**
   ```python
   spec_counts = []
   for specs_json in df['specifications']:
       if pd.notna(specs_json):
           specs = json.loads(specs_json)
           spec_counts.append(len(specs))
   print(f"Average spec fields: {sum(spec_counts) / len(spec_counts):.1f}")
   ```

4. **抽样检查**
   - 随机抽取10个产品
   - 手动访问产品页面
   - 对比爬取数据的准确性

---

## 📤 交付物清单

### 必需文件
1. ✅ **merck_crawl_results.csv** - 最终爬取结果（199行）
2. ✅ **merck_quality_report.md** - 数据质量报告（见下方模板）
3. ✅ **merck_crawl_log.txt** - 爬取日志（可选）

### 质量报告模板
```markdown
# Merck 品牌数据爬取质量报告

## 📊 基本统计

- **总产品数**：199
- **成功爬取**：XXX (XX.X%)
- **失败数量**：XXX (XX.X%)
- **未找到**：XXX (XX.X%)

## 📝 描述质量分析

- **描述覆盖率**：XX.X% (XXX/199)
- **A级描述（≥300字符）**：XXX (XX.X%)
- **B级描述（150-299字符）**：XXX (XX.X%)
- **C级描述（50-149字符）**：XXX (XX.X%)
- **D级描述（提取）**：XXX (XX.X%)
- **E级描述（无）**：XXX (XX.X%)
- **A/B级描述占比**：XX.X% ✅/❌

## 🔧 规格字段统计

- **平均规格字段数**：XX.X个/产品 ✅/❌
- **规格完整性**：XX.X% (XXX/199)
- **最多规格字段数**：XX个
- **最少规格字段数**：XX个

## 🎯 目标达成情况

| 指标 | 目标 | 实际 | 达成 |
|------|------|------|------|
| 成功率 | ≥90% | XX.X% | ✅/❌ |
| 描述覆盖率 | ≥70% | XX.X% | ✅/❌ |
| A/B级描述 | ≥40% | XX.X% | ✅/❌ |
| 平均规格字段 | ≥15个 | XX.X个 | ✅/❌ |

## 🚨 问题与建议

### 主要问题
1. XXX
2. XXX

### 改进建议
1. XXX
2. XXX

## ✅ 结论

总体评级：⭐⭐⭐⭐⭐ (优秀) / ⭐⭐⭐⭐ (良好) / ⭐⭐⭐ (合格) / ⭐⭐ (需改进) / ⭐ (不合格)

建议：✅ 可以导入 / ⚠️ 需要修正后导入 / ❌ 需要重新爬取
```

---

## 🔗 参考资源

### Merck 官方资源
- Supelco产品目录：https://www.sigmaaldrich.com/supelco
- GC色谱柱选择指南：https://www.sigmaaldrich.com/technical-documents/articles/analytical-chemistry/gc-column-selection-guide
- HPLC色谱柱选择指南：https://www.sigmaaldrich.com/technical-documents/articles/analytical-chemistry/hplc-column-selection-guide

### 技术文档
- BeautifulSoup文档：https://www.crummy.com/software/BeautifulSoup/bs4/doc/
- Selenium文档：https://selenium-python.readthedocs.io/
- Pandas文档：https://pandas.pydata.org/docs/

---

## 📞 联系方式

如有任何问题，请联系：
- **项目负责人**：[您的姓名]
- **邮箱**：[您的邮箱]
- **微信**：[您的微信号]

---

**祝爬取顺利！🚀**
