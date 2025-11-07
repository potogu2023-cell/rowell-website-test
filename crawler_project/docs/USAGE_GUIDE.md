# 爬虫使用指南

## 目录
1. [环境准备](#环境准备)
2. [Agilent爬虫使用](#agilent爬虫使用)
3. [数据处理流程](#数据处理流程)
4. [质量检查](#质量检查)
5. [常见问题](#常见问题)

---

## 环境准备

### 1. Python环境
```bash
python3.11 --version  # 确认Python版本
```

### 2. 安装依赖
```bash
cd /home/ubuntu/crawler_project
pip3 install pandas beautifulsoup4 requests openpyxl
```

### 3. 验证安装
```python
python3.11 << 'EOF'
import pandas as pd
import json
from agilent_crawler import AgilentCrawler

print("✓ 所有依赖已安装")
print("✓ Agilent爬虫模块已加载")
EOF
```

---

## Agilent爬虫使用

### 方法1: 浏览器手动爬取(推荐)

由于Agilent官网有反爬虫机制,推荐使用浏览器方式:

#### 步骤1: 准备产品列表
```python
python3.11 << 'EOF'
import pandas as pd
import json

# 加载Agilent产品
df = pd.read_csv('data/product_list_for_crawler_2025-11-05.csv')
agilent = df[df['brand'] == 'Agilent']

print(f"Agilent产品总数: {len(agilent)}")

# 可以分批处理,每批50-100个
batch_size = 50
batch_1 = agilent.head(batch_size)
batch_1.to_csv('data/agilent_batch_current.csv', index=False)

print(f"当前批次: {len(batch_1)} 个产品")
EOF
```

#### 步骤2: 访问产品页面并记录数据

使用Manus AI的浏览器工具或手动访问:

```python
# 示例: 访问单个产品
# URL: https://www.agilent.com/store/productDetail.jsp?catalogId={partNumber}

# 提取以下信息:
# 1. 产品名称 (Part Number下方的完整名称)
# 2. 产品描述 (产品名称下方的段落文本)
# 3. 技术规格 (Specifications表格)
```

#### 步骤3: 保存爬取数据

将爬取的数据保存为JSON格式:

```json
[
  {
    "product_id": "AGIL-121-1012",
    "part_number": "121-1012",
    "name": "J&W DB-1 GC Column, 10 m, 0.18 mm, 0.18 µm, 7 inch cage",
    "description": "This is the most common GC column format...",
    "specifications": {
      "Length": "10 m",
      "Inner Diameter (ID)": "0.18 mm",
      "Film Thickness": "0.18 µm",
      "Phase": "DB-1"
    }
  }
]
```

保存到: `data/agilent_batch_crawled.json`

#### 步骤4: 处理数据并生成CSV

```bash
python3.11 << 'EOF'
import sys
sys.path.append('/home/ubuntu/crawler_project')
from agilent_crawler import AgilentCrawler
import pandas as pd
import json

# 加载爬取数据
with open('data/agilent_batch_crawled.json', 'r', encoding='utf-8') as f:
    crawled_data = json.load(f)

# 创建爬虫实例
crawler = AgilentCrawler()

# 处理数据
results = []
for item in crawled_data:
    result = crawler.parse_product_page(item)
    results.append(result)

# 保存CSV
df = pd.DataFrame(results)
df.to_csv('output/agilent_batch_results.csv', index=False, encoding='utf-8-sig')

# 生成报告
crawler.results = results
crawler.generate_report('output/agilent_batch_report.md')

print(f"✓ 处理完成: {len(results)} 个产品")
print(f"✓ CSV: output/agilent_batch_results.csv")
print(f"✓ 报告: output/agilent_batch_report.md")
EOF
```

---

### 方法2: 使用Selenium自动化(需要额外配置)

如果要使用Selenium自动化爬取:

#### 步骤1: 安装Selenium
```bash
pip3 install selenium webdriver-manager
```

#### 步骤2: 创建自动化脚本

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import json
import pandas as pd

def crawl_agilent_product(driver, part_number):
    """爬取单个Agilent产品"""
    url = f"https://www.agilent.com/store/productDetail.jsp?catalogId={part_number}"
    
    try:
        driver.get(url)
        time.sleep(2)  # 等待页面加载
        
        # 提取产品名称
        name_element = driver.find_element(By.CSS_SELECTOR, "h2")
        name = name_element.text
        
        # 提取描述
        try:
            desc_element = driver.find_element(By.CSS_SELECTOR, "div.product-description")
            description = desc_element.text
        except:
            description = ""
        
        # 提取规格
        specs = {}
        try:
            spec_table = driver.find_element(By.CSS_SELECTOR, "table.specifications")
            rows = spec_table.find_elements(By.TAG_NAME, "tr")
            for row in rows:
                cells = row.find_elements(By.TAG_NAME, "td")
                if len(cells) >= 2:
                    key = cells[0].text.strip()
                    value = cells[1].text.strip()
                    if key and value:
                        specs[key] = value
        except:
            pass
        
        return {
            'product_id': f'AGIL-{part_number}',
            'part_number': part_number,
            'name': name,
            'description': description,
            'specifications': specs
        }
    
    except Exception as e:
        print(f"错误: {part_number} - {e}")
        return None

# 主程序
def main():
    # 加载产品列表
    df = pd.read_csv('data/agilent_batch_current.csv')
    
    # 初始化浏览器
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')  # 无头模式
    driver = webdriver.Chrome(options=options)
    
    results = []
    for idx, row in df.iterrows():
        print(f"爬取 {idx+1}/{len(df)}: {row['partNumber']}")
        result = crawl_agilent_product(driver, row['partNumber'])
        if result:
            results.append(result)
        time.sleep(1.5)  # 间隔
    
    driver.quit()
    
    # 保存结果
    with open('data/agilent_batch_crawled.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"✓ 爬取完成: {len(results)} 个产品")

if __name__ == '__main__':
    main()
```

保存为: `run_agilent_selenium.py`

运行:
```bash
python3.11 run_agilent_selenium.py
```

---

## 数据处理流程

### 完整流程图

```
1. 准备产品列表
   ↓
2. 爬取产品数据 (浏览器/Selenium)
   ↓
3. 保存原始数据 (JSON)
   ↓
4. 解析和清理数据
   ↓
5. 生成CSV和报告
   ↓
6. 质量检查
   ↓
7. 交付
```

### 批量处理建议

对于630个Agilent产品,建议分批处理:

**批次划分**:
- 批次1: 1-100 (测试批次)
- 批次2: 101-200
- 批次3: 201-300
- ...
- 批次7: 601-630

**每批次流程**:
1. 准备批次产品列表
2. 爬取数据
3. 生成CSV和报告
4. 质量检查
5. 合并到总结果

**合并批次结果**:
```python
import pandas as pd
import glob

# 读取所有批次CSV
csv_files = glob.glob('output/agilent_batch_*.csv')
dfs = [pd.read_csv(f) for f in csv_files]

# 合并
merged_df = pd.concat(dfs, ignore_index=True)
merged_df.to_csv('output/agilent_all_results.csv', index=False, encoding='utf-8-sig')

print(f"✓ 合并完成: {len(merged_df)} 个产品")
```

---

## 质量检查

### 自动检查

```python
import pandas as pd

df = pd.read_csv('output/agilent_batch_results.csv')

print("=== 质量检查报告 ===\n")

# 1. 产品名称完整性
name_complete = df['name'].notna().sum()
print(f"1. 产品名称完整性: {name_complete}/{len(df)} ({name_complete/len(df)*100:.1f}%)")

# 2. 描述覆盖率
desc_complete = df['description'].notna().sum()
print(f"2. 描述覆盖率: {desc_complete}/{len(df)} ({desc_complete/len(df)*100:.1f}%)")

# 3. 规格完整性
specs_complete = df['specifications'].notna().sum()
print(f"3. 规格完整性: {specs_complete}/{len(df)} ({specs_complete/len(df)*100:.1f}%)")

# 4. 描述质量分布
print(f"\n4. 描述质量分布:")
quality_counts = df['descriptionQuality'].value_counts()
for quality, count in quality_counts.items():
    print(f"   {quality}: {count} ({count/len(df)*100:.1f}%)")

# 5. A/B级描述占比
ab_count = len(df[df['descriptionQuality'].isin(['high', 'medium'])])
print(f"\n5. A/B级描述占比: {ab_count}/{len(df)} ({ab_count/len(df)*100:.1f}%)")

# 6. 检查是否达标
print(f"\n=== 达标情况 ===")
print(f"✓ 产品名称完整性 ≥100%: {'✓' if name_complete/len(df) >= 1.0 else '✗'}")
print(f"✓ 规格完整性 ≥90%: {'✓' if specs_complete/len(df) >= 0.9 else '✗'}")
print(f"✓ 描述覆盖率 ≥70%: {'✓' if desc_complete/len(df) >= 0.7 else '✗'}")
print(f"✓ A/B级描述 ≥30%: {'✓' if ab_count/len(df) >= 0.3 else '✗'}")
```

### 手动抽查

建议抽查5-10个产品,验证:
1. 产品名称是否完整准确
2. 描述是否合理
3. 规格JSON格式是否正确
4. 规格字段数量是否≥3

---

## 常见问题

### Q1: 403 Forbidden错误
**原因**: 请求过快或被识别为爬虫
**解决**: 
- 增加请求间隔(2-3秒)
- 使用浏览器方式爬取
- 添加User-Agent头

### Q2: 产品页面404
**原因**: 产品可能已停产或零件号错误
**解决**:
- 标记为"未找到"
- 在报告中列出
- 人工确认

### Q3: 描述为空
**原因**: 官网确实没有提供描述
**解决**:
- 使用提取策略(从名称和规格提取)
- 标记descriptionQuality为"extracted"

### Q4: 规格字段太少
**原因**: 某些产品类型规格较少
**解决**:
- 如果<3个字段,标记为"部分成功"
- 在报告中说明

### Q5: 爬取速度太慢
**原因**: 网络延迟或页面加载慢
**解决**:
- 使用并行爬取(多个浏览器实例)
- 优化等待时间
- 分批处理

---

## 下一步

完成Agilent后,参考本指南为其他品牌创建爬虫:
1. 研究品牌官网结构
2. 创建品牌专用爬虫类
3. 测试2-3个产品
4. 批量爬取
5. 生成报告

---

**版本**: 1.0
**更新日期**: 2025-11-04
