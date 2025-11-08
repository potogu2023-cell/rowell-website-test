# ACE品牌产品爬取任务指令文档

## 📋 任务概述

**品牌**：ACE (Avantor® ACE®)  
**产品数量**：151个  
**任务优先级**：🔥 高优先级（第6个品牌）  
**预计工作量**：2天  
**目标完成日期**：2025年11月10日

### 质量目标
- ✅ **成功率**：≥90%（至少136个产品）
- 📝 **描述覆盖率**：≥70%（至少106个产品有详细描述）
- 🔍 **规格完整性**：≥80%（至少121个产品有核心技术规格）

---

## 🌐 ACE官网结构分析

### 品牌背景
- **母公司**：Avantor (VWR)
- **官网**：https://www.avantorsciences.com/
- **产品线**：ACE是Avantor旗下的HPLC色谱柱品牌
- **特点**：高性能C18、C8、CN等多种固定相

### URL模式识别

根据产品清单中的Part Number，ACE产品的URL模式可能包括：

1. **Avantor官网产品页**：
   ```
   https://www.avantorsciences.com/[region]/product/[part-number]/[product-name]
   ```

2. **VWR官网（Avantor子公司）**：
   ```
   https://[region].vwr.com/store/product/[part-number]/[product-name]
   ```

3. **搜索策略**：
   - 使用Part Number（如 `76382-576`）在Avantor/VWR官网搜索
   - 使用产品名称关键词（如 `ACE C18 5um`）搜索
   - 检查是否有产品目录PDF可下载

### 页面结构特征

**典型ACE产品页面包含**：
- 产品名称和Part Number
- 技术规格表格（粒径、孔径、柱长、内径等）
- 产品描述（应用、特性、优势）
- 相关文档下载（COA、说明书、应用手册）
- 可能包含USP分类信息

---

## 🔍 爬取策略

### 第一步：URL发现

由于产品清单中`catalogUrl`字段为空，需要先发现每个产品的URL：

```python
import requests
from bs4 import BeautifulSoup
import time

def find_ace_product_url(part_number, product_name):
    """
    尝试多种方式发现ACE产品URL
    """
    # 方法1: Avantor搜索
    search_url = f"https://www.avantorsciences.com/search?q={part_number}"
    response = requests.get(search_url, headers={'User-Agent': 'Mozilla/5.0'})
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # 查找产品链接
    product_links = soup.select('a[href*="/product/"]')
    if product_links:
        return product_links[0]['href']
    
    # 方法2: VWR搜索
    vwr_search = f"https://us.vwr.com/store/search?keyword={part_number}"
    # ... 类似逻辑
    
    # 方法3: Google搜索作为备选
    google_query = f"ACE {part_number} site:avantorsciences.com OR site:vwr.com"
    # ... 使用Google Custom Search API
    
    return None
```

**注意事项**：
- 每次请求之间添加1-2秒延迟
- 使用合适的User-Agent
- 记录无法找到URL的产品（需要人工检查）

### 第二步：数据提取

找到产品页面后，提取以下信息：

```python
def extract_ace_product_data(url):
    """
    从ACE产品页面提取数据
    """
    response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
    soup = BeautifulSoup(response.text, 'html.parser')
    
    data = {
        'catalogUrl': url,
        'description': '',
        'specifications': {},
        'qualityLevel': 'unknown'
    }
    
    # 提取产品描述
    desc_section = soup.select_one('.product-description, .product-details, [class*="description"]')
    if desc_section:
        data['description'] = desc_section.get_text(strip=True)
    
    # 提取技术规格
    spec_table = soup.select_one('table.specifications, .spec-table, [class*="specifications"]')
    if spec_table:
        for row in spec_table.select('tr'):
            cells = row.select('td, th')
            if len(cells) >= 2:
                key = cells[0].get_text(strip=True).lower()
                value = cells[1].get_text(strip=True)
                data['specifications'][key] = value
    
    # 质量等级评估
    desc_length = len(data['description'])
    spec_count = len(data['specifications'])
    
    if desc_length > 500 and spec_count >= 5:
        data['qualityLevel'] = 'high'
    elif desc_length > 200 and spec_count >= 3:
        data['qualityLevel'] = 'medium'
    else:
        data['qualityLevel'] = 'low'
    
    return data
```

---

## 📊 输出格式要求

### CSV文件格式

输出文件名：`ace_enriched_data.csv`

**必需字段**：

| 字段名 | 说明 | 示例 |
|--------|------|------|
| `productId` | 产品ID（来自输入CSV） | `245139` |
| `partNumber` | 零件号 | `76382-576` |
| `brand` | 品牌名称 | `ACE` |
| `name` | 产品名称 | `Avantor® ACE® C18, HPLC Columns, 5 µm` |
| `catalogUrl` | 产品页面URL | `https://www.avantorsciences.com/...` |
| `description` | 产品描述（完整文本） | `ACE C18 is a high-performance...` |
| `qualityLevel` | 数据质量等级 | `high` / `medium` / `low` / `unknown` |
| `status` | 爬取状态 | `success` / `failed` / `not_found` |

**规格字段**（JSON格式存储在`specifications`列）：

```json
{
  "particle_size": "5 µm",
  "pore_size": "100 Å",
  "column_length": "150 mm",
  "inner_diameter": "4.6 mm",
  "phase_type": "C18",
  "ph_range": "2.0-8.0",
  "max_pressure": "400 bar",
  "max_temperature": "60°C",
  "usp_code": "L1",
  "end_capping": "Yes"
}
```

### 质量等级定义

| 等级 | 描述长度 | 规格字段数 | 说明 |
|------|----------|------------|------|
| **high** | >500字符 | ≥5个 | 描述详细，规格完整 |
| **medium** | 200-500字符 | 3-4个 | 描述基本完整 |
| **low** | <200字符 | <3个 | 信息不足 |
| **unknown** | 无描述 | 0个 | 未找到产品页面 |

---

## 🛠️ 技术实现建议

### Python爬虫框架

```python
import pandas as pd
import requests
from bs4 import BeautifulSoup
import json
import time
from typing import Dict, Optional

class ACECrawler:
    def __init__(self, input_csv: str):
        self.df = pd.read_csv(input_csv)
        self.results = []
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def crawl_all(self):
        """爬取所有产品"""
        for idx, row in self.df.iterrows():
            print(f"Processing {idx+1}/{len(self.df)}: {row['partNumber']}")
            
            # 步骤1: 查找URL
            url = self.find_product_url(row['partNumber'], row['name'])
            
            if not url:
                self.results.append({
                    **row.to_dict(),
                    'catalogUrl': '',
                    'description': '',
                    'specifications': '{}',
                    'qualityLevel': 'unknown',
                    'status': 'not_found'
                })
                continue
            
            # 步骤2: 提取数据
            try:
                data = self.extract_product_data(url)
                self.results.append({
                    **row.to_dict(),
                    **data,
                    'status': 'success'
                })
            except Exception as e:
                print(f"Error processing {row['partNumber']}: {e}")
                self.results.append({
                    **row.to_dict(),
                    'catalogUrl': url,
                    'description': '',
                    'specifications': '{}',
                    'qualityLevel': 'unknown',
                    'status': 'failed'
                })
            
            # 延迟避免被封
            time.sleep(2)
    
    def find_product_url(self, part_number: str, product_name: str) -> Optional[str]:
        """查找产品URL"""
        # 实现URL查找逻辑
        pass
    
    def extract_product_data(self, url: str) -> Dict:
        """提取产品数据"""
        # 实现数据提取逻辑
        pass
    
    def save_results(self, output_csv: str):
        """保存结果"""
        df_results = pd.DataFrame(self.results)
        df_results.to_csv(output_csv, index=False, encoding='utf-8')
        print(f"✅ Results saved to {output_csv}")

# 使用示例
if __name__ == "__main__":
    crawler = ACECrawler('ace_product_list_for_crawler.csv')
    crawler.crawl_all()
    crawler.save_results('ace_enriched_data.csv')
```

### 关键技术点

1. **URL发现策略**：
   - 优先使用Part Number搜索
   - 备选使用产品名称关键词
   - 记录无法找到的产品供人工检查

2. **反爬虫对策**：
   - 随机User-Agent
   - 请求间隔1-2秒
   - 使用代理IP（如需要）
   - 处理验证码（如遇到）

3. **数据清洗**：
   - 去除HTML标签
   - 统一单位格式（µm, mm, Å等）
   - 处理特殊字符和编码

4. **错误处理**：
   - 网络超时重试（最多3次）
   - 记录失败原因
   - 保存中间结果避免重复爬取

---

## 📈 质量验证清单

### 自动检查

```python
def validate_results(csv_file: str):
    """验证爬取结果质量"""
    df = pd.read_csv(csv_file)
    
    total = len(df)
    success = len(df[df['status'] == 'success'])
    has_description = len(df[df['description'].str.len() > 0])
    has_specs = len(df[df['specifications'] != '{}'])
    
    print(f"📊 质量报告")
    print(f"总产品数: {total}")
    print(f"成功爬取: {success} ({success/total*100:.1f}%)")
    print(f"有描述: {has_description} ({has_description/total*100:.1f}%)")
    print(f"有规格: {has_specs} ({has_specs/total*100:.1f}%)")
    
    # 质量等级分布
    quality_dist = df['qualityLevel'].value_counts()
    print(f"\n质量等级分布:")
    for level, count in quality_dist.items():
        print(f"  {level}: {count} ({count/total*100:.1f}%)")
    
    # 检查是否达标
    if success/total >= 0.9 and has_description/total >= 0.7:
        print("\n✅ 质量达标！")
    else:
        print("\n⚠️  质量未达标，需要改进")
```

### 人工抽查

随机抽取10-20个产品进行人工检查：
- 描述是否准确完整
- 规格是否正确提取
- URL是否有效
- 数据格式是否规范

---

## ⚠️ 注意事项

### 1. 网站访问限制
- Avantor/VWR可能有地区访问限制
- 部分产品可能需要登录才能查看完整信息
- 注意遵守robots.txt规则

### 2. 数据清洗重点
- 统一单位格式（µm vs um, Å vs A）
- 去除多余空格和换行符
- 处理HTML实体编码（&nbsp;, &deg;等）

### 3. 特殊情况处理
- 产品停产或下架：标记为`status: discontinued`
- 重定向到其他产品：记录新URL
- 多个规格型号：选择最常用的规格

### 4. 性能优化
- 使用异步请求提高速度（但注意并发限制）
- 缓存已访问的页面避免重复请求
- 定期保存中间结果

---

## 📤 提交清单

完成爬取后，请提交以下文件：

1. ✅ **ace_enriched_data.csv** - 完整的爬取结果
2. ✅ **ace_crawling_log.txt** - 爬取日志（包含错误信息）
3. ✅ **ace_quality_report.txt** - 质量验证报告
4. ✅ **ace_failed_products.csv** - 失败产品清单（如有）

### 文件命名规范
- 使用小写字母和下划线
- 包含品牌名称前缀
- 包含日期后缀（如需要）

---

## 🎯 成功标准

- ✅ 成功率 ≥ 90% (至少136个产品)
- ✅ 描述覆盖率 ≥ 70% (至少106个产品)
- ✅ 规格完整性 ≥ 80% (至少121个产品)
- ✅ 数据格式正确，无乱码
- ✅ URL有效可访问

---

## 📞 联系方式

如有任何问题或需要澄清，请及时联系项目负责人。

**预祝爬取顺利！** 🚀
