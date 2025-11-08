# Merck 品牌产品数据爬取任务包

## 📦 任务包内容

本任务包包含以下文件：

1. **merck_product_list_for_crawler.csv** - 产品清单（199个产品）
2. **MERCK_CRAWLING_INSTRUCTIONS.md** - 详细爬取指令文档
3. **MERCK_TASK_README.md** - 本文件（任务说明）

---

## 🎯 任务目标

爬取 **199个 Merck 品牌色谱产品** 的详细信息，包括：
- 产品名称和描述
- 技术规格（≥15个字段/产品）
- 产品图片URL
- 技术文档URL
- 应用领域和产品特点

**质量目标**：
- 成功率 ≥90%
- 描述覆盖率 ≥70%
- A/B级描述占比 ≥40%
- 平均规格字段数 ≥15个

---

## 📋 快速开始

### 1. 下载任务包文件
- `merck_product_list_for_crawler.csv` - 输入文件
- `MERCK_CRAWLING_INSTRUCTIONS.md` - 详细指令

### 2. 阅读爬取指令
打开 `MERCK_CRAWLING_INSTRUCTIONS.md`，了解：
- 数据源分析（Merck官网结构）
- 爬取策略（URL发现 + 数据提取）
- 字段说明（必需/重要/可选字段）
- 输出格式要求
- 技术实现建议（Python代码示例）

### 3. 开始爬取
使用提供的Python代码模板，或根据您的技术栈实现爬虫。

### 4. 质量检查
完成后，使用指令文档中的"质量验证清单"进行自检。

### 5. 提交结果
提交以下文件：
- `merck_crawl_results.csv` - 爬取结果
- `merck_quality_report.md` - 质量报告

---

## 📊 输入文件说明

### merck_product_list_for_crawler.csv

**文件格式**：CSV（UTF-8编码）  
**行数**：200行（1行表头 + 199行数据）  
**列结构**：
```
productId,partNumber,brand,name,catalogUrl
```

**示例数据**：
```csv
productId,partNumber,brand,name,catalogUrl
"MERC-24218-U","24218-U","Merck","SPB®-Octyl Capillary GC Column L × I.D. 30 m × 0.25 mm, df 0.25 μm",""
"MERC-24133-U","24133-U","Merck","Petrocol® DH 50.2 Capillary GC Column L × I.D. 50 m × 0.20 mm, df 0.50 μm",""
```

**字段说明**：
- **productId**：数据库唯一标识（请保持不变）
- **partNumber**：Merck官方零件号（用于搜索产品）
- **brand**：固定值"Merck"（请保持不变）
- **name**：产品名称（当前数据库中的名称，可能不完整，请更新为官网准确名称）
- **catalogUrl**：产品目录页URL（当前为空，需要爬取填充）

---

## 📤 输出文件要求

### merck_crawl_results.csv

**文件格式**：CSV（UTF-8编码）  
**行数**：200行（1行表头 + 199行数据）  
**列结构**：
```
productId,partNumber,brand,name,description,descriptionQuality,detailedDescription,specifications,particleSize,poreSize,columnLength,innerDiameter,phRange,packingMaterial,imageUrl,catalogUrl,technicalDocsUrl,applications,features,crawlStatus,crawlError
```

**必需字段**（不能为空）：
- productId, partNumber, brand, name, catalogUrl, crawlStatus

**重要字段**（尽量填写）：
- description, descriptionQuality, specifications

**可选字段**（有则填写）：
- detailedDescription, particleSize, poreSize, columnLength, innerDiameter, phRange, packingMaterial, imageUrl, technicalDocsUrl, applications, features

**详细字段说明**：请参考 `MERCK_CRAWLING_INSTRUCTIONS.md` 中的"输出格式要求"章节。

---

## 🌐 数据源

### Merck 官方网站
- **主站**：https://www.sigmaaldrich.com
- **Supelco品牌**：https://www.sigmaaldrich.com/supelco
- **产品页URL模式**：
  ```
  https://www.sigmaaldrich.com/CN/zh/product/supelco/{partNumber}
  https://www.sigmaaldrich.com/CN/zh/product/mm/{partNumber}
  https://www.sigmaaldrich.com/CN/zh/product/sial/{partNumber}
  ```

### 爬取策略提示
1. **URL发现**：尝试多个URL模式，找到有效的产品页
2. **数据提取**：使用CSS选择器提取产品信息
3. **规格解析**：从规格表格或属性列表提取技术参数
4. **质量评估**：根据描述长度和内容丰富度评级

---

## ⚠️ 重要提示

### 1. 反爬虫策略
- 设置合理的User-Agent
- 请求间隔2-3秒
- 使用Session管理
- 如果IP被封，使用代理

### 2. 数据清洗
- 去除HTML标签和多余空格
- 统一单位格式（µm, Å, mm, m）
- 验证JSON格式（specifications字段）

### 3. 错误处理
- 404错误：标记为`not_found`
- 超时错误：设置timeout（10-15秒）
- 网络错误：实现重试机制（最多3次）

### 4. 进度保存
- 每处理10个产品保存一次进度
- 支持断点续传
- 记录详细日志

---

## 📈 质量标准

### 成功标准
- ✅ 成功率 ≥90%（至少179个产品成功）
- ✅ 描述覆盖率 ≥70%（至少139个产品有描述）
- ✅ A/B级描述占比 ≥40%（至少80个产品）
- ✅ 平均规格字段数 ≥15个

### 描述质量等级
| 等级 | 字符数 | 说明 |
|------|--------|------|
| A (high) | ≥300 | 包含应用场景、技术优势、适用范围 |
| B (medium) | 150-299 | 包含基本技术特点和应用 |
| C (low) | 50-149 | 简单描述，信息有限 |
| D (extracted) | 任意 | 从产品名称或规格表提取的描述 |
| E (none) | 0 | 无描述 |

---

## 🔍 质量检查清单

完成爬取后，请进行以下检查：

- [ ] 成功率达到90%以上
- [ ] 描述覆盖率达到70%以上
- [ ] A/B级描述占比达到40%以上
- [ ] 平均规格字段数达到15个以上
- [ ] 所有必需字段完整填写
- [ ] CSV格式正确，无语法错误
- [ ] JSON字段格式正确（specifications, applications, features）
- [ ] 无重复数据
- [ ] 抽样检查10个产品，数据准确性≥95%

---

## 📤 提交清单

请提交以下文件：

1. ✅ **merck_crawl_results.csv** - 爬取结果（199行数据）
2. ✅ **merck_quality_report.md** - 质量报告（使用指令文档中的模板）
3. ⭕ **merck_crawl_log.txt** - 爬取日志（可选）

---

## 📞 联系方式

如有任何问题，请随时联系：
- **项目负责人**：[您的姓名]
- **邮箱**：[您的邮箱]
- **微信**：[您的微信号]

---

## 🚀 预计工作量

- **预计时间**：2-3天
- **目标完成日期**：2025年11月10日
- **优先级**：🔥 高优先级

---

**祝工作顺利！如有疑问，请及时沟通。**
