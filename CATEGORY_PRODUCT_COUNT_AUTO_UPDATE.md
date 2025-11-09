# 分类产品数量自动更新机制

## 概述

本文档说明ROWELL网站的分类产品数量如何自动更新，确保在产品数据库变化时，前端显示的分类产品数量始终保持准确。

---

## 工作原理

### 数据库层（Real-time Calculation）

分类产品数量通过SQL实时计算，不依赖缓存或预计算值。

**实现位置**: `server/db.ts` → `getCategoriesWithProductCount()`

**SQL查询逻辑**:
```sql
SELECT 
  c.id,
  c.name,
  c.slug,
  c.parentId,
  -- ... other category fields
  COUNT(DISTINCT pc.productId) as productCount
FROM categories c
LEFT JOIN product_categories pc ON c.id = pc.categoryId
WHERE c.isVisible = 1
GROUP BY c.id
ORDER BY c.displayOrder
```

**关键点**:
- ✅ 使用`LEFT JOIN`确保即使分类没有产品也会返回（productCount = 0）
- ✅ 使用`COUNT(DISTINCT pc.productId)`避免重复计数（产品可能关联到多个分类）
- ✅ 每次查询都从数据库获取最新数据，无缓存

---

### API层（tRPC Procedure）

**实现位置**: `server/routers.ts` → `category.getWithProductCount`

```typescript
category: router({
  getWithProductCount: publicProcedure.query(async () => {
    return await getCategoriesWithProductCount();
  }),
}),
```

**特点**:
- ✅ 每次前端调用都会执行数据库查询
- ✅ 无缓存机制，确保数据实时性
- ✅ 公开接口，无需认证即可访问

---

### 前端层（React Query）

**实现位置**: `client/src/components/CategoryNav.tsx`

```typescript
const { data: categories } = trpc.category.getWithProductCount.useQuery();
```

**特点**:
- ✅ 使用tRPC React Query hooks自动管理数据获取
- ✅ 页面加载时自动调用API
- ✅ 支持自动重新获取（refetch）和缓存失效（invalidation）

---

## 自动更新时机

分类产品数量会在以下情况下自动更新：

### 1. 页面加载/刷新
- 用户访问产品页面时
- 用户刷新浏览器时
- 前端路由切换到产品页面时

### 2. 数据库变化后的下次查询
- 添加新产品并关联到分类
- 删除产品或移除分类关联
- 修改产品的分类关联
- 批量导入产品数据

**注意**: 数据库变化不会立即推送到前端，需要等待下次查询（页面刷新或自动refetch）

---

## 验证测试

### 测试场景
1. 添加测试产品到数据库
2. 将产品关联到特定分类
3. 刷新页面
4. 验证分类产品数量是否更新

### 测试结果（2025-11-08）
- ✅ 总产品数自动更新：2689 → 2690
- ✅ 品牌筛选器自动更新：出现新品牌"TestBrand (1)"
- ✅ 分类产品数保持准确：所有分类数量正确

---

## 性能考虑

### 当前实现
- **查询频率**: 每次页面加载
- **查询复杂度**: O(n) - 需要JOIN和GROUP BY
- **数据量**: 34个分类 × 2689个产品

### 优化建议（如果性能成为问题）

#### 1. 添加数据库索引
```sql
CREATE INDEX idx_product_categories_categoryId ON product_categories(categoryId);
CREATE INDEX idx_product_categories_productId ON product_categories(productId);
```

#### 2. 启用tRPC缓存
```typescript
const { data: categories } = trpc.category.getWithProductCount.useQuery(undefined, {
  staleTime: 5 * 60 * 1000, // 5分钟内使用缓存
  cacheTime: 10 * 60 * 1000, // 10分钟后清除缓存
});
```

#### 3. 使用物化视图（Materialized View）
- 创建预计算的分类产品数量表
- 使用触发器（Trigger）在产品变化时更新
- 适用于大规模数据场景（10万+产品）

---

## 故障排查

### 问题：分类产品数量显示不正确

**可能原因**:
1. 使用`COUNT(pc.productId)`而非`COUNT(DISTINCT pc.productId)`
2. 产品关联到多个分类导致重复计数
3. 前端缓存未失效

**解决方案**:
1. 确认使用`COUNT(DISTINCT pc.productId)`
2. 清除浏览器缓存或强制刷新（Ctrl+Shift+R）
3. 检查数据库`product_categories`表的数据完整性

### 问题：新产品未显示在分类中

**可能原因**:
1. 产品未关联到任何分类
2. 分类`isVisible = 0`（隐藏）
3. 前端缓存未更新

**解决方案**:
1. 检查`product_categories`表是否有对应记录
2. 检查`categories`表的`isVisible`字段
3. 刷新页面或清除缓存

---

## 相关文件

| 文件路径 | 功能 |
|---------|------|
| `server/db.ts` | 数据库查询函数 |
| `server/routers.ts` | tRPC API定义 |
| `client/src/components/CategoryNav.tsx` | 分类导航组件 |
| `drizzle/schema.ts` | 数据库表结构定义 |

---

## 更新历史

| 日期 | 变更 | 作者 |
|------|------|------|
| 2025-11-08 | 修复重复计数问题，改用COUNT(DISTINCT) | 网站工程师 |
| 2025-11-08 | 创建本文档 | 网站工程师 |
| 2025-11-08 | 验证自动更新机制 | 网站工程师 |

---

## 总结

✅ **当前实现已经是自动同步的**，无需额外的同步机制。

✅ **每次页面加载都会实时计算最新的产品数量**。

✅ **使用`COUNT(DISTINCT)`确保产品数量准确**，即使产品关联到多个分类。

✅ **性能表现良好**，适用于当前数据规模（2689个产品，34个分类）。

如果未来数据规模显著增长（10万+产品），可以考虑添加缓存或物化视图优化性能。
