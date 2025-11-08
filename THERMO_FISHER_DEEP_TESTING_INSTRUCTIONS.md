# Thermo Fisher深度测试任务指令

**任务编号**: ROWELL-CRAWL-008  
**发布日期**: 2025-11-08  
**优先级**: ⭐⭐⭐⭐ 高  
**预计时间**: 2-3小时  
**测试产品数**: 20个

---

## 📊 执行摘要

基于可行性测试结果，Thermo Fisher品牌存在一定技术风险，需要通过深度测试验证可行性：

| 指标 | 值 |
|------|-----|
| **可行性** | ⚠️ 中等 |
| **推荐度** | ⭐⭐⭐ |
| **预期成功率** | 60-70% (不确定性高) |
| **数据质量** | HIGH (11个规格字段，600字符描述) |
| **主要风险** | Fisher Scientific覆盖率未知 |
| **ROI评级** | ⭐⭐⭐ 中等 |

**测试目的**:
1. 验证Fisher Scientific对Thermo Fisher产品的覆盖率
2. 确认Part Number转换规则的准确性
3. 评估数据一致性和质量
4. 决定是否启动全量爬取（366个产品）

---

## 🎯 任务目标

测试20个Thermo Fisher产品，验证以下内容：

1. **Fisher Scientific覆盖率**: 20个产品中有多少可以在Fisher Scientific找到？
2. **Part Number转换**: 转换规则（移除连字符）是否适用于所有产品？
3. **数据质量**: 描述长度、规格字段数是否符合预期？
4. **数据一致性**: Fisher Scientific的数据是否与Thermo Fisher官网一致？

**决策标准**:
- **成功率≥80%**: 启动全量爬取（366个产品）
- **成功率60-79%**: 评估风险，决定是否继续
- **成功率<60%**: 暂停全量爬取，探索替代方案

---

## 📋 测试产品清单

### 选择标准

从366个产品中选择20个具有代表性的产品：
- **产品类型**: 覆盖不同系列（Accucore, TraceGOLD, Hypersil等）
- **Part Number格式**: 包含不同格式（带连字符、不带连字符）
- **产品类别**: HPLC色谱柱、GC色谱柱、配件等

### 测试产品列表

| # | productId | partNumber | 产品系列 | 预期URL格式 |
|---|-----------|------------|----------|------------|
| 1 | THER-17126-102130 | 17126-102130 | Accucore C18 | 171261021 30 |
| 2 | THER-17126-032130 | 17126-032130 | Accucore C18 | 17126032130 |
| 3 | THER-26098-1420 | 26098-1420 | TraceGOLD TG-5MS | 260981420 |
| 4 | THER-25003-052130 | 25003-052130 | Hypersil GOLD | 25003052130 |
| 5 | THER-25005-052130 | 25005-052130 | Hypersil GOLD | 25005052130 |
| 6 | THER-26096-1420 | 26096-1420 | TraceGOLD TG-1MS | 260961420 |
| 7 | THER-26097-1420 | 26097-1420 | TraceGOLD TG-Wax MS | 260971420 |
| 8 | THER-17126-152130 | 17126-152130 | Accucore C18 | 17126152130 |
| 9 | THER-17126-252130 | 17126-252130 | Accucore C18 | 17126252130 |
| 10 | THER-17126-052130 | 17126-052130 | Accucore C18 | 17126052130 |
| 11 | THER-25003-102130 | 25003-102130 | Hypersil GOLD | 25003102130 |
| 12 | THER-25003-152130 | 25003-152130 | Hypersil GOLD | 25003152130 |
| 13 | THER-25003-252130 | 25003-252130 | Hypersil GOLD | 25003252130 |
| 14 | THER-25005-102130 | 25005-102130 | Hypersil GOLD | 25005102130 |
| 15 | THER-25005-152130 | 25005-152130 | Hypersil GOLD | 25005152130 |
| 16 | THER-25005-252130 | 25005-252130 | Hypersil GOLD | 25005252130 |
| 17 | THER-26098-1460 | 26098-1460 | TraceGOLD TG-5MS | 260981460 |
| 18 | THER-26098-1425 | 26098-1425 | TraceGOLD TG-5MS | 260981425 |
| 19 | THER-26096-1460 | 26096-1460 | TraceGOLD TG-1MS | 260961460 |
| 20 | THER-26097-1460 | 26097-1460 | TraceGOLD TG-Wax MS | 260971460 |

---

## 🔧 技术实施方案

### 1. URL构建规则

#### Thermo Fisher官网（已被阻止）
```
https://www.thermofisher.com/order/catalog/product/{partNumber}
```
**状态**: ❌ Access Denied

#### Fisher Scientific分销商（可访问）
```
https://www.fishersci.ca/shop/products/{slug}/{partNumber-without-dash}
```

**Part Number转换规则**:
```python
# 移除连字符
part_number = "26098-1420"
part_number_url = part_number.replace("-", "")  # → "260981420"
```

**Slug生成规则**:
```python
# 从产品名称生成slug（小写，空格替换为连字符）
# 示例: "TraceGOLD™ TG-5MS GC Columns" → "tracegold-tg-5ms-gc-columns"
```

**完整URL示例**:
```
https://www.fishersci.ca/shop/products/tracegold-tg-5ms-gc-columns/260981420
```

### 2. 页面结构分析

**页面类型**: 独立产品页面

**关键元素**:
```html
<!-- 产品名称 -->
<h1 class="product-name">TraceGOLD™ TG-5MS GC Columns</h1>

<!-- 产品描述（在Description标签页） -->
<div id="description-tab">
  <p>Employ the most widely used MS phase in gas chromatography with the 5% phenyl phase TraceGOLD TG-5MS GC Column.</p>
  <ul>
    <li>Low polarity phase, 5% diphenyl/95% dimethyl polysiloxane</li>
    <li>Low bleed for excellent signal-to-noise ratio...</li>
  </ul>
</div>

<!-- 技术规格表格（在Specifications标签页） -->
<table class="specifications">
  <tr>
    <td>Diameter (Metric) Inner</td>
    <td>0.25 mm</td>
  </tr>
  <tr>
    <td>Stationary Phase</td>
    <td>TraceGOLD™ TG-5 MS</td>
  </tr>
  <!-- ... 更多规格字段 ... -->
</table>
```

### 3. 数据提取规则

#### 必需字段（8个）

| 字段 | 提取方法 | 示例 |
|------|----------|------|
| **productId** | 使用CSV中的productId | `THER-26098-1420` |
| **partNumber** | 使用CSV中的partNumber | `26098-1420` |
| **brand** | 固定值 | `Thermo Fisher Scientific` |
| **name** | `<h1>` tag | `TraceGOLD™ TG-5MS GC Columns` |
| **description** | Description标签页内容 | `Employ the most widely used MS phase...` |
| **imageUrl** | `<img class="product-image">` src属性 | `https://www.fishersci.ca/...` |
| **catalogUrl** | 当前页面URL | `https://www.fishersci.ca/shop/products/...` |
| **technicalDocUrl** | 技术文档链接（如有） | `https://www.fishersci.ca/...` |

#### 技术规格字段（11个）

根据可行性测试，Thermo Fisher产品页面包含以下规格字段：

**核心字段**（优先提取）:
1. **Diameter (Metric) Inner** (内径) - 映射到 `innerDiameter`
2. **Length (Metric)** (柱长) - 映射到 `length`
3. **Stationary Phase** (固定相) - 映射到 `stationaryPhase`
4. **Film Thickness** (膜厚) - 映射到 `filmThickness`
5. **Polarity** (极性) - 映射到 `polarity`
6. **Max. Temperature** (最高温度) - 映射到 `maxTemperature`
7. **Particle Size** (粒径) - 映射到 `particleSize`
8. **Pore Size** (孔径) - 映射到 `poreSize`

**重要字段**（尽量提取）:
9. **USP Type** (USP分类)
10. **Product Line** (产品系列)
11. **pH** (pH范围) - 映射到 `phRange`

### 4. 测试流程

#### Phase 1: 环境准备（15分钟）

1. **安装依赖**
```bash
pip install requests beautifulsoup4 pandas
```

2. **准备测试产品清单**
```python
import pandas as pd

# 从完整清单中提取20个测试产品
df_full = pd.read_csv('thermo_366_final_unique.csv')

# 选择测试产品（按productId）
test_product_ids = [
    'THER-17126-102130', 'THER-17126-032130', 'THER-26098-1420',
    'THER-25003-052130', 'THER-25005-052130', 'THER-26096-1420',
    'THER-26097-1420', 'THER-17126-152130', 'THER-17126-252130',
    'THER-17126-052130', 'THER-25003-102130', 'THER-25003-152130',
    'THER-25003-252130', 'THER-25005-102130', 'THER-25005-152130',
    'THER-25005-252130', 'THER-26098-1460', 'THER-26098-1425',
    'THER-26096-1460', 'THER-26097-1460'
]

df_test = df_full[df_full['productId'].isin(test_product_ids)]
df_test.to_csv('thermo_fisher_test_20_products.csv', index=False)

print(f"Test products: {len(df_test)}")
```

#### Phase 2: 测试爬取（1-1.5小时）

1. **测试单个产品**
```python
def test_product(row):
    """测试单个产品的爬取"""
    part_number = row['partNumber']
    product_id = row['productId']
    name = row['name']
    
    # 转换Part Number（移除连字符）
    part_number_url = part_number.replace("-", "")
    
    # 生成slug（从产品名称）
    slug = name.lower().replace(" ", "-").replace("™", "").replace("®", "")
    
    # 构建URL
    url = f"https://www.fishersci.ca/shop/products/{slug}/{part_number_url}"
    
    print(f"\nTesting: {product_id}")
    print(f"Part Number: {part_number} → {part_number_url}")
    print(f"URL: {url}")
    
    try:
        response = requests.get(url, timeout=30)
        
        if response.status_code == 404:
            print("❌ 404 Not Found")
            return {
                'productId': product_id,
                'partNumber': part_number,
                'status': 'failed',
                'reason': '404',
                'url': url
            }
        
        if response.status_code == 200:
            print("✅ Page found")
            
            # 解析页面
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 提取数据
            data = {
                'productId': product_id,
                'partNumber': part_number,
                'brand': 'Thermo Fisher Scientific',
                'name': extract_name(soup),
                'description': extract_description(soup),
                'specifications': extract_specifications(soup),
                'imageUrl': extract_image_url(soup),
                'catalogUrl': url,
                'technicalDocUrl': extract_tech_doc_url(soup),
                'status': 'success'
            }
            
            # 验证数据质量
            desc_length = len(data['description']) if data['description'] else 0
            spec_count = len(json.loads(data['specifications']))
            
            print(f"Description length: {desc_length} characters")
            print(f"Specification fields: {spec_count}")
            
            return data
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return {
            'productId': product_id,
            'partNumber': part_number,
            'status': 'failed',
            'reason': str(e),
            'url': url
        }

# 测试所有20个产品
results = []
for _, row in df_test.iterrows():
    result = test_product(row)
    results.append(result)
    time.sleep(2)  # 避免请求过快

# 统计结果
success_count = len([r for r in results if r['status'] == 'success'])
failed_count = len([r for r in results if r['status'] == 'failed'])

print(f"\n=== Test Results ===")
print(f"Success: {success_count}/20 ({success_count/20*100:.1f}%)")
print(f"Failed: {failed_count}/20 ({failed_count/20*100:.1f}%)")
```

#### Phase 3: 数据分析（0.5-1小时）

1. **覆盖率分析**
```python
# Fisher Scientific覆盖率
coverage_rate = success_count / 20
print(f"Fisher Scientific Coverage: {coverage_rate:.1%}")

# 按产品系列分析
series_coverage = {}
for result in results:
    # 提取产品系列（从productId）
    series = result['productId'].split('-')[1][:5]  # 例如: "17126"
    if series not in series_coverage:
        series_coverage[series] = {'total': 0, 'success': 0}
    series_coverage[series]['total'] += 1
    if result['status'] == 'success':
        series_coverage[series]['success'] += 1

print("\n=== Coverage by Series ===")
for series, stats in series_coverage.items():
    rate = stats['success'] / stats['total']
    print(f"{series}: {stats['success']}/{stats['total']} ({rate:.1%})")
```

2. **数据质量分析**
```python
# 描述质量
success_results = [r for r in results if r['status'] == 'success']

if success_results:
    desc_lengths = [len(r['description']) for r in success_results if r.get('description')]
    avg_desc_length = sum(desc_lengths) / len(desc_lengths) if desc_lengths else 0
    
    print(f"\n=== Data Quality ===")
    print(f"Average description length: {avg_desc_length:.1f} characters")
    print(f"Description coverage: {len(desc_lengths)}/{len(success_results)} ({len(desc_lengths)/len(success_results):.1%})")
    
    # 规格字段数
    spec_counts = [len(json.loads(r['specifications'])) for r in success_results]
    avg_spec_count = sum(spec_counts) / len(spec_counts) if spec_counts else 0
    
    print(f"Average specification fields: {avg_spec_count:.1f}")
```

3. **Part Number转换验证**
```python
# 验证Part Number转换规则
print("\n=== Part Number Conversion ===")
for result in results:
    part_number = result['partNumber']
    part_number_url = part_number.replace("-", "")
    
    if result['status'] == 'success':
        print(f"✅ {part_number} → {part_number_url}")
    else:
        print(f"❌ {part_number} → {part_number_url} (Failed: {result['reason']})")
```

#### Phase 4: 决策建议（0.5小时）

1. **生成测试报告**
```python
report = f"""
# Thermo Fisher深度测试报告

## 测试概况
- 测试产品数: 20
- 成功产品: {success_count} ({success_count/20*100:.1f}%)
- 失败产品: {failed_count} ({failed_count/20*100:.1f}%)

## Fisher Scientific覆盖率
- 总体覆盖率: {coverage_rate:.1%}

### 按产品系列分析
"""

for series, stats in series_coverage.items():
    rate = stats['success'] / stats['total']
    report += f"- {series}: {stats['success']}/{stats['total']} ({rate:.1%})\n"

if success_results:
    report += f"""
## 数据质量
- 平均描述长度: {avg_desc_length:.1f}字符
- 描述覆盖率: {len(desc_lengths)}/{len(success_results)} ({len(desc_lengths)/len(success_results):.1%})
- 平均规格字段数: {avg_spec_count:.1f}

## 决策建议
"""

    if coverage_rate >= 0.80:
        report += """
### ✅ 推荐启动全量爬取

**理由**:
- Fisher Scientific覆盖率≥80%
- 数据质量符合预期
- Part Number转换规则有效

**预期成果**:
- 成功产品: 220-256个（基于80%覆盖率）
- 项目完成率: 89.2-91.8%
- 数据质量: HIGH
"""
    elif coverage_rate >= 0.60:
        report += """
### ⚠️ 谨慎推荐，需要评估风险

**理由**:
- Fisher Scientific覆盖率60-79%
- 成功率低于预期
- 需要权衡时间投入与产出

**建议**:
1. 分析失败原因（404 vs 其他错误）
2. 如果主要是404，可能是产品不在Fisher Scientific
3. 如果是其他错误，可以尝试修复
4. 评估是否值得继续（时间投入 vs 预期产出）
"""
    else:
        report += """
### ❌ 不推荐启动全量爬取

**理由**:
- Fisher Scientific覆盖率<60%
- 成功率过低，ROI不佳
- 时间投入与产出不成正比

**建议**:
1. 暂停全量爬取
2. 探索替代方案:
   - 尝试其他分销商（如VWR）
   - 研究是否有API可用
   - 考虑使用代理服务器访问Thermo Fisher官网
3. 或者完全跳过Thermo Fisher品牌
"""

# 保存报告
with open('THERMO_FISHER_DEEP_TEST_REPORT.md', 'w') as f:
    f.write(report)

print(report)
```

---

## 📦 交付清单

### 必需文件

1. **thermo_fisher_test_20_results.csv** (测试结果数据)
   - 格式: CSV
   - 字段: productId, partNumber, brand, name, description, specifications, imageUrl, catalogUrl, technicalDocUrl, status, reason
   - 行数: 20行

2. **thermo_fisher_test_log.txt** (测试日志)
   - 格式: 纯文本
   - 内容: 每个产品的测试过程、URL、响应状态、错误信息
   - 用途: 调试和问题排查

3. **THERMO_FISHER_DEEP_TEST_REPORT.md** (测试报告)
   - 格式: Markdown
   - 内容: 覆盖率分析、数据质量分析、决策建议
   - 用途: 决定是否启动全量爬取

### 可选文件

4. **thermo_fisher_failed_products.csv** (失败产品清单)
   - 格式: CSV
   - 字段: productId, partNumber, failureReason, url
   - 用途: 分析失败原因

---

## ⚠️ 注意事项

### 1. URL构建
- **Slug生成**: 从产品名称生成，需要处理特殊字符（™, ®等）
- **Part Number转换**: 移除连字符，但需要验证是否适用于所有产品
- **URL格式**: Fisher Scientific的URL格式可能不统一

### 2. 数据提取
- **标签页切换**: 描述和规格可能在不同的标签页，需要正确定位
- **字段缺失**: 部分产品可能缺少某些规格字段
- **格式不一致**: 规格字段格式可能不统一

### 3. 错误处理
- **404错误**: 产品不在Fisher Scientific，记录为失败
- **超时错误**: 网络不稳定，重试3次
- **解析错误**: 页面结构变化，记录错误信息

### 4. 决策标准
- **成功率≥80%**: 启动全量爬取
- **成功率60-79%**: 评估风险后决定
- **成功率<60%**: 暂停全量爬取

---

## 📊 预期成果

### 测试结果预期

| 场景 | 成功率 | 决策 |
|------|--------|------|
| **最佳情况** | ≥80% | ✅ 启动全量爬取 |
| **中等情况** | 60-79% | ⚠️ 评估风险后决定 |
| **最差情况** | <60% | ❌ 暂停全量爬取 |

### 全量爬取预期（如果测试成功）

| 指标 | 值 |
|------|-----|
| 产品数 | 366 |
| 预期成功率 | 60-70% |
| 预期成功产品 | 220-256 |
| 数据质量 | HIGH |
| 预计时间 | 6-8小时 |

### 项目影响（如果全量爬取成功）

| 指标 | 当前值 | 爬取后 | 提升 |
|------|--------|--------|------|
| 已完成产品 | 2,179-2,211 | 2,399-2,467 | +220-256 |
| 完成率 | 81.0-82.2% | 89.2-91.8% | +8.2-9.6% |

---

## 🚀 里程碑

- **M1** (15分钟内): 完成环境准备，准备测试产品清单
- **M2** (1.5小时内): 完成20个产品测试
- **M3** (2小时内): 完成数据分析和覆盖率评估
- **M4** (2.5小时内): 完成测试报告生成
- **M5** (3小时内): 提交决策建议

---

## 📞 联系方式

如有任何问题或需要技术支持，请联系：

- **项目负责人**: Manus AI Agent
- **任务编号**: ROWELL-CRAWL-008
- **优先级**: ⭐⭐⭐⭐ 高

---

## 附录

### A. Python代码框架

```python
import requests
from bs4 import BeautifulSoup
import pandas as pd
import json
import time

# 读取测试产品清单
df_test = pd.read_csv('thermo_fisher_test_20_products.csv')

# 数据提取函数
def extract_name(soup):
    """提取产品名称"""
    try:
        return soup.find('h1', class_='product-name').text.strip()
    except:
        return None

def extract_description(soup):
    """提取产品描述（从Description标签页）"""
    try:
        desc_tab = soup.find('div', id='description-tab')
        paragraphs = desc_tab.find_all('p')
        lists = desc_tab.find_all('ul')
        
        desc = ""
        for p in paragraphs:
            desc += p.text.strip() + "\n"
        for ul in lists:
            for li in ul.find_all('li'):
                desc += "• " + li.text.strip() + "\n"
        
        return desc.strip()
    except:
        return None

def extract_specifications(soup):
    """提取技术规格（从Specifications标签页）"""
    try:
        specs = {}
        spec_tab = soup.find('div', id='specifications-tab')
        table = spec_tab.find('table', class_='specifications')
        
        for row in table.find_all('tr'):
            cells = row.find_all('td')
            if len(cells) == 2:
                key = cells[0].text.strip()
                value = cells[1].text.strip()
                specs[key] = value
        
        return json.dumps(specs)
    except:
        return '{}'

def extract_image_url(soup):
    """提取产品图片URL"""
    try:
        return soup.find('img', class_='product-image')['src']
    except:
        return None

def extract_tech_doc_url(soup):
    """提取技术文档URL"""
    try:
        return soup.find('a', class_='technical-doc')['href']
    except:
        return None

# 测试单个产品
def test_product(row):
    """测试单个产品的爬取"""
    part_number = row['partNumber']
    product_id = row['productId']
    name = row['name']
    
    # 转换Part Number
    part_number_url = part_number.replace("-", "")
    
    # 生成slug
    slug = name.lower().replace(" ", "-").replace("™", "").replace("®", "")
    
    # 构建URL
    url = f"https://www.fishersci.ca/shop/products/{slug}/{part_number_url}"
    
    print(f"\nTesting: {product_id}")
    print(f"URL: {url}")
    
    try:
        response = requests.get(url, timeout=30, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        if response.status_code == 404:
            print("❌ 404 Not Found")
            return {
                'productId': product_id,
                'partNumber': part_number,
                'status': 'failed',
                'reason': '404',
                'url': url
            }
        
        if response.status_code == 200:
            print("✅ Page found")
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            data = {
                'productId': product_id,
                'partNumber': part_number,
                'brand': 'Thermo Fisher Scientific',
                'name': extract_name(soup),
                'description': extract_description(soup),
                'specifications': extract_specifications(soup),
                'imageUrl': extract_image_url(soup),
                'catalogUrl': url,
                'technicalDocUrl': extract_tech_doc_url(soup),
                'status': 'success'
            }
            
            desc_length = len(data['description']) if data['description'] else 0
            spec_count = len(json.loads(data['specifications']))
            
            print(f"Description: {desc_length} chars")
            print(f"Specs: {spec_count} fields")
            
            return data
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return {
            'productId': product_id,
            'partNumber': part_number,
            'status': 'failed',
            'reason': str(e),
            'url': url
        }

# 测试所有产品
results = []
for _, row in df_test.iterrows():
    result = test_product(row)
    results.append(result)
    time.sleep(2)

# 保存结果
df_results = pd.DataFrame(results)
df_results.to_csv('thermo_fisher_test_20_results.csv', index=False)

# 统计结果
success_count = len([r for r in results if r['status'] == 'success'])
print(f"\n=== Final Results ===")
print(f"Success: {success_count}/20 ({success_count/20*100:.1f}%)")
```

### B. 决策流程图

```
开始测试
    ↓
测试20个产品
    ↓
计算成功率
    ↓
    ├─ 成功率≥80% → ✅ 启动全量爬取（366个产品）
    ├─ 成功率60-79% → ⚠️ 评估风险后决定
    └─ 成功率<60% → ❌ 暂停全量爬取，探索替代方案
```

### C. 常见问题FAQ

**Q1: 如果成功率低于80%怎么办？**
A1: 分析失败原因。如果主要是404，说明Fisher Scientific覆盖率不足；如果是其他错误，可以尝试修复。

**Q2: 如何处理Part Number转换失败？**
A2: 尝试不同的转换规则，或者手动构建URL。

**Q3: 如果Fisher Scientific覆盖率不足怎么办？**
A3: 探索其他分销商（如VWR），或者研究是否有API可用。

**Q4: 是否可以直接访问Thermo Fisher官网？**
A4: 可行性测试显示官网被阻止，可以尝试使用代理服务器。

**Q5: 如果测试失败，是否完全放弃Thermo Fisher？**
A5: 不一定。可以探索替代方案，或者等待更好的技术方案。

---

**任务发布时间**: 2025-11-08  
**预期完成时间**: 2025-11-08（当天完成）  
**任务状态**: 🟢 已批准，等待执行
