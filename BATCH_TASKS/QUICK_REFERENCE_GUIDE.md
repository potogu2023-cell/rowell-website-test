# 爬虫团队快速参考指南

**用途**: 快速查阅关键信息，无需阅读完整文档  
**适用**: 所有9个批次

---

## 🎯 执行顺序（一目了然）

```
1️⃣ Avantor补充 (58个) → 1-2h → 验证率62.1%
2️⃣ Waters补充 (2个) → 0.5h → 验证率62.2%
3️⃣ Thermo Fisher补充 (50个) → 1h → 验证率63.9%
4️⃣ Daicel补充 (260个) → 3-4h → 验证率72.6% 🎯70%
5️⃣ ACE全品类 (151个) → 2-3h → 验证率77.9%
6️⃣ Merck全品类 (195个) → 3-4h → 验证率84.1% 🎯80%
7️⃣ YMC全品类 (54个) → 1-2h → 验证率85.8%
8️⃣ Restek全品类 (54个) → 1-2h → 验证率87.4%
9️⃣ Shimadzu全品类 (130个) → 7-10h → 验证率91.0% 🎯90%
```

---

## 📋 必需字段（所有批次）

```
✅ Product ID (数据库ID)
✅ Part Number (零件号)
✅ Product Name (产品名称)
✅ Brand (品牌)
✅ Description (描述，≥100字符)
```

---

## 📊 核心规格字段（优先级排序）

```
🔴 高优先级（必须尽力提取）
   - Particle Size (粒径)
   - Column Length (柱长)
   - Inner Diameter (内径)

🟡 中优先级（尽可能提取）
   - Pore Size (孔径)
   - pH Range (pH范围)
   - Stationary Phase (固定相)

🟢 低优先级（有则提取）
   - End-capping (端基封尾)
   - Carbon Load (碳载量)
   - Max Pressure (最大压力)
   - Temperature Range (温度范围)
   - Application (应用领域)
   - Series (系列)
```

---

## 📁 交付文件（每个批次）

```
1. {brand}_crawled_data_YYYYMMDD.csv
   - 格式: Product ID, Part Number, Product Name, Brand, Description, [规格字段...]
   
2. {brand}_quality_report_YYYYMMDD.md
   - 包含: 成功率、数据质量统计、失败产品清单、技术问题
```

---

## ✅ 质量标准（快速检查）

### 必达标准
```
✅ 成功率 ≥ 70%
✅ 描述覆盖率 ≥ 80%
✅ 描述长度 ≥ 100字符
✅ 至少1个核心规格字段（粒径/柱长/内径）
```

### 品牌特定目标
```
Avantor:        90-95% | 600+字符 | 13字段
Waters:         100%   | 400+字符 | 12字段
Thermo Fisher:  80-90% | 500+字符 | 14字段
Daicel:         90-95% | 300+字符 | 5字段
ACE:            90-95% | 600+字符 | 13字段
Merck:          85-90% | 400+字符 | 10字段
YMC:            80-90% | 200+字符 | 6字段
Restek:         75-85% | 300+字符 | 8字段
Shimadzu:       70-80% | 200-300字符 | 6-8字段
```

---

## ⚠️ 爬虫礼仪（必须遵守）

```
✅ 请求间隔: 1-2秒
✅ User-Agent: 模拟真实浏览器
✅ 最大并发: 3个
✅ 遵守robots.txt
✅ 网络超时: 重试3次，间隔5秒
```

---

## 🚨 何时暂停任务

```
❌ 测试5个产品，成功率 < 40%
❌ 连续10个请求失败
❌ 收到反爬虫警告
❌ 时间超过预计的2倍

→ 立即联系总工程师
```

---

## 📞 交付流程（每个批次）

```
1. 完成爬取和清洗
2. 生成CSV + 质量报告
3. 发送邮件给总工程师
   主题: [ROWELL] 批次X - {品牌} 爬取完成
   附件: CSV + 报告
4. 立即开始下一批次（不等待审核）
```

---

## 🔧 技术要点速查

### 批次1: Avantor
```
官网: https://www.avantor.com/
方法: 搜索功能 → https://www.avantor.com/search?searchTerm={partNumber}
难点: URL包含内部ID，需要搜索
```

### 批次2: Waters
```
官网: https://www.waters.com/
方法: 复用之前的爬虫程序
难点: 无（只有2个产品）
```

### 批次3: Thermo Fisher
```
官网: https://www.thermofisher.com/
方法: 复用之前的爬虫程序
难点: 注意去重
```

### 批次4: Daicel
```
官网: https://www.daicel.com/
方法: 复用之前的爬虫程序
难点: 日本品牌，规格字段少
```

### 批次5: ACE
```
官网: https://www.avantor.com/ (ACE品牌)
方法: 与批次1相同，搜索功能
难点: 与Avantor相同
```

### 批次6: Merck
```
官网: https://www.sigmaaldrich.com/
方法: 需要新开发
难点: 需要分析官网结构
```

### 批次7: YMC
```
官网: https://www.ymc.co.jp/
方法: 参考Daicel（日本品牌）
难点: 日本品牌特性
```

### 批次8: Restek
```
官网: https://www.restek.com/
方法: 需要新开发
难点: 需要分析官网结构
```

### 批次9: Shimadzu
```
官网: https://www.shimadzu.com/
方法: 系列页面解析
难点: 系列页面结构，描述共享
```

---

## 📊 获取产品清单（SQL）

```sql
SELECT productId, partNumber, name
FROM products
WHERE brand = '{品牌名称}'
AND (description IS NULL OR LENGTH(description) <= 100)
ORDER BY partNumber;
```

**品牌名称对照**:
```
批次1: 'Avantor'
批次2: 'Waters'
批次3: 'Thermo Fisher Scientific'
批次4: 'Daicel'
批次5: 'ACE'
批次6: 'Merck'
批次7: 'YMC'
批次8: 'Restek'
批次9: 'Shimadzu'
```

---

## ✅ 每个批次检查清单

```
准备阶段:
□ 获取产品清单
□ 分析官网结构
□ 确认技术方案
□ 设置爬虫环境

开发阶段:
□ 开发爬虫程序
□ 测试5-10个产品
□ 验证数据质量
□ 调整爬虫逻辑

执行阶段:
□ 批量爬取所有产品
□ 实时监控进度
□ 处理错误和异常
□ 保存原始数据

清洗阶段:
□ 数据格式标准化
□ 去重和验证
□ 生成CSV文件
□ 质量检查

报告阶段:
□ 生成质量报告
□ 统计成功率
□ 记录技术问题
□ 打包交付文件

交付阶段:
□ 发送给总工程师
□ 立即开始下一批次
```

---

## 🎯 里程碑

```
🎯 批次1完成: 第一个快速胜利
🎯 批次4完成: 验证率突破70%
🎯 批次6完成: 验证率突破80%
🎯 批次9完成: 验证率突破90%
```

---

**最后更新**: 2025-11-09  
**完整文档**: 见 `MASTER_TASK_PACKAGE.md`
