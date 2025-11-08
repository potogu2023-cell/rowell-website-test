# 剩余品牌爬取任务指南

**品牌数量**：3个（Shimadzu, Develosil, Avantor）  
**总产品数**：331个  
**优先级**：🔥 高优先级  
**预计完成日期**：2025年11月13日

---

## 📋 任务概述

### 品牌列表

| 品牌 | 产品数 | CSV文件 | 预计时间 |
|------|--------|---------|----------|
| **Shimadzu** | 130个 | `shimadzu_product_list_for_crawler.csv` | 1-2天 |
| **Develosil** | 118个 | `develosil_product_list_for_crawler.csv` | 1-2天 |
| **Avantor** | 83个 | `avantor_product_list_for_crawler.csv` | 1天 |

### 质量目标（统一标准）
- ✅ **成功率**：≥90%
- ✅ **描述覆盖率**：≥70%
- ✅ **A/B级描述**：≥40%
- ✅ **平均规格字段**：≥10个/产品

---

## 🌐 品牌官网信息

### 1. Shimadzu（岛津制作所）
- **官网**：https://www.shimadzu.com/
- **中国站**：https://www.shimadzu.com.cn/
- **产品线**：色谱柱、样品前处理、标准品
- **特点**：结构化良好，信息完整，多语言支持

**URL模式**：
```
搜索：https://www.shimadzu.com/search?q={partNumber}
产品页：https://www.shimadzu.com/an/products/{category}/{product-slug}
```

### 2. Develosil（日本野村化学）
- **官网**：https://www.nomurachemical.co.jp/
- **英文站**：https://www.nomurachemical.co.jp/en/
- **产品线**：HPLC色谱柱
- **特点**：日本品牌，信息相对简洁

**URL模式**：
```
产品列表：https://www.nomurachemical.co.jp/en/products/hplc/
产品页：https://www.nomurachemical.co.jp/en/products/hplc/{product-slug}
```

### 3. Avantor（VWR/J.T.Baker）
- **官网**：https://www.avantorsciences.com/
- **VWR站**：https://us.vwr.com/
- **产品线**：色谱柱、化学试剂、实验室耗材
- **特点**：大型供应商，产品信息详细

**URL模式**：
```
搜索：https://www.avantorsciences.com/search?q={partNumber}
产品页：https://www.avantorsciences.com/products/{product-id}
```

---

## 🔍 通用爬取策略

### URL发现
1. **优先使用CSV中的catalogUrl**（如果有）
2. **通过官网搜索**：`{官网}/search?q={partNumber}`
3. **从搜索结果提取产品链接**
4. **验证partNumber匹配**

### 数据提取

#### 1. 产品描述（description）
**提取位置**：
- 产品概述/描述区域
- 特性和优势
- 应用说明

**质量等级**：
- **high**（A级）：≥500字符
- **medium**（B级）：200-499字符
- **low**（C级）：<200字符

#### 2. 技术规格（specifications）
**关键字段**：
```
- particle_size（粒径）
- pore_size（孔径）
- column_length（柱长）
- column_id（内径）
- packing_material（填料）
- phase_type（相）
- ph_range（pH范围）
- temperature_range（温度范围）
- usp_code（USP代码）
- application（应用）
```

**提取方法**：
- 从规格表格提取（`<table class="specifications">`）
- 从定义列表提取（`<dl class="specs">`）
- 从产品详情区域提取

#### 3. 产品名称（name）
- 优先使用中文名称
- 如果只有英文，保留英文
- 去除品牌前缀

#### 4. Catalog URL
- 保存实际访问的产品页面URL
- 使用规范化URL（去除查询参数）

---

## 📤 输出格式

### JSON格式（每个品牌一个文件）

**文件命名**：
- `shimadzu_crawl_results.json`
- `develosil_crawl_results.json`
- `avantor_crawl_results.json`

**JSON结构**：
```json
[
  {
    "productId": 12345,
    "partNumber": "227-30001-91",
    "name": "Shim-pack GIST C18色谱柱",
    "description": "详细的产品描述...",
    "descriptionQuality": "high",
    "specifications": {
      "particle_size": "5 μm",
      "pore_size": "120 Å",
      "column_length": "250 mm",
      "column_id": "4.6 mm",
      "phase_type": "C18",
      "ph_range": "2-7.5"
    },
    "catalogUrl": "https://www.shimadzu.com/...",
    "status": "success"
  }
]
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `productId` | number | ✅ | 数据库产品ID |
| `partNumber` | string | ✅ | 产品型号 |
| `name` | string | ✅ | 产品名称 |
| `description` | string | ⚠️ | 产品描述 |
| `descriptionQuality` | string | ⚠️ | high/medium/low |
| `specifications` | object | ⚠️ | 技术规格 |
| `catalogUrl` | string | ✅ | 产品页URL |
| `status` | string | ✅ | success/failed |
| `errorMessage` | string | ❌ | 错误信息（仅失败时） |

---

## 🛠️ Python实现示例

```python
import asyncio
import csv
import json
from playwright.async_api import async_playwright

async def crawl_product(page, product_info, brand_config):
    """
    通用产品爬取函数
    """
    product_id = product_info['productId']
    part_number = product_info['partNumber']
    catalog_url = product_info.get('catalogUrl')
    
    try:
        # 1. 访问产品页面
        if catalog_url:
            await page.goto(catalog_url, timeout=30000)
        else:
            # 通过搜索查找
            search_url = f"{brand_config['search_url']}?q={part_number}"
            await page.goto(search_url, timeout=30000)
            first_result = await page.query_selector("a.product-link, a.search-result")
            if first_result:
                await first_result.click()
                await page.wait_for_load_state("networkidle")
            else:
                return {"productId": product_id, "partNumber": part_number, 
                        "status": "failed", "errorMessage": "Not found"}
        
        # 2. 提取产品名称
        name_element = await page.query_selector("h1.product-name, h1")
        name = await name_element.inner_text() if name_element else product_info['name']
        
        # 3. 提取描述
        description = ""
        for selector in [".product-description", ".description", ".overview"]:
            element = await page.query_selector(selector)
            if element:
                description += await element.inner_text() + "\n\n"
        
        description = description.strip()
        desc_quality = "high" if len(description) >= 500 else ("medium" if len(description) >= 200 else "low")
        
        # 4. 提取规格
        specifications = {}
        table = await page.query_selector("table.specifications, table.specs")
        if table:
            rows = await table.query_selector_all("tr")
            for row in rows:
                cells = await row.query_selector_all("td, th")
                if len(cells) >= 2:
                    key = await cells[0].inner_text()
                    value = await cells[1].inner_text()
                    specifications[key.strip().lower().replace(" ", "_")] = value.strip()
        
        return {
            "productId": product_id,
            "partNumber": part_number,
            "name": name.strip(),
            "description": description,
            "descriptionQuality": desc_quality,
            "specifications": specifications,
            "catalogUrl": page.url,
            "status": "success"
        }
        
    except Exception as e:
        return {
            "productId": product_id,
            "partNumber": part_number,
            "status": "failed",
            "errorMessage": str(e)
        }

async def crawl_brand(brand_name, csv_file, brand_config):
    """
    爬取单个品牌的所有产品
    """
    # 读取CSV
    products = []
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        products = list(reader)
    
    print(f"\n🔄 Crawling {brand_name}: {len(products)} products")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        results = []
        for i, product in enumerate(products, 1):
            print(f"   [{i}/{len(products)}] {product['partNumber']}")
            result = await crawl_product(page, product, brand_config)
            results.append(result)
            await asyncio.sleep(1)  # 延迟
        
        await browser.close()
    
    # 保存结果
    output_file = f"{brand_name.lower()}_crawl_results.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    success_count = sum(1 for r in results if r['status'] == 'success')
    print(f"   ✅ {brand_name} completed: {success_count}/{len(results)} ({success_count/len(results)*100:.1f}%)")
    
    return results

async def main():
    """
    主函数：爬取所有品牌
    """
    brands = [
        {
            "name": "Shimadzu",
            "csv": "shimadzu_product_list_for_crawler.csv",
            "config": {"search_url": "https://www.shimadzu.com/search"}
        },
        {
            "name": "Develosil",
            "csv": "develosil_product_list_for_crawler.csv",
            "config": {"search_url": "https://www.nomurachemical.co.jp/en/search"}
        },
        {
            "name": "Avantor",
            "csv": "avantor_product_list_for_crawler.csv",
            "config": {"search_url": "https://www.avantorsciences.com/search"}
        }
    ]
    
    print("📦 Starting crawl for all remaining brands...\n")
    
    all_results = {}
    for brand in brands:
        results = await crawl_brand(brand["name"], brand["csv"], brand["config"])
        all_results[brand["name"]] = results
    
    print("\n🎉 All brands completed!")
    
    # 生成汇总报告
    total_products = sum(len(results) for results in all_results.values())
    total_success = sum(sum(1 for r in results if r['status'] == 'success') 
                       for results in all_results.values())
    
    print(f"\n📊 Summary:")
    print(f"   Total products: {total_products}")
    print(f"   Success: {total_success} ({total_success/total_products*100:.1f}%)")
    
    for brand_name, results in all_results.items():
        success = sum(1 for r in results if r['status'] == 'success')
        print(f"   - {brand_name}: {success}/{len(results)} ({success/len(results)*100:.1f}%)")

if __name__ == "__main__":
    asyncio.run(main())
```

---

## 📈 质量检查清单

### 每个品牌完成后检查
- [ ] 成功率≥90%
- [ ] 描述覆盖率≥70%
- [ ] A/B级描述≥40%
- [ ] 平均规格字段≥10个
- [ ] 所有productId都有结果
- [ ] catalogUrl都是有效URL

### 数据清洗
- 去除多余空白和换行
- 统一规格字段键名
- 验证数值格式
- 去除HTML标签

---

## ⚠️ 注意事项

### 反爬虫策略
- 使用真实User-Agent
- 请求间隔1-2秒
- 保持会话Cookie
- 失败重试2-3次

### 数据质量
- 描述长度≥500字符（high级别）
- 规格字段≥10个
- URL规范化
- 正确处理多语言字符

### 错误处理
- 页面加载超时30秒
- 元素未找到尝试多个选择器
- 网络错误重试3次
- 数据验证标记异常

---

## 📤 提交清单

每个品牌提交：
1. ✅ 爬取结果JSON文件
2. ✅ 质量报告（成功率、描述覆盖率等）
3. ✅ 错误日志（如果有失败）

---

## 📞 联系方式

- **项目负责人**：顾伟
- **技术支持**：help.manus.im

---

**任务优先级**：🔥 高  
**预计完成时间**：2025年11月13日  
**预计工作量**：4-5天

祝爬取顺利！🚀
