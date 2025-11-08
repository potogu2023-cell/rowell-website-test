# ACE品牌爬取任务包 - 交付说明

## 🎯 任务目标

爬取 **ACE品牌151个产品** 的详细信息，包括产品描述、技术规格等。

**质量标准**：
- ✅ 成功率 ≥ 90% (至少136个产品)
- ✅ 描述覆盖率 ≥ 70% (至少106个产品有详细描述)
- ✅ 规格完整性 ≥ 80% (至少121个产品有核心技术规格)

---

## 📦 任务包内容

本任务包包含以下文件：

### 1. `ace_product_list_for_crawler.csv` (13KB)
**输入文件** - 包含151个ACE产品的基础信息

**字段说明**：
- `productId`: 产品ID
- `partNumber`: 零件号（如 `76382-576`）
- `brand`: 品牌名称（`ACE`）
- `name`: 产品名称
- `catalogUrl`: 产品URL（当前为空，需要爬虫发现）

### 2. `ACE_CRAWLING_INSTRUCTIONS.md` (15KB+)
**详细指令文档** - 包含完整的爬取策略和技术实现

**主要内容**：
- 📋 任务概述和质量目标
- 🌐 ACE官网结构分析
- 🔍 详细爬取策略（URL发现 + 数据提取）
- 📊 输出格式要求（21个字段说明）
- 🛠️ Python技术实现建议（完整代码示例）
- 📈 质量验证清单和自检步骤
- ⚠️ 注意事项（反爬虫、数据清洗、错误处理）

### 3. `ACE_TASK_README.md` (本文件)
**任务说明** - 快速开始指南

---

## 🚀 快速开始

### 步骤1：阅读指令文档
```bash
# 仔细阅读详细指令文档
cat ACE_CRAWLING_INSTRUCTIONS.md
```

### 步骤2：准备环境
```bash
# 安装Python依赖
pip install pandas requests beautifulsoup4 lxml
```

### 步骤3：开始爬取
```python
# 使用指令文档中的代码模板
python ace_crawler.py
```

### 步骤4：验证质量
```python
# 运行质量检查脚本
python validate_ace_results.py
```

### 步骤5：提交结果
提交以下文件：
- `ace_enriched_data.csv` - 完整爬取结果
- `ace_crawling_log.txt` - 爬取日志
- `ace_quality_report.txt` - 质量报告
- `ace_failed_products.csv` - 失败产品清单（如有）

---

## 📊 输入/输出文件说明

### 输入文件：`ace_product_list_for_crawler.csv`

```csv
productId,partNumber,brand,name,catalogUrl
245139,"76382-576","ACE","Avantor® ACE® C18, HPLC Columns, 5 µm",""
245140,"76386-626","ACE","Avantor® ACE® C18, HPLC Columns, 5 µm",""
...
```

### 输出文件：`ace_enriched_data.csv`

**必需字段**：
- `productId`, `partNumber`, `brand`, `name` - 来自输入文件
- `catalogUrl` - 产品页面URL（需爬虫发现）
- `description` - 产品详细描述
- `specifications` - 技术规格（JSON格式）
- `qualityLevel` - 数据质量等级（high/medium/low/unknown）
- `status` - 爬取状态（success/failed/not_found）

**示例输出**：
```csv
productId,partNumber,brand,name,catalogUrl,description,specifications,qualityLevel,status
245139,"76382-576","ACE","Avantor® ACE® C18, HPLC Columns, 5 µm","https://www.avantorsciences.com/...","ACE C18 is a high-performance reversed-phase column...","{"particle_size":"5 µm","pore_size":"100 Å",...}","high","success"
```

---

## 🌐 数据源提示

### ACE产品主要数据源

1. **Avantor官网**（推荐）
   - URL: https://www.avantorsciences.com/
   - 特点：官方数据，信息完整
   - 搜索方式：使用Part Number搜索

2. **VWR官网**（备选）
   - URL: https://us.vwr.com/
   - 特点：Avantor子公司，产品信息同步
   - 搜索方式：产品目录搜索

3. **产品目录PDF**（补充）
   - 可能包含批量产品信息
   - 需要PDF解析技术

### URL发现策略

由于输入CSV中`catalogUrl`为空，需要：

1. **方法1**：使用Part Number在Avantor官网搜索
   ```
   https://www.avantorsciences.com/search?q=76382-576
   ```

2. **方法2**：使用产品名称关键词搜索
   ```
   搜索词: "ACE C18 5um 150mm 4.6mm"
   ```

3. **方法3**：Google搜索（备选）
   ```
   site:avantorsciences.com OR site:vwr.com "76382-576"
   ```

---

## 📈 质量检查清单

### 自动检查项

- [ ] 成功率 ≥ 90%
- [ ] 描述覆盖率 ≥ 70%
- [ ] 规格完整性 ≥ 80%
- [ ] 所有URL有效可访问
- [ ] 无乱码和格式错误
- [ ] JSON格式规范正确

### 人工抽查项

- [ ] 随机抽取10个产品验证描述准确性
- [ ] 检查规格提取是否正确
- [ ] 确认质量等级评估合理
- [ ] 验证失败产品的失败原因

---

## ⚠️ 重要提示

### 1. 网站访问
- Avantor/VWR可能有地区访问限制
- 建议使用美国或欧洲IP访问
- 遵守网站robots.txt规则

### 2. 反爬虫策略
- 请求间隔：1-2秒
- 使用真实User-Agent
- 避免高并发请求
- 处理可能的验证码

### 3. 数据质量
- 优先保证描述的准确性
- 规格字段统一单位格式
- 清理HTML标签和特殊字符
- 记录无法爬取的产品及原因

### 4. 时间安排
- 预计总耗时：2天
- URL发现：0.5天
- 数据爬取：1天
- 质量检查：0.5天

---

## 📞 支持

如遇到以下情况，请及时反馈：

- ❌ 无法访问Avantor/VWR官网
- ❌ 大量产品URL无法找到（>20%）
- ❌ 网站结构与预期不符
- ❌ 遇到验证码或IP封禁
- ❌ 其他技术问题

---

## 📤 提交清单

完成后请提交：

1. ✅ `ace_enriched_data.csv` - 完整爬取结果（必需）
2. ✅ `ace_crawling_log.txt` - 详细日志（必需）
3. ✅ `ace_quality_report.txt` - 质量报告（必需）
4. ✅ `ace_failed_products.csv` - 失败产品清单（如有）
5. ✅ `ace_crawler.py` - 爬虫代码（可选，便于复现）

---

## 🎯 成功标准

- ✅ 至少136个产品成功爬取（90%）
- ✅ 至少106个产品有详细描述（70%）
- ✅ 至少121个产品有完整规格（80%）
- ✅ 数据格式正确，符合规范
- ✅ 质量报告完整，问题清晰

---

**预祝任务顺利完成！** 🚀

如有任何问题，请随时联系项目负责人。
