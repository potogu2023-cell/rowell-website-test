# Phenomenex品牌产品数据爬取任务指令

**任务编号**: ROWELL-CRAWLER-PHENOMENEX-001  
**任务类型**: 产品数据批量爬取  
**目标品牌**: Phenomenex（飞诺美）  
**发布日期**: 2025-11-08  
**优先级**: 高

---

## 📋 任务概述

### 任务目标

从Phenomenex官方网站爬取247个产品的详细信息，包括产品名称、规格参数、技术描述等，用于ROWELL色谱耗材网站的产品数据库。

### 背景信息

**当前进度**:
- 已完成品牌：Agilent (630个), Thermo Fisher Scientific (366个), Daicel (263个), Waters (106个)
- 总进度：1,365/2,689 (50.8%)
- 剩余品牌：8个

**Phenomenex品牌特点**:
- 全球知名HPLC/GC色谱柱制造商
- 产品线丰富，涵盖HPLC、GC、SPE等多种类型
- 技术文档完善，数据结构化程度高
- 预期数据质量：优秀

---

## 🎯 爬取目标

### 产品数量

**总目标**: 247个产品

**产品类型分布**（预估）:
- HPLC色谱柱：约150-180个
- GC色谱柱：约40-60个
- 保护柱：约20-30个
- SPE固相萃取柱：约10-20个
- 其他耗材：约10-20个

### 数据来源

**官方网站**: https://www.phenomenex.com/

**产品页面结构**:
- 产品目录页：https://www.phenomenex.com/products/
- 产品详情页：https://www.phenomenex.com/product/{product-slug}
- 技术规格通常在产品详情页的"Specifications"或"Technical Information"部分

**搜索策略**:
- 优先使用产品零件号（Part Number）搜索
- 如果零件号搜索失败，尝试使用产品名称搜索
- 如果两者都失败，记录为"未找到"

---

## 📊 数据字段要求

### 必需字段（100%完整性）

| 字段名 | 说明 | 示例 | 验证规则 |
|--------|------|------|---------|
| productId | ROWELL内部产品ID | PHEN-7EG-G006-11 | 与CSV一致，不可修改 |
| partNumber | Phenomenex官方零件号 | 7EG-G006-11 | 必须从官网获取 |
| brand | 品牌名称 | Phenomenex | 固定值 |
| name | 产品完整名称 | Zebron ZB-1701, GC Cap. Column 15 m x 0.25 mm x 0.25 µm | 从官网获取，保持原格式 |

### 重要字段（≥90%完整性）

| 字段名 | 说明 | 示例 | 获取方式 |
|--------|------|------|---------|
| description | 产品详细描述 | The Zebron ZB-1701 column is a mid-polarity column... | 从产品详情页获取 |
| specifications | 技术规格（JSON对象） | {"Particle Size": "1.7 µm", "Column Length": "50 mm", ...} | 从规格表格提取 |
| descriptionQuality | 描述质量等级 | high / medium / low / extracted | 根据描述长度和质量判断 |

### 可选字段（尽力获取）

| 字段名 | 说明 | 示例 |
|--------|------|------|
| imageUrl | 产品图片URL | https://www.phenomenex.com/... |
| catalogUrl | 产品目录页URL | https://www.phenomenex.com/product/... |
| technicalDocUrl | 技术文档URL | https://www.phenomenex.com/... |

---

## 📝 数据格式规范

### CSV文件格式

**文件名**: `phenomenex_247_results.csv`

**编码**: UTF-8（带BOM）

**字段顺序**:
```
productId,partNumber,brand,name,description,descriptionQuality,specifications,imageUrl,catalogUrl,technicalDocUrl
```

**字段说明**:

1. **productId**: 与输入CSV完全一致，不可修改
2. **partNumber**: Phenomenex官方零件号（去除品牌前缀）
3. **brand**: 固定为"Phenomenex"
4. **name**: 产品完整名称（保持官网原格式，包含规格信息）
5. **description**: 产品详细描述文本
6. **descriptionQuality**: 描述质量等级
   - `high`: ≥200字符，详细描述产品特性、应用、优势
   - `medium`: 100-199字符，包含基本产品信息
   - `low`: 50-99字符，简短描述
   - `extracted`: <50字符，从其他字段提取的描述
7. **specifications**: JSON格式的技术规格对象
8. **imageUrl**: 产品主图URL（如有）
9. **catalogUrl**: 产品详情页URL
10. **technicalDocUrl**: 技术文档PDF URL（如有）

### specifications字段格式

**JSON对象**，包含所有技术参数，例如：

```json
{
  "Particle Size": "1.7 µm",
  "Column Length": "50 mm",
  "Inner Diameter": "2.1 mm",
  "Pore Size": "130 Å",
  "pH Range": "2-8",
  "Temperature Limit": "80°C",
  "USP Classification": "L1",
  "Surface Area": "185 m²/g",
  "Carbon Load": "10%",
  "End Capping": "Yes",
  "Phase Type": "C18",
  "Column Format": "Analytical"
}
```

**注意事项**:
- 所有键名使用英文，首字母大写
- 保留单位符号（µm, Å, °C, m²/g等）
- 数值和单位之间保留空格
- 布尔值使用"Yes"/"No"
- 如果某个规格不适用，不要包含该字段

---

## 🔍 爬取策略

### 搜索策略

**优先级顺序**:

1. **使用零件号搜索**（推荐）
   - 在Phenomenex官网搜索框输入零件号
   - 例如：搜索"7EG-G006-11"
   - 如果找到唯一匹配，进入产品详情页

2. **使用产品名称搜索**（备选）
   - 如果零件号搜索失败，使用产品名称的关键词
   - 例如："Zebron ZB-1701 15m 0.25mm"
   - 从搜索结果中选择最匹配的产品

3. **标记为未找到**
   - 如果两种方法都失败，在CSV中标记status="not_found"
   - 记录失败原因到日志文件

### 数据提取策略

**描述文本提取**（多层级降级）:

1. **优先**: 产品详情页的"Product Description"或"Overview"部分
2. **备选1**: "Features and Benefits"部分
3. **备选2**: "Applications"部分
4. **备选3**: 从产品名称和规格生成简短描述
5. **最后**: 标记为extracted，使用产品名称作为描述

**技术规格提取**:

1. **优先**: 产品详情页的"Specifications"表格
2. **备选**: "Technical Information"或"Product Details"部分
3. **解析方式**:
   - 提取表格中的所有行
   - 左列为规格名称，右列为规格值
   - 转换为JSON对象

**图片URL提取**:

1. 产品详情页的主图（通常是第一张大图）
2. 使用完整的HTTPS URL
3. 如果有多张图片，选择最清晰的产品图

---

## ✅ 质量验收标准

### 必达标准（Minimum Acceptable）

| 指标 | 要求 | 说明 |
|------|------|------|
| 成功率 | ≥ 90% | 至少222个产品成功爬取 |
| 产品名称完整性 | = 100% | 所有产品必须有name字段 |
| 零件号完整性 | = 100% | 所有产品必须有partNumber字段 |
| 规格完整性 | ≥ 90% | 至少222个产品有≥3个规格字段 |
| 描述覆盖率 | ≥ 70% | 至少173个产品有description |
| CSV格式正确性 | = 100% | CSV文件可正常解析，无格式错误 |
| 字符编码 | = UTF-8 | 支持中文和特殊字符 |

### 优秀标准（Excellent）

| 指标 | 要求 | 说明 |
|------|------|------|
| 成功率 | ≥ 95% | 至少235个产品成功爬取 |
| 描述覆盖率 | ≥ 80% | 至少198个产品有description |
| A/B级描述占比 | ≥ 40% | 至少99个产品有high/medium描述 |
| 平均规格字段数 | ≥ 15个 | 每个产品平均有15个以上规格字段 |
| 图片覆盖率 | ≥ 70% | 至少173个产品有imageUrl |

### 参考：已完成品牌的数据质量

| 品牌 | 产品数 | 成功率 | 描述覆盖率 | A/B级描述 | 平均规格字段 |
|------|--------|--------|-----------|----------|-------------|
| Agilent | 630 | 98.7% | 99.0% | 97.6% | 12.9个 |
| Thermo Fisher | 366 | 73.5% | 78.1% | 62.0% | 14.0个 |
| Daicel | 263 | 94.9% | 94.9% | 30.4% | 4.9个 |
| Waters | 106 | 100% | 100% | 100% | 26.0个 |

**目标**: Phenomenex的数据质量应达到或超过Agilent的水平。

---

## 📁 交付物清单

### 必需文件

1. **phenomenex_247_results.csv**
   - 247个产品的完整数据
   - UTF-8编码
   - 包含所有必需字段

2. **PHENOMENEX_CRAWLING_REPORT.md**
   - 爬取过程总结
   - 数据质量统计
   - 遇到的问题和解决方案
   - 质量自评

3. **crawler.log**（可选）
   - 详细的爬取日志
   - 包含所有警告和错误信息
   - 用于问题排查

### 报告内容要求

**PHENOMENEX_CRAWLING_REPORT.md** 应包含：

1. **执行总结**
   - 爬取时间
   - 成功/失败数量
   - 总体评价

2. **数据质量统计**
   - 必需字段完整性
   - 描述覆盖率
   - 描述质量分布（high/medium/low/extracted）
   - 规格字段统计（最多/最少/平均）
   - 图片覆盖率

3. **问题记录**
   - 未找到的产品列表（如有）
   - 数据质量问题
   - 技术难点

4. **质量自评**
   - 对照验收标准自评
   - 是否达到必达标准
   - 是否达到优秀标准

---

## ⚙️ 技术要求

### 爬虫程序要求

1. **遵守robots.txt**
   - 检查Phenomenex官网的robots.txt
   - 遵守爬取频率限制

2. **请求频率控制**
   - 每个请求间隔≥2秒
   - 避免对服务器造成压力
   - 如遇到429错误，增加延迟时间

3. **User-Agent设置**
   - 使用真实的浏览器User-Agent
   - 不要使用默认的爬虫标识

4. **错误处理**
   - 网络超时：重试3次，间隔5秒
   - 404错误：标记为"not_found"
   - 其他错误：记录到日志

5. **数据验证**
   - 检查必需字段是否为空
   - 检查JSON格式是否正确
   - 检查URL是否有效

### 推荐工具

- **Python**: Selenium + BeautifulSoup4 + Pandas
- **Node.js**: Puppeteer + Cheerio + csv-writer
- **其他**: 任何能完成任务的工具都可以

---

## 📅 执行计划

### 时间安排

**预计总时间**: 2-3小时

| 阶段 | 时间 | 说明 |
|------|------|------|
| 准备阶段 | 10分钟 | 配置环境，测试连接 |
| 测试爬取 | 20分钟 | 爬取10个样本，验证策略 |
| 全量爬取 | 90-120分钟 | 爬取全部247个产品 |
| 数据验证 | 20分钟 | 检查数据质量，修复问题 |
| 生成报告 | 10分钟 | 编写爬取报告 |

### 里程碑

1. **测试完成**（30分钟内）
   - 成功爬取10个样本产品
   - 验证数据格式正确
   - 确认爬取策略可行

2. **50%完成**（90分钟内）
   - 成功爬取至少124个产品
   - 数据质量符合预期

3. **全部完成**（150分钟内）
   - 爬取全部247个产品
   - 生成CSV和报告
   - 质量自检通过

---

## 🚨 常见问题和解决方案

### Q1: 零件号搜索找不到产品怎么办？

**A**: 
1. 尝试去除零件号中的连字符，例如"7EG-G006-11"改为"7EGG00611"
2. 尝试使用产品名称的关键词搜索
3. 如果仍然找不到，标记为"not_found"并记录到日志

### Q2: 产品详情页没有"Specifications"表格怎么办？

**A**:
1. 查找"Technical Information"、"Product Details"等类似部分
2. 从产品名称中提取规格信息（例如：柱长、内径、粒径）
3. 至少提取3个基本规格（Column Length, Inner Diameter, Particle Size）

### Q3: 描述文本太短怎么办？

**A**:
1. 合并多个部分的文本（Description + Features + Applications）
2. 如果合并后仍<50字符，标记为"extracted"
3. 使用产品名称和规格生成简短描述

### Q4: CSV文件中有特殊字符导致格式错误怎么办？

**A**:
1. 所有字段值都用双引号包裹
2. 字段值内的双引号要转义为两个双引号（""）
3. 使用UTF-8编码保存文件
4. 测试CSV文件能否被Excel正常打开

### Q5: 爬取速度太慢怎么办？

**A**:
1. 确认网络连接稳定
2. 适当减少请求间隔（但不低于1秒）
3. 使用多线程/多进程并行爬取（最多5个并发）
4. 缓存已访问的页面，避免重复请求

---

## 📞 联系方式

如有任何问题或需要澄清，请随时联系：

**项目负责人**: ROWELL网站总工程师  
**沟通方式**: 通过任务对话窗口  
**响应时间**: 工作时间内1小时内回复

---

## ✅ 任务验收流程

1. **提交交付物**
   - 上传CSV文件
   - 上传爬取报告
   - 上传日志文件（可选）

2. **自动验证**
   - 检查CSV格式
   - 检查必需字段完整性
   - 统计数据质量指标

3. **人工审核**
   - 随机抽查10-20个产品
   - 验证数据准确性
   - 评估整体质量

4. **反馈结果**
   - 通过：数据导入数据库，任务完成
   - 需要修改：指出具体问题，要求修正
   - 不通过：说明原因，重新爬取

---

## 📚 参考资料

### Phenomenex官网链接

- 官网首页：https://www.phenomenex.com/
- 产品目录：https://www.phenomenex.com/products/
- HPLC色谱柱：https://www.phenomenex.com/products/hplc-columns
- GC色谱柱：https://www.phenomenex.com/products/gc-columns
- 技术支持：https://www.phenomenex.com/support

### 已完成品牌的参考文档

- Agilent爬取报告：AGILENT_FINAL_QUALITY_REPORT.md
- Thermo Fisher爬取报告：THERMO_FISHER_QUALITY_REPORT.md
- Daicel爬取报告：DAICEL_QUALITY_REPORT.md
- Waters爬取报告：WATERS_QUALITY_REPORT.md

### 数据导入脚本

- import-agilent-batch-data.mjs（通用导入脚本，可复用）

---

## 🎯 成功标准总结

**任务成功的关键指标**:

1. ✅ 成功率 ≥ 90%（至少222个产品）
2. ✅ 所有产品都有name和partNumber
3. ✅ 至少70%的产品有description
4. ✅ 至少90%的产品有≥3个规格字段
5. ✅ CSV文件格式正确，可正常导入
6. ✅ 数据准确性：随机抽查10个产品，至少9个正确

**期望达到的优秀标准**:

1. 🌟 成功率 ≥ 95%
2. 🌟 描述覆盖率 ≥ 80%
3. 🌟 A/B级描述占比 ≥ 40%
4. 🌟 平均规格字段数 ≥ 15个
5. 🌟 图片覆盖率 ≥ 70%

---

**祝爬取顺利！期待收到高质量的Phenomenex产品数据！** 🚀
