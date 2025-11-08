# Agilent全量爬取任务指令

**任务编号**: ROWELL-CRAWL-007  
**发布日期**: 2025-11-08  
**优先级**: ⭐⭐⭐⭐⭐ 最高  
**预计时间**: 4-6小时  
**产品数量**: 630个

---

## 📊 执行摘要

基于可行性测试结果，Agilent品牌已确认为**最高ROI、最低风险**的爬取目标：

| 指标 | 值 |
|------|-----|
| **可行性** | ✅ 高 |
| **推荐度** | ⭐⭐⭐⭐⭐ |
| **预期成功率** | 90-95% |
| **数据质量** | HIGH (20个规格字段) |
| **时间效率** | 95-150个产品/小时 |
| **ROI评级** | ⭐⭐⭐⭐⭐ 极高 |

**预期交付**:
- 成功产品数: 567-599个
- 项目完成率提升: 从59.9%到81.0-82.2% (+21.1-22.3%)

---

## 🎯 任务目标

爬取Agilent官网630个产品的完整数据，包括：
1. 产品名称
2. 产品描述（177字符平均长度）
3. 技术规格（20个字段）
4. 产品图片URL
5. 产品目录URL
6. 技术文档URL

---

## 📋 产品清单

**文件**: `agilent_630_final_unique.csv`  
**产品数量**: 624个（CSV中实际行数）  
**CSV格式**:
```csv
productId,partNumber,brand,name,description,specifications,descriptionQuality,detailedDescription
AGIL-0100-2637,0100-2637,Agilent,"Nut and ferrule, stainless steel, 1/8 inch, for sample loop for switching valve",,{},none,
AGIL-0101867305,01018-67305,Agilent,Capillary stainless steel 0.25 x 700 mm S/S ps/ns,...
```

**注意**: 
- productId格式: `AGIL-{partNumber}`
- partNumber是官方零件号，用于构建URL
- 现有数据质量较低，需要完全替换

---

## 🔧 技术实施方案

### 1. URL构建规则

**URL格式**:
```
https://www.agilent.com/store/en_US/Prod-{partNumber}/{partNumber}
```

**示例**:
```python
part_number = "699970-902"
url = f"https://www.agilent.com/store/en_US/Prod-{part_number}/{part_number}"
# 结果: https://www.agilent.com/store/en_US/Prod-699970-902/699970-902
```

**特点**:
- ✅ URL格式简单，可直接构建
- ✅ 无需搜索或目录页面发现
- ✅ 95%以上的产品URL有效
- ⚠️ 部分产品可能返回404（预计5-10%）

### 2. 页面结构分析

**页面类型**: 独立产品页面

**关键元素**:
```html
<!-- 产品名称 -->
<h1 class="product-name">InfinityLab Poroshell 120 EC-C18, 4.6 x 50 mm, 4 µm</h1>

<!-- 产品描述 -->
<div class="product-description">
  <p>General purpose column, versatile pH range (2.0-9.0), max 60°C temp, ideal for diverse chromatographic needs.</p>
</div>

<!-- 技术规格表格 -->
<table class="specifications">
  <tr>
    <td>Brand</td>
    <td>InfinityLab Poroshell 120</td>
  </tr>
  <tr>
    <td>Carbon Load</td>
    <td>10 %</td>
  </tr>
  <!-- ... 更多规格字段 ... -->
</table>

<!-- 产品图片 -->
<img class="product-image" src="https://www.agilent.com/...">

<!-- 技术文档链接 -->
<a href="..." class="technical-doc">Technical Documentation</a>
```

### 3. 数据提取规则

#### 必需字段（8个）

| 字段 | 提取方法 | 示例 |
|------|----------|------|
| **productId** | 使用CSV中的productId | `AGIL-699970-902` |
| **partNumber** | 使用CSV中的partNumber | `699970-902` |
| **brand** | 固定值 | `Agilent` |
| **name** | `<h1>` tag | `InfinityLab Poroshell 120 EC-C18, 4.6 x 50 mm, 4 µm` |
| **description** | 产品名称下方段落 | `General purpose column, versatile pH range...` |
| **imageUrl** | `<img class="product-image">` src属性 | `https://www.agilent.com/...` |
| **catalogUrl** | 当前页面URL | `https://www.agilent.com/store/en_US/Prod-699970-902/699970-902` |
| **technicalDocUrl** | 技术文档链接 | `https://www.agilent.com/...` |

#### 技术规格字段（20个）

根据可行性测试，Agilent产品页面包含以下规格字段：

**核心字段**（优先提取）:
1. **Particle Size** (粒径) - 映射到 `particleSize`
2. **Pore Size** (孔径) - 映射到 `poreSize`
3. **Length** (柱长) - 映射到 `dimensions` (长度部分)
4. **Inner Diameter (ID)** (内径) - 映射到 `dimensions` (内径部分)
5. **pH Range** (pH范围) - 映射到 `phRange`
6. **Phase** (固定相) - 映射到 `stationaryPhase`
7. **Endcapped** (端基封尾) - 映射到 `endCapping`
8. **Carbon Load** (碳载量) - 映射到 `carbonLoad`

**重要字段**（尽量提取）:
9. **Brand** (品牌系列)
10. **Maximum Temperature** (最高温度)
11. **Pressure Rating** (最大压力)
12. **Separation Mode** (分离模式)
13. **Particle Type** (粒子类型)
14. **LC Platform** (LC平台)
15. **Hardware** (硬件类型)
16. **Shipping Solvent** (运输溶剂)

**可选字段**（有则提取）:
17. **Guard Column** (保护柱)
18. **Molecular Weight Limits** (分子量限制)
19. **UNSPSC Code** (UNSPSC代码)
20. **其他字段** (如有)

#### 规格字段映射规则

```python
# 字段映射字典
field_mapping = {
    "Particle Size": "particleSize",
    "Pore Size": "poreSize",
    "Length": "length",  # 需要提取数值
    "Inner Diameter (ID)": "innerDiameter",  # 需要提取数值
    "pH Range": "phRange",
    "Phase": "stationaryPhase",
    "Endcapped": "endCapping",
    "Carbon Load": "carbonLoad",
    "Maximum Temperature": "maxTemperature",
    "Pressure Rating": "maxPressure",
    "Separation Mode": "separationMode",
    "Particle Type": "particleType",
    "Brand": "brandSeries",
}

# dimensions字段构建
# 如果有Length和Inner Diameter，构建为: "250.0 × 4.6"
if length and inner_diameter:
    dimensions = f"{length} × {inner_diameter}"
```

### 4. 数据质量标准

#### 成功标准
- **成功率**: ≥90% (至少567个产品)
- **描述覆盖率**: ≥95% (至少595个产品有描述)
- **A/B级描述**: ≥80% (至少504个产品)
- **平均描述长度**: ≥150字符
- **平均规格字段数**: ≥15个

#### 描述质量分级

| 等级 | 标准 | 示例 |
|------|------|------|
| **A级** | ≥200字符，包含应用场景和特点 | `General purpose column with versatile pH range (2.0-9.0), maximum temperature 60°C, ideal for diverse chromatographic needs including pharmaceutical analysis and environmental testing.` |
| **B级** | 100-199字符，包含基本信息 | `General purpose column, versatile pH range (2.0-9.0), max 60°C temp, ideal for diverse chromatographic needs.` |
| **C级** | 50-99字符，仅基本描述 | `General purpose column with pH range 2.0-9.0` |
| **D级** | <50字符或无描述 | `HPLC Column` |

#### 规格字段完整性

| 等级 | 标准 | 评分 |
|------|------|------|
| **优秀** | ≥15个字段 | ⭐⭐⭐⭐⭐ |
| **良好** | 10-14个字段 | ⭐⭐⭐⭐ |
| **一般** | 5-9个字段 | ⭐⭐⭐ |
| **较差** | <5个字段 | ⭐⭐ |

---

## 🔄 爬取流程

### Phase 1: 环境准备（15分钟）

1. **安装依赖**
```bash
pip install requests beautifulsoup4 pandas selenium
```

2. **准备产品清单**
```python
import pandas as pd

# 读取产品清单
df = pd.read_csv('agilent_630_final_unique.csv')
print(f"Total products: {len(df)}")

# 检查数据
print(df.head())
print(df.columns)
```

3. **测试前5个产品**
```python
# 测试URL构建和页面访问
for i in range(5):
    part_number = df.iloc[i]['partNumber']
    url = f"https://www.agilent.com/store/en_US/Prod-{part_number}/{part_number}"
    print(f"Testing: {url}")
    # 访问并检查响应状态
```

### Phase 2: 数据爬取（3-4小时）

1. **批量爬取**
```python
import time
from concurrent.futures import ThreadPoolExecutor

def crawl_product(row):
    """爬取单个产品数据"""
    part_number = row['partNumber']
    product_id = row['productId']
    
    # 构建URL
    url = f"https://www.agilent.com/store/en_US/Prod-{part_number}/{part_number}"
    
    try:
        # 访问页面
        response = requests.get(url, timeout=30)
        
        if response.status_code == 404:
            return {'status': 'failed', 'reason': '404', 'productId': product_id}
        
        # 解析页面
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # 提取数据
        data = {
            'productId': product_id,
            'partNumber': part_number,
            'brand': 'Agilent',
            'name': extract_name(soup),
            'description': extract_description(soup),
            'specifications': extract_specifications(soup),
            'imageUrl': extract_image_url(soup),
            'catalogUrl': url,
            'technicalDocUrl': extract_tech_doc_url(soup),
            'status': 'success'
        }
        
        return data
        
    except Exception as e:
        return {'status': 'failed', 'reason': str(e), 'productId': product_id}

# 使用线程池并发爬取（建议5-10个线程）
with ThreadPoolExecutor(max_workers=5) as executor:
    results = list(executor.map(crawl_product, df.to_dict('records')))

# 保存结果
success_results = [r for r in results if r['status'] == 'success']
failed_results = [r for r in results if r['status'] == 'failed']

print(f"Success: {len(success_results)}/{len(df)} ({len(success_results)/len(df)*100:.1f}%)")
print(f"Failed: {len(failed_results)}/{len(df)} ({len(failed_results)/len(df)*100:.1f}%)")
```

2. **错误处理**
- 404错误: 记录失败产品，继续下一个
- 超时错误: 重试3次，仍失败则记录
- 解析错误: 记录错误信息，继续下一个

3. **进度监控**
```python
# 每爬取50个产品输出一次进度
if i % 50 == 0:
    print(f"Progress: {i}/{len(df)} ({i/len(df)*100:.1f}%)")
    print(f"Success rate so far: {success_count}/{i} ({success_count/i*100:.1f}%)")
```

### Phase 3: 数据清洗（0.5-1小时）

1. **数据验证**
```python
# 检查必需字段
required_fields = ['productId', 'partNumber', 'brand', 'name']
for field in required_fields:
    missing = df[df[field].isna()].shape[0]
    print(f"{field}: {missing} missing")

# 检查描述质量
df['descLength'] = df['description'].str.len()
print(f"Average description length: {df['descLength'].mean():.1f}")
print(f"Products with description: {df[df['descLength'] > 0].shape[0]}")

# 检查规格字段数
df['specCount'] = df['specifications'].apply(lambda x: len(json.loads(x)) if x else 0)
print(f"Average spec fields: {df['specCount'].mean():.1f}")
```

2. **数据清洗**
```python
# 清理描述文本
df['description'] = df['description'].str.strip()
df['description'] = df['description'].str.replace('\n', ' ')
df['description'] = df['description'].str.replace('  +', ' ', regex=True)

# 标准化规格字段
# (根据field_mapping映射规格字段名)

# 提取dimensions字段
# (从Length和Inner Diameter构建)
```

3. **质量评级**
```python
# 描述质量分级
def grade_description(desc):
    if not desc or len(desc) < 50:
        return 'D'
    elif len(desc) < 100:
        return 'C'
    elif len(desc) < 200:
        return 'B'
    else:
        return 'A'

df['descriptionQuality'] = df['description'].apply(grade_description)

# 统计质量分布
print(df['descriptionQuality'].value_counts())
```

### Phase 4: 质量验证（0.5-1小时）

1. **自动验证**
```python
# 成功率检查
success_rate = len(success_results) / len(df)
assert success_rate >= 0.90, f"Success rate too low: {success_rate:.1%}"

# 描述覆盖率检查
desc_coverage = df[df['description'].notna()].shape[0] / len(df)
assert desc_coverage >= 0.95, f"Description coverage too low: {desc_coverage:.1%}"

# A/B级描述比例检查
ab_ratio = df[df['descriptionQuality'].isin(['A', 'B'])].shape[0] / len(df)
assert ab_ratio >= 0.80, f"A/B grade ratio too low: {ab_ratio:.1%}"

# 平均规格字段数检查
avg_spec_count = df['specCount'].mean()
assert avg_spec_count >= 15, f"Average spec count too low: {avg_spec_count:.1f}"
```

2. **手动抽查**
```python
# 随机抽取10个产品进行手动验证
sample = df.sample(10)
for _, row in sample.iterrows():
    print(f"\nProduct: {row['name']}")
    print(f"Description: {row['description'][:100]}...")
    print(f"Spec count: {row['specCount']}")
    print(f"Quality: {row['descriptionQuality']}")
    print(f"URL: {row['catalogUrl']}")
```

3. **生成质量报告**
```python
# 生成详细的质量报告
report = f"""
# Agilent爬取质量报告

## 基本统计
- 总产品数: {len(df)}
- 成功产品: {len(success_results)} ({success_rate:.1%})
- 失败产品: {len(failed_results)} ({1-success_rate:.1%})

## 描述质量
- 描述覆盖率: {desc_coverage:.1%}
- 平均描述长度: {df['descLength'].mean():.1f}字符
- A级描述: {df[df['descriptionQuality']=='A'].shape[0]} ({df[df['descriptionQuality']=='A'].shape[0]/len(df):.1%})
- B级描述: {df[df['descriptionQuality']=='B'].shape[0]} ({df[df['descriptionQuality']=='B'].shape[0]/len(df):.1%})
- C级描述: {df[df['descriptionQuality']=='C'].shape[0]} ({df[df['descriptionQuality']=='C'].shape[0]/len(df):.1%})
- D级描述: {df[df['descriptionQuality']=='D'].shape[0]} ({df[df['descriptionQuality']=='D'].shape[0]/len(df):.1%})

## 规格完整性
- 平均规格字段数: {df['specCount'].mean():.1f}
- ≥15个字段: {df[df['specCount']>=15].shape[0]} ({df[df['specCount']>=15].shape[0]/len(df):.1%})
- 10-14个字段: {df[(df['specCount']>=10) & (df['specCount']<15)].shape[0]}
- 5-9个字段: {df[(df['specCount']>=5) & (df['specCount']<10)].shape[0]}
- <5个字段: {df[df['specCount']<5].shape[0]}

## 失败产品分析
"""

# 分析失败原因
if failed_results:
    failure_reasons = {}
    for r in failed_results:
        reason = r['reason']
        failure_reasons[reason] = failure_reasons.get(reason, 0) + 1
    
    report += "\n### 失败原因分布:\n"
    for reason, count in failure_reasons.items():
        report += f"- {reason}: {count}\n"

# 保存报告
with open('AGILENT_QUALITY_REPORT.md', 'w') as f:
    f.write(report)
```

---

## 📦 交付清单

### 必需文件

1. **agilent_630_results.csv** (主要数据文件)
   - 格式: CSV
   - 字段: productId, partNumber, brand, name, description, specifications, imageUrl, catalogUrl, technicalDocUrl, descriptionQuality
   - 行数: 567-599行（成功产品）

2. **agilent_crawl_log.txt** (爬取日志)
   - 格式: 纯文本
   - 内容: 每个产品的爬取状态、时间戳、错误信息
   - 用途: 调试和问题排查

3. **AGILENT_QUALITY_REPORT.md** (质量报告)
   - 格式: Markdown
   - 内容: 成功率、描述质量、规格完整性、失败产品分析
   - 用途: 质量评估和验收

### 可选文件

4. **agilent_failed_products.csv** (失败产品清单)
   - 格式: CSV
   - 字段: productId, partNumber, failureReason
   - 用途: 人工补充或重试

5. **agilent_sample_products.json** (样本产品)
   - 格式: JSON
   - 内容: 10个随机抽样产品的完整数据
   - 用途: 快速验证数据质量

---

## ⚠️ 注意事项

### 1. 网站访问
- **User-Agent**: 使用真实浏览器User-Agent
- **请求频率**: 建议每秒1-2个请求，避免触发反爬虫
- **超时设置**: 30秒超时，避免长时间等待
- **重试机制**: 失败后重试3次，间隔5秒

### 2. 数据提取
- **JavaScript渲染**: Agilent网站可能使用JavaScript动态加载数据，建议使用Selenium
- **字段缺失**: 部分产品可能缺少某些规格字段，记录为null
- **格式不一致**: 规格字段格式可能不统一，需要标准化

### 3. 错误处理
- **404错误**: 部分产品页面可能不存在，记录为失败
- **超时错误**: 网络不稳定可能导致超时，重试3次
- **解析错误**: 页面结构变化可能导致解析失败，记录错误信息

### 4. 质量保证
- **自动验证**: 运行自动验证脚本，确保达到质量标准
- **手动抽查**: 随机抽查10个产品，验证数据准确性
- **质量报告**: 生成详细的质量报告，包含统计数据和失败分析

---

## 📊 预期成果

### 数据质量预期

| 指标 | 目标值 | 预期值 |
|------|--------|--------|
| 成功率 | ≥90% | 90-95% |
| 成功产品数 | ≥567 | 567-599 |
| 描述覆盖率 | ≥95% | 95-98% |
| A/B级描述 | ≥80% | 80-85% |
| 平均描述长度 | ≥150字符 | 150-200字符 |
| 平均规格字段数 | ≥15个 | 15-20个 |

### 项目影响

| 指标 | 当前值 | 爬取后 | 提升 |
|------|--------|--------|------|
| 总产品数 | 2,689 | 2,689 | - |
| 已完成产品 | 1,612 | 2,179-2,211 | +567-599 |
| 完成率 | 59.9% | 81.0-82.2% | +21.1-22.3% |
| 高质量产品 | 703 | 1,270-1,302 | +567-599 |

### 时间安排

| 阶段 | 任务 | 预计时间 |
|------|------|----------|
| Phase 1 | 环境准备、代码开发 | 15分钟 |
| Phase 2 | 数据爬取（630个产品） | 3-4小时 |
| Phase 3 | 数据清洗和标准化 | 0.5-1小时 |
| Phase 4 | 质量验证和报告生成 | 0.5-1小时 |
| **总计** | | **4-6小时** |

---

## 🚀 里程碑

- **M1** (15分钟内): 完成环境准备，测试前5个产品
- **M2** (2小时内): 完成50%产品爬取（约315个）
- **M3** (4小时内): 完成100%产品爬取（约630个）
- **M4** (5小时内): 完成数据清洗和质量验证
- **M5** (6小时内): 完成质量报告生成和文件交付

---

## 📞 联系方式

如有任何问题或需要技术支持，请联系：

- **项目负责人**: Manus AI Agent
- **任务编号**: ROWELL-CRAWL-007
- **优先级**: ⭐⭐⭐⭐⭐ 最高

---

## 附录

### A. Python代码框架

```python
import requests
from bs4 import BeautifulSoup
import pandas as pd
import json
import time
from concurrent.futures import ThreadPoolExecutor

# 读取产品清单
df = pd.read_csv('agilent_630_final_unique.csv')

# 数据提取函数
def extract_name(soup):
    """提取产品名称"""
    try:
        return soup.find('h1', class_='product-name').text.strip()
    except:
        return None

def extract_description(soup):
    """提取产品描述"""
    try:
        return soup.find('div', class_='product-description').find('p').text.strip()
    except:
        return None

def extract_specifications(soup):
    """提取技术规格"""
    try:
        specs = {}
        table = soup.find('table', class_='specifications')
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

# 爬取单个产品
def crawl_product(row):
    """爬取单个产品数据"""
    part_number = row['partNumber']
    product_id = row['productId']
    
    url = f"https://www.agilent.com/store/en_US/Prod-{part_number}/{part_number}"
    
    try:
        response = requests.get(url, timeout=30, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        if response.status_code == 404:
            return {'status': 'failed', 'reason': '404', 'productId': product_id}
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        data = {
            'productId': product_id,
            'partNumber': part_number,
            'brand': 'Agilent',
            'name': extract_name(soup),
            'description': extract_description(soup),
            'specifications': extract_specifications(soup),
            'imageUrl': extract_image_url(soup),
            'catalogUrl': url,
            'technicalDocUrl': extract_tech_doc_url(soup),
            'status': 'success'
        }
        
        return data
        
    except Exception as e:
        return {'status': 'failed', 'reason': str(e), 'productId': product_id}

# 批量爬取
results = []
with ThreadPoolExecutor(max_workers=5) as executor:
    for i, result in enumerate(executor.map(crawl_product, df.to_dict('records'))):
        results.append(result)
        if i % 50 == 0:
            print(f"Progress: {i}/{len(df)} ({i/len(df)*100:.1f}%)")

# 保存结果
success_results = [r for r in results if r['status'] == 'success']
failed_results = [r for r in results if r['status'] == 'failed']

success_df = pd.DataFrame(success_results)
success_df.to_csv('agilent_630_results.csv', index=False)

print(f"Success: {len(success_results)}/{len(df)} ({len(success_results)/len(df)*100:.1f}%)")
print(f"Failed: {len(failed_results)}/{len(df)} ({len(failed_results)/len(df)*100:.1f}%)")
```

### B. 质量验证清单

- [ ] 成功率 ≥90%
- [ ] 描述覆盖率 ≥95%
- [ ] A/B级描述 ≥80%
- [ ] 平均描述长度 ≥150字符
- [ ] 平均规格字段数 ≥15个
- [ ] 所有必需字段无缺失
- [ ] 手动抽查10个产品通过
- [ ] 质量报告已生成
- [ ] 所有交付文件已准备

### C. 常见问题FAQ

**Q1: 如果成功率低于90%怎么办？**
A1: 分析失败原因，如果是404错误，记录失败产品清单；如果是解析错误，调整提取逻辑。

**Q2: 如果描述质量不达标怎么办？**
A2: 检查描述提取逻辑，可能需要从其他位置提取描述文本。

**Q3: 如果规格字段数少于15个怎么办？**
A3: 检查规格表格提取逻辑，确保所有字段都被提取。

**Q4: 如果遇到反爬虫机制怎么办？**
A4: 降低请求频率，使用真实浏览器User-Agent，或使用Selenium模拟浏览器。

**Q5: 如何处理JavaScript动态加载的内容？**
A5: 使用Selenium + ChromeDriver，等待页面完全加载后再提取数据。

---

**任务发布时间**: 2025-11-08  
**预期完成时间**: 2025-11-08（当天完成）  
**任务状态**: 🟢 已批准，等待执行
