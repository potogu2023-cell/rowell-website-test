# 批次1：Avantor补充 - 爬虫任务指令

**任务编号**: ROWELL-BATCH-001  
**品牌**: Avantor  
**任务类型**: 补充爬取（已有部分数据）  
**优先级**: 🔴 最高  
**预计时间**: 1-2小时  
**执行顺序**: 第1个

---

## 📋 任务概述

### 任务目标

爬取58个Avantor品牌未验证产品的详细信息，补充现有数据库。

### 背景信息

- **数据库现状**: 已有167个Avantor产品，其中109个已验证（65.3%验证率）
- **本次任务**: 补充58个未验证产品
- **技术方案**: 已完成技术分析，方案成熟可行
- **成功案例**: 已有109个产品成功验证，证明技术方案有效

### 预期成果

| 指标 | 目标 |
|------|------|
| 成功产品数 | 52-55个 |
| 成功率 | 90-95% |
| 描述覆盖率 | 100% |
| 平均描述长度 | 600+字符 |
| 平均规格字段数 | 13个 |
| 数据质量评级 | ⭐⭐⭐⭐⭐ HIGH |

---

## 🎯 产品清单

### 产品数量

**总计**: 58个未验证产品

### 产品清单获取方式

**方式1**: 从数据库导出（推荐）

```sql
SELECT productId, partNumber, name
FROM products
WHERE brand = 'Avantor'
AND (description IS NULL OR LENGTH(description) <= 100)
ORDER BY partNumber;
```

**方式2**: 使用提供的CSV文件

文件名: `batch1_avantor_products.csv`  
格式: Product ID, Part Number, Product Name

### 产品示例

| Product ID | Part Number | Product Name |
|-----------|-------------|--------------|
| AVAN-xxx | ACE-xxx-xxx | ACE C18 HPLC Column... |
| AVAN-yyy | ACE-yyy-yyy | ACE C8 HPLC Column... |

（完整清单见附件CSV文件）

---

## 🔧 技术要求

### 1. 数据源

**官网**: https://www.avantor.com/  
**品牌**: Avantor® ACE®

### 2. URL发现方法

**挑战**: 产品URL包含内部ID，无法直接推断

**解决方案**: 通过搜索功能发现产品URL

#### 步骤：

1. **访问搜索页面**
   ```
   https://www.avantor.com/search?searchTerm={partNumber}
   ```
   
2. **提取搜索结果中的产品链接**
   - 搜索结果页面包含产品链接
   - 提取第一个匹配的产品URL
   
3. **访问产品详情页**
   - 示例URL: `https://www.avantor.com/p/ace-5-c18-hplc-column-5-m-100-x-46-mm-ace-111-0546`
   - 获取完整产品数据

#### 示例代码（Python）:

```python
import requests
from bs4 import BeautifulSoup

def find_product_url(part_number):
    """通过搜索功能查找产品URL"""
    search_url = f"https://www.avantor.com/search?searchTerm={part_number}"
    response = requests.get(search_url)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # 提取第一个产品链接
    product_link = soup.select_one('a.product-link')  # 根据实际页面结构调整
    if product_link:
        return product_link['href']
    return None

# 使用示例
part_number = "ACE-111-0546"
product_url = find_product_url(part_number)
print(f"Product URL: {product_url}")
```

### 3. 数据提取

#### 必需字段

| 字段 | 说明 | 示例 |
|------|------|------|
| **Product ID** | 保持数据库中的ID | AVAN-ACE-111-0546 |
| **Part Number** | 零件号 | ACE-111-0546 |
| **Product Name** | 产品名称 | ACE 5 C18 HPLC Column (5 µm, 100 x 4.6 mm) |
| **Brand** | 品牌 | Avantor |
| **Description** | 产品描述 | ACE C18 is a high-quality reversed-phase column... |

#### 规格字段（Specifications）

提取以下规格参数（如果可用）：

| 规格字段 | 英文名称 | 示例值 |
|---------|---------|--------|
| 粒径 | Particle Size | 5 µm |
| 孔径 | Pore Size | 100 Å |
| 柱长 | Column Length | 100 mm |
| 内径 | Inner Diameter | 4.6 mm |
| pH范围 | pH Range | 2.0-8.0 |
| 固定相 | Stationary Phase | C18 |
| 端基封尾 | End-capping | Yes |
| 碳载量 | Carbon Load | 17% |
| 最大压力 | Max Pressure | 400 bar |
| 温度范围 | Temperature Range | 5-60°C |
| 应用领域 | Application | Pharmaceutical, Environmental |
| 系列 | Series | ACE C18 |
| 填料类型 | Packing Type | Silica-based |

#### 可选字段

| 字段 | 说明 |
|------|------|
| Product URL | 产品详情页URL |
| Image URL | 产品图片URL |
| Price | 价格（如果可用） |
| Availability | 库存状态 |

---

## 📊 数据质量标准

### 必达标准（Must Have）

1. ✅ **成功率 ≥ 85%**: 至少49个产品成功爬取
2. ✅ **描述覆盖率 ≥ 90%**: 至少47个产品有描述
3. ✅ **描述长度 ≥ 200字符**: 描述内容详细完整
4. ✅ **规格字段 ≥ 8个**: 每个产品至少8个规格参数

### 优秀标准（Nice to Have）

1. 🌟 **成功率 ≥ 90%**: 52个以上产品成功爬取
2. 🌟 **描述覆盖率 100%**: 所有产品都有描述
3. 🌟 **平均描述长度 ≥ 500字符**: 描述内容非常详细
4. 🌟 **平均规格字段 ≥ 12个**: 规格参数非常完整

### 数据验证

每个产品必须通过以下验证：

1. ✅ Part Number与数据库一致
2. ✅ Product Name不为空
3. ✅ Description长度 > 100字符
4. ✅ 至少包含3个核心规格字段（粒径、柱长、内径）

---

## 📁 交付格式

### CSV文件格式

**文件名**: `avantor_crawled_data_YYYYMMDD.csv`

**列定义**:

```csv
Product ID,Part Number,Product Name,Brand,Description,Particle Size,Pore Size,Column Length,Inner Diameter,pH Range,Stationary Phase,End-capping,Carbon Load,Max Pressure,Temperature Range,Application,Series,Product URL
```

**示例行**:

```csv
AVAN-ACE-111-0546,ACE-111-0546,"ACE 5 C18 HPLC Column (5 µm, 100 x 4.6 mm)",Avantor,"ACE C18 is a high-quality reversed-phase column offering excellent retention and selectivity for a wide range of compounds...",5 µm,100 Å,100 mm,4.6 mm,2.0-8.0,C18,Yes,17%,400 bar,5-60°C,"Pharmaceutical, Environmental",ACE C18,https://www.avantor.com/p/ace-5-c18-hplc-column...
```

### 质量报告

**文件名**: `avantor_quality_report_YYYYMMDD.md`

**内容包括**:

1. **执行摘要**
   - 总产品数
   - 成功产品数
   - 失败产品数
   - 成功率

2. **数据质量统计**
   - 描述覆盖率
   - 平均描述长度
   - 平均规格字段数
   - 数据质量评级

3. **失败产品清单**
   - Product ID
   - Part Number
   - 失败原因

4. **技术问题记录**
   - 遇到的技术难题
   - 解决方案
   - 改进建议

---

## ⚠️ 注意事项

### 1. 爬虫礼仪

- ✅ 设置请求间隔：每个请求间隔1-2秒
- ✅ 使用User-Agent：模拟真实浏览器
- ✅ 遵守robots.txt
- ✅ 避免高并发请求

### 2. 错误处理

- ✅ 产品未找到：记录到失败清单
- ✅ 网络超时：重试3次，间隔5秒
- ✅ 数据格式异常：记录警告，继续处理
- ✅ 反爬虫机制：降低请求频率，使用代理

### 3. 数据清洗

- ✅ 去除HTML标签
- ✅ 统一单位格式（µm, mm, Å）
- ✅ 规范化布尔值（Yes/No）
- ✅ 去除多余空格和换行

---

## 🚀 执行流程

### Phase 1: 准备（15分钟）

1. [ ] 下载产品清单CSV
2. [ ] 设置爬虫环境
3. [ ] 测试搜索功能
4. [ ] 验证URL发现逻辑

### Phase 2: 开发（30-45分钟）

1. [ ] 开发URL发现函数
2. [ ] 开发数据提取函数
3. [ ] 测试5个产品
4. [ ] 验证数据质量
5. [ ] 调整提取逻辑

### Phase 3: 执行（30-45分钟）

1. [ ] 批量爬取所有58个产品
2. [ ] 实时监控进度
3. [ ] 记录错误和警告
4. [ ] 保存原始数据

### Phase 4: 清洗（15-20分钟）

1. [ ] 数据格式标准化
2. [ ] 去重验证
3. [ ] 质量检查
4. [ ] 生成CSV文件

### Phase 5: 报告（10-15分钟）

1. [ ] 生成质量报告
2. [ ] 统计成功率
3. [ ] 记录技术问题
4. [ ] 打包交付文件

---

## 📊 成功标准

### 任务成功条件

1. ✅ 成功率 ≥ 90%（52个以上产品）
2. ✅ 描述覆盖率 ≥ 95%（50个以上产品有描述）
3. ✅ 平均规格字段 ≥ 10个
4. ✅ 数据质量评级 ≥ ⭐⭐⭐⭐

### 任务失败条件

1. ❌ 成功率 < 80%（少于46个产品）
2. ❌ 描述覆盖率 < 70%（少于41个产品有描述）
3. ❌ 技术难度超出预期，无法解决

---

## 📞 支持和联系

### 遇到问题时

1. **技术问题**: 记录详细错误信息，暂停任务，联系总工程师
2. **数据质量问题**: 调整提取逻辑，重新测试
3. **时间超出预期**: 评估ROI，决定是否继续

### 交付方式

1. **完成后**: 将CSV文件和质量报告发送给总工程师
2. **不等待审核**: 立即开始批次2（Waters补充）
3. **异步沟通**: 总工程师会异步审核数据质量

---

## ✅ 检查清单

### 开始前

- [ ] 已下载产品清单
- [ ] 已设置爬虫环境
- [ ] 已理解技术要求
- [ ] 已准备好数据存储

### 执行中

- [ ] URL发现成功率 > 90%
- [ ] 数据提取逻辑正确
- [ ] 错误处理机制有效
- [ ] 进度监控正常

### 完成后

- [ ] CSV文件格式正确
- [ ] 质量报告完整
- [ ] 成功率达标
- [ ] 数据质量达标
- [ ] 已发送给总工程师
- [ ] 已开始批次2

---

**任务创建日期**: 2025-11-09  
**预计完成时间**: 1-2小时  
**下一批次**: 批次2 - Waters补充
