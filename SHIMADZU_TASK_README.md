# Shimadzu品牌爬取任务交付包

## 🎯 任务目标

爬取**Shimadzu品牌130个色谱耗材产品**的详细信息，包括产品描述、技术规格、应用信息等。

**质量标准**：
- ✅ 成功率≥90%（至少117个产品）
- ✅ 描述覆盖率≥70%（至少91个产品有描述）
- ✅ A/B级描述≥40%（至少52个产品）
- ✅ 平均规格字段≥10个/产品

---

## 📋 快速开始

### 1. 输入文件
- **文件名**：`shimadzu_product_list_for_crawler.csv`
- **产品数量**：130个
- **字段**：productId, partNumber, brand, name, catalogUrl

### 2. 输出文件
- **文件名**：`shimadzu_crawl_results.json`
- **格式**：JSON数组，每个产品一个对象

### 3. 执行步骤
```bash
# 1. 安装依赖
pip install playwright beautifulsoup4 pandas

# 2. 安装浏览器
playwright install chromium

# 3. 运行爬虫
python shimadzu_crawler.py

# 4. 检查结果
python validate_results.py shimadzu_crawl_results.json
```

---

## 📊 输入文件格式

`shimadzu_product_list_for_crawler.csv`：

```csv
productId,partNumber,brand,name,catalogUrl
12345,227-30001-91,Shimadzu,Shim-pack GIST C18色谱柱,https://www.shimadzu.com/...
12346,227-30002-92,Shimadzu,Shim-pack GIST C8色谱柱,https://www.shimadzu.com/...
...
```

---

## 📤 输出文件格式

`shimadzu_crawl_results.json`：

```json
[
  {
    "productId": 12345,
    "partNumber": "227-30001-91",
    "name": "Shim-pack GIST C18色谱柱",
    "description": "Shim-pack GIST C18是一款高性能反相色谱柱，采用高纯度硅胶填料...",
    "descriptionQuality": "high",
    "specifications": {
      "particle_size": "5 μm",
      "pore_size": "120 Å",
      "column_length": "250 mm",
      "column_id": "4.6 mm",
      "phase_type": "C18",
      "ph_range": "2-7.5"
    },
    "catalogUrl": "https://www.shimadzu.com/an/products/hplc-columns/shim-pack-gist-c18",
    "status": "success"
  },
  ...
]
```

---

## 🌐 数据源

### Shimadzu官网
- **主站**：https://www.shimadzu.com/
- **中国站**：https://www.shimadzu.com.cn/
- **产品线**：色谱柱、样品前处理、标准品

### 爬取策略提示
1. **URL发现**：优先使用CSV中的catalogUrl，如果没有则通过搜索查找
2. **搜索URL**：`https://www.shimadzu.com/search?q={partNumber}`
3. **语言版本**：优先英文版，中文名称优先
4. **动态内容**：部分内容可能需要JavaScript渲染，建议使用Playwright

---

## 📈 质量检查清单

### 数据完整性
- [ ] 所有130个产品都有对应的结果
- [ ] 每个结果都包含productId和partNumber
- [ ] 成功率≥90%（至少117个success状态）

### 描述质量
- [ ] ≥70%的产品有description字段
- [ ] ≥40%的产品descriptionQuality为high或medium
- [ ] 描述长度合理（high≥500字符，medium≥200字符）

### 规格完整性
- [ ] ≥80%的产品有specifications字段
- [ ] 平均规格字段数≥10个
- [ ] 关键字段存在：particle_size, column_length, column_id, phase_type

### URL有效性
- [ ] 所有success状态的产品都有catalogUrl
- [ ] catalogUrl是有效的HTTP/HTTPS链接
- [ ] catalogUrl可以正常访问

---

## 📤 提交清单

请提交以下文件：

1. **✅ 爬取结果**：`shimadzu_crawl_results.json`
2. **✅ 质量报告**：`shimadzu_quality_report.md`（包含成功率、描述覆盖率等统计）
3. **✅ 错误日志**：`shimadzu_errors.log`（如果有失败的产品）
4. **⚠️ 爬虫代码**：`shimadzu_crawler.py`（可选，便于复现）

---

## 💡 技术提示

### Shimadzu网站特点
- ✅ **结构化良好**：产品页面HTML结构清晰
- ✅ **信息完整**：包含详细的技术规格和应用信息
- ⚠️ **多语言支持**：英语、日语、中文版本
- ⚠️ **区域分站**：不同地区有不同的网站

### 推荐工具
- **浏览器自动化**：Playwright（支持动态内容）
- **HTML解析**：BeautifulSoup4
- **数据处理**：Pandas

### 常见问题
1. **Q: 如何处理多语言版本？**  
   A: 优先使用英文版页面，产品名称优先中文。

2. **Q: 如何提取规格表格？**  
   A: 查找`<table class="specifications">`或类似结构，提取键值对。

3. **Q: 如何判断描述质量？**  
   A: 根据字符长度：high≥500, medium≥200, low<200。

---

## 📞 联系方式

如有任何问题，请联系：
- **项目负责人**：顾伟
- **技术支持**：help.manus.im

---

**任务优先级**：🔥 高  
**预计完成时间**：2025年11月10日  
**预计工作量**：1-2天

祝任务顺利！🚀
