# Shimadzu品牌产品爬取任务指令

**品牌**：Shimadzu（岛津制作所）  
**产品数量**：130个  
**优先级**：🔥 高优先级（第7个品牌）  
**预计工作量**：1-2天  
**目标完成日期**：2025年11月10日

---

## 📋 任务概述

### 目标
爬取Shimadzu品牌130个色谱耗材产品的详细信息，包括产品描述、技术规格、应用信息等。

### 质量目标
- **成功率**：≥90%（至少117个产品）
- **描述覆盖率**：≥70%（至少91个产品有描述）
- **描述质量**：≥40%的产品达到A/B级（high/medium质量）
- **规格完整性**：平均≥10个规格字段/产品

---

## 🌐 Shimadzu官网结构分析

### 品牌背景
- **公司**：Shimadzu Corporation（岛津制作所）
- **国家**：日本
- **官网**：https://www.shimadzu.com/
- **产品线**：色谱柱、样品前处理、标准品等

### 网站特点
- ✅ **结构化良好**：产品页面有清晰的HTML结构
- ✅ **信息完整**：包含详细的技术规格和应用信息
- ⚠️ **多语言支持**：英语、日语、中文版本
- ⚠️ **区域分站**：不同地区有不同的网站（.com, .com.cn, .co.jp）

---

## 🔍 爬取策略

### 输入数据
CSV文件：`shimadzu_product_list_for_crawler.csv`

包含字段：
- `productId`：数据库产品ID
- `partNumber`：产品型号
- `brand`：品牌名称（Shimadzu）
- `name`：产品名称
- `catalogUrl`：产品目录页URL（如果有）

### URL发现策略

#### 策略1：使用catalogUrl（优先）
如果CSV中有`catalogUrl`，直接使用该URL。

#### 策略2：通过官网搜索
如果没有catalogUrl，通过Shimadzu官网搜索功能查找：

1. **搜索URL模式**：
   ```
   https://www.shimadzu.com/search?q={partNumber}
   ```

2. **搜索结果解析**：
   - 提取搜索结果中的产品链接
   - 优先选择英文版产品页面
   - 验证partNumber匹配

#### 策略3：构造URL（备选）
部分Shimadzu产品URL可能遵循固定模式：
```
https://www.shimadzu.com/an/products/{category}/{product-slug}
```

---

## 📊 数据提取方法

### 1. 产品描述（description）

**提取位置**：
- 产品概述部分（Product Overview / Description）
- 特性和优势（Features & Benefits）
- 应用说明（Applications）

**提取方法**：
```python
# 示例代码
description_selectors = [
    ".product-description",
    ".product-overview",
    "[class*='description']",
    ".features-benefits"
]

description = ""
for selector in description_selectors:
    element = page.query_selector(selector)
    if element:
        description += element.inner_text().strip() + "\n\n"
```

**质量等级判断**：
- **high**（A级）：≥500字符，包含详细的技术说明和应用信息
- **medium**（B级）：200-499字符，包含基本的产品说明
- **low**（C级）：<200字符，仅简单描述

### 2. 技术规格（specifications）

**提取位置**：
- 规格表格（Specifications Table）
- 技术参数（Technical Parameters）
- 产品详情（Product Details）

**关键规格字段**：
```python
spec_fields = {
    # 色谱柱规格
    "particle_size": ["Particle Size", "粒径"],
    "pore_size": ["Pore Size", "孔径"],
    "column_length": ["Length", "柱长"],
    "column_id": ["Inner Diameter", "内径", "ID"],
    "column_format": ["Format", "格式"],
    
    # 填料信息
    "packing_material": ["Packing Material", "填料"],
    "phase_type": ["Phase", "相"],
    "end_capping": ["End-capping", "封端"],
    
    # 使用条件
    "ph_range": ["pH Range", "pH范围"],
    "temperature_range": ["Temperature Range", "温度范围"],
    "max_pressure": ["Maximum Pressure", "最大压力"],
    
    # 其他
    "usp_code": ["USP Code", "USP代码"],
    "application": ["Application", "应用"],
}
```

**提取方法**：
```python
# 示例代码
specifications = {}

# 方法1：从表格提取
table = page.query_selector("table.specifications")
if table:
    rows = table.query_selector_all("tr")
    for row in rows:
        cells = row.query_selector_all("td, th")
        if len(cells) >= 2:
            key = cells[0].inner_text().strip()
            value = cells[1].inner_text().strip()
            specifications[key] = value

# 方法2：从定义列表提取
dl = page.query_selector("dl.product-specs")
if dl:
    dts = dl.query_selector_all("dt")
    dds = dl.query_selector_all("dd")
    for dt, dd in zip(dts, dds):
        key = dt.inner_text().strip()
        value = dd.inner_text().strip()
        specifications[key] = value
```

### 3. 产品名称（name）

**提取位置**：
- 页面标题（`<h1>`标签）
- 产品名称区域（`.product-name`, `.product-title`）

**注意事项**：
- 优先使用中文名称（如果有）
- 如果只有英文名称，保留英文
- 去除多余的品牌前缀（如"Shimadzu"）

### 4. Catalog URL

**要求**：
- 保存实际访问的产品页面URL
- 使用规范化的URL（去除查询参数）
- 优先使用英文版URL

---

## 📤 输出格式

### JSON格式
每个产品输出一个JSON对象：

```json
{
  "productId": 12345,
  "partNumber": "227-30001-91",
  "name": "Shim-pack GIST C18色谱柱",
  "description": "Shim-pack GIST C18是一款高性能反相色谱柱...",
  "descriptionQuality": "high",
  "specifications": {
    "particle_size": "5 μm",
    "pore_size": "120 Å",
    "column_length": "250 mm",
    "column_id": "4.6 mm",
    "packing_material": "Silica",
    "phase_type": "C18",
    "ph_range": "2-7.5",
    "usp_code": "L1"
  },
  "catalogUrl": "https://www.shimadzu.com/an/products/hplc-columns/shim-pack-gist-c18",
  "status": "success"
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `productId` | number | ✅ | 数据库产品ID（来自CSV） |
| `partNumber` | string | ✅ | 产品型号（来自CSV） |
| `name` | string | ✅ | 产品名称（优先中文） |
| `description` | string | ⚠️ | 产品描述（尽量获取） |
| `descriptionQuality` | string | ⚠️ | 描述质量等级：high/medium/low |
| `specifications` | object | ⚠️ | 技术规格（键值对） |
| `catalogUrl` | string | ✅ | 产品页面URL |
| `status` | string | ✅ | 爬取状态：success/failed |
| `errorMessage` | string | ❌ | 错误信息（仅失败时） |

---

## 🛠️ Python技术实现建议

### 推荐技术栈
- **浏览器自动化**：Playwright（支持动态内容）
- **HTML解析**：BeautifulSoup4
- **数据处理**：Pandas
- **并发控制**：asyncio

### 示例代码框架

```python
import asyncio
import csv
import json
from playwright.async_api import async_playwright

async def crawl_shimadzu_product(page, product_info):
    """
    爬取单个Shimadzu产品
    """
    product_id = product_info['productId']
    part_number = product_info['partNumber']
    catalog_url = product_info['catalogUrl']
    
    try:
        # 1. 访问产品页面
        if catalog_url:
            await page.goto(catalog_url, timeout=30000)
        else:
            # 通过搜索查找
            search_url = f"https://www.shimadzu.com/search?q={part_number}"
            await page.goto(search_url, timeout=30000)
            # 点击第一个搜索结果
            first_result = await page.query_selector("a.search-result-link")
            if first_result:
                await first_result.click()
                await page.wait_for_load_state("networkidle")
            else:
                return {
                    "productId": product_id,
                    "partNumber": part_number,
                    "status": "failed",
                    "errorMessage": "Product not found in search"
                }
        
        # 2. 提取产品名称
        name_element = await page.query_selector("h1.product-name, h1.product-title")
        name = await name_element.inner_text() if name_element else product_info['name']
        
        # 3. 提取描述
        description = ""
        desc_selectors = [".product-description", ".product-overview", ".features"]
        for selector in desc_selectors:
            element = await page.query_selector(selector)
            if element:
                description += await element.inner_text() + "\n\n"
        
        description = description.strip()
        
        # 判断描述质量
        desc_quality = "low"
        if len(description) >= 500:
            desc_quality = "high"
        elif len(description) >= 200:
            desc_quality = "medium"
        
        # 4. 提取规格
        specifications = {}
        
        # 从表格提取
        table = await page.query_selector("table.specifications, table.product-specs")
        if table:
            rows = await table.query_selector_all("tr")
            for row in rows:
                cells = await row.query_selector_all("td, th")
                if len(cells) >= 2:
                    key = await cells[0].inner_text()
                    value = await cells[1].inner_text()
                    specifications[key.strip()] = value.strip()
        
        # 5. 获取当前URL
        current_url = page.url
        
        return {
            "productId": product_id,
            "partNumber": part_number,
            "name": name.strip(),
            "description": description,
            "descriptionQuality": desc_quality,
            "specifications": specifications,
            "catalogUrl": current_url,
            "status": "success"
        }
        
    except Exception as e:
        return {
            "productId": product_id,
            "partNumber": part_number,
            "status": "failed",
            "errorMessage": str(e)
        }

async def main():
    # 读取CSV
    products = []
    with open('shimadzu_product_list_for_crawler.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        products = list(reader)
    
    print(f"📋 Total products to crawl: {len(products)}")
    
    # 启动浏览器
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        results = []
        for i, product in enumerate(products, 1):
            print(f"🔄 [{i}/{len(products)}] Crawling {product['partNumber']}...")
            result = await crawl_shimadzu_product(page, product)
            results.append(result)
            
            # 保存中间结果
            if i % 10 == 0:
                with open('shimadzu_results_temp.json', 'w', encoding='utf-8') as f:
                    json.dump(results, f, ensure_ascii=False, indent=2)
            
            # 延迟，避免过快请求
            await asyncio.sleep(1)
        
        await browser.close()
    
    # 保存最终结果
    with open('shimadzu_crawl_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    # 统计
    success_count = sum(1 for r in results if r['status'] == 'success')
    print(f"\n✅ Crawling completed!")
    print(f"   Success: {success_count}/{len(results)} ({success_count/len(results)*100:.1f}%)")

if __name__ == "__main__":
    asyncio.run(main())
```

---

## 📈 质量验证清单

### 自检步骤
1. ✅ 成功率≥90%？
2. ✅ 描述覆盖率≥70%？
3. ✅ A/B级描述≥40%？
4. ✅ 平均规格字段≥10个？
5. ✅ 所有productId都有对应结果？
6. ✅ catalogUrl都是有效的URL？
7. ✅ 产品名称优先使用中文？

### 数据清洗
- 去除描述中的多余空白和换行
- 统一规格字段的键名（如"Particle Size" → "particle_size"）
- 验证数值型规格的格式（如"5 μm"）
- 去除HTML标签和特殊字符

---

## ⚠️ 注意事项

### 1. 反爬虫策略
- **User-Agent**：使用真实的浏览器User-Agent
- **请求频率**：每个请求间隔1-2秒
- **Cookie处理**：保持会话Cookie
- **错误重试**：失败后重试2-3次，间隔递增

### 2. 数据质量
- **描述长度**：尽量获取完整描述（≥500字符）
- **规格完整性**：至少获取10个关键规格字段
- **URL规范化**：去除查询参数，使用规范URL
- **编码处理**：正确处理日文和中文字符

### 3. 错误处理
- **页面加载超时**：30秒超时，记录错误
- **元素未找到**：尝试多个选择器，记录警告
- **网络错误**：重试3次，间隔2/4/8秒
- **数据验证**：检查必填字段，标记异常数据

---

## 📞 支持联系

如有任何问题或需要技术支持，请联系：
- **项目负责人**：顾伟
- **技术支持**：help.manus.im

---

**任务创建时间**：2025年11月8日  
**预计完成时间**：2025年11月10日  
**优先级**：🔥 高

---

祝爬取顺利！🚀
