# Agilent产品页面结构分析

## 测试产品
- 零件号: 0100-2637
- URL: https://www.agilent.com/store/productDetail.jsp?catalogId=0100-2637

## 页面结构

### 1. 产品名称
**位置**: 页面标题下方
**格式**: "Nut and ferrule, stainless steel, 1/8 inch, for sample loop for switching valve"
**特点**: 完整的产品名称,包含规格信息

### 2. 产品描述
**位置**: 在搜索结果页面有简短描述,详情页面可能需要滚动查看
**当前状态**: 详情页面主要显示规格,描述较少
**建议**: 可能需要从搜索结果页或产品类别页获取描述

### 3. 技术规格
**位置**: "Specifications"部分
**格式**: 表格形式

提取到的规格:
- Fitting Component: Fitting Complete
- Material: Stainless Steel  
- Technique: LC
- UNSPSC Code: 41105106

## 爬取策略

### 方案1: 搜索结果页 + 详情页组合
1. 访问搜索URL: `https://www.agilent.com/search/?Ntt={partNumber}`
2. 从搜索结果提取:
   - 完整产品名称
   - 简短描述(如果有)
3. 点击进入详情页提取:
   - 完整规格表格
   - 详细描述(如果有)

### 方案2: 直接访问详情页
1. 访问详情URL: `https://www.agilent.com/store/productDetail.jsp?catalogId={partNumber}`
2. 提取所有信息

**推荐**: 方案2更简单直接,减少请求次数

## 数据提取方法

### 产品名称
- 从页面标题或H1标签提取
- 位置: "Part Number: {partNumber}" 下方的文本

### 产品描述
- 可能需要从多个位置组合:
  - 产品类别描述
  - 产品特点说明
  - 应用场景
- 如果详情页没有,可从搜索结果页获取

### 技术规格
- 提取"Specifications"表格
- 转换为JSON格式
- 字段映射:
  - Fitting Component → 配件类型
  - Material → 材质
  - Technique → 技术类型
  - 其他字段根据产品类型不同而不同

## 注意事项

1. **URL格式**: catalogId参数使用零件号
2. **反爬虫**: 需要控制请求频率(1-2秒/请求)
3. **登录状态**: 当前已登录,可能影响页面内容
4. **产品类型差异**: 不同类型产品的规格字段不同
5. **描述获取**: 可能需要从搜索结果页或产品Overview部分获取

## 下一步

1. 测试更多产品类型(色谱柱、样品瓶等)
2. 确定统一的数据提取逻辑
3. 开发Agilent专用爬虫类
