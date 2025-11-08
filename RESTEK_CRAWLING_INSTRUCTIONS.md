# Restek品牌产品数据爬取任务指令

**任务编号**: ROWELL-CRAWLER-RESTEK-001  
**优先级**: 高  
**目标品牌**: Restek  
**目标产品数**: 215个  
**预计耗时**: 2-3小时

---

## 📋 任务概述

本任务需要爬取**Restek品牌**的215个HPLC/GC色谱耗材产品的详细信息。Restek是全球领先的色谱耗材制造商，产品线包括HPLC色谱柱、GC色谱柱、样品前处理产品等。

### 任务目标

1. **完整性**: 爬取所有215个产品的详细信息
2. **准确性**: 确保产品名称、型号、规格等关键信息准确无误
3. **丰富性**: 尽可能获取产品描述、技术参数、应用领域、图片等详细信息
4. **结构化**: 输出标准化的CSV格式，便于批量导入

---

## 📁 输入文件

**文件名**: `restek_product_list_for_crawler.csv`

**文件格式**:
```csv
productId,partNumber,brand,name,catalogUrl
REST-9314262,9314262,Restek,"Raptor ARC-18, 1.8 µm, 150 x 2.1 mm HPLC Column",
REST-9314A12-T,9314A12-T,Restek,"Raptor Inert ARC-18, 2.7 µm, 100 x 2.1 mm HPLC Column",
...
```

**字段说明**:
- `productId`: 产品唯一标识符（数据库主键，格式：REST-{partNumber}）
- `partNumber`: Restek官方型号
- `brand`: 品牌名称（固定为"Restek"）
- `name`: 产品名称（从数据库获取，可能不完整）
- `catalogUrl`: 产品详情页URL（**注意：此字段为空，需要构建URL**）

---

## 🎯 数据采集要求

### 必需字段 (Required)

以下字段**必须**采集，缺失任何一个字段视为爬取失败：

1. **productId** (string)
   - 说明：产品唯一标识符，直接从输入CSV复制
   - 示例：`REST-9314262`
   - 验证：必须与输入CSV完全一致

2. **partNumber** (string)
   - 说明：Restek官方型号
   - 示例：`9314262`, `9314A12-T`
   - 验证：必须与输入CSV完全一致

3. **brand** (string)
   - 说明：品牌名称
   - 固定值：`Restek`

4. **name** (string)
   - 说明：产品完整名称
   - 示例：`Raptor ARC-18, 1.8 µm, 150 x 2.1 mm HPLC Column`
   - 来源：从产品详情页的标题或H1标签获取
   - 验证：不能为空，长度≥10字符

5. **catalogUrl** (string)
   - 说明：产品详情页URL
   - 示例：`https://www.restek.com/catalog/view/9314262`
   - 构建规则：`https://www.restek.com/catalog/view/{partNumber}`
   - 验证：必须是有效的URL

### 重要字段 (Important)

以下字段**强烈建议**采集，缺失会影响数据质量评分：

6. **description** (string)
   - 说明：产品详细描述
   - 来源：产品详情页的描述文本
   - 要求：
     - 优先级1：产品特性描述（Features, Benefits, Description等section）
     - 优先级2：应用领域描述（Applications, Recommended Use等）
     - 优先级3：产品简介（Product Overview等）
   - 长度要求：
     - 优秀：≥200字符
     - 良好：100-199字符
     - 及格：50-99字符
     - 不及格：<50字符
   - 示例：
     ```
     Raptor ARC-18 columns feature a unique Achiral Resolution Core (ARC) technology that provides excellent peak shape for acidic and basic compounds without the need for ion-pairing reagents. The 1.8 µm particle size delivers high efficiency and fast separations, making it ideal for UHPLC applications. These columns are particularly well-suited for pharmaceutical analysis, metabolite profiling, and method development.
     ```

7. **specifications** (JSON object)
   - 说明：产品技术规格参数
   - 格式：JSON对象，键值对形式
   - 来源：产品详情页的规格表格（Specifications, Technical Data等）
   - 要求：
     - 优秀：≥15个字段
     - 良好：10-14个字段
     - 及格：5-9个字段
     - 不及格：<5个字段
   - 常见字段：
     - `Column Length`: 柱长（如"150 mm", "100 mm"）
     - `Inner Diameter`: 内径（如"2.1 mm", "3.0 mm"）
     - `Particle Size`: 粒径（如"1.8 µm", "2.7 µm"）
     - `Pore Size`: 孔径（如"90 Å", "120 Å"）
     - `pH Range`: pH范围（如"1.5-10.0"）
     - `Max Pressure`: 最大压力（如"600 bar", "1000 psi"）
     - `Max Temperature`: 最高温度（如"60°C", "80°C"）
     - `Stationary Phase`: 固定相类型（如"C18", "Biphenyl"）
     - `End Capping`: 封端方式（如"Yes", "No"）
     - `USP Code`: USP分类代码（如"L1", "L11"）
     - `Carbon Load`: 碳载量（如"18%", "12%"）
     - `Surface Area`: 表面积（如"350 m²/g"）
   - 示例：
     ```json
     {
       "Column Length": "150 mm",
       "Inner Diameter": "2.1 mm",
       "Particle Size": "1.8 µm",
       "Pore Size": "90 Å",
       "pH Range": "1.5-10.0",
       "Max Pressure": "600 bar",
       "Max Temperature": "60°C",
       "Stationary Phase": "C18",
       "End Capping": "Yes",
       "USP Code": "L1",
       "Carbon Load": "18%",
       "Surface Area": "350 m²/g"
     }
     ```

8. **imageUrl** (string)
   - 说明：产品主图URL
   - 来源：产品详情页的主图片
   - 要求：
     - 必须是完整的URL（包含https://）
     - 优先选择高分辨率图片
     - 如果有多张图片，选择第一张产品图（非示意图、非图表）
   - 示例：`https://www.restek.com/globalassets/images/products/columns/9314262.jpg`

### 可选字段 (Optional)

以下字段**可选**采集，有助于提升数据完整性：

9. **descriptionQuality** (string)
   - 说明：描述质量等级（自动评估）
   - 取值：`high` (≥200字符), `medium` (100-199), `low` (50-99), `extracted` (<50), `none` (无描述)
   - 注意：此字段由爬虫程序根据description长度自动生成

10. **applications** (array of strings)
    - 说明：应用领域列表
    - 示例：`["Pharmaceutical Analysis", "Metabolite Profiling", "Environmental Testing"]`

11. **relatedProducts** (array of strings)
    - 说明：相关产品型号列表
    - 示例：`["9314A12-T", "9309A5E"]`

---

## 🌐 目标网站信息

### 网站基本信息

- **网站名称**: Restek Corporation
- **主域名**: https://www.restek.com
- **产品目录页**: https://www.restek.com/catalog
- **产品详情页格式**: `https://www.restek.com/catalog/view/{partNumber}`

### 页面结构特点

**产品详情页典型结构**:

```html
<!-- 产品标题 -->
<h1 class="product-title">Raptor ARC-18, 1.8 µm, 150 x 2.1 mm HPLC Column</h1>

<!-- 产品型号 -->
<div class="product-sku">Cat. No.: 9314262</div>

<!-- 产品图片 -->
<img class="product-image" src="https://www.restek.com/globalassets/images/products/columns/9314262.jpg" alt="Product Image">

<!-- 产品描述 -->
<div class="product-description">
  <h2>Product Description</h2>
  <p>Raptor ARC-18 columns feature...</p>
</div>

<!-- 产品特性 -->
<div class="product-features">
  <h2>Features & Benefits</h2>
  <ul>
    <li>Excellent peak shape for acidic and basic compounds</li>
    <li>No ion-pairing reagents required</li>
    ...
  </ul>
</div>

<!-- 技术规格 -->
<div class="product-specifications">
  <h2>Specifications</h2>
  <table>
    <tr>
      <td>Column Length</td>
      <td>150 mm</td>
    </tr>
    <tr>
      <td>Inner Diameter</td>
      <td>2.1 mm</td>
    </tr>
    ...
  </table>
</div>

<!-- 应用领域 -->
<div class="product-applications">
  <h2>Applications</h2>
  <ul>
    <li>Pharmaceutical Analysis</li>
    <li>Metabolite Profiling</li>
    ...
  </ul>
</div>
```

**注意事项**:
1. Restek网站可能使用动态加载，建议使用Selenium或Playwright
2. 部分产品可能需要登录才能查看完整信息（如价格），但产品描述和规格通常是公开的
3. 网站可能有反爬虫机制，建议：
   - 设置合理的请求间隔（建议2-5秒）
   - 使用真实的User-Agent
   - 避免并发请求过多
4. 如果遇到404页面，说明产品可能已下架，记录为失败

---

## 📤 输出格式

### CSV文件格式

**文件名**: `restek_215_all_results.csv`

**编码**: UTF-8 with BOM

**分隔符**: 逗号 (,)

**字段顺序**:
```csv
productId,partNumber,brand,name,description,descriptionQuality,specifications,imageUrl,catalogUrl
```

**字段格式要求**:

1. **文本字段** (productId, partNumber, brand, name, description, descriptionQuality, imageUrl, catalogUrl):
   - 如果包含逗号、换行符或双引号，必须用双引号包裹
   - 双引号需要转义为两个双引号 (`""`)
   - 示例：`"Raptor ARC-18, 1.8 µm, 150 x 2.1 mm HPLC Column"`

2. **JSON字段** (specifications):
   - 必须是有效的JSON字符串
   - 必须用双引号包裹
   - 内部双引号需要转义
   - 示例：`"{\"Column Length\":\"150 mm\",\"Inner Diameter\":\"2.1 mm\"}"`

3. **空值处理**:
   - 如果字段无数据，保留为空（两个逗号之间无内容）
   - 不要使用NULL、null、N/A等文本

### 示例输出

```csv
productId,partNumber,brand,name,description,descriptionQuality,specifications,imageUrl,catalogUrl
REST-9314262,9314262,Restek,"Raptor ARC-18, 1.8 µm, 150 x 2.1 mm HPLC Column","Raptor ARC-18 columns feature a unique Achiral Resolution Core (ARC) technology that provides excellent peak shape for acidic and basic compounds without the need for ion-pairing reagents. The 1.8 µm particle size delivers high efficiency and fast separations, making it ideal for UHPLC applications.",high,"{\"Column Length\":\"150 mm\",\"Inner Diameter\":\"2.1 mm\",\"Particle Size\":\"1.8 µm\",\"Pore Size\":\"90 Å\",\"pH Range\":\"1.5-10.0\",\"Max Pressure\":\"600 bar\",\"Max Temperature\":\"60°C\",\"Stationary Phase\":\"C18\",\"End Capping\":\"Yes\",\"USP Code\":\"L1\"}",https://www.restek.com/globalassets/images/products/columns/9314262.jpg,https://www.restek.com/catalog/view/9314262
REST-9314A12-T,9314A12-T,Restek,"Raptor Inert ARC-18, 2.7 µm, 100 x 2.1 mm HPLC Column","Raptor Inert ARC-18 columns combine the benefits of ARC technology with an inert surface treatment for improved peak shape of chelating compounds. Ideal for metal-sensitive analytes in pharmaceutical and environmental applications.",medium,"{\"Column Length\":\"100 mm\",\"Inner Diameter\":\"2.1 mm\",\"Particle Size\":\"2.7 µm\",\"pH Range\":\"1.5-10.0\",\"Stationary Phase\":\"C18\"}",https://www.restek.com/globalassets/images/products/columns/9314A12-T.jpg,https://www.restek.com/catalog/view/9314A12-T
```

---

## 🎯 质量标准

### 必达标准 (Minimum Acceptable)

以下标准**必须**达到，否则任务视为不合格：

| 指标 | 要求 | 说明 |
|------|------|------|
| **成功率** | ≥90% | 至少194个产品成功爬取（215 × 90%） |
| **产品名称完整性** | 100% | 所有产品必须有完整的name字段 |
| **零件号完整性** | 100% | 所有产品的partNumber必须与输入CSV一致 |
| **规格完整性** | ≥90% | 至少194个产品有specifications字段（≥3个规格参数） |
| **描述覆盖率** | ≥70% | 至少151个产品有description字段（≥50字符） |
| **CSV格式正确性** | 100% | 输出CSV必须符合格式要求，能被标准CSV解析器解析 |

### 优秀标准 (Excellent)

以下标准为优秀标准，达到者将获得额外奖励：

| 指标 | 要求 | 说明 |
|------|------|------|
| **成功率** | ≥95% | 至少205个产品成功爬取 |
| **描述覆盖率** | ≥80% | 至少172个产品有描述 |
| **A/B级描述占比** | ≥40% | 至少86个产品的描述≥100字符 |
| **平均规格字段数** | ≥15个 | 所有产品的规格字段平均数≥15 |
| **图片覆盖率** | ≥70% | 至少151个产品有imageUrl |

---

## 🚀 爬取流程建议

### 阶段1：环境准备 (10分钟)

1. **安装依赖**:
   ```bash
   pip install pandas requests beautifulsoup4 selenium
   # 或
   npm install puppeteer csv-parser csv-writer
   ```

2. **读取输入CSV**:
   ```python
   import pandas as pd
   products = pd.read_csv('restek_product_list_for_crawler.csv')
   print(f"Total products to crawl: {len(products)}")
   ```

3. **初始化浏览器** (如使用Selenium):
   ```python
   from selenium import webdriver
   from selenium.webdriver.chrome.options import Options
   
   options = Options()
   options.add_argument('--headless')
   options.add_argument('--user-agent=Mozilla/5.0...')
   driver = webdriver.Chrome(options=options)
   ```

### 阶段2：小批量测试 (20分钟)

1. **测试前10个产品**:
   - 验证URL构建逻辑是否正确
   - 检查页面结构是否与预期一致
   - 测试数据提取逻辑
   - 验证CSV输出格式

2. **调整爬虫策略**:
   - 根据测试结果调整CSS选择器或XPath
   - 优化等待时间和重试逻辑
   - 处理特殊情况（如404、重定向等）

### 阶段3：全量爬取 (90-120分钟)

1. **批量爬取**:
   ```python
   results = []
   for index, row in products.iterrows():
       try:
           # 构建URL
           url = f"https://www.restek.com/catalog/view/{row['partNumber']}"
           
           # 爬取数据
           product_data = crawl_product(url, row)
           results.append(product_data)
           
           # 进度提示
           if (index + 1) % 10 == 0:
               print(f"Progress: {index + 1}/{len(products)}")
           
           # 请求间隔
           time.sleep(random.uniform(2, 5))
       except Exception as e:
           print(f"Error crawling {row['partNumber']}: {e}")
           results.append(create_failed_record(row))
   ```

2. **实时保存**:
   - 每爬取50个产品保存一次中间结果
   - 避免因异常导致所有数据丢失

### 阶段4：质量检查 (20分钟)

1. **数据验证**:
   ```python
   # 检查必需字段
   assert all(results['productId'].notna())
   assert all(results['partNumber'].notna())
   assert all(results['name'].notna())
   
   # 检查成功率
   success_rate = (results['description'].notna().sum() / len(results)) * 100
   print(f"Success rate: {success_rate:.1f}%")
   
   # 检查描述质量
   high_quality = (results['descriptionQuality'] == 'high').sum()
   medium_quality = (results['descriptionQuality'] == 'medium').sum()
   print(f"High quality: {high_quality}, Medium quality: {medium_quality}")
   ```

2. **生成质量报告**:
   - 统计成功/失败数量
   - 分析失败原因
   - 计算各项质量指标
   - 生成详细的质量报告文档

### 阶段5：结果提交 (10分钟)

1. **输出最终CSV**:
   ```python
   results.to_csv('restek_215_all_results.csv', index=False, encoding='utf-8-sig')
   ```

2. **生成质量报告**:
   - 创建Markdown格式的质量报告
   - 包含统计数据、问题分析、改进建议等
   - 文件名：`RESTEK_CRAWLING_REPORT.md`

---

## ⚠️ 常见问题和解决方案

### 问题1：产品页面404

**原因**: 产品可能已下架或URL构建错误

**解决方案**:
1. 检查URL构建逻辑是否正确
2. 尝试在Restek官网搜索该型号
3. 如果确认产品已下架，在结果中标记为失败
4. 记录失败原因：`"Product not found (404)"`

### 问题2：页面加载缓慢

**原因**: 网站服务器响应慢或网络问题

**解决方案**:
1. 增加页面加载等待时间（如10-15秒）
2. 使用显式等待（等待特定元素出现）
3. 如果多次超时，跳过该产品并记录

### 问题3：反爬虫拦截

**原因**: 请求频率过高或User-Agent异常

**解决方案**:
1. 增加请求间隔（3-5秒）
2. 使用真实的User-Agent
3. 添加Referer头
4. 考虑使用代理IP（如果允许）
5. 分批次爬取，避免短时间大量请求

### 问题4：规格表格结构不统一

**原因**: 不同产品类型的规格表格格式可能不同

**解决方案**:
1. 编写灵活的表格解析逻辑
2. 尝试多种CSS选择器
3. 如果无法解析，至少提取关键规格（柱长、内径、粒径）
4. 记录解析失败的产品，供后续人工处理

### 问题5：描述文本包含HTML标签

**原因**: 直接提取innerHTML而非textContent

**解决方案**:
1. 使用`.get_text()`（BeautifulSoup）或`.textContent`（Selenium）
2. 清理多余的空白字符和换行符
3. 移除HTML实体编码（如`&nbsp;`）

---

## 📊 质量报告模板

爬取完成后，请生成一份质量报告，包含以下内容：

```markdown
# Restek品牌产品数据爬取质量报告

**任务编号**: ROWELL-CRAWLER-RESTEK-001  
**爬取日期**: YYYY-MM-DD  
**品牌**: Restek  
**目标产品数**: 215

---

## 📊 执行总结

### 爬取结果

| 指标 | 数值 | 目标 | 达标情况 |
|------|------|------|---------|
| 总产品数 | 215 | 215 | ✅ 100% |
| 成功爬取 | XXX | ≥194 (90%) | ✅/❌ XX% |
| 描述覆盖率 | XXX | ≥151 (70%) | ✅/❌ XX% |
| 规格完整性 | XXX | ≥194 (90%) | ✅/❌ XX% |
| A/B级描述 | XXX | ≥86 (40%) | ✅/❌ XX% |
| 图片覆盖率 | XXX | ≥151 (70%) | ✅/❌ XX% |
| 平均规格字段 | XX个 | ≥15个 | ✅/❌ |

### 爬取时长

- 开始时间: HH:MM
- 结束时间: HH:MM
- 总耗时: XX分钟
- 平均速度: XX秒/产品

---

## 📈 数据质量统计

### 描述质量分布

| 质量等级 | 数量 | 占比 |
|---------|------|------|
| high (≥200字符) | XX | XX% |
| medium (100-199字符) | XX | XX% |
| low (50-99字符) | XX | XX% |
| extracted (<50字符) | XX | XX% |
| none (无描述) | XX | XX% |

### 规格字段统计

- 平均字段数: XX个
- 最多字段数: XX个
- 最少字段数: XX个

---

## 🔍 问题分析

### 失败产品列表

| 产品型号 | 失败原因 |
|---------|---------|
| XXXXXX | 404 Not Found |
| XXXXXX | Timeout |
| ... | ... |

### 改进建议

1. ...
2. ...

---

## 📁 交付文件

1. **restek_215_all_results.csv** - 完整爬取结果
2. **RESTEK_CRAWLING_REPORT.md** - 本质量报告

---

**报告生成时间**: YYYY-MM-DD HH:MM:SS
```

---

## 📞 联系方式

如有任何问题，请通过以下方式联系：

- **项目负责人**: ROWELL HPLC网站建设总工程师
- **联系方式**: 通过Manus AI任务系统

---

## ✅ 任务检查清单

在提交结果前，请确认以下事项：

- [ ] 已读取输入CSV文件（restek_product_list_for_crawler.csv）
- [ ] 已爬取所有215个产品
- [ ] 成功率≥90%（至少194个产品）
- [ ] 所有产品都有productId、partNumber、brand、name、catalogUrl字段
- [ ] 至少70%的产品有description字段（≥50字符）
- [ ] 至少90%的产品有specifications字段（≥3个参数）
- [ ] 输出CSV格式正确，能被标准解析器解析
- [ ] 已生成质量报告（RESTEK_CRAWLING_REPORT.md）
- [ ] 已检查CSV中没有乱码或格式错误
- [ ] 已准备好提交restek_215_all_results.csv和质量报告

---

**祝爬取顺利！** 🚀
