# ROWELL网站工程师交接文档

## 📋 文档目的

本文档用于在新的Manus任务中完全恢复ROWELL色谱耗材网站，并为新的"总工程师"提供完整的上下文、技术细节和操作指南。

---

## 🎯 网站概述

### 基本信息

| 项目 | 信息 |
|------|------|
| **网站名称** | ROWELL - Global Chromatography Solutions |
| **网站定位** | 色谱耗材综合供应商（B2B电商平台） |
| **主要产品** | HPLC色谱柱、GC色谱柱、保护柱、SPE柱、样品瓶、过滤器等色谱耗材 |
| **目标客户** | 实验室、研究机构、制药公司、化工企业 |
| **当前状态** | 开发中，已完成核心功能，产品数据持续更新 |
| **产品数量** | 2,689个产品（截至2025-11-08） |
| **品牌数量** | 12个主要品牌 |
| **分类数量** | 34个分类（包含顶级分类和子分类） |

### 网站演进历史

1. **Phase 1**: 专业HPLC色谱柱网站（2020-2024）
   - 只销售HPLC色谱柱产品
   - 产品数量约1,000个

2. **Phase 2**: 升级为色谱耗材综合网站（2024-2025）
   - 扩展产品范围：色谱柱 + 耗材 + 配件
   - 新增分类：Chromatography Supplies, Sample Preparation, Filtration, Lab Supplies
   - 产品数量增至2,689个

3. **Phase 3**: 当前状态（2025-11-08）
   - 完成核心功能开发
   - 产品数据持续更新中
   - 等待Agilent等品牌的爬虫数据交付

---

## 🏗️ 技术架构

### 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| **前端框架** | React | 19 |
| **UI库** | shadcn/ui + Tailwind CSS | 4 |
| **路由** | Wouter | - |
| **后端框架** | Express | 4 |
| **API层** | tRPC | 11 |
| **数据库** | MySQL/TiDB | - |
| **ORM** | Drizzle ORM | - |
| **认证** | Manus OAuth | - |
| **部署** | Manus Platform | - |

### 项目结构

```
rowell-website-test/
├── client/                 # 前端代码
│   ├── public/            # 静态资源
│   └── src/
│       ├── pages/         # 页面组件
│       ├── components/    # UI组件
│       ├── contexts/      # React上下文
│       ├── hooks/         # 自定义Hooks
│       └── lib/           # 工具库
├── server/                # 后端代码
│   ├── _core/            # 核心功能（OAuth, LLM等）
│   ├── db.ts             # 数据库查询函数
│   └── routers.ts        # tRPC路由定义
├── drizzle/              # 数据库Schema和迁移
│   ├── schema.ts         # 表结构定义
│   └── migrations/       # 迁移文件
├── shared/               # 前后端共享代码
└── storage/              # S3存储辅助函数
```

---

## 💾 数据库结构

### 核心表

#### 1. products（产品表）
- **记录数**: 2,689
- **关键字段**:
  - `id`: 主键
  - `productId`: 产品ID（带品牌前缀，如WATS-186009298）
  - `partNumber`: 原始零件号
  - `brand`: 品牌名称
  - `name`: 产品名称
  - `description`: 产品描述
  - `specifications`: 技术规格（JSON）
  - `particleSize`, `poreSize`, `columnLength`, `innerDiameter`: 规格字段
  - `usp`: USP分类
  - `phaseType`: 填料类型

#### 2. categories（分类表）
- **记录数**: 34
- **关键字段**:
  - `id`: 主键
  - `name`: 分类名称（中文）
  - `nameEn`: 分类名称（英文）
  - `slug`: URL友好的分类标识
  - `parentId`: 父分类ID（顶级分类为NULL）
  - `level`: 分类层级（1=顶级，2=子分类）
  - `isVisible`: 是否可见
  - `displayOrder`: 显示顺序

#### 3. product_categories（产品-分类关联表）
- **记录数**: ~3,000+
- **关键字段**:
  - `productId`: 产品ID
  - `categoryId`: 分类ID
- **注意**: 一个产品可以关联到多个分类

#### 4. users（用户表）
- **记录数**: ~100+
- **关键字段**:
  - `id`: 主键
  - `openId`: Manus OAuth标识
  - `name`, `email`: 用户信息
  - `role`: 用户角色（admin/user）
  - `company`, `phone`, `country`: 企业信息

#### 5. articles（文章表）
- **记录数**: 31
- **关键字段**:
  - `id`: 主键
  - `slug`: URL标识
  - `title`: 标题
  - `content`: 内容（Markdown）
  - `category`: 分类（application/resource）
  - `tags`: 标签（JSON数组）

#### 6. quote_requests（询价表）
- **记录数**: ~50+
- **关键字段**:
  - `id`: 主键
  - `userId`: 用户ID
  - `products`: 产品列表（JSON）
  - `status`: 状态（pending/processing/quoted/completed/cancelled）

---

## 🔑 关键功能实现

### 1. 产品分类导航

**实现位置**: `client/src/components/CategoryNav.tsx`

**关键特性**:
- 显示所有可见分类
- 实时显示每个分类的产品数量
- 支持展开/折叠子分类
- 点击分类筛选产品

**产品数量计算**:
```typescript
// server/db.ts
export async function getCategoriesWithProductCount() {
  return await db
    .select({
      ...categories,
      productCount: countDistinct(productCategories.productId),
    })
    .from(categories)
    .leftJoin(productCategories, eq(categories.id, productCategories.categoryId))
    .where(eq(categories.isVisible, 1))
    .groupBy(categories.id);
}
```

**重要**: 使用`countDistinct()`避免重复计数（产品可能关联到多个分类）

### 2. 产品筛选器

**实现位置**: `client/src/pages/Products.tsx`

**筛选维度**:
- 品牌（Brand）
- 分类（Category）
- 粒径（Particle Size）
- 孔径（Pore Size）
- 柱长（Column Length）
- 内径（Inner Diameter）
- pH范围（pH Range）
- USP分类
- 填料类型（Phase Type）

**筛选逻辑**:
- 前端发送筛选条件到后端
- 后端构建SQL WHERE子句
- 返回符合条件的产品列表

### 3. AI产品顾问

**实现位置**: `client/src/pages/Products.tsx` + `server/routers.ts`

**功能**:
- 用户描述需求（自然语言）
- AI分析需求并推荐产品
- 支持多轮对话

**技术实现**:
- 使用Manus内置LLM API
- 调用`invokeLLM()`函数
- 传入产品数据库上下文

### 4. 询价功能

**实现位置**: `client/src/components/QuoteCart.tsx`

**流程**:
1. 用户浏览产品，点击"添加到询价"
2. 产品添加到询价清单（localStorage）
3. 用户填写联系信息并提交
4. 后端保存询价记录
5. 发送通知给网站管理员

### 5. USP标准参考

**实现位置**: `client/src/pages/USPStandards.tsx`

**功能**:
- 显示所有USP分类（L1, L7, L11等）
- 每个USP分类显示对应的产品数量
- 点击USP分类筛选产品

### 6. 资源中心

**实现位置**: `client/src/pages/Resources.tsx`

**内容**:
- 技术文章（31篇）
- 应用案例
- 产品手册
- 视频教程

---

## 📊 产品数据管理

### 当前产品数据状态

| 品牌 | 产品数 | 验证状态 | 数据质量 |
|------|--------|---------|---------|
| Daicel | 523 | ✅ 已验证（277个） | ⭐⭐⭐⭐⭐ |
| Waters | 269 | ✅ 已验证（106个） | ⭐⭐⭐⭐⭐ |
| Phenomenex | 247 | ✅ 已验证（247个） | ⭐⭐⭐⭐⭐ |
| GC Columns | 425 | ⚠️ 未验证 | ⭐⭐⭐ |
| Guard Columns | 364 | ⚠️ 未验证 | ⭐⭐⭐ |
| YMC | 203 | ⚠️ 未验证 | ⭐⭐⭐ |
| Merck | 90 | ⚠️ 未验证 | ⭐⭐⭐ |
| ACE | 99 | ⚠️ 未验证 | ⭐⭐⭐ |
| Agilent | 50 | ⚠️ 未验证 | ⭐⭐⭐ |
| 其他 | 419 | ⚠️ 未验证 | ⭐⭐⭐ |

**验证状态说明**:
- ✅ 已验证：通过爬虫团队从品牌官网重新爬取验证，数据质量极高
- ⚠️ 未验证：来自原始数据库，数据质量中等

### 产品数据更新流程

#### 方式1：爬虫团队交付数据

1. **下达爬取指令**
   - 生成详细的爬取指令文档
   - 包含产品清单、技术方案、质量标准
   - 交付给爬虫团队

2. **接收爬虫数据**
   - 爬虫团队返回CSV文件
   - 包含产品名称、规格、描述等字段

3. **数据导入**
   - 使用`import_crawler_data.mjs`脚本
   - 验证数据格式和质量
   - 批量插入到`products`表
   - 关联到分类（`product_categories`表）

4. **验证结果**
   - 检查产品数量
   - 验证分类关联
   - 测试前端显示

#### 方式2：手动导入数据

1. **准备CSV文件**
   - 必需字段：brand, partNumber, name
   - 可选字段：description, specifications, particleSize等

2. **运行导入脚本**
   ```bash
   node import_products.mjs path/to/products.csv
   ```

3. **关联分类**
   - 手动或使用脚本关联产品到分类
   - 插入记录到`product_categories`表

### 产品分类关联策略

**关键原则**:
- 一个产品可以关联到多个分类
- 例如：VanGuard产品同时属于"Guard Columns"和"SPE Cartridges"

**关联方法**:
1. **基于产品类型**：根据`productType`字段自动关联
2. **基于产品名称**：使用关键词匹配（如"VanGuard" → SPE Cartridges）
3. **手动关联**：对于特殊产品，手动指定分类

---

## 🔧 关键技术决策

### 1. 为什么使用`COUNT(DISTINCT)`？

**问题**: 产品可能关联到多个分类，使用`COUNT()`会重复计数

**解决方案**: 使用`COUNT(DISTINCT productId)`确保每个产品只被计数一次

**实现位置**: `server/db.ts` → `getCategoriesWithProductCount()`

### 2. 为什么不使用缓存？

**决策**: 分类产品数量实时计算，不使用缓存

**原因**:
- 数据变化频繁（产品导入、分类关联）
- 实时计算确保数据准确性
- 当前数据规模（2,689个产品）性能表现良好

**未来优化**: 如果产品数量超过10万，可以考虑添加缓存或物化视图

### 3. 为什么使用tRPC而不是REST API？

**优势**:
- 类型安全：前后端共享类型定义
- 自动生成API文档
- 简化API调用（无需手动fetch）
- 支持实时数据同步

### 4. 为什么使用Drizzle ORM？

**优势**:
- 类型安全的SQL查询
- 轻量级，性能优秀
- 支持复杂查询（JOIN, GROUP BY等）
- 易于维护和调试

---

## 📝 待办事项（todo.md）

### 当前进行中的任务

1. **等待Agilent色谱柱爬取数据**
   - 预期交付：141-145个产品
   - 数据质量：⭐⭐⭐⭐⭐

2. **SEO优化**
   - 为所有文章生成meta描述
   - 提交sitemap到搜索引擎

3. **移动端优化**
   - 测试并优化分类导航在移动设备上的响应式布局

### 未来计划

1. **完成所有品牌的数据验证**
   - Avantor: 83个产品
   - Thermo Fisher: 366个产品
   - Restek: 215个产品
   - 其他品牌

2. **添加产品对比功能**
   - 允许用户选择2-4个产品进行并排对比

3. **优化产品详情页SEO**
   - 为每个产品生成独特的meta描述

---

## 🚨 常见问题和故障排查

### 问题1：分类产品数量显示不正确

**症状**: 分类导航中的产品数量与实际不符

**原因**: 使用`COUNT()`而非`COUNT(DISTINCT)`，导致重复计数

**解决方案**: 
```typescript
// server/db.ts
productCount: countDistinct(productCategories.productId)  // 正确
// 而不是
productCount: count(productCategories.productId)  // 错误
```

### 问题2：新产品未显示在分类中

**症状**: 导入新产品后，分类中看不到

**原因**: 产品未关联到任何分类

**解决方案**:
1. 检查`product_categories`表是否有对应记录
2. 如果没有，手动插入关联记录：
   ```sql
   INSERT INTO product_categories (productId, categoryId)
   VALUES (产品ID, 分类ID);
   ```

### 问题3：产品筛选器不工作

**症状**: 选择筛选条件后，产品列表没有变化

**原因**: 前端筛选条件未正确传递到后端

**解决方案**:
1. 检查浏览器控制台是否有错误
2. 检查tRPC查询参数是否正确
3. 检查后端SQL WHERE子句构建逻辑

### 问题4：AI产品顾问无响应

**症状**: 用户提交问题后，AI没有回复

**原因**: LLM API调用失败或超时

**解决方案**:
1. 检查`BUILT_IN_FORGE_API_KEY`环境变量是否正确
2. 检查网络连接
3. 查看服务器日志获取详细错误信息

---

## 📚 重要文档索引

### 核心技术文档

| 文档名称 | 用途 |
|---------|------|
| `CATEGORY_PRODUCT_COUNT_AUTO_UPDATE.md` | 分类产品数量自动更新机制 |
| `PRODUCT_DATA_STATISTICS_REPORT.md` | 产品数据统计报告 |
| `UNVERIFIED_PRODUCTS_VERIFICATION_STRATEGY.md` | 未验证产品验证策略 |
| `CRAWLER_DELIVERY_ANALYSIS_REPORT.md` | 爬虫数据交付分析报告 |

### 爬虫任务文档

| 文档名称 | 品牌 |
|---------|------|
| `AGILENT_COLUMN_CRAWLING_INSTRUCTIONS.md` | Agilent |
| `AVANTOR_CRAWLING_TASK_INSTRUCTIONS.md` | Avantor |
| `THERMO_FISHER_DEEP_TESTING_INSTRUCTIONS.md` | Thermo Fisher |

### 项目管理文档

| 文档名称 | 用途 |
|---------|------|
| `todo.md` | 待办事项清单 |
| `FINAL_PROJECT_SUMMARY.md` | 项目总结 |
| `PROJECT_PROGRESS_REPORT.md` | 项目进度报告 |

---

## 🔐 环境变量和密钥

### 系统自动注入的环境变量

以下环境变量由Manus平台自动注入，**无需手动配置**：

```bash
# 数据库
DATABASE_URL=mysql://...

# 认证
JWT_SECRET=...
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
VITE_APP_ID=...
OWNER_OPEN_ID=...
OWNER_NAME=...

# Manus内置API
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=...

# 邮件
SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=...

# 网站配置
VITE_APP_TITLE=ROWELL - Global Chromatography Solutions
VITE_APP_LOGO=https://...

# 分析
VITE_ANALYTICS_ENDPOINT=...
VITE_ANALYTICS_WEBSITE_ID=...
```

### 需要手动配置的环境变量

**无**（当前所有环境变量都由系统自动注入）

---

## 🚀 快速恢复指南

### 步骤1：创建新的Manus项目

1. 在Manus平台创建新的Web项目
2. 选择"Web App Template (tRPC + Manus Auth + Database)"
3. 项目名称：`rowell-website-test`

### 步骤2：恢复代码

1. 下载本备份包
2. 解压到本地
3. 将所有文件复制到新项目目录
4. 运行`pnpm install`安装依赖

### 步骤3：恢复数据库

#### 方式1：使用Drizzle迁移（推荐）

```bash
# 1. 推送Schema到数据库
pnpm db:push

# 2. 导入产品数据（如果有备份的SQL文件）
# 通过Manus平台的Database面板导入SQL文件
```

#### 方式2：手动创建表

```bash
# 使用Manus平台的Database面板
# 执行drizzle/migrations/目录下的SQL文件
```

### 步骤4：导入产品数据

```bash
# 如果有产品数据CSV备份
node import_products.mjs path/to/products_backup.csv
```

### 步骤5：验证恢复结果

1. 启动开发服务器：`pnpm dev`
2. 访问网站：https://3000-xxx.manus-asia.computer
3. 检查：
   - ✅ 产品列表显示正常
   - ✅ 分类导航显示正常
   - ✅ 产品筛选功能正常
   - ✅ AI产品顾问正常
   - ✅ 询价功能正常

### 步骤6：创建Checkpoint

```bash
# 通过Manus平台创建Checkpoint
# 描述：Initial restore from backup
```

---

## 📞 联系信息

### 项目所有者

- **姓名**: 顾伟
- **Manus账号**: [用户的Manus账号]

### 技术支持

- **Manus帮助中心**: https://help.manus.im
- **Manus文档**: https://docs.manus.im

---

## 📅 更新历史

| 日期 | 版本 | 变更 |
|------|------|------|
| 2025-11-08 | 1.0 | 创建初始版本 |

---

## ✅ 恢复检查清单

使用此清单验证网站是否完全恢复：

### 代码恢复
- [ ] 所有源代码文件已恢复
- [ ] `package.json`依赖已安装
- [ ] 开发服务器可以启动
- [ ] 无TypeScript编译错误

### 数据库恢复
- [ ] 数据库Schema已创建
- [ ] 所有表已创建（19个表）
- [ ] 产品数据已导入（2,689个产品）
- [ ] 分类数据已导入（34个分类）
- [ ] 产品-分类关联已导入

### 功能验证
- [ ] 首页显示正常
- [ ] 产品列表显示正常
- [ ] 分类导航显示正常（包含产品数量）
- [ ] 产品筛选器工作正常
- [ ] 产品详情页显示正常
- [ ] AI产品顾问工作正常
- [ ] 询价功能工作正常
- [ ] USP标准页面显示正常
- [ ] 资源中心显示正常（31篇文章）

### 管理功能
- [ ] 可以通过Manus OAuth登录
- [ ] 管理员可以访问管理面板
- [ ] 可以通过Database面板查看数据
- [ ] 可以创建Checkpoint

### 文档恢复
- [ ] 所有技术文档已恢复（82个Markdown文件）
- [ ] `todo.md`已恢复
- [ ] 工程师交接文档已阅读

---

## 🎓 新工程师上手指南

### 第1天：熟悉项目

1. **阅读本文档**（ENGINEER_HANDOVER_DOCUMENT.md）
2. **阅读README.md**（模板文档）
3. **浏览代码结构**
   - `client/src/pages/` - 页面组件
   - `server/routers.ts` - API定义
   - `drizzle/schema.ts` - 数据库Schema

### 第2天：理解核心功能

1. **产品分类导航**
   - 阅读`CATEGORY_PRODUCT_COUNT_AUTO_UPDATE.md`
   - 查看`client/src/components/CategoryNav.tsx`
   - 理解`COUNT(DISTINCT)`的重要性

2. **产品筛选器**
   - 查看`client/src/pages/Products.tsx`
   - 理解筛选条件如何传递到后端
   - 测试各种筛选组合

3. **AI产品顾问**
   - 查看AI顾问实现
   - 测试AI推荐功能
   - 理解LLM API调用流程

### 第3天：数据管理

1. **产品数据导入**
   - 阅读`PRODUCT_DATA_STATISTICS_REPORT.md`
   - 理解已验证vs未验证产品
   - 查看爬虫任务文档

2. **分类管理**
   - 理解分类层级结构
   - 查看产品-分类关联逻辑
   - 测试分类关联功能

### 第4天：待办事项

1. **阅读`todo.md`**
2. **了解当前进行中的任务**
3. **规划下一步工作**

### 第5天：实践操作

1. **修复一个小Bug**（如果有）
2. **添加一个小功能**（如新的筛选条件）
3. **创建Checkpoint**
4. **开始独立工作**

---

## 🎯 成功标准

新工程师成功接手项目的标准：

1. ✅ 能够独立启动和部署网站
2. ✅ 能够导入新的产品数据
3. ✅ 能够修复常见问题（参考故障排查章节）
4. ✅ 能够与爬虫团队协作（下达指令、接收数据）
5. ✅ 能够创建和管理Checkpoint
6. ✅ 理解所有核心功能的实现原理
7. ✅ 能够规划和执行新功能开发

---

**祝您顺利接手项目！如有任何问题，请参考本文档或联系Manus技术支持。** 🚀
