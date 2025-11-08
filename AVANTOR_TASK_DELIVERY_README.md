# Avantor爬取任务交付说明

**任务编号**：ROWELL-CRAWL-006  
**品牌**：Avantor® ACE®  
**产品数量**：83个  
**优先级**：⭐⭐⭐⭐⭐ 最高  
**预计工作量**：4-6小时

---

## 📦 任务包内容

本任务包包含以下文件：

1. **AVANTOR_CRAWLING_TASK_INSTRUCTIONS.md**（本文件）
   - 完整的任务指令和技术实施方案
   - 数据提取规则和质量标准
   - Python示例代码

2. **avantor_product_list_for_crawler.csv**
   - 83个产品的清单
   - 包含：productId、partNumber、brand、name、catalogUrl

3. **AVANTOR_TASK_DELIVERY_README.md**
   - 快速开始指南
   - 交付清单

---

## 🚀 快速开始

### 第1步：环境准备

**安装Python依赖**：
```bash
pip install requests beautifulsoup4 lxml
```

### 第2步：下载任务文件

确保以下文件在同一目录：
- `avantor_product_list_for_crawler.csv`
- `crawl_avantor.py`（你的爬虫脚本）

### 第3步：运行爬虫

```bash
python crawl_avantor.py
```

### 第4步：验证输出

检查生成的文件：
- `avantor_crawled_data_YYYYMMDD.json`（主要数据文件）
- `avantor_crawl_log_YYYYMMDD.txt`（日志文件）

---

## ✅ 质量检查清单

在交付前，请确认：

### 自动验证
- [ ] 成功率 ≥ 90%（至少75个产品）
- [ ] 描述覆盖率 ≥ 95%（至少72个产品有描述）
- [ ] 平均描述长度 ≥ 500字符
- [ ] 平均规格字段数 ≥ 10个
- [ ] A/B级描述 ≥ 80%（至少60个产品）
- [ ] JSON文件格式正确

### 手动验证
- [ ] 随机抽取10个产品，验证数据准确性
- [ ] 检查描述内容是否与官网一致
- [ ] 检查规格数据是否与官网一致
- [ ] 检查图片链接是否能正常访问

---

## 📋 交付清单

请提交以下文件：

### 必需文件（3个）

1. **avantor_crawled_data_YYYYMMDD.json**
   - 完整的爬取数据
   - 包含 crawlInfo、products、failures

2. **avantor_crawl_log_YYYYMMDD.txt**
   - 详细的爬取日志
   - 包含时间戳、状态、警告、错误

3. **avantor_quality_report_YYYYMMDD.md**
   - 数据质量报告
   - 包含质量指标、分析、建议

### 可选文件（2个）

4. **avantor_failed_products_YYYYMMDD.csv**
   - 失败产品清单（如果有）

5. **avantor_sample_screenshots/**
   - 抽样产品的页面截图（至少10个）

---

## 📊 预期质量指标

根据技术分析，Avantor品牌的预期质量指标：

| 指标 | 目标值 | 预期值 |
|------|--------|--------|
| **成功率** | ≥90% | 90-95% |
| **描述覆盖率** | ≥95% | 95-100% |
| **平均描述长度** | ≥500字符 | 600+字符 |
| **平均规格字段数** | ≥10个 | 13个 |
| **A级描述占比** | ≥60% | 70-80% |
| **B级描述占比** | ≥20% | 15-20% |

**数据质量评级**：预期 ⭐⭐⭐⭐⭐（与Waters、Agilent同级）

---

## 🎯 核心技术要点

### URL发现策略

**关键点**：Avantor产品URL包含内部ID，无法直接推断

**解决方案**：
1. 访问搜索页面：`https://www.avantor.com/search?searchTerm={partNumber}`
2. 提取第一个产品链接
3. 访问产品详情页

**示例**：
```
Part Number: ACE-111-0546
搜索URL: https://www.avantor.com/search?searchTerm=ACE-111-0546
产品URL: https://www.avantor.com/p/ace-5-c18-hplc-column-5-m-100-x-46-mm-ace-111-0546
```

### 数据提取重点

**必需字段**（至少8个）：
- particleSize（粒径）
- poreSize（孔径）
- columnLength（柱长）
- innerDiameter（内径）
- phRange（pH范围）
- stationaryPhase（固定相）
- endCapping（端基封尾）
- carbonLoad（碳载量）

**可选字段**（尽量提取）：
- maxPressure（最大压力）
- temperatureRange（温度范围）
- application（应用领域）
- series（系列名称）
- uspClassification（USP分类）

---

## ⏱️ 时间安排

| 阶段 | 任务 | 预计时间 |
|------|------|---------|
| 阶段1 | 环境准备、代码开发 | 1小时 |
| 阶段2 | URL发现（83个产品） | 1.5-2小时 |
| 阶段3 | 数据爬取（75-79个产品） | 1-1.5小时 |
| 阶段4 | 数据清洗和验证 | 0.5-1小时 |
| 阶段5 | 质量报告生成 | 0.5-1小时 |
| **总计** | | **4-6小时** |

### 里程碑报告

请在以下时间节点报告进度：
- **M1（1小时内）**：完成代码开发，测试前5个产品
- **M2（3小时内）**：完成50%产品爬取（约40个）
- **M3（5小时内）**：完成100%产品爬取（约75-79个）
- **M4（6小时内）**：完成数据验证和质量报告

---

## 🚨 常见问题

### Q1：搜索结果为空怎么办？
**A**：记录到 failures 数组，reason 设置为 "Product not found in search results"，继续下一个产品。

### Q2：搜索结果有多个产品怎么办？
**A**：选择第一个结果（通常是最相关的），在日志中记录警告。

### Q3：产品页面加载失败怎么办？
**A**：记录到 failures 数组，reason 设置为 "Product page not accessible (HTTP {status_code})"，继续下一个产品。

### Q4：描述为空或过短怎么办？
**A**：仍然保存产品数据，dataQualityGrade 设置为 "D"，在日志中记录警告。

### Q5：规格字段不足8个怎么办？
**A**：仍然保存产品数据，dataQualityGrade 根据字段数量降级，在日志中记录警告。

### Q6：CSV中的Part Number格式异常怎么办？
**A**：跳过该产品，记录到 failures 数组，reason 设置为 "Invalid Part Number format"。

---

## 📞 技术支持

如有任何问题，请联系：
- **项目负责人**：[您的姓名]
- **邮箱**：[您的邮箱]
- **微信**：[您的微信号]

---

## 🎉 为什么选择Avantor？

基于深度技术分析和ROI评估，Avantor是剩余品牌中**唯一强烈推荐**的选择：

✅ **数据质量最高**：600+字符描述，13个规格字段  
✅ **成功率最高**：90-95%，几乎无风险  
✅ **时间投入最少**：4-6小时  
✅ **ROI最高**：与Waters、Agilent同级的高质量数据

**对比其他品牌**：
- Shimadzu：中等质量（200-300字符，6-8个字段），7-10小时
- Develosil：低质量（50-100字符，3-4个字段），11-17小时，**强烈不推荐**

---

**祝爬取顺利！期待高质量的数据交付！** 🚀

---

**任务批准人**：项目负责人  
**任务批准日期**：2025年11月8日  
**预期完成日期**：2025年11月8日（当天完成）
